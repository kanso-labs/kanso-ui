// The collections take arbitrary content in their slots, so JSX at a prop is
// their API rather than a misuse of it. react-perf guards against a fresh
// element identity defeating memoization, which the React Compiler this repo
// builds with already handles; the object and function rules are off for the
// same reason plus one of their own — a case here renders its fixture,
// asserts and unmounts, so there is no second render for a fresh identity to
// cost anything on.
// oxlint-disable react-perf/jsx-no-jsx-as-prop
// oxlint-disable react-perf/jsx-no-new-array-as-prop
// oxlint-disable react-perf/jsx-no-new-function-as-prop
// oxlint-disable react-perf/jsx-no-new-object-as-prop

import type { RenderResult } from '@testing-library/react'
import type { ReactNode } from 'react'

import * as stylex from '@stylexjs/stylex'
import { act, fireEvent, render, renderHook } from '@testing-library/react'
import { isValidElement } from 'react'
import { afterEach, describe, expect, it } from 'vitest'

import Button from '../components/button'
import List from '../components/list'
import ListBox from '../components/list-box'
import Table from '../components/table'
import Tree from '../components/tree'
import {
  colors,
  shadows,
  stateLayerOpacity,
} from '../tokens/design.tokens.stylex'
import { useDragAndDrop } from './hooks'

// Hoisted so the identity is stable, which is what the case below compares.
const OURS = () => <span />

// Every draggable row in a grid list, table or tree carries one: React Aria
// starts a drag from the pointer on its own, and this is what gives a
// keyboard or screen reader user the same move.
const DRAG = <Button slot="drag">Drag</Button>

const probeStyles = stylex.create({
  // A collection's own box while a drop would land on it.
  collectionTarget: {
    backgroundColor: `color-mix(in srgb, ${colors.primary} calc(${stateLayerOpacity.hover} * 100%), transparent)`,
  },
  // The dragged row's lift.
  lifted: { boxShadow: shadows.elevation4 },
  onSurface: { color: colors.onSurface },
  primary: { color: colors.primary },
  // A row's layer while a drop would land on it.
  rowTarget: {
    backgroundImage: `linear-gradient(color-mix(in srgb, ${colors.primary} calc(${stateLayerOpacity.hover} * 100%), transparent), color-mix(in srgb, ${colors.primary} calc(${stateLayerOpacity.hover} * 100%), transparent))`,
  },
  surfaceContainerHigh: { color: colors.surfaceContainerHigh },
})

function classesOf(style: stylex.StyleXStyles) {
  const classes = (stylex.props(style).className ?? '')
    .split(' ')
    .filter(Boolean)
  // An empty list would make every `every` below vacuously true.
  if (classes.length === 0) {
    throw new Error('expected the probe style to generate at least one class')
  }
  return classes
}

const CLASSES = {
  collectionTarget: classesOf(probeStyles.collectionTarget),
  lifted: classesOf(probeStyles.lifted),
  rowTarget: classesOf(probeStyles.rowTarget),
}

// One set of hooks handed to whichever collection the case is about, which is
// the whole point of the item: the four share them.
type Hooks = ReturnType<typeof useDragAndDrop>['dragAndDropHooks']

type Kind = 'List' | 'ListBox' | 'Table' | 'Tree'

