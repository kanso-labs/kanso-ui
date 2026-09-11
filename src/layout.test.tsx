// The collections take arbitrary content in their slots, so JSX at a prop is
// their API rather than a misuse of it. react-perf guards against a fresh
// element identity defeating memoization, which the React Compiler this repo
// builds with already handles.
// oxlint-disable react-perf/jsx-no-jsx-as-prop

import * as stylex from '@stylexjs/stylex'
import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import Button from './components/button'
import List from './components/list'
import ListBox from './components/list-box'
import Menu from './components/menu'
import Table from './components/table'
import Tree from './components/tree'
import { dragStyles } from './drag/styles'
import { collectionSizes } from './layout'

// Every constant is checked against what the component actually draws. A
// virtualized collection positions its rows from these numbers rather than
// from the DOM, so one that drifted from its component would put every row
// in the wrong place — and nothing else in the suite would notice.
//
// `offsetHeight` rather than a bounding rect, because a rect includes any
// transform: a menu measured while its popover is still scaling in comes to
// 45.6 rather than 48, which is the animation rather than the row.
describe('collection sizes', () => {
  it('matches a List row with a headline alone', () => {
    const view = render(
      <List aria-label="Label">
        <List.Item id="first">First item</List.Item>
      </List>,
    )

    expect(view.getAllByRole('row')[0].offsetHeight).toBe(
      collectionSizes.listRow,
    )
  })

  it('matches a List row with a supporting line', () => {
    const view = render(
      <List aria-label="Label">
        <List.Item id="first" supporting="Supporting line">
          First item
        </List.Item>
      </List>,
    )

    expect(view.getAllByRole('row')[0].offsetHeight).toBe(
      collectionSizes.listRowTwoLine,
    )
  })

  it('matches a section heading', () => {
    const view = render(
      <List aria-label="Label">
        <List.Section header="Headline" id="section">
          <List.Item id="first">First item</List.Item>
        </List.Section>
      </List>,
    )
    const heading = view.getByText('Headline').closest('[role="row"]')
    if (!(heading instanceof HTMLElement)) {
      throw new Error('expected the heading to render a row')
    }

    expect(heading.offsetHeight).toBe(collectionSizes.sectionHeading)
  })

  it('matches a ListBox option', () => {
    const view = render(
      <ListBox aria-label="Label">
        <ListBox.Item id="first">First item</ListBox.Item>
      </ListBox>,
    )

    expect(view.getAllByRole('option')[0].offsetHeight).toBe(
      collectionSizes.listRow,
    )
  })

  it('matches a Tree row', () => {
    const view = render(
      <Tree aria-label="Label">
        <Tree.Item headline="First item" id="first" />
      </Tree>,
    )

    expect(view.getAllByRole('row')[0].offsetHeight).toBe(
      collectionSizes.listRow,
    )
  })

  it('matches a Table header row and a body row', () => {
    const view = render(
      <Table aria-label="Label">
        <Table.Header>
          <Table.Column id="colName" isRowHeader>
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
    const [header, row] = view.getAllByRole('row')

    expect(header.offsetHeight).toBe(collectionSizes.tableHeaderRow)
    expect(row.offsetHeight).toBe(collectionSizes.tableRow)
  })

  it('matches a Menu item', () => {
    const view = render(
      <Menu defaultOpen>
        <Button>Open</Button>
        <Menu.Content>
          <Menu.Item id="first">First item</Menu.Item>
        </Menu.Content>
      </Menu>,
    )

    expect(view.getAllByRole('menuitem')[0].offsetHeight).toBe(
      collectionSizes.menuRow,
    )
  })

  it('matches the drop indicator the drag module draws', () => {
    const view = render(
      <span
        className={stylex.props(dragStyles.indicator).className}
        data-testid="line"
      />,
    )

    expect(
      Number.parseFloat(getComputedStyle(view.getByTestId('line')).blockSize),
    ).toBe(collectionSizes.dropIndicator)
  })
})
