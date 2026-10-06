import type { DropTarget } from 'react-aria-components'

import { DropIndicator as RACDropIndicator } from 'react-aria-components'

import { indicatorClassName } from './styles'

// What drag and drop looks like across the four collections that do it —
// List, ListBox, Table and Tree. React Aria supplies the behaviour through
// `useDragAndDrop` and renders an unstyled line between items; what is here
// is the line and the preview, and a wrapper that makes both the default so
// a call site gets them without wiring either.
//
// Apart from `src/components` because it is shared internals rather than a
// component: a directory there is a public component with stories, a barrel
// entry and a `styling.test.tsx` case, and this has none of the three. The
// one name it does put on the public surface is `useDragAndDrop`, which
// `src/react-aria.ts` exports in place of React Aria's own.
//
// The lists page draws one part of a drag: the dragged row, lifted to
// elevation 4 under a pressed layer, which the row a drag started from takes
// as `dragging` in `src/row` — in List, ListBox and Tree through
// `rowItemStyles`, and in Table's own row. Three things are this library's
// own, since no page draws them.
//
// **The line between two items is the primary role, 2dp.** It is the same
// weight and colour a focus ring takes, which is the nearest thing the
// system has to "this is where the thing you are moving will land".
//
// **A row or a whole collection a drop lands on draws that line around
// itself**, as an outline inside its edges over a primary layer at the hover
// opacity — `dropTarget` in `src/row` and in `src/collection`, which Table's
// own row and box take too.
//
// **The preview is the row's own type on a raised surface.** A drag preview
// that looked nothing like the row it came from would read as a second
// thing rather than as the row in transit.

/**
 * The line that shows where a dragged item would land. Rendered by
 * {@link useDragAndDrop} rather than by a call site, which is why it takes
 * React Aria's target rather than props of its own.
 */
function DropIndicator({ target }: { target: DropTarget }) {
  return <RACDropIndicator className={indicatorClassName} target={target} />
}

export { DropIndicator }