// One of the four collections, two rows deep, under the hooks given. Every
// row but a ListBox option carries a handle; React Aria starts an option's
// drag from Enter on the option itself.
function collectionOf(kind: Kind, hooks: Hooks, label = 'Label') {
  if (kind === 'List') {
    return (
      <List aria-label={label} dragAndDropHooks={hooks}>
        <List.Item id="first" leading={DRAG}>
          First item
        </List.Item>
        <List.Item id="second" leading={DRAG}>
          Second item
        </List.Item>
      </List>
    )
  }
  if (kind === 'ListBox') {
    return (
      <ListBox aria-label={label} dragAndDropHooks={hooks}>
        <ListBox.Item id="first">First item</ListBox.Item>
        <ListBox.Item id="second">Second item</ListBox.Item>
      </ListBox>
    )
  }
  if (kind === 'Table') {
    return (
      <Table aria-label={label} dragAndDropHooks={hooks}>
        <Table.Header>
          <Table.Column id="colName" isRowHeader>
            Label
          </Table.Column>
        </Table.Header>
        <Table.Body>
          <Table.Row id="first">
            <Table.Cell>
              {DRAG}
              First item
            </Table.Cell>
          </Table.Row>
          <Table.Row id="second">
            <Table.Cell>
              {DRAG}
              Second item
            </Table.Cell>
          </Table.Row>
        </Table.Body>
      </Table>
    )
  }
  return (
    <Tree aria-label={label} dragAndDropHooks={hooks}>
      <Tree.Item headline="First item" id="first" leading={DRAG} />
      <Tree.Item headline="Second item" id="second" leading={DRAG} />
    </Tree>
  )
}

function Draggable({ children }: { children: (hooks: Hooks) => ReactNode }) {
  const { dragAndDropHooks } = useDragAndDrop({
    getItems: (keys) => [...keys].map((key) => ({ 'text/plain': String(key) })),
  })

  return <>{children(dragAndDropHooks)}</>
}

function hasClasses(element: Element, classes: string[]) {
  return classes.every((name) => element.classList.contains(name))
}

// The indicators React Aria has drawn: rows it adds between the collection's
// own, each holding the button a screen reader lands on, and each carrying
// the classes this library gives it.
function indicatorsIn(container: HTMLElement) {
  return [
    ...container.querySelectorAll('[aria-roledescription="drop indicator"]'),
  ].map((button) => {
    const row = button.closest('[role="row"]')
    if (!(row instanceof HTMLElement)) {
      throw new Error('expected the indicator to be drawn as a row')
    }
    return row
  })
}

// A collection whose rows take a drop onto themselves, as a tree's branch
// takes a row into it.
function ItemDrops({ kind }: { kind: Kind }) {
  const { dragAndDropHooks } = useDragAndDrop({
    getItems: (keys) => [...keys].map((key) => ({ 'text/plain': String(key) })),
    onItemDrop: () => undefined,
  })
  return collectionOf(kind, dragAndDropHooks)
}

// A key pressed on whatever has focus, as a keyboard would.
function press(key: string) {
  const target = document.activeElement ?? document.body
  fireEvent.keyDown(target, { key })
  fireEvent.keyUp(target, { key })
}

// The preview the wrapper installs, for the items named. React Aria draws it
// only when a pointer starts the drag, as the image the browser drags under
// it; the keyboard drags the cases below drive draw none. So this calls the
// renderer and renders what it returns — the element React Aria would draw
// under the pointer.
function preview(labels: string[]) {
  const { result } = renderHook(() =>
    useDragAndDrop({ getItems: () => [], onReorder: () => undefined }),
  )
  const element = result.current.dragAndDropHooks.renderDragPreview?.(
    labels.map((label) => ({ 'text/plain': label })),
  )
  if (!isValidElement(element)) {
    throw new Error('expected the preview to be an element')
  }
  const view = render(element)
  const surface = view.container.firstElementChild
  if (!(surface instanceof HTMLElement)) {
    throw new Error('expected the preview to draw a surface')
  }
  return surface
}

function probe(style: stylex.StyleXStyles) {
  const view = render(<span data-testid="probe" {...stylex.props(style)} />)
  const read = getComputedStyle(view.getByTestId('probe')).color
  view.unmount()
  return read
}

// Three rows that reorder. A collection draws drop indicators only where
// something may land, which is what `onReorder` declares.
function Reorderable() {
  const { dragAndDropHooks } = useDragAndDrop({
    getItems: (keys) => [...keys].map((key) => ({ 'text/plain': String(key) })),
    onReorder: () => undefined,
  })

  return (
    <List aria-label="Label" dragAndDropHooks={dragAndDropHooks}>
      <List.Item id="first" leading={DRAG}>
        First item
      </List.Item>
      <List.Item id="second" leading={DRAG}>
        Second item
      </List.Item>
      <List.Item id="third" leading={DRAG}>
        Third item
      </List.Item>
    </List>
  )
}

