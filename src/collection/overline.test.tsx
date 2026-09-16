import type { ReactElement } from 'react'

import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import List from '../components/list'
import ListBox from '../components/list-box'

// The lists page's three container heights. A row draws the one its content
// asks for: a headline alone, a headline with one more line, or all three.
const ONE_LINE = '56px'
const TWO_LINE = '72px'
const THREE_LINE = '88px'

type Row = {
  overline?: string
  supporting?: string
}

const COLLECTIONS: ReadonlyArray<{
  name: string
  render: (row: Row) => ReactElement
  role: 'option' | 'row'
}> = [
  {
    name: 'a list row',
    render: (row) => (
      <List aria-label="Label">
        <List.Item id="first" {...row}>
          First item
        </List.Item>
      </List>
    ),
    role: 'row',
  },
  {
    name: 'a list box option',
    render: (row) => (
      <ListBox aria-label="Label">
        <ListBox.Item id="first" {...row}>
          First item
        </ListBox.Item>
      </ListBox>
    ),
    role: 'option',
  },
]

function heightOf(element: Element) {
  return getComputedStyle(element).minBlockSize
}

describe('an overline on a collection row', () => {
  it.each(COLLECTIONS)(
    'leaves $name at the one-line height without one',
    ({ render: renderRow, role }) => {
      const view = render(renderRow({}))

      expect(heightOf(view.getByRole(role))).toBe(ONE_LINE)
    },
  )

  it.each(COLLECTIONS)(
    'takes $name to the two-line height on its own',
    ({ render: renderRow, role }) => {
      const view = render(renderRow({ overline: 'Overline' }))

      expect(view.getByText('Overline')).toBeDefined()
      expect(heightOf(view.getByRole(role))).toBe(TWO_LINE)
    },
  )

  // The three-line item is the only row whose slots move, so the height is
  // not the whole of it.
  it.each(COLLECTIONS)(
    'takes $name to the three-line height beside a supporting line',
    ({ render: renderRow, role }) => {
      const view = render(
        renderRow({ overline: 'Overline', supporting: 'Supporting line' }),
      )
      const row = view.getByRole(role)

      expect(heightOf(row)).toBe(THREE_LINE)
      expect(getComputedStyle(row).alignItems).toBe('flex-start')
    },
  )

  it.each(COLLECTIONS)(
    'leaves $name at the two-line height with a supporting line alone',
    ({ render: renderRow, role }) => {
      const view = render(renderRow({ supporting: 'Supporting line' }))

      expect(heightOf(view.getByRole(role))).toBe(TWO_LINE)
    },
  )
})
