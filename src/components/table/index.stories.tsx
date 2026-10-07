// A cell takes arbitrary content, so passing JSX to a slot is this
// component's API rather than a misuse of it — and in a table the node
// depends on the row's own data, so there is nothing to hoist. react-perf
// guards against a fresh element identity defeating memoization, which the
// React Compiler this repo builds with already handles.
// oxlint-disable react-perf/jsx-no-jsx-as-prop

import type { Meta, StoryObj } from '@storybook/react-vite'
import type { SortDescriptor } from 'react-aria-components'

import * as stylex from '@stylexjs/stylex'
import { useMemo, useState } from 'react'

import Table from '.'
import { typography } from '../../tokens/design.tokens.stylex'
import Card from '../card'
import Tag from '../tag'

const styles = stylex.create({
  // What a sticky header needs to have something to stick to: a box the
  // table is taller than.
  scroller: {
    blockSize: '200px',
    overflowY: 'auto',
  },
  // A styled span rather than a Text: the value column wants mono with
  // tabular figures so 01/02/03 line up down the column, and Text carries
  // neither — its variants set the family, and it spreads its own StyleX
  // class last so the call site cannot add font-variant-numeric.
  value: {
    fontFamily: typography.fontFamilyMono,
    fontVariantNumeric: 'tabular-nums',
  },
})

const ROWS = [
  { id: 'first', name: 'First item', status: 'Ready', value: '01' },
  { id: 'second', name: 'Second item', status: 'Waiting', value: '02' },
  { id: 'third', name: 'Third item', status: 'Ready', value: '03' },
] as const

// A column's id and a row's id share one namespace in React Aria's
// collection, so the two sets are kept apart by prefix — a value used by
// both leaves the table with no columns at all.
const COLUMNS = {
  name: 'colName',
  status: 'colStatus',
  value: 'colValue',
} as const

// Hoisted so the array identity is stable across renders, which is what
// react-perf's jsx-no-new-array-as-prop is after.
const SELECTED = ['second']
const DISABLED = ['third']

// Enough rows to scroll under a sticky header, each with an id of its own —
// the same three repeated would give three rows one key between them.
const SCROLLING_ROWS = Array.from({ length: 9 }, (_unused, index) => ({
  id: `row${index}`,
  name: ROWS[index % ROWS.length].name,
  value: String(index + 1).padStart(2, '0'),
}))

// What the empty table draws in place of rows. Declared once rather than
// written at the prop, which would hand it a new function each render.
function nothingToShow() {
  return 'Nothing to show'
}

const meta = {
  component: Table,
  title: 'Components/Table',
} satisfies Meta<typeof Table>

type Story = StoryObj<typeof meta>