// A list to drag from beside a collection that takes a drop as a whole. A
// collection never offers its own root to a drag that started in it, so the
// drag has to come from somewhere else.
function RootDrop({ kind }: { kind: Kind }) {
  const source = useDragAndDrop({
    getItems: (keys) => [...keys].map((key) => ({ 'text/plain': String(key) })),
  })
  const target = useDragAndDrop({
    acceptedDragTypes: ['text/plain'],
    onRootDrop: () => undefined,
  })

  return (
    <>
      <List aria-label="Source" dragAndDropHooks={source.dragAndDropHooks}>
        <List.Item id="source" leading={DRAG}>
          Source item
        </List.Item>
      </List>
      {collectionOf(kind, target.dragAndDropHooks, 'Target')}
    </>
  )
}

// The fixture's two rows, by the keys it gives them: React Aria keys a
// table's column too, and adds keyless indicators between rows in a drag.
function rowsIn(container: HTMLElement) {
  return [
    ...container.querySelectorAll('[data-key="first"], [data-key="second"]'),
  ]
}

// Where each of the collection's own rows sits, read so a case can tell
// whether anything moved them.
function rowTops(container: HTMLElement) {
  const rows = [...container.querySelectorAll('[role="row"][data-key]')]
  // An empty list would compare equal to any other empty list, whatever
  // moved.
  if (rows.length === 0) {
    throw new Error('expected the collection to draw its rows')
  }
  return rows.map((row) => row.getBoundingClientRect().top)
}

// Starts a drag of the first row as a keyboard user does, with Enter on its
// handle, or on a ListBox's option itself. A table moves focus that lands
// inside a row back to the row, so there the handle is reached from the row
// with the arrow into it, as a keyboard reaches it. React Aria puts focus on
// the first place the row could land, and starts listening for the keys
// that move and drop it, a frame later — so this waits that frame out.
async function startKeyboardDrag(view: RenderResult, kind: Kind = 'List') {
  if (kind === 'Table') {
    const row = view.container.querySelector('[data-key="first"]')
    act(() => {
      if (row instanceof HTMLElement) {
        row.focus()
      }
    })
    press('ArrowRight')
  } else {
    const handle =
      kind === 'ListBox'
        ? view.getAllByRole('option')[0]
        : view.getAllByRole('button', { name: /^Drag/ })[0]
    act(() => {
      handle.focus()
    })
  }
  press('Enter')
  await act(async () => {
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => {
        resolve()
      })
    })
  })
}

// The indicator React Aria has marked as where the row would land now.
function targetIn(container: HTMLElement) {
  const target = container.querySelector('[data-drop-target]')
  if (!(target instanceof HTMLElement)) {
    throw new Error('expected a drop indicator to be the target')
  }
  return target
}

