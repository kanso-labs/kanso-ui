import * as stylex from '@stylexjs/stylex'
import { act, fireEvent, render } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import ListBox from '.'
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
  supporting: { color: colors.onSurfaceVariant },
})

// Hoisted so the option's slots are not new elements on every render, which
// is what react-perf's jsx-no-jsx-as-prop is after.
const SECOND = ['second']
const LEADING = <span>Leading</span>
const TRAILING = <span>Trailing</span>

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
  supporting: classesOf(stylex.props(probeStyles.supporting)),
}

function hasClasses(element: Element, classes: string[]) {
  return classes.every((name) => element.classList.contains(name))
}

function setup(
  props: Partial<Parameters<typeof ListBox<object>>[0]> = {},
  children?: Parameters<typeof ListBox<object>>[0]['children'],
) {
  return render(
    <ListBox aria-label="Label" selectionMode="single" {...props}>
      {children ?? (
        <>
          <ListBox.Item id="first">First item</ListBox.Item>
          <ListBox.Item id="second">Second item</ListBox.Item>
          <ListBox.Item id="third">Third item</ListBox.Item>
        </>
      )}
    </ListBox>,
  )
}

describe('list box', () => {
  describe('semantics', () => {
    it('renders a listbox of options named by its label', () => {
      const view = setup()
      expect(view.getByRole('listbox', { name: 'Label' })).not.toBeNull()
      expect(view.getAllByRole('option')).toHaveLength(3)
    })

    it('names a section by its header', () => {
      const view = setup(
        {},
        <ListBox.Section header="First group">
          <ListBox.Item id="first">First item</ListBox.Item>
        </ListBox.Section>,
      )
      expect(view.getByRole('group', { name: 'First group' })).not.toBeNull()
      expect(view.getByText('First group')).not.toBeNull()
    })

    it('draws no heading for a section without one', () => {
      const view = setup(
        {},
        <ListBox.Section>
          <ListBox.Item id="first">First item</ListBox.Item>
        </ListBox.Section>,
      )
      expect(view.getByRole('group').textContent).toBe('First item')
    })

    it('reports a disabled option as one', () => {
      const view = setup({ disabledKeys: ['second'] })
      const [, second] = view.getAllByRole('option')
      expect(second.getAttribute('aria-disabled')).toBe('true')
    })

    // React Aria reads an option's text off its children, and an option here
    // always wraps its headline in the row — so without passing a
    // plain-string headline through as the text value, every option is worth
    // nothing as text. Typeahead finds none of them, a combo box filters
    // them all away, and a select shows a blank where its value should be.
    it('is worth its headline as text, which typeahead finds it by', () => {
      const view = setup()
      const [first, , third] = view.getAllByRole('option')

      act(() => {
        first.focus()
      })
      fireEvent.keyDown(first, { key: 'T' })
      fireEvent.keyUp(first, { key: 'T' })

      expect(document.activeElement).toBe(third)
    })

    // The option's slots are the shared row's, so a supporting line and the
    // two content slots all read as part of the same option.
    it('draws the row slots inside the option', () => {
      const view = setup(
        {},
        <ListBox.Item
          id="first"
          leading={LEADING}
          supporting="Supporting line"
          trailing={TRAILING}
        >
          First item
        </ListBox.Item>,
      )
      const [option] = view.getAllByRole('option')
      expect(option.textContent).toBe(
        'LeadingFirst itemSupporting lineTrailing',
      )
    })
  })

  describe('selection', () => {
    it('selects one option at a time', () => {
      const view = setup()
      const [first, second] = view.getAllByRole('option')

      fireEvent.click(first)
      expect(first.getAttribute('aria-selected')).toBe('true')

      fireEvent.click(second)
      expect(second.getAttribute('aria-selected')).toBe('true')
      expect(first.getAttribute('aria-selected')).toBe('false')
    })

    it('toggles more than one when asked', () => {
      const view = setup({ selectionMode: 'multiple' })
      const [first, second] = view.getAllByRole('option')

      fireEvent.click(first)
      fireEvent.click(second)

      expect(first.getAttribute('aria-selected')).toBe('true')
      expect(second.getAttribute('aria-selected')).toBe('true')
    })

    it('keeps its own selection from defaultSelectedKeys', () => {
      const view = setup({ defaultSelectedKeys: ['third'] })
      const [, , third] = view.getAllByRole('option')
      expect(third.getAttribute('aria-selected')).toBe('true')
    })

    it('does not select on its own when controlled', () => {
      const onSelectionChange = vi.fn<(keys: unknown) => void>()
      const view = setup({
        onSelectionChange,
        selectedKeys: ['first'],
      })
      const [first, second] = view.getAllByRole('option')

      fireEvent.click(second)

      expect(onSelectionChange).toHaveBeenCalledTimes(1)
      expect(first.getAttribute('aria-selected')).toBe('true')
      expect(second.getAttribute('aria-selected')).toBe('false')
    })

    it('leaves a disabled option unselectable', () => {
      const view = setup({ disabledKeys: ['second'] })
      const [, second] = view.getAllByRole('option')

      fireEvent.click(second)

      expect(second.getAttribute('aria-selected')).toBe('false')
    })
  })

  describe('keyboard', () => {
    // React Aria moves focus between options rather than tabbing through
    // them, which is what makes a long list navigable.
    it('moves through the options with the arrow keys', () => {
      const view = setup()
      const list = view.getByRole('listbox', { name: 'Label' })
      const [first, second] = view.getAllByRole('option')

      act(() => {
        first.focus()
      })
      expect(document.activeElement).toBe(first)

      fireEvent.keyDown(list, { key: 'ArrowDown' })
      fireEvent.keyUp(list, { key: 'ArrowDown' })
      expect(document.activeElement).toBe(second)
    })

    it('selects the focused option with the keyboard', () => {
      const view = setup()
      const [first] = view.getAllByRole('option')

      act(() => {
        first.focus()
      })
      fireEvent.keyDown(first, { key: ' ' })
      fireEvent.keyUp(first, { key: ' ' })

      expect(first.getAttribute('aria-selected')).toBe('true')
    })
  })

  describe('appearance', () => {
    // The page's selected state is primary container and on primary
    // container, which the row module carries as its list variant.
    it('draws a selected option in the page selected roles', () => {
      const view = setup({ defaultSelectedKeys: SECOND })
      const [first, second] = view.getAllByRole('option')

      expect(hasClasses(second, CLASSES.selected)).toBe(true)
      expect(hasClasses(first, CLASSES.selected)).toBe(false)
    })

    // The muted role a supporting line draws on the surface is a second
    // colour family over a selected option's own container, and the pair is
    // not guaranteed to clear AA — it does not on the Terminal scheme. A
    // selected option's supporting line takes the container's content role
    // instead, the same one its headline takes.
    it('draws a selected supporting line in the selected content role', () => {
      const view = setup(
        { defaultSelectedKeys: SECOND },
        <>
          <ListBox.Item id="first" supporting="Supporting line">
            First item
          </ListBox.Item>
          <ListBox.Item id="second" supporting="Supporting line">
            Second item
          </ListBox.Item>
        </>,
      )
      const [unselected, selected] = view.getAllByText('Supporting line')

      expect(hasClasses(selected, CLASSES.selected)).toBe(true)
      expect(hasClasses(selected, CLASSES.supporting)).toBe(false)
      expect(hasClasses(unselected, CLASSES.supporting)).toBe(true)
    })

    it('draws a disabled option in the disabled role', () => {
      const view = setup({ disabledKeys: SECOND })
      const [, second] = view.getAllByRole('option')
      expect(hasClasses(second, CLASSES.disabled)).toBe(true)
    })

    // The muted role is at full strength, so a disabled option whose
    // supporting line kept it drew the line the option is least about as the
    // only part that had not faded.
    it('fades a disabled supporting line with the rest of the option', () => {
      const view = setup(
        { disabledKeys: SECOND },
        <>
          <ListBox.Item id="first" supporting="Supporting line">
            First item
          </ListBox.Item>
          <ListBox.Item id="second" supporting="Supporting line">
            Second item
          </ListBox.Item>
        </>,
      )
      const [enabled, disabled] = view.getAllByText('Supporting line')

      // Compared against the headline beside it rather than against a
      // literal, since what is being pinned is that the two agree.
      expect(getComputedStyle(disabled).color).toBe(
        getComputedStyle(view.getByText('Second item')).color,
      )
      expect(getComputedStyle(enabled).color).not.toBe(
        getComputedStyle(view.getByText('First item')).color,
      )
    })

    it('draws a section heading in the muted role', () => {
      const view = setup(
        {},
        <ListBox.Section header="First group">
          <ListBox.Item id="first">First item</ListBox.Item>
        </ListBox.Section>,
      )
      expect(hasClasses(view.getByText('First group'), CLASSES.header)).toBe(
        true,
      )
    })

    // The lists page's row: a 56dp floor with 16 either side, which the
    // shared row module gives every collection item here.
    it('draws the page row height and inset', () => {
      const view = setup()
      const [first] = view.getAllByRole('option')
      const style = getComputedStyle(first)

      expect(style.minBlockSize).toBe('56px')
      expect(style.paddingLeft).toBe('16px')
      expect(style.paddingRight).toBe('16px')
    })

    // The container carries the page's 8dp above and below its rows and no
    // colour, so the same list draws correctly on a page and on a popover.
    it('insets the rows without a colour of its own', () => {
      const view = setup()
      const style = getComputedStyle(
        view.getByRole('listbox', { name: 'Label' }),
      )

      expect(style.paddingTop).toBe('8px')
      expect(style.paddingBottom).toBe('8px')
      expect(style.backgroundColor).toBe('rgba(0, 0, 0, 0)')
    })
  })

  describe('loading more', () => {
    it('draws the ring while it is loading', () => {
      const view = setup(
        {},
        <>
          <ListBox.Item id="first">First item</ListBox.Item>
          <ListBox.LoadMore isLoading />
        </>,
      )
      expect(
        view.getByRole('progressbar', { name: 'Loading more' }),
      ).not.toBeNull()
    })

    it('takes a label of its own', () => {
      const view = setup(
        {},
        <>
          <ListBox.Item id="first">First item</ListBox.Item>
          <ListBox.LoadMore isLoading label="Fetching" />
        </>,
      )
      expect(view.getByRole('progressbar', { name: 'Fetching' })).not.toBeNull()
    })

    it('draws nothing while it is not', () => {
      const view = setup(
        {},
        <>
          <ListBox.Item id="first">First item</ListBox.Item>
          <ListBox.LoadMore />
        </>,
      )
      expect(view.queryByRole('progressbar')).toBeNull()
    })
  })
})