function Basic() {
  return (
    <Card padding="none" variant="outlined">
      <Table aria-label="Label">
        <Table.Header>
          <Table.Column id={COLUMNS.name} isRowHeader>
            Label
          </Table.Column>
          <Table.Column id={COLUMNS.status}>Status</Table.Column>
          <Table.Column id={COLUMNS.value}>Value</Table.Column>
        </Table.Header>
        <Table.Body>
          {ROWS.map((row) => (
            <Table.Row id={row.id} key={row.id}>
              <Table.Cell>{row.name}</Table.Cell>
              <Table.Cell>{row.status}</Table.Cell>
              <Table.Cell>
                <span {...stylex.props(styles.value)}>{row.value}</span>
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table>
    </Card>
  )
}

// Resizing is React Aria's: the container holds the widths and the handle
// drags them. What a call site decides is which columns take a handle, and
// what each one starts at.
function Resizable() {
  return (
    <Card padding="none" variant="outlined">
      <Table aria-label="Label" resizable>
        <Table.Header>
          <Table.Column
            defaultWidth="2fr"
            id={COLUMNS.name}
            isRowHeader
            resizable
          >
            Label
          </Table.Column>
          <Table.Column defaultWidth="1fr" id={COLUMNS.status} resizable>
            Status
          </Table.Column>
          <Table.Column defaultWidth="1fr" id={COLUMNS.value}>
            Value
          </Table.Column>
        </Table.Header>
        <Table.Body>
          {ROWS.map((row) => (
            <Table.Row id={row.id} key={row.id}>
              <Table.Cell>{row.name}</Table.Cell>
              <Table.Cell>{row.status}</Table.Cell>
              <Table.Cell>
                <span {...stylex.props(styles.value)}>{row.value}</span>
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table>
    </Card>
  )
}

// A table whose rows select, with the second selected. The Disabled story
// disables a row of the same table.
function Selecting(props: { disabledKeys?: string[] }) {
  return (
    <Card padding="none" variant="outlined">
      <Table
        aria-label="Label"
        defaultSelectedKeys={SELECTED}
        disabledKeys={props.disabledKeys}
        selectionMode="multiple"
      >
        <Table.Header>
          <Table.Column id="colSelect" selection />
          <Table.Column id={COLUMNS.name} isRowHeader>
            Label
          </Table.Column>
          <Table.Column id={COLUMNS.status}>Status</Table.Column>
        </Table.Header>
        <Table.Body>
          {ROWS.map((row) => (
            <Table.Row id={row.id} key={row.id}>
              <Table.Cell selection />
              <Table.Cell>{row.name}</Table.Cell>
              <Table.Cell>
                <Tag tone={row.status === 'Ready' ? 'positive' : 'neutral'}>
                  {row.status}
                </Tag>
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table>
    </Card>
  )
}

// Sorting is the call site's to do: React Aria reports which column and which
// direction, and the rows it is handed are the rows it draws.
function Sortable() {
  const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({
    column: COLUMNS.name,
    direction: 'ascending',
  })

  const rows = useMemo(() => {
    const key = sortDescriptor.column === COLUMNS.value ? 'value' : 'name'
    // `toSorted` and `toReversed` are ES2023 and the library compiles to
    // ES2022, so the copy is made by the spread instead — which is what the
    // two rules below are guarding against in the first place.
    // oxlint-disable-next-line unicorn/no-array-sort -- the spread above is the copy
    const sorted = [...ROWS].sort((a, b) => a[key].localeCompare(b[key]))
    // oxlint-disable-next-line unicorn/no-array-reverse -- sorted is already a copy
    return sortDescriptor.direction === 'descending' ? sorted.reverse() : sorted
  }, [sortDescriptor])

  return (
    <Card padding="none" variant="outlined">
      <Table
        aria-label="Label"
        onSortChange={setSortDescriptor}
        sortDescriptor={sortDescriptor}
      >
        <Table.Header>
          <Table.Column allowsSorting id={COLUMNS.name} isRowHeader>
            Label
          </Table.Column>
          <Table.Column id={COLUMNS.status}>Status</Table.Column>
          <Table.Column allowsSorting id={COLUMNS.value}>
            Value
          </Table.Column>
        </Table.Header>
        <Table.Body>
          {rows.map((row) => (
            <Table.Row id={row.id} key={row.id}>
              <Table.Cell>{row.name}</Table.Cell>
              <Table.Cell>{row.status}</Table.Cell>
              <Table.Cell>
                <span {...stylex.props(styles.value)}>{row.value}</span>
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table>
    </Card>
  )
}

const Default: Story = {
  render: () => <Basic />,
}

// Its own story because it is a state no other story draws: the third
// row faded, with its checkbox off and neither tint nor pointer, in a table
// whose other rows still select.
const Disabled: Story = {
  render: () => <Selecting disabledKeys={DISABLED} />,
}

// Its own story because it is a state a snapshot can show and a description
// cannot: the arrow beside the sorted column, and the rows in the order
// the call site put them in.
const Sorting: Story = {
  render: () => <Sortable />,
}

// Its own story because dragging a handle is the thing to look at, and a
// snapshot of the resting state is what a reviewer compares against.
const Resizing: Story = {
  render: () => <Resizable />,
}

// The header holds its place while the rows scroll under it, which needs the
// table inside something that scrolls — so the story brings the box as well.
const StickyHeader: Story = {
  render: () => (
    <Card padding="none" variant="outlined">
      <div {...stylex.props(styles.scroller)}>
        <Table aria-label="Label" stickyHeader>
          <Table.Header>
            <Table.Column id={COLUMNS.name} isRowHeader>
              Label
            </Table.Column>
            <Table.Column id={COLUMNS.value}>Value</Table.Column>
          </Table.Header>
          <Table.Body>
            {SCROLLING_ROWS.map((row) => (
              <Table.Row id={row.id} key={row.id}>
                <Table.Cell>{row.name}</Table.Cell>
                <Table.Cell>
                  <span {...stylex.props(styles.value)}>{row.value}</span>
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      </div>
    </Card>
  ),
}

// `Table.LoadMore` goes after the rows and draws a ring across the width while
// more are being fetched. It is drawn mid-fetch rather than wired to a real
// one, since a story that fetches has loaded its next page when captured.
const LoadingMore: Story = {
  render: () => (
    <Card padding="none" variant="outlined">
      <Table aria-label="Label">
        <Table.Header>
          <Table.Column id={COLUMNS.name} isRowHeader>
            Label
          </Table.Column>
          <Table.Column id={COLUMNS.value}>Value</Table.Column>
        </Table.Header>
        <Table.Body>
          {ROWS.map((row) => (
            <Table.Row id={row.id} key={row.id}>
              <Table.Cell>{row.name}</Table.Cell>
              <Table.Cell>
                <span {...stylex.props(styles.value)}>{row.value}</span>
              </Table.Cell>
            </Table.Row>
          ))}
          <Table.LoadMore isLoading />
        </Table.Body>
      </Table>
    </Card>
  ),
}

// A footer holds a row under the body, totals and the like, ruled off from it.
// React Aria keeps it out of the selection and the keyboard navigation, so it
// is read as a summary rather than as one more row.
const Footer: Story = {
  render: () => (
    <Card padding="none" variant="outlined">
      <Table aria-label="Label">
        <Table.Header>
          <Table.Column id={COLUMNS.name} isRowHeader>
            Label
          </Table.Column>
          <Table.Column id={COLUMNS.value}>Value</Table.Column>
        </Table.Header>
        <Table.Body>
          {ROWS.map((row) => (
            <Table.Row id={row.id} key={row.id}>
              <Table.Cell>{row.name}</Table.Cell>
              <Table.Cell>
                <span {...stylex.props(styles.value)}>{row.value}</span>
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
        <Table.Footer>
          <Table.Row id="total">
            <Table.Cell>Total</Table.Cell>
            <Table.Cell>
              <span {...stylex.props(styles.value)}>06</span>
            </Table.Cell>
          </Table.Row>
        </Table.Footer>
      </Table>
    </Card>
  ),
}

// A table with no rows shows what its `renderEmptyState` returns in their
// place, and still says what its columns are.
const Empty: Story = {
  render: () => (
    <Card padding="none" variant="outlined">
      <Table aria-label="Label">
        <Table.Header>
          <Table.Column id={COLUMNS.name} isRowHeader>
            Label
          </Table.Column>
          <Table.Column id={COLUMNS.value}>Value</Table.Column>
        </Table.Header>
        <Table.Body renderEmptyState={nothingToShow} />
      </Table>
    </Card>
  ),
}

export {
  Default,
  Disabled,
  Empty,
  Footer,
  LoadingMore,
  Resizing,
  Sorting,
  StickyHeader,
}

export default meta
