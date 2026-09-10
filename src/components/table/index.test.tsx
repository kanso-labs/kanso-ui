// A cell takes arbitrary content, so JSX at a prop is this component's API
// rather than a misuse of it. react-perf guards against a fresh element
// identity defeating memoization, which the React Compiler this repo builds
// with already handles.
//
// The object, array and function rules are off for the same reason plus one
// of their own: a case here renders its fixture, asserts, and unmounts, so
// there is no second render for a fresh identity to cost anything on — and
// hoisting a sort descriptor or a set of keys out of the case that uses it
// would put the fixture further from the assertion it exists for.
// oxlint-disable react-perf/jsx-no-jsx-as-prop
// oxlint-disable react-perf/jsx-no-new-array-as-prop
// oxlint-disable react-perf/jsx-no-new-function-as-prop
// oxlint-disable react-perf/jsx-no-new-object-as-prop

import type { Key, ReactElement } from 'react'
import type { Selection, SortDescriptor } from 'react-aria-components'

import * as stylex from '@stylexjs/stylex'
import { fireEvent, render } from '@testing-library/react'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'

import Table from '.'
import { colors, typography } from '../../tokens/design.tokens.stylex'

const probeStyles = stylex.create({
  bodyMedium: { fontSize: typography.bodyMediumSize },
  labelLarge: { fontWeight: typography.labelLargeWeight },
  onSurfaceVariant: { color: colors.onSurfaceVariant },
  outlineVariant: { color: colors.outlineVariant },
  primaryContainer: { color: colors.primaryContainer },
})

// A column's id and a row's id share one namespace in React Aria's
// collection, so the two sets are kept apart by prefix throughout this file —
// a value used by both leaves the table with no columns at all.
const COLUMNS = ['colName', 'colValue'] as const

// React Aria drives a resize off the pointer rather than off the hidden range
// input's own keyboard handling — `focus()` on that input does not take, since
// React Aria manages where focus goes.
const DRAG_FROM = { button: 0, clientX: 200, pointerId: 1 }
const DRAG_TO = { button: 0, clientX: 120, pointerId: 1 }

// A plain table with two columns and two rows, which is what most of the
// cases below need before they change one thing about it.
function Basic(props: {
  emptyState?: ReactElement | string
  loadMore?: boolean
  loadMoreLabel?: string
  loadMoreLoading?: boolean
  onResize?: (widths: Map<Key, unknown>) => void
  resizable?: boolean
  resizableColumns?: boolean
  resizeLabel?: string
  rows?: ReadonlyArray<readonly [string, string, string]>
  selectionMode?: 'multiple' | 'none' | 'single'
  stickyHeader?: boolean
}) {
  const rows =
    props.rows ??
    ([
      ['first', 'First item', '01'],
      ['second', 'Second item', '02'],
    ] as const)

  return (
    <Table
      aria-label="Label"
      onResize={props.onResize}
      resizable={props.resizable}
      resizeLabel={props.resizeLabel}
      selectionMode={props.selectionMode}
      stickyHeader={props.stickyHeader}
    >
      <Table.Header>
        {props.selectionMode === undefined ? null : (
          <Table.Column id="colSelect" selection />
        )}
        <Table.Column
          id={COLUMNS[0]}
          isRowHeader
          resizable={props.resizableColumns}
        >
          Label
        </Table.Column>
        <Table.Column id={COLUMNS[1]}>Value</Table.Column>
      </Table.Header>
      <Table.Body emptyState={props.emptyState}>
        {rows.map(([id, label, value]) => (
          <Table.Row id={id} key={id}>
            {props.selectionMode === undefined ? null : (
              <Table.Cell selection />
            )}
            <Table.Cell>{label}</Table.Cell>
            <Table.Cell>{value}</Table.Cell>
          </Table.Row>
        ))}
        {props.loadMore === true ? (
          <Table.LoadMore
            isLoading={props.loadMoreLoading ?? true}
            label={props.loadMoreLabel}
          />
        ) : null}
      </Table.Body>
    </Table>
  )
}

function drag(resizer: HTMLElement) {
  fireEvent.pointerDown(resizer, DRAG_FROM)
  fireEvent.pointerMove(resizer, DRAG_TO)
  fireEvent.pointerUp(resizer, DRAG_TO)
}

