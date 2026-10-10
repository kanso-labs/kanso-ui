'use client'

import type { RefObject, UIEvent } from 'react'

import { useRef, useState } from 'react'

/**
 * The small bar's height in pixels, which is what a flexible bar collapses
 * to. AppBar draws its small height from this, so the hook's arithmetic and
 * the bar it measures cannot disagree.
 */
const COLLAPSED_BLOCK_SIZE = 64

type AppBarScroll = {
  /** For the bar's `collapsed`. */
  collapsed: boolean
  /** For the `onScroll` of the element that scrolls. */
  onScroll: (event: UIEvent<HTMLElement>) => void
  /**
   * For the bar's `ref`. The bar's height is what tells the hook how much
   * room collapsing gives back, so without it every page counts as long
   * enough to collapse on.
   */
  ref: RefObject<HTMLElement | null>
  /** For the bar's `scrolled`. */
  scrolled: boolean
}

type AppBarScrollOptions = {
  /**
   * How far the page scrolls, in pixels, before the bar collapses. It
   * expands again once the page is scrolled back to this offset or less.
   * @default 0
   */
  collapseAfter?: number
}

/**
 * Derives an `AppBar`'s `scrolled` and `collapsed` from the element its page
 * scrolls in. Pass `ref` to the bar and `onScroll` to that element, and hand
 * the bar the two states.
 *
 * ```tsx
 * const { collapsed, onScroll, ref, scrolled } = useAppBarScroll()
 *
 * <div onScroll={onScroll}>
 *   <AppBar collapsed={collapsed} ref={ref} scrolled={scrolled} size="lg" />
 * </div>
 * ```
 *
 * It collapses the bar only on a page long enough to stay collapsed.
 * Collapsing shortens the page by the height the bar gives back, and a page
 * that overflows by less than that plus `collapseAfter` cannot scroll that
 * far any more: the browser pulls the offset back inside the shorter page,
 * below `collapseAfter`, the bar expands, the page lengthens, and the two
 * take turns on every scroll event. On such a page the bar stays expanded,
 * which is also all there is room for.
 *
 * The other half of keeping the bar steady is the scroll container's own:
 * give it `overflow-anchor: none`, as the `collapsed` prop explains.
 */
function useAppBarScroll({
  collapseAfter = 0,
}: AppBarScrollOptions = {}): AppBarScroll {
  const ref = useRef<HTMLElement>(null)
  const [collapsed, setCollapsed] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  const onScroll = (event: UIEvent<HTMLElement>) => {
    const { clientHeight, scrollHeight, scrollTop } = event.currentTarget

    setScrolled(scrollTop > 0)
    if (scrollTop <= collapseAfter) {
      setCollapsed(false)
    } else if (!collapsed) {
      const givesBack = Math.max(
        0,
        (ref.current?.offsetHeight ?? COLLAPSED_BLOCK_SIZE) -
          COLLAPSED_BLOCK_SIZE,
      )
      setCollapsed(scrollHeight - clientHeight - givesBack > collapseAfter)
    }
  }

  return { collapsed, onScroll, ref, scrolled }
}

export type { AppBarScroll, AppBarScrollOptions }
export { COLLAPSED_BLOCK_SIZE, useAppBarScroll }
