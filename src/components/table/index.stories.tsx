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
import { spacing, typography } from '../../tokens/design.tokens.stylex'
import Card from '../card'
import Separator from '../separator'
import Tag from '../tag'
import Text from '../text'

// See avatar/index.stories.tsx for why the overview is built from the
// library's own components rather than from shell components of its own, and
// why its sections are divided by a rule instead of boxed in Cards.
// oxlint-disable-next-line jsx-a11y/heading-has-content -- filled by useRender
const HEADING_1 = <h1 />
// oxlint-disable-next-line jsx-a11y/heading-has-content -- filled by useRender
const HEADING_2 = <h2 />
const PARAGRAPH = <p />

const styles = stylex.create({
  header: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.xs,
  },
  intro: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.xxs,
  },
  page: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.xl,
    marginInline: 'auto',
    maxInlineSize: '960px',
    padding: spacing.xl,
  },
  // What a sticky header needs to have something to stick to: a box the
  // table is taller than.
  scroller: {
    blockSize: '200px',
    overflowY: 'auto',
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.lg,
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

// Enough rows to scroll under a sticky header, each with an id of its own —
// the same three repeated would give three rows one key between them.
const SCROLLING_ROWS = Array.from({ length: 9 }, (_unused, index) => ({
  id: `row${index}`,
  name: ROWS[index % ROWS.length].name,
  value: String(index + 1).padStart(2, '0'),
}))

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

const Overview: Story = {
  render: () => (
    <div {...stylex.props(styles.page)}>
      <header {...stylex.props(styles.header)}>
        <Text render={HEADING_1} variant="displaySmall">
          Table
        </Text>
        <Text render={PARAGRAPH} tone="muted" variant="bodyLarge">
          A grid of rows and columns, with sorting and selection.
        </Text>
      </header>

      <Separator />

      <section {...stylex.props(styles.section)}>
        <div {...stylex.props(styles.intro)}>
          <Text render={HEADING_2} variant="titleLarge">
            Rows and columns
          </Text>
          <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
            The page&apos;s 56px header over 52px rows, with 16px on each side
            of every cell — which is what puts its 32px between two adjacent
            columns. The header is a medium weight against the rows&apos;
            regular one, and the table draws no container of its own, so an
            outlined Card is what gives it an edge.
          </Text>
        </div>
        <Basic />
      </section>

      <Separator />

      <section {...stylex.props(styles.section)}>
        <div {...stylex.props(styles.intro)}>
          <Text render={HEADING_2} variant="titleLarge">
            Sorting
          </Text>
          <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
            A sortable column&apos;s header is the control that sorts it — React
            Aria puts no button inside, so the whole cell is the press target.
            The arrow sits beside the name of the column being sorted and turns
            over with the direction; a sortable column that is not the sorted
            one draws none.
          </Text>
        </div>
        <Sortable />
      </section>

      <Separator />

      <section {...stylex.props(styles.section)}>
        <div {...stylex.props(styles.intro)}>
          <Text render={HEADING_2} variant="titleLarge">
            Selection
          </Text>
          <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
            A selecting table draws a checkbox in the column the call site marks
            `selection` — the header&apos;s is select-all, each row&apos;s is
            that row. A selected row takes the primary container, the same one a
            selected list row takes, so the two cannot disagree on a page
            holding both.
          </Text>
        </div>
        <Card padding="none" variant="outlined">
          <Table
            aria-label="Label"
            defaultSelectedKeys={SELECTED}
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
      </section>

      <Separator />

      <section {...stylex.props(styles.section)}>
        <div {...stylex.props(styles.intro)}>
          <Text render={HEADING_2} variant="titleLarge">
            Footer and empty state
          </Text>
          <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
            A footer holds a row under the body — totals and the like — and is
            ruled off from it. React Aria keeps it out of the selection and the
            keyboard navigation, so it is read as a summary rather than as one
            more row. A table with no rows shows its `emptyState` in their
            place, and still says what its columns are.
          </Text>
        </div>
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
        <Card padding="none" variant="outlined">
          <Table aria-label="Label">
            <Table.Header>
              <Table.Column id={COLUMNS.name} isRowHeader>
                Label
              </Table.Column>
              <Table.Column id={COLUMNS.value}>Value</Table.Column>
            </Table.Header>
            <Table.Body emptyState="Nothing to show" />
          </Table>
        </Card>
      </section>
    </div>
  ),
}

const Default: Story = {
  render: () => <Basic />,
}

// Its own story because it is a state a snapshot can show and the overview's
// copy cannot: the arrow beside the sorted column, and the rows in the order
// the call site put them in.
const Sorting: Story = {
  render: () => <Sortable />,
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

export { Default, Overview, Sorting, StickyHeader }

export default meta
