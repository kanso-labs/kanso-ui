import type { PointerEvent, ReactNode } from 'react'

import { useState } from 'react'

import { textOf } from '../collection/text'

// A label kept to one line ends in an ellipsis when it has no room, and a
// sighted reader then had no way to read the rest: the accessible name stays
// whole, but nothing on screen did. This hands such a label its full text as
// a native `title`, so the browser's own tooltip shows it on hover.
//
// The label is measured when the pointer reaches it rather than watched, so
// a page of labels that fit pays for nothing: no observer, no measurement on
// render. A label that fits gets no title, since a tooltip repeating text
// already in full view is noise. The text is the label's own when it is text
// alone — a string, a number, or the two mixed, read as `textOf` reads an
// item — and a label holding an element gets nothing, since a title is a
// string and the element's text is not this hook's to guess.

/**
 * The `title` and `onPointerEnter` for a label span that clips to one line:
 * spread both on the span that carries `overflow: hidden`.
 */
function useClippedTitle(label: ReactNode) {
  const [title, setTitle] = useState<string>()
  const text = textOf(label)

  const onPointerEnter = (event: PointerEvent<HTMLElement>) => {
    const span = event.currentTarget
    setTitle(
      text !== undefined && span.scrollWidth > span.clientWidth
        ? text
        : undefined,
    )
  }

  return { onPointerEnter, title }
}

export { useClippedTitle }
