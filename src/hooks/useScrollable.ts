import type { RefObject } from 'react'

import { useLayoutEffect, useState } from 'react'

/**
 * Whether the element in `ref` is scrolling its content: whether the content
 * runs past the element's own block size. Kept current as the element
 * resizes and as its content changes.
 *
 * What it is for is keyboard access. A scroll container with nothing
 * focusable inside it cannot be reached from the keyboard in every browser,
 * so a component makes it a tab stop while this is true, and only then — a
 * body short enough to show whole is no stop at all.
 *
 * The element is watched for its own size, and each child for its size, since
 * a child growing is how content outgrows a container whose size is capped.
 * The children are re-observed whenever the content changes, and a change of
 * text alone is caught by the same mutation observer. Measured in a layout
 * effect, so the first paint already has the answer rather than a frame
 * later.
 */
function useScrollable(ref: RefObject<HTMLElement | null>): boolean {
  const [scrollable, setScrollable] = useState(false)

  useLayoutEffect(() => {
    const element = ref.current
    if (element === null) {
      return undefined
    }

    const measure = () => {
      setScrollable(element.scrollHeight > element.clientHeight)
    }
    const resize = new ResizeObserver(measure)
    const observe = () => {
      resize.disconnect()
      resize.observe(element)
      for (const child of element.children) {
        resize.observe(child)
      }
    }
    const mutation = new MutationObserver(() => {
      observe()
      measure()
    })

    observe()
    mutation.observe(element, {
      characterData: true,
      childList: true,
      subtree: true,
    })
    measure()

    return () => {
      resize.disconnect()
      mutation.disconnect()
    }
  }, [ref])

  return scrollable
}

export { useScrollable }
