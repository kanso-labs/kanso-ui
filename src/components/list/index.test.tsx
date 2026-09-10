import * as stylex from '@stylexjs/stylex'
import { act, fireEvent, render } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import List from '.'
import { colors, stateLayerOpacity } from '../../tokens/design.tokens.stylex'

// StyleX hashes an atomic class from the property and value, so the same
// declaration written here produces the same class the component produces.
// Asserting on class membership pins which role each part reaches for without
// depending on the browser having applied a rule these tests are the first
// thing to use — see chip/index.test.tsx for the flake behind this.
const probeStyles = stylex.create({
  disabled: {
    color: `color-mix(in srgb, ${colors.onSurface} calc(${stateLayerOpacity.disabledContent} * 100%), ${colors.surface})`,
  },
  header: { color: colors.onSurfaceVariant },
  selected: { color: colors.onPrimaryContainer },
})

function classesOf(props: { className?: string | undefined }) {
  const classes = (props.className ?? '').split(' ').filter(Boolean)
  // An empty list would make every `every` below vacuously true, so it is a
  // broken assertion rather than a passing one.
  if (classes.length === 0) {
    throw new Error('expected the probe style to generate at least one class')
  }
  return classes
}

const CLASSES = {
  disabled: classesOf(stylex.props(probeStyles.disabled)),
  header: classesOf(stylex.props(probeStyles.header)),
  selected: classesOf(stylex.props(probeStyles.selected)),
}

const SECOND = ['second']
const LEADING = <span>Leading</span>
const TRAILING = <span>Trailing</span>

function hasClasses(element: Element, classes: string[]) {
  return classes.every((name) => element.classList.contains(name))
}

function setup(
  props: Partial<Parameters<typeof List<object>>[0]> = {},
  children?: Parameters<typeof List<object>>[0]['children'],
) {
  return render(
    <List aria-label="Label" selectionMode="multiple" {...props}>
      {children ?? (
        <>
          <List.Item id="first">First item</List.Item>
          <List.Item id="second">Second item</List.Item>
          <List.Item id="third">Third item</List.Item>
        </>
      )}
    </List>,
  )
}

