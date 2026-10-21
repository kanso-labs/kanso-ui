'use client'

import type { ReactNode } from 'react'

import { useLayoutEffect } from 'react'

/**
 * Narrows the frame an Overview page draws a story in to `width`, for a story
 * whose point is a window narrower than the page's column. Storybook sizes
 * that frame to the column, and its `docs.story` parameter takes a height
 * alone; the viewport global sizes the story's own canvas and nothing on the
 * Overview page. So a story about a compact window would draw its wide form
 * there.
 *
 * Only a frame inside one of the page's story blocks is touched, so the story
 * has to be framed, with `docs.story.inline` off; `docsFrameWidth` in
 * ../decorators.tsx is the form a story takes it in. On its own a story's frame
 * is the canvas, which the viewport toolbar sizes, and a test run or a
 * Chromatic snapshot frames it otherwise. The width goes back when the story
 * unmounts.
 */
function DocsFrame({
  children,
  width,
}: {
  children: ReactNode
  width: string
}) {
  useLayoutEffect(() => {
    const frame = window.frameElement
    if (!isDocsFrame(frame)) {
      return undefined
    }
    const previous = frame.style.width
    frame.style.width = width
    return () => {
      frame.style.width = previous
    }
  }, [width])

  return <>{children}</>
}

// The frame belongs to the page around it, so `instanceof` against this
// frame's own HTMLIFrameElement would never hold; the tag is read instead.
function isDocsFrame(element: Element | null): element is HTMLIFrameElement {
  return (
    element?.tagName === 'IFRAME' &&
    element.closest('[data-story-block]') !== null
  )
}

export default DocsFrame
