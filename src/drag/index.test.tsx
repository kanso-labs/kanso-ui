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

import type { ReactNode } from 'react'

import * as stylex from '@stylexjs/stylex'
import { render, renderHook } from '@testing-library/react'
import { isValidElement } from 'react'
import { describe, expect, it } from 'vitest'

import Button from '../components/button'
import List from '../components/list'
import ListBox from '../components/list-box'
import Table from '../components/table'
import Tree from '../components/tree'
import { colors } from '../tokens/design.tokens.stylex'
import { useDragAndDrop } from './hooks'
import { dragStyles } from './styles'

// Hoisted so the identity is stable, which is what the case below compares.
const OURS = () => <span />

// Every draggable row in a grid list, table or tree carries one: React Aria
// starts a drag from the pointer on its own, and this is what gives a
// keyboard or screen reader user the same move.
const DRAG = <Button slot="drag">Drag</Button>

const probeStyles = stylex.create({
  onSurface: { color: colors.onSurface },
  primary: { color: colors.primary },
  surfaceContainerHigh: { color: colors.surfaceContainerHigh },
})

// One set of hooks handed to whichever collection the case is about, which is
// the whole point of the item: the four share them.
type Hooks = ReturnType<typeof useDragAndDrop>['dragAndDropHooks']

function Draggable({ children }: { children: (hooks: Hooks) => ReactNode }) {
  const { dragAndDropHooks } = useDragAndDrop({
    getItems: (keys) => [...keys].map((key) => ({ 'text/plain': String(key) })),
  })

  return <>{children(dragAndDropHooks)}</>
}

// The preview the wrapper installs, for the items named. React Aria draws it
// only while a drag is in flight, which a test cannot start, so this calls
// the renderer and renders what it returns — the element React Aria would
// draw under the pointer.
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

      // React Aria renders both only while a drag is in flight, which a test
      // cannot start — so what is checked is that the wrapper put them there
      // at all. Without this, dropping either default from the wrapper is a
      // change nothing notices.
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

  describe('the drop indicator', () => {
    it('takes no room in the list until it is the target', () => {
      const view = render(
        <Draggable>
          {(hooks) => (
            <List aria-label="Label" dragAndDropHooks={hooks}>
              <List.Item id="first" leading={DRAG}>
                First item
              </List.Item>
              <List.Item id="second" leading={DRAG}>
                Second item
              </List.Item>
            </List>
          )}
        </Draggable>,
      )

      // React Aria draws the indicators only while a drag is in flight, so a
      // list at rest has none at all — which is the strongest form of taking
      // no room.
      expect(
        view.container.querySelectorAll('[data-drop-target]'),
      ).toHaveLength(0)
    })

    it('is the primary role, and drawn as a line rather than a box', () => {
      const view = render(
        <span
          className={
            stylex.props(dragStyles.indicator, dragStyles.indicatorActive)
              .className
          }
          data-testid="line"
        />,
      )
      const line = getComputedStyle(view.getByTestId('line'))

      expect(line.backgroundColor).toBe(probe(probeStyles.primary))
      expect(line.blockSize).toBe('2px')
    })

    it('is invisible while it is not the target', () => {
      const view = render(
        <span
          className={stylex.props(dragStyles.indicator).className}
          data-testid="line"
        />,
      )

      expect(getComputedStyle(view.getByTestId('line')).backgroundColor).toBe(
        'rgba(0, 0, 0, 0)',
      )
    })
  })
})
