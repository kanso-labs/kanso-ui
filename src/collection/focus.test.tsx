import type { ReactElement } from 'react'

import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { userEvent } from 'vitest/browser'

import List from '../components/list'
import ListBox from '../components/list-box'
import Table from '../components/table'
import Tree from '../components/tree'

// A collection hands focus to one of its items, and each item draws its own
// ring, so the collection's own box draws none — until it has no items. React
// Aria then leaves the empty collection in the Tab order, so that its empty
// state is announced, and focus lands on the box itself. Before the box drew
// a ring of its own, a Tab into any of these landed on nothing a reader could
// see: `document.activeElement` was the listbox or the grid while its outline
// read `none`.
function emptyState() {
  return <span>Nothing to show</span>
}

const CASES: ReadonlyArray<{
  element: ReactElement
  name: string
  role: string
}> = [
  {
    element: <ListBox aria-label="Label" renderEmptyState={emptyState} />,
    name: 'ListBox',
    role: 'listbox',
  },
  {
    element: (
      <Table aria-label="Label">
        <Table.Header>
          <Table.Column id="label" isRowHeader>
            Label
          </Table.Column>
        </Table.Header>
        <Table.Body renderEmptyState={emptyState} />
      </Table>
    ),
    name: 'Table',
    role: 'grid',
  },
  {
    element: <List aria-label="Label" renderEmptyState={emptyState} />,
    name: 'List',
    role: 'grid',
  },
  {
    element: <Tree aria-label="Label" renderEmptyState={emptyState} />,
    name: 'Tree',
    role: 'treegrid',
  },
]

describe('an empty collection holding focus', () => {
  for (const { element, name, role } of CASES) {
    it(`draws a ring on an empty ${name}`, async () => {
      const view = render(element)
      await userEvent.tab()

      const focused = document.activeElement
      if (!(focused instanceof HTMLElement)) {
        throw new Error('expected focus on an element')
      }
      expect(view.container.contains(focused)).toBe(true)
      expect(focused.getAttribute('role')).toBe(role)

      const style = getComputedStyle(focused)
      expect(style.outlineStyle).toBe('solid')
      expect(Number.parseFloat(style.outlineWidth)).toBeGreaterThan(0)
      // Inside the box, as the rows' and cells' rings are, so a container
      // that clips its edge keeps the whole ring.
      expect(Number.parseFloat(style.outlineOffset)).toBeLessThan(0)
    })
  }
})
