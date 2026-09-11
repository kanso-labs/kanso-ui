import type { JSX } from 'react'
import type { DropTarget } from 'react-aria-components'

import * as stylex from '@stylexjs/stylex'
import { useDragAndDrop as useRACDragAndDrop } from 'react-aria-components'

import { DropIndicator } from '.'
import { dragStyles } from './styles'

// The hook half of `src/drag`, apart from ./index.tsx so that file exports
// components alone — which is what keeps fast refresh working for it, the
// same arrangement `src/row` uses.

// React Aria types the preview renderer's argument with a `DragItem` it does
// not export, so the shape is read back off the option that takes it.
type DragItems = Parameters<
  NonNullable<Parameters<typeof useRACDragAndDrop>[0]['renderDragPreview']>
>[0]

// What is drawn under the pointer while a drag is in flight. React Aria
// hands it the items being dragged, each a map of type to value; what is
// shown is the plain text one, and how many others are coming with it.
//
// The parameter type is taken off the option rather than imported, since
// `DragItem` is not on the package's public surface.
function renderDragPreview(items: DragItems): JSX.Element {
  const first = items[0]?.['text/plain'] ?? ''
  const rest = items.length - 1

  return (
    <div {...stylex.props(dragStyles.preview)}>
      {rest > 0 ? `${first} + ${rest}` : first}
    </div>
  )
}

function renderDropIndicator(target: DropTarget): JSX.Element {
  return <DropIndicator target={target} />
}

/**
 * React Aria's drag and drop hooks, with this library's drop indicator and
 * drag preview as the defaults. Hand what it returns to a `List`, `ListBox`,
 * `Table` or `Tree` as `dragAndDropHooks`.
 *
 * ```tsx
 * const { dragAndDropHooks } = useDragAndDrop({
 *   getItems: (keys) => [...keys].map((key) => ({ 'text/plain': String(key) })),
 *   onReorder: (event) => { … },
 * })
 *
 * <List aria-label="Label" dragAndDropHooks={dragAndDropHooks}>…</List>
 * ```
 *
 * Everything else is React Aria's and is not wrapped — `getItems`,
 * `onReorder`, `onInsert`, `acceptedDragTypes` and the rest decide what may
 * be dragged where, which is the page's business rather than the row's.
 * Passing `renderDropIndicator` or `renderDragPreview` replaces the default.
 */
function useDragAndDrop(
  options: Parameters<typeof useRACDragAndDrop>[0],
): ReturnType<typeof useRACDragAndDrop> {
  return useRACDragAndDrop({
    renderDragPreview,
    renderDropIndicator,
    ...options,
  })
}

export { useDragAndDrop }
