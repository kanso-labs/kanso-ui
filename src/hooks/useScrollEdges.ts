import { useCallback, useSyncExternalStore } from 'react'

// Which inline edges of a box that scrolls sideways have content past them,
// for `scrollFadeOf` in src/styles/scroll-fade.ts to fade.
//
// Read from the box itself on every scroll, on a change of its size or of
// any child's, and on a child arriving or leaving — a font loading late, a
// tab added, a column resized — since each moves where the content ends
// without the box scrolling. A store over the element rather than state set
// from an effect, so a render always reads the edges as they are now.

type ScrollEdges = { end: boolean; start: boolean }

// Bit flags, so the snapshot is a number and two reads of the same edges are
// equal without a cache to keep them so.
const START = 1
const END = 2

// Subpixel layout leaves a box scrolled to either end a fraction of a pixel
// short of it, which would otherwise read as one more pixel to go.
const SLACK = 1

function flagsOf(element: HTMLElement | null) {
  if (element === null) {
    return 0
  }
  // Under right-to-left `scrollLeft` runs from 0 at the start edge down into
  // the negatives, so its size is how far the box has scrolled either way.
  const travelled = Math.abs(element.scrollLeft)
  const room = element.scrollWidth - element.clientWidth
  return (travelled > SLACK ? START : 0) | (travelled < room - SLACK ? END : 0)
}

// Nothing is laid out while a page is rendered on the server.
function serverFlags() {
  return 0
}

/**
 * The inline edges of `element` that have content past them: `start` once it
 * is scrolled away from its start, `end` while there is more past its end,
 * and neither while what it holds fits.
 */
function useScrollEdges(element: HTMLElement | null): ScrollEdges {
  const subscribe = useCallback(
    (onChange: () => void) => {
      if (element === null) {
        return () => {}
      }
      const sizes = new ResizeObserver(onChange)
      const observeAll = () => {
        sizes.observe(element)
        for (const child of element.children) {
          sizes.observe(child)
        }
      }
      const children = new MutationObserver(() => {
        observeAll()
        onChange()
      })
      observeAll()
      children.observe(element, { childList: true })
      element.addEventListener('scroll', onChange, { passive: true })
      return () => {
        element.removeEventListener('scroll', onChange)
        children.disconnect()
        sizes.disconnect()
      }
    },
    [element],
  )
  const flags = useSyncExternalStore(
    subscribe,
    () => flagsOf(element),
    serverFlags,
  )
  return { end: (flags & END) !== 0, start: (flags & START) !== 0 }
}

export type { ScrollEdges }
export { useScrollEdges }