describe('drag and drop', () => {
  describe('across the collections', () => {
    it('makes a List row draggable', () => {
      const view = render(
        <Draggable>
          {(hooks) => (
            <List aria-label="Label" dragAndDropHooks={hooks}>
              <List.Item id="first" leading={DRAG}>
                First item
              </List.Item>
            </List>
          )}
        </Draggable>,
      )

      expect(
        view.container.querySelectorAll('[draggable="true"]'),
      ).toHaveLength(1)
    })

    it('makes a ListBox option draggable', () => {
      const view = render(
        <Draggable>
          {(hooks) => (
            <ListBox aria-label="Label" dragAndDropHooks={hooks}>
              <ListBox.Item id="first">First item</ListBox.Item>
            </ListBox>
          )}
        </Draggable>,
      )

      expect(
        view.container.querySelectorAll('[draggable="true"]'),
      ).toHaveLength(1)
    })

    it('makes a Table row draggable', () => {
      const view = render(
        <Draggable>
          {(hooks) => (
            <Table aria-label="Label" dragAndDropHooks={hooks}>
              <Table.Header>
                <Table.Column id="colName" isRowHeader>
                  Label
                </Table.Column>
              </Table.Header>
              <Table.Body>
                <Table.Row id="first">
                  <Table.Cell>
                    {DRAG}
                    First item
                  </Table.Cell>
                </Table.Row>
              </Table.Body>
            </Table>
          )}
        </Draggable>,
      )

      expect(
        view.container.querySelectorAll('[draggable="true"]'),
      ).toHaveLength(1)
    })

    it('makes a Tree row draggable', () => {
      const view = render(
        <Draggable>
          {(hooks) => (
            <Tree aria-label="Label" dragAndDropHooks={hooks}>
              <Tree.Item headline="First item" id="first" leading={DRAG} />
            </Tree>
          )}
        </Draggable>,
      )

      expect(
        view.container.querySelectorAll('[draggable="true"]'),
      ).toHaveLength(1)
    })
  })

  describe('the defaults the wrapper installs', () => {
    it('gives the hooks this library indicator and preview', () => {
      const { result } = renderHook(() =>
        useDragAndDrop({ getItems: () => [], onReorder: () => undefined }),
      )
      const hooks = result.current.dragAndDropHooks

      // React Aria draws the preview only when a pointer starts the drag,
      // which no case here does, so what is checked for it is that the
      // wrapper put it there at all — without this, dropping it from the
      // wrapper is a change nothing notices. The indicator is drawn for real
      // under "the drop indicator" below.
      expect(typeof hooks.renderDropIndicator).toBe('function')
      expect(typeof hooks.renderDragPreview).toBe('function')
    })

    it('lets a call site replace either one', () => {
      const { result } = renderHook(() =>
        useDragAndDrop({
          getItems: () => [],
          onReorder: () => undefined,
          renderDropIndicator: OURS,
        }),
      )

      expect(result.current.dragAndDropHooks.renderDropIndicator).toBe(OURS)
    })
  })

  describe('the drag preview', () => {
    it('names the item being dragged', () => {
      expect(preview(['First item']).textContent).toBe('First item')
    })

    // More than one, and the first is named with a count of the rest rather
    // than all of them, which would run past the preview's width.
    it('names the first of several and counts the rest', () => {
      expect(preview(['First item', 'Second item']).textContent).toBe(
        'First item + 1',
      )
      expect(
        preview(['First item', 'Second item', 'Third item']).textContent,
      ).toBe('First item + 2')
    })

    // The row it came from, raised: the label type on a surface above the
    // list's own.
    it('is drawn on a raised surface in the label type', () => {
      const surface = getComputedStyle(preview(['First item']))

      expect(surface.backgroundColor).toBe(
        probe(probeStyles.surfaceContainerHigh),
      )
      expect(surface.color).toBe(probe(probeStyles.onSurface))
      expect(surface.fontSize).toBe('14px')
      expect(surface.lineHeight).toBe('20px')
    })

    it('cuts a long label short at its width with an ellipsis', () => {
      const surface = preview([
        'A label long enough to run past the width '.repeat(3),
      ])
      const style = getComputedStyle(surface)

      expect(surface.getBoundingClientRect().width).toBeLessThanOrEqual(320)
      expect(surface.scrollWidth).toBeGreaterThan(surface.clientWidth)
      expect([style.overflowX, style.textOverflow, style.whiteSpace]).toEqual([
        'hidden',
        'ellipsis',
        'nowrap',
      ])
    })
  })

  // Drawn during a drag driven from the keyboard, as a keyboard or screen
  // reader user drags: Enter on a row's handle starts it, the arrow keys move
  // between the places the row could land, and Enter drops it.
  describe('the drop indicator', () => {
    // React Aria keeps one drag session for the whole document and refuses to
    // begin a second while one is in flight, so each case's drag ends here —
    // even one an assertion stopped partway.
    afterEach(() => {
      press('Escape')
    })

    it('is not drawn while nothing is dragged', () => {
      const view = render(<Reorderable />)

      expect(indicatorsIn(view.container)).toHaveLength(0)
    })

    // Every gap between two rows gains an indicator once a drag starts, so a
    // line that took room would push the rows apart the moment one began.
    it('keeps the rows where they are while a drag passes between them', async () => {
      const view = render(<Reorderable />)
      const resting = rowTops(view.container)

      await startKeyboardDrag(view)

      expect(indicatorsIn(view.container)).toHaveLength(4)
      expect(rowTops(view.container)).toEqual(resting)

      press('ArrowDown')

      expect(rowTops(view.container)).toEqual(resting)
    })

    it('draws the target as a 2dp line in the primary role', async () => {
      const view = render(<Reorderable />)
      await startKeyboardDrag(view)

      const line = getComputedStyle(targetIn(view.container))

      expect(line.backgroundColor).toBe(probe(probeStyles.primary))
      expect(line.blockSize).toBe('2px')
    })

    it('leaves every other place the row could land invisible', async () => {
      const view = render(<Reorderable />)
      await startKeyboardDrag(view)

      // One before the first row and one after each, less the target.
      const others = indicatorsIn(view.container).filter(
        (indicator) => !indicator.hasAttribute('data-drop-target'),
      )

      expect(others).toHaveLength(3)
      for (const other of others) {
        expect(getComputedStyle(other).backgroundColor).toBe('rgba(0, 0, 0, 0)')
      }
    })

    // The colour belongs to the state rather than to a place, so it moves
    // with the target as the arrow keys do.
    it('moves the line with the target', async () => {
      const view = render(<Reorderable />)
      await startKeyboardDrag(view)
      const before = targetIn(view.container)

      press('ArrowDown')
      const after = targetIn(view.container)

      expect(after).not.toBe(before)
      expect(getComputedStyle(after).backgroundColor).toBe(
        probe(probeStyles.primary),
      )
      expect(getComputedStyle(before).backgroundColor).toBe('rgba(0, 0, 0, 0)')
    })
  })

  // The lists page's dragged row, and the drop target a row or a whole
  // collection draws. React Aria marks each of them; these are what show it.
  describe('the row being dragged', () => {
    afterEach(() => {
      press('Escape')
    })

    it.each(['List', 'ListBox', 'Table', 'Tree'] as const)(
      'lifts the %s row a drag started from, and that row alone',
      async (kind) => {
        const view = render(<ItemDrops kind={kind} />)
        await startKeyboardDrag(view, kind)
        const [first, second] = rowsIn(view.container)

        expect(first.hasAttribute('data-dragging')).toBe(true)
        expect(hasClasses(first, CLASSES.lifted)).toBe(true)
        expect(hasClasses(second, CLASSES.lifted)).toBe(false)
      },
    )

    it('sets it down when the drag ends', async () => {
      const view = render(<ItemDrops kind="List" />)
      await startKeyboardDrag(view)

      press('Escape')

      const [first] = rowsIn(view.container)
      expect(hasClasses(first, CLASSES.lifted)).toBe(false)
    })
  })

  describe('a drop target', () => {
    afterEach(() => {
      press('Escape')
    })

    it.each(['List', 'ListBox', 'Table', 'Tree'] as const)(
      'outlines the %s row a drop would land on',
      async (kind) => {
        const view = render(<ItemDrops kind={kind} />)
        await startKeyboardDrag(view, kind)
        const [first, second] = rowsIn(view.container)

        expect(second.hasAttribute('data-drop-target')).toBe(true)
        expect(hasClasses(second, CLASSES.rowTarget)).toBe(true)
        expect(hasClasses(first, CLASSES.rowTarget)).toBe(false)
      },
    )

    it.each(['List', 'ListBox', 'Table', 'Tree'] as const)(
      'outlines a %s a drop would land on as a whole',
      async (kind) => {
        const view = render(<RootDrop kind={kind} />)
        await startKeyboardDrag(view)
        const target = view.container.querySelector('[aria-label="Target"]')
        const source = view.container.querySelector('[aria-label="Source"]')
        if (target === null || source === null) {
          throw new Error('expected both collections to render')
        }

        expect(target.hasAttribute('data-drop-target')).toBe(true)
        expect(hasClasses(target, CLASSES.collectionTarget)).toBe(true)
        expect(hasClasses(source, CLASSES.collectionTarget)).toBe(false)
      },
    )
  })
})