describe('list', () => {
  describe('semantics', () => {
    it('renders a grid of rows named by its label', () => {
      const view = setup()
      expect(view.getByRole('grid', { name: 'Label' })).not.toBeNull()
      expect(view.getAllByRole('row')).toHaveLength(3)
    })

    // A listbox option is a leaf: nothing inside it can be focused. A grid
    // list's row is a row of cells, which is what lets a checkbox live in it
    // — and is why this exists beside ListBox rather than instead of it.
    it('holds a focusable control inside a row', () => {
      const view = setup()
      const [first] = view.getAllByRole('row')
      const box = first.querySelector<HTMLInputElement>(
        'input[type="checkbox"]',
      )
      if (box == null) {
        throw new Error('expected the row to hold a checkbox')
      }

      act(() => {
        box.focus()
      })
      expect(document.activeElement).toBe(box)
    })

    it('names a section by its header', () => {
      const view = setup(
        {},
        <List.Section header="First group">
          <List.Item id="first">First item</List.Item>
        </List.Section>,
      )
      expect(view.getByText('First group')).not.toBeNull()
    })

    it('reports a disabled row as one', () => {
      const view = setup({ disabledKeys: SECOND })
      const [, second] = view.getAllByRole('row')
      expect(second.getAttribute('aria-disabled')).toBe('true')
    })

    // The row's slots are the shared row's, so a supporting line and the two
    // content slots all read as part of the same row.
    it('draws the row slots inside the row', () => {
      const view = setup(
        { selectionMode: 'none' },
        <List.Item
          id="first"
          leading={LEADING}
          supporting="Supporting line"
          trailing={TRAILING}
        >
          First item
        </List.Item>,
      )
      const [row] = view.getAllByRole('row')
      expect(row.textContent).toBe('LeadingFirst itemSupporting lineTrailing')
    })
  })

  describe('the selection checkbox', () => {
    // React Aria reports the selection mode and behaviour on each row, so
    // the box is drawn from that rather than named on every item.
    it('draws one on every row while the list toggles', () => {
      const view = setup()
      expect(view.getAllByRole('checkbox')).toHaveLength(3)
    })

    it('draws none when the list does not select', () => {
      const view = setup({ selectionMode: 'none' })
      expect(view.queryAllByRole('checkbox')).toHaveLength(0)
    })

    it('draws none when selecting replaces rather than toggles', () => {
      const view = setup({ selectionBehavior: 'replace' })
      expect(view.queryAllByRole('checkbox')).toHaveLength(0)
    })

    // React Aria points the box's `aria-labelledby` at itself and at the row,
    // so the name is the given label followed by the row's own text — which
    // is what makes three identically labelled boxes tell each other apart.
    it('takes a label of its own', () => {
      const view = setup({ selectLabel: 'Choose' })
      expect(
        view.getByRole('checkbox', { name: 'Choose First item' }),
      ).not.toBeNull()
    })

    it('selects the row it belongs to', () => {
      const view = setup()
      const [first] = view.getAllByRole('checkbox')

      fireEvent.click(first)

      expect(view.getAllByRole('row')[0]?.getAttribute('aria-selected')).toBe(
        'true',
      )
    })
  })

  describe('selection', () => {
    it('selects more than one', () => {
      const view = setup()
      const [first, second] = view.getAllByRole('row')

      fireEvent.click(first)
      fireEvent.click(second)

      expect(first.getAttribute('aria-selected')).toBe('true')
      expect(second.getAttribute('aria-selected')).toBe('true')
    })

    it('keeps its own selection from defaultSelectedKeys', () => {
      const view = setup({ defaultSelectedKeys: SECOND })
      const [, second] = view.getAllByRole('row')
      expect(second.getAttribute('aria-selected')).toBe('true')
    })

    it('does not select on its own when controlled', () => {
      const onSelectionChange = vi.fn<(keys: unknown) => void>()
      const view = setup({ onSelectionChange, selectedKeys: ['first'] })
      const [first, second] = view.getAllByRole('row')

      fireEvent.click(second)

      expect(onSelectionChange).toHaveBeenCalledTimes(1)
      expect(first.getAttribute('aria-selected')).toBe('true')
      expect(second.getAttribute('aria-selected')).toBe('false')
    })
  })

  describe('keyboard', () => {
    it('moves through the rows with the arrow keys', () => {
      const view = setup({ selectionMode: 'none' })
      const list = view.getByRole('grid', { name: 'Label' })
      const [first, second] = view.getAllByRole('row')

      act(() => {
        first.focus()
      })
      fireEvent.keyDown(list, { key: 'ArrowDown' })
      fireEvent.keyUp(list, { key: 'ArrowDown' })

      expect(document.activeElement).toBe(second)
    })
  })

  describe('appearance', () => {
    it('draws a selected row in the page selected roles', () => {
      const view = setup({ defaultSelectedKeys: SECOND })
      const [first, second] = view.getAllByRole('row')

      expect(hasClasses(second, CLASSES.selected)).toBe(true)
      expect(hasClasses(first, CLASSES.selected)).toBe(false)
    })

    it('draws a disabled row in the disabled role', () => {
      const view = setup({ disabledKeys: SECOND })
      const [, second] = view.getAllByRole('row')
      expect(hasClasses(second, CLASSES.disabled)).toBe(true)
    })

    // React Aria draws the header as a row holding a `rowheader` cell, and
    // the styled element is the row — the cell inside it is `display:
    // contents`, so it carries neither the padding nor the colour.
    it('draws a section heading in the muted role', () => {
      const view = setup(
        {},
        <List.Section header="First group">
          <List.Item id="first">First item</List.Item>
        </List.Section>,
      )
      const header = view.getByRole('rowheader', {
        name: 'First group',
      }).parentElement
      if (header === null) {
        throw new Error('expected the header cell to sit in a row')
      }

      expect(hasClasses(header, CLASSES.header)).toBe(true)
    })

    // The lists page's row: a 56dp floor with 16 either side, which the
    // shared row module gives every collection item here.
    it('draws the page row height and inset', () => {
      const view = setup()
      const [first] = view.getAllByRole('row')
      const style = getComputedStyle(first)

      expect(style.minBlockSize).toBe('56px')
      expect(style.paddingLeft).toBe('16px')
      expect(style.paddingRight).toBe('16px')
    })
  })

  describe('loading more', () => {
    it('draws the ring while it is loading', () => {
      const view = setup(
        {},
        <>
          <List.Item id="first">First item</List.Item>
          <List.LoadMore isLoading />
        </>,
      )
      expect(
        view.getByRole('progressbar', { name: 'Loading more' }),
      ).not.toBeNull()
    })

    it('draws nothing while it is not', () => {
      const view = setup(
        {},
        <>
          <List.Item id="first">First item</List.Item>
          <List.LoadMore />
        </>,
      )
      expect(view.queryByRole('progressbar')).toBeNull()
    })
  })
})
