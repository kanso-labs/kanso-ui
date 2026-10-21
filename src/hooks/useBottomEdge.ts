import type { RefObject } from 'react'

import { useLayoutEffect, useSyncExternalStore } from 'react'

// The strips of the window's bottom edge that open overlays hold with their
// actions, keyed by the element holding each, and how far a toast has to rise
// to clear them all.
//
// The snackbar sits on that edge and above every modal, which is what lets a
// message raised from inside a dialog be read over its scrim. But a
// full-screen dialog's action bar and a sheet's actions sit on the same edge,
// so a toast with an action lay over them and took the taps meant for their
// buttons — and a toast with an action stays until it is answered. The parts
// that hold the edge say so here, and the snackbar's region rises by the
// tallest of them.
//
// A store rather than a context, since the two meet nowhere in the tree: the
// snackbar is mounted once near the root, and the overlay is portalled to the
// end of the body from wherever it was opened.
const holders = new Map<Element, number>()
const listeners = new Set<() => void>()
let clearance = 0

function getClearance() {
  return clearance
}

// Nothing is open while a page is rendered on the server.
function getServerClearance() {
  return 0
}

function hold(element: Element, height: number | undefined) {
  if (height === undefined || height <= 0) {
    holders.delete(element)
  } else {
    holders.set(element, height)
  }
  const next = Math.max(0, ...holders.values())
  if (next === clearance) {
    return
  }
  clearance = next
  for (const listener of listeners) {
    listener()
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

/**
 * How far above the window's bottom edge a toast has to sit to clear the
 * actions of every open overlay holding that edge, in pixels: `0` while none
 * is open.
 */
function useBottomEdgeClearance(): number {
  return useSyncExternalStore(subscribe, getClearance, getServerClearance)
}

/**
 * Holds the strip from the top of the element in `ref` to the bottom of the
 * window while `isHolding` is true, so a toast rises clear of it. For a part
 * whose own bottom is the window's: an overlay's actions, pinned there.
 *
 * Measured from where the element is drawn, so the strip takes in whatever
 * lies between it and the edge, a safe area among them. It is measured again
 * whenever the element resizes, the window does, or an animation or a scroll
 * ends, since an overlay arriving from below is drawn lower than it rests
 * until its entry has run — a dialog's entry is an animation, and a sheet's
 * is a scroll, which is also what a swipe that lets go of it makes.
 */
function useHoldBottomEdge(
  ref: RefObject<HTMLElement | null>,
  isHolding: boolean,
) {
  useLayoutEffect(() => {
    const element = ref.current
    if (element === null || !isHolding) {
      return undefined
    }

    const measure = () => {
      hold(
        element,
        Math.ceil(window.innerHeight - element.getBoundingClientRect().top),
      )
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(element)
    window.addEventListener('resize', measure)
    document.addEventListener('animationend', measure, true)
    // Captured, since `scrollend` does not bubble from the element scrolled.
    document.addEventListener('scrollend', measure, true)

    return () => {
      observer.disconnect()
      window.removeEventListener('resize', measure)
      document.removeEventListener('animationend', measure, true)
      document.removeEventListener('scrollend', measure, true)
      hold(element, undefined)
    }
  }, [isHolding, ref])
}

export { useBottomEdgeClearance, useHoldBottomEdge }