function probe(style: stylex.StyleXStyles) {
  const view = render(<span data-testid="probe" {...stylex.props(style)} />)
  const computed = getComputedStyle(view.getByTestId('probe'))
  const read = {
    color: computed.color,
    fontSize: computed.fontSize,
    fontWeight: computed.fontWeight,
  }
  view.unmount()
  return read
}

// The handle React Aria renders is a visually hidden range input inside the
// element that is actually dragged.
function resizerOf(handle: HTMLElement) {
  const resizer = handle.parentElement
  if (!(resizer instanceof HTMLElement)) {
    throw new Error('expected the handle to sit inside a resizer')
  }
  return resizer
}

describe('table', () => {
  describe('structure', () => {
    it('renders the grid roles React Aria gives a table', () => {
      const view = render(<Basic />)

      expect(view.getByRole('grid', { name: 'Label' })).not.toBeNull()
      expect(view.getAllByRole('columnheader')).toHaveLength(2)
      // Two body rows plus the header's own.
      expect(view.getAllByRole('row')).toHaveLength(3)
      // The column marked isRowHeader is what names each row.
      expect(view.getAllByRole('rowheader')).toHaveLength(2)
      expect(view.getAllByRole('gridcell')).toHaveLength(2)
    })

    it('draws the page heights: 56px for the header and 52px for a row', () => {
      const view = render(<Basic />)

      const header = view.getAllByRole('columnheader')[0]
      const row = view.getAllByRole('row')[1]

      expect(header.getBoundingClientRect().height).toBe(56)
      expect(row.getBoundingClientRect().height).toBe(52)
    })

    it('puts the page 16px on each side of a cell, so two columns sit 32px apart', () => {
      const view = render(<Basic />)
      const [name, value] = view.getAllByRole('columnheader')

      expect(getComputedStyle(name).paddingInlineStart).toBe('16px')
      expect(getComputedStyle(name).paddingInlineEnd).toBe('16px')
      expect(getComputedStyle(value).paddingInlineStart).toBe('16px')
    })

    it('sets the header in the page medium weight against the rows regular one', () => {
      const view = render(<Basic />)

      const header = getComputedStyle(view.getAllByRole('columnheader')[0])
      const cell = getComputedStyle(view.getAllByRole('rowheader')[0])

      expect(header.fontWeight).toBe(probe(probeStyles.labelLarge).fontWeight)
      expect(cell.fontSize).toBe(probe(probeStyles.bodyMedium).fontSize)
      expect(header.fontWeight).not.toBe(cell.fontWeight)
    })

    it('rules the rows apart without doubling the one under the header', () => {
      const view = render(<Basic />)
      const [, first, second] = view.getAllByRole('row')

      // The first body row takes no rule of its own: the header group's is
      // already between it and the columns.
      expect(getComputedStyle(first).borderBlockStartWidth).toBe('0px')
      expect(getComputedStyle(second).borderBlockStartWidth).toBe('1px')
      expect(getComputedStyle(second).borderBlockStartColor).toBe(
        probe(probeStyles.outlineVariant).color,
      )
    })
  })

  describe('sorting', () => {
    it('marks only the sorted column, and only in the direction it is sorted', () => {
      const view = render(
        <Table
          aria-label="Label"
          onSortChange={vi.fn<(descriptor: SortDescriptor) => void>()}
          sortDescriptor={{ column: COLUMNS[0], direction: 'descending' }}
        >
          <Table.Header>
            <Table.Column allowsSorting id={COLUMNS[0]} isRowHeader>
              Label
            </Table.Column>
            <Table.Column allowsSorting id={COLUMNS[1]}>
              Value
            </Table.Column>
          </Table.Header>
          <Table.Body>
            <Table.Row id="first">
              <Table.Cell>First item</Table.Cell>
              <Table.Cell>01</Table.Cell>
            </Table.Row>
          </Table.Body>
        </Table>,
      )

      const [sorted, unsorted] = view.getAllByRole('columnheader')

      expect(sorted.getAttribute('aria-sort')).toBe('descending')
      // A sortable column that is not the sorted one says so rather than
      // staying silent, which is what lets a reader tell the two apart.
      expect(unsorted.getAttribute('aria-sort')).toBe('none')
      // The arrow is drawn beside the sorted column's name and nowhere else,
      // so a sortable column that is not the sorted one carries no glyph.
      expect(sorted.querySelector('svg')).not.toBeNull()
      expect(unsorted.querySelector('svg')).toBeNull()
    })

    it('reports the column and the direction when a header is pressed', () => {
      const onSortChange = vi.fn<(descriptor: SortDescriptor) => void>()
      const view = render(
        <Table
          aria-label="Label"
          onSortChange={onSortChange}
          sortDescriptor={{ column: COLUMNS[0], direction: 'ascending' }}
        >
          <Table.Header>
            <Table.Column allowsSorting id={COLUMNS[0]} isRowHeader>
              Label
            </Table.Column>
          </Table.Header>
          <Table.Body>
            <Table.Row id="first">
              <Table.Cell>First item</Table.Cell>
            </Table.Row>
          </Table.Body>
        </Table>,
      )

      // React Aria's press comes off the pointer events rather than a click,
      // and the sequence is dispatched rather than pointed at: a pointer that
      // has to find the element waits for it to be stable, which under a
      // parallel run is a race the assertion below can lose.
      const header = view.getByRole('columnheader', { name: /Label/ })
      fireEvent.pointerDown(header, { button: 0, pointerId: 1 })
      fireEvent.pointerUp(header, { button: 0, pointerId: 1 })
      fireEvent.click(header)

      // Pressing the column already sorted ascending reverses it, which is
      // what the page says the arrow then shows.
      expect(onSortChange).toHaveBeenCalledWith({
        column: COLUMNS[0],
        direction: 'descending',
      })
    })

    it('turns the arrow over when the direction changes', () => {
      function Sortable() {
        const [direction, setDirection] = useState<'ascending' | 'descending'>(
          'ascending',
        )
        return (
          <>
            <button
              onClick={() => {
                setDirection('descending')
              }}
              type="button"
            >
              Reverse
            </button>
            <Table
              aria-label="Label"
              onSortChange={vi.fn<(descriptor: SortDescriptor) => void>()}
              sortDescriptor={{ column: COLUMNS[0], direction }}
            >
              <Table.Header>
                <Table.Column allowsSorting id={COLUMNS[0]} isRowHeader>
                  Label
                </Table.Column>
              </Table.Header>
              <Table.Body>
                <Table.Row id="first">
                  <Table.Cell>First item</Table.Cell>
                </Table.Row>
              </Table.Body>
            </Table>
          </>
        )
      }

      const view = render(<Sortable />)
      const pathOf = () =>
        view
          .getByRole('columnheader')
          .querySelector('svg path')
          ?.getAttribute('d')

      const ascending = pathOf()
      fireEvent.click(view.getByRole('button', { name: 'Reverse' }))

      expect(pathOf()).not.toBe(ascending)
    })
  })

  describe('selection', () => {
    it('draws a checkbox in the header and one on every row', () => {
      const view = render(<Basic selectionMode="multiple" />)

      // The row boxes take the table's own label, and React Aria composes
      // each one with the row it is in — so the name is the label plus the
      // row's text rather than the label alone.
      expect(view.getByRole('checkbox', { name: 'Select all' })).not.toBeNull()
      expect(
        view.getByRole('checkbox', { name: 'Select First item' }),
      ).not.toBeNull()
      expect(
        view.getByRole('checkbox', { name: 'Select Second item' }),
      ).not.toBeNull()
    })

    it('takes the labels the table was given', () => {
      const view = render(
        <Table
          aria-label="Label"
          selectAllLabel="Choose every one"
          selectionMode="multiple"
          selectLabel="Choose"
        >
          <Table.Header>
            <Table.Column id="colSelect" selection />
            <Table.Column id={COLUMNS[0]} isRowHeader>
              Label
            </Table.Column>
          </Table.Header>
          <Table.Body>
            <Table.Row id="first">
              <Table.Cell selection />
              <Table.Cell>First item</Table.Cell>
            </Table.Row>
          </Table.Body>
        </Table>,
      )

      expect(
        view.getByRole('checkbox', { name: 'Choose every one' }),
      ).not.toBeNull()
      expect(
        view.getByRole('checkbox', { name: 'Choose First item' }),
      ).not.toBeNull()
    })

    it('reports the row keys it was left holding', () => {
      const onSelectionChange = vi.fn<(keys: Selection) => void>()
      const view = render(
        <Table
          aria-label="Label"
          onSelectionChange={onSelectionChange}
          selectionMode="multiple"
        >
          <Table.Header>
            <Table.Column id="colSelect" selection />
            <Table.Column id={COLUMNS[0]} isRowHeader>
              Label
            </Table.Column>
          </Table.Header>
          <Table.Body>
            <Table.Row id="first">
              <Table.Cell selection />
              <Table.Cell>First item</Table.Cell>
            </Table.Row>
          </Table.Body>
        </Table>,
      )

      // The box itself is the visually hidden input a Checkbox renders, so
      // it is dispatched to directly rather than pointed at.
      fireEvent.click(view.getByRole('checkbox', { name: 'Select First item' }))

      // React Aria reports a Selection rather than a plain Set — a subclass
      // carrying the anchor and current keys, or the string `all` — so what
      // is asserted is what it holds rather than the object it is.
      const keys = onSelectionChange.mock.calls[0][0]
      if (keys === 'all') {
        throw new Error('expected the keys rather than all of them')
      }

      expect([...keys]).toEqual(['first'])
    })

    it('draws a selected row on the page own container rather than a state layer', () => {
      const view = render(
        <Table
          aria-label="Label"
          defaultSelectedKeys={['first']}
          selectionMode="multiple"
        >
          <Table.Header>
            <Table.Column id="colSelect" selection />
            <Table.Column id={COLUMNS[0]} isRowHeader>
              Label
            </Table.Column>
          </Table.Header>
          <Table.Body>
            <Table.Row id="first">
              <Table.Cell selection />
              <Table.Cell>First item</Table.Cell>
            </Table.Row>
            <Table.Row id="second">
              <Table.Cell selection />
              <Table.Cell>Second item</Table.Cell>
            </Table.Row>
          </Table.Body>
        </Table>,
      )

      const [, selected, plain] = view.getAllByRole('row')

      expect(getComputedStyle(selected).backgroundColor).toBe(
        probe(probeStyles.primaryContainer).color,
      )
      expect(getComputedStyle(plain).backgroundColor).not.toBe(
        getComputedStyle(selected).backgroundColor,
      )
    })

    it('leaves the checkbox out when the table does not select', () => {
      const view = render(<Basic />)

      expect(view.queryByRole('checkbox')).toBeNull()
    })
  })

  describe('empty state', () => {
    it('shows what it was given in place of rows', () => {
      const view = render(<Basic emptyState="Nothing to show" rows={[]} />)

      expect(view.getByText('Nothing to show')).not.toBeNull()
      // The header is still drawn: a table with no rows still says what its
      // columns are.
      expect(view.getAllByRole('columnheader')).toHaveLength(2)
    })

    it('draws it in the muted role rather than the row one', () => {
      const view = render(<Basic emptyState="Nothing to show" rows={[]} />)

      expect(getComputedStyle(view.getByText('Nothing to show')).color).toBe(
        probe(probeStyles.onSurfaceVariant).color,
      )
    })

    it('centres it in a row of its own rather than leaving it at the edge', () => {
      const view = render(<Basic emptyState="Nothing to show" rows={[]} />)
      const empty = getComputedStyle(view.getByText('Nothing to show'))

      // React Aria's cell carries no padding of its own, so an inline box
      // here would sit against the table's edge with no height to speak of.
      expect(empty.display).toBe('block')
      expect(empty.textAlign).toBe('center')
      expect(empty.paddingBlockStart).toBe('32px')
    })

    it('shows nothing in their place when it was given nothing', () => {
      const view = render(<Basic rows={[]} />)

      expect(view.queryByText('Nothing to show')).toBeNull()
      expect(view.getAllByRole('columnheader')).toHaveLength(2)
    })
  })

  describe('sticky header', () => {
    it('holds the header in place and gives it a ground to scroll rows under', () => {
      const view = render(<Basic stickyHeader />)
      const header = getComputedStyle(view.getAllByRole('columnheader')[0])

      expect(header.position).toBe('sticky')
      expect(header.insetBlockStart).toBe('0px')
      expect(header.backgroundColor).not.toBe('rgba(0, 0, 0, 0)')
    })

    it('keeps the rule under the header, which the group cannot carry', () => {
      const view = render(<Basic stickyHeader />)
      const head = view.container.querySelector('thead')
      if (!(head instanceof HTMLElement)) {
        throw new Error('expected the header to render a thead')
      }

      // `position: sticky` lifts the cells out of the row group's box, so the
      // group's border would stay behind with the scrolled-away header. The
      // cells carry it instead, as a shadow rather than a border — under
      // `border-collapse: collapse` the table paints a cell's border, and it
      // paints a sticky cell's where the cell no longer is.
      expect(getComputedStyle(head).borderBlockEndWidth).toBe('0px')

      const cell = getComputedStyle(view.getAllByRole('columnheader')[0])

      expect(cell.borderBlockEndWidth).toBe('0px')
      expect(cell.boxShadow).toContain('inset')
      expect(cell.boxShadow).toContain(probe(probeStyles.outlineVariant).color)
    })

    it('leaves the rule on the group when the header does not stick', () => {
      const view = render(<Basic />)
      const head = view.container.querySelector('thead')
      if (!(head instanceof HTMLElement)) {
        throw new Error('expected the header to render a thead')
      }

      expect(getComputedStyle(head).borderBlockEndWidth).toBe('1px')
      expect(
        getComputedStyle(view.getAllByRole('columnheader')[0]).boxShadow,
      ).toBe('none')
    })

    it('leaves the header in the flow otherwise', () => {
      const view = render(<Basic />)

      expect(
        getComputedStyle(view.getAllByRole('columnheader')[0]).position,
      ).not.toBe('sticky')
    })
  })

  describe('resizing', () => {
    it('brings the container React Aria keeps the resize state on', () => {
      const view = render(<Basic resizable />)
      const table = view.getByRole('grid')

      // The container is the element that fills the width and scrolls, since
      // React Aria sizes a resizable table to its columns instead.
      const container = table.closest('div')
      if (!(container instanceof HTMLElement)) {
        throw new Error('expected the table to be wrapped in a container')
      }

      expect(getComputedStyle(container).overflowX).toBe('auto')
    })

    it('leaves the table unwrapped when it does not resize', () => {
      const view = render(<Basic />)
      const container = view.getByRole('grid').closest('div')

      // The render container itself is a div, so what is checked is that it
      // carries none of the scrolling the resizable one does.
      expect(
        container === null ? '' : getComputedStyle(container).overflowX,
      ).not.toBe('auto')
    })

    it('draws a handle on the columns that asked for one, and no others', () => {
      const view = render(<Basic resizable resizableColumns />)

      // React Aria draws the handle as a range input, so a slider is what a
      // reader finds — one per resizable column.
      expect(view.getAllByRole('slider')).toHaveLength(1)
    })

    it('draws none when the table does not resize', () => {
      const view = render(<Basic resizableColumns />)

      expect(view.queryByRole('slider')).toBeNull()
    })

    it('names the handle with the table label composed with the column', () => {
      const view = render(<Basic resizable resizableColumns />)

      // React Aria points the handle's `aria-labelledby` at itself and at the
      // column, so the name is the label plus the column's own text.
      expect(
        view.getByRole('slider', { name: 'Resize column Label' }),
      ).not.toBeNull()
    })

    it('takes the label the table was given', () => {
      const view = render(
        <Basic resizable resizableColumns resizeLabel="Drag to size" />,
      )

      expect(
        view.getByRole('slider', { name: 'Drag to size Label' }),
      ).not.toBeNull()
    })

    it('reports every column width once a handle is dragged', () => {
      const onResize = vi.fn<(widths: Map<Key, unknown>) => void>()
      const view = render(
        <Basic onResize={onResize} resizable resizableColumns />,
      )

      drag(resizerOf(view.getByRole('slider')))

      expect(onResize).toHaveBeenCalled()
      // Every column is reported, not only the one dragged: under the fixed
      // layout the container imposes, moving one boundary moves the rest.
      expect([...onResize.mock.calls[0][0].keys()]).toEqual([
        COLUMNS[0],
        COLUMNS[1],
      ])
    })

    it('narrows the column it was dragged across', () => {
      const view = render(<Basic resizable resizableColumns />)
      const column = view.getAllByRole('columnheader')[0]
      const before = column.getBoundingClientRect().width

      drag(resizerOf(view.getByRole('slider')))

      expect(column.getBoundingClientRect().width).toBeLessThan(before)
    })

    it('marks the handle while it is being dragged, and lets go after', () => {
      const view = render(<Basic resizable resizableColumns />)
      const resizer = resizerOf(view.getByRole('slider'))
      const resting = getComputedStyle(resizer).inlineSize

      fireEvent.pointerDown(resizer, DRAG_FROM)
      fireEvent.pointerMove(resizer, DRAG_TO)

      // Thickened while it is the boundary being moved, so the one under the
      // pointer is the one that stands out.
      const dragging = getComputedStyle(resizer).inlineSize

      fireEvent.pointerUp(resizer, DRAG_TO)

      expect(dragging).not.toBe(resting)
      expect(getComputedStyle(resizer).inlineSize).toBe(resting)
    })
  })

  describe('load more', () => {
    it('shows the ring while it is fetching, named for a reader', () => {
      const view = render(<Basic loadMore />)

      expect(
        view.getByRole('progressbar', { name: 'Loading more' }),
      ).not.toBeNull()
    })

    it('takes the label it was given', () => {
      const view = render(<Basic loadMore loadMoreLabel="Fetching" />)

      expect(view.getByRole('progressbar', { name: 'Fetching' })).not.toBeNull()
    })

    it('shows nothing while it is not fetching', () => {
      const view = render(<Basic loadMore loadMoreLoading={false} />)

      expect(view.queryByRole('progressbar')).toBeNull()
    })

    it('holds a body row height, so the list does not jump as rows arrive', () => {
      const view = render(<Basic loadMore />)
      const row = view
        .getByRole('progressbar', { name: 'Loading more' })
        .closest('tr')
      if (!(row instanceof HTMLTableRowElement)) {
        throw new Error('expected the ring to sit in a row')
      }

      expect(row.getBoundingClientRect().height).toBe(52)
    })

    it('carries no aria-level, which a grid row may not have', () => {
      const view = render(<Basic loadMore />)
      const row = view
        .getByRole('progressbar', { name: 'Loading more' })
        .closest('tr')
      if (!(row instanceof HTMLTableRowElement)) {
        throw new Error('expected the ring to sit in a row')
      }

      // React Aria sets it, and `aria-level` belongs to a treegrid's rows
      // rather than a grid's — axe fails the page on it, and the stories run
      // axe as an error. It is taken off the element, since React Aria writes
      // it after the call site's own props.
      expect(row.getAttribute('aria-level')).toBeNull()
    })

    it('spans every column rather than sitting in the first', () => {
      const view = render(<Basic loadMore />)
      const cell = view
        .getByRole('progressbar', { name: 'Loading more' })
        .closest('td')
      if (!(cell instanceof HTMLTableCellElement)) {
        throw new Error('expected the ring to sit in a cell')
      }

      expect(cell.colSpan).toBe(2)
    })
  })

  describe('footer', () => {
    it('renders its rows outside the body and rules itself off from them', () => {
      const view = render(
        <Table aria-label="Label">
          <Table.Header>
            <Table.Column id={COLUMNS[0]} isRowHeader>
              Label
            </Table.Column>
            <Table.Column id={COLUMNS[1]}>Value</Table.Column>
          </Table.Header>
          <Table.Body>
            <Table.Row id="first">
              <Table.Cell>First item</Table.Cell>
              <Table.Cell>01</Table.Cell>
            </Table.Row>
          </Table.Body>
          <Table.Footer>
            <Table.Row id="total">
              <Table.Cell>Total</Table.Cell>
              <Table.Cell>01</Table.Cell>
            </Table.Row>
          </Table.Footer>
        </Table>,
      )

      const foot = view.container.querySelector('tfoot')
      if (!(foot instanceof HTMLElement)) {
        throw new Error('expected the footer to render a tfoot')
      }

      expect(view.getByText('Total')).not.toBeNull()
      expect(getComputedStyle(foot).borderBlockStartWidth).toBe('1px')
      expect(getComputedStyle(foot).borderBlockStartColor).toBe(
        probe(probeStyles.outlineVariant).color,
      )
    })
  })

  describe('keyboard', () => {
    it('moves between rows with the arrow keys', () => {
      const view = render(<Basic />)
      const [, first, second] = view.getAllByRole('row')

      // Focused and keyed directly rather than clicked into: a pointer that
      // has to find the row waits for it to be stable, which under a parallel
      // run is a race the assertions below can lose.
      first.focus()
      expect(first.contains(document.activeElement)).toBe(true)

      fireEvent.keyDown(first, { key: 'ArrowDown' })
      fireEvent.keyUp(first, { key: 'ArrowDown' })

      expect(second.contains(document.activeElement)).toBe(true)
    })
  })
})
