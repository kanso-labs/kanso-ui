import type { Key, Selection } from 'react-aria-components'

import * as stylex from '@stylexjs/stylex'
import { act, fireEvent, render, waitFor } from '@testing-library/react'
import { useCallback, useState } from 'react'
import { describe, expect, it, vi } from 'vitest'

import ChipGroup from '.'
import { rippleStyles } from '../../styles/ripple'
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
  error: { color: colors.error },
  icon: { color: colors.primary },
  selected: { color: colors.onSecondaryContainer },
  unselected: { color: colors.onSurfaceVariant },
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
  error: classesOf(stylex.props(probeStyles.error)),
  icon: classesOf(stylex.props(probeStyles.icon)),
  selected: classesOf(stylex.props(probeStyles.selected)),
  unselected: classesOf(stylex.props(probeStyles.unselected)),
}

const SECOND = ['second']

// The check a chosen chip draws, or null where it draws none. A removable
// chip also renders the close target's cross, so this takes the first SVG —
// the check is before the label and the cross after it.
function checkIn(chip: Element) {
  return chip.querySelector('svg')
}

function hasClasses(element: Element, classes: string[]) {
  return classes.every((name) => element.classList.contains(name))
}

// An icon as the README asks for one: hidden from assistive technology,
// drawn in `currentColor`, and `1em` square so the slot's size is its own.
const ICON = (
  <svg
    aria-hidden="true"
    data-testid="icon"
    fill="currentColor"
    height="1em"
    viewBox="0 0 24 24"
    width="1em"
  >
    <circle cx="12" cy="12" r="8" />
  </svg>
)

function iconIn(chip: Element) {
  return chip.querySelector('[data-testid="icon"]')
}

// The slot the icon is drawn in, which is the element carrying its colour.
function iconSlotOf(chip: Element) {
  const slot = iconIn(chip)?.parentElement
  if (!(slot instanceof HTMLElement)) {
    throw new Error('expected the chip to draw its icon in a slot')
  }
  return slot
}

function setup(props: Partial<Parameters<typeof ChipGroup<object>>[0]> = {}) {
  return render(
    <ChipGroup label="Label" {...props}>
      <ChipGroup.Chip id="first">First item</ChipGroup.Chip>
      <ChipGroup.Chip id="second">Second item</ChipGroup.Chip>
      <ChipGroup.Chip id="third">Third item</ChipGroup.Chip>
    </ChipGroup>,
  )
}

// A set from data, and the function React Aria calls for each item in it.
const ITEMS = [
  { id: 'first', name: 'First item' },
  { id: 'second', name: 'Second item' },
  { id: 'third', name: 'Third item' },
]

function chipFor(item: (typeof ITEMS)[number]) {
  return <ChipGroup.Chip id={item.id}>{item.name}</ChipGroup.Chip>
}

function emptyState() {
  return 'Empty state'
}

// A group whose chips are removed from state, as a call site's are: one chip
// to start, so a single removal empties it.
function OneRemovable({ empty }: { empty?: boolean }) {
  const [ids, setIds] = useState(['first'])
  const remove = useCallback((keys: 'all' | Set<Key>) => {
    setIds((current) => current.filter((id) => keys !== 'all' && !keys.has(id)))
  }, [])

  return (
    <ChipGroup
      label="Label"
      onRemove={remove}
      renderEmptyState={empty === true ? emptyState : undefined}
    >
      {ids.map((id) => (
        <ChipGroup.Chip id={id} key={id}>
          First item
        </ChipGroup.Chip>
      ))}
    </ChipGroup>
  )
}

function setupWithIcons(
  props: Partial<Parameters<typeof ChipGroup<object>>[0]> = {},
) {
  return render(
    <ChipGroup label="Label" {...props}>
      <ChipGroup.Chip icon={ICON} id="first">
        First item
      </ChipGroup.Chip>
      <ChipGroup.Chip icon={ICON} id="second">
        Second item
      </ChipGroup.Chip>
    </ChipGroup>,
  )
}

describe('the last chip removed', () => {
  // React Aria moves focus onto the list once it is empty, and the list drew
  // no ring, so focus went somewhere nobody could see; and the group lost the
  // chip's height, drawing everything under it up.
  it.each([
    ['with nothing in its place', false],
    ['with an empty state', true],
  ])('keeps focus visible and the height, %s', async (_case, empty) => {
    const view = render(<OneRemovable empty={empty} />)
    // The group's own element: React Aria puts a template it collects the
    // chips from beside it.
    const root = view.container.querySelector(':scope > div')
    if (!(root instanceof HTMLElement)) {
      throw new Error('expected the group to render an element')
    }
    const before = root.getBoundingClientRect().height
    const chip = view.getByRole('row', { name: 'First item' })
    act(() => {
      chip.focus()
    })
    fireEvent.keyDown(chip, { key: 'Delete' })
    fireEvent.keyUp(chip, { key: 'Delete' })

    await waitFor(() => {
      expect(view.queryByRole('row', { name: 'First item' })).toBeNull()
    })
    // React Aria moves focus onto the list a moment after the row goes.
    await waitFor(() => {
      expect(root.contains(document.activeElement)).toBe(true)
    })
    // The list, which React Aria gives the group role once it holds no rows.
    const list = document.activeElement
    if (!(list instanceof HTMLElement)) {
      throw new Error('expected focus on an element')
    }
    const outline = getComputedStyle(list)

    expect(root.contains(list)).toBe(true)
    expect(list.getAttribute('role')).toBe('group')
    expect(outline.outlineStyle).toBe('solid')
    expect(outline.outlineWidth).toBe('2px')
    expect(root.getBoundingClientRect().height).toBe(before)
  })
})

describe('chip group', () => {
  describe('semantics', () => {
    it('renders a named group of chips', () => {
      const view = setup()
      expect(view.getByRole('grid', { name: 'Label' })).not.toBeNull()
      expect(view.getAllByRole('row')).toHaveLength(3)
    })

    it('shows the description when there is no error', () => {
      const view = setup({ description: 'Supporting line' })
      expect(view.getByText('Supporting line')).not.toBeNull()
    })

    it('replaces the description with the error', () => {
      const view = setup({
        description: 'Supporting line',
        error: 'Choose one',
      })
      expect(view.getByText('Choose one')).not.toBeNull()
      expect(view.queryByText('Supporting line')).toBeNull()
    })

    // Drawing the message is not the same as saying it. React Aria keeps an
    // id in the group's `aria-describedby` only while an element carrying
    // that id is in the document, so a message rendered outside its slot is
    // read by nobody — the id is dropped again on mount.
    it.each([
      ['description', { description: 'Supporting line' }, 'Supporting line'],
      ['error', { error: 'Choose one' }, 'Choose one'],
    ])('describes the group by its %s', (_name, props, text) => {
      const view = setup(props)
      const described = view
        .getByRole('grid', { name: 'Label' })
        .getAttribute('aria-describedby')
      // An empty attribute would make the `some` below vacuously false, and
      // a missing one would throw rather than read as "not described".
      expect(described ?? '').not.toBe('')

      const ids = (described ?? '').split(' ').filter(Boolean)
      const message = view.getByText(text)
      expect(ids).toContain(message.id)
    })

    it('reports a disabled chip as one', () => {
      const view = setup({ disabledKeys: SECOND })
      const [, second] = view.getAllByRole('row')
      expect(second.getAttribute('aria-disabled')).toBe('true')
    })
  })

  describe('selection', () => {
    it('selects one chip at a time', () => {
      const view = setup({ selectionMode: 'single' })
      const [first, second] = view.getAllByRole('row')

      fireEvent.click(first)
      expect(first.getAttribute('aria-selected')).toBe('true')

      fireEvent.click(second)
      expect(second.getAttribute('aria-selected')).toBe('true')
      expect(first.getAttribute('aria-selected')).toBe('false')
    })

    it('selects more than one when asked', () => {
      const view = setup({ selectionMode: 'multiple' })
      const [first, second] = view.getAllByRole('row')

      fireEvent.click(first)
      fireEvent.click(second)

      expect(first.getAttribute('aria-selected')).toBe('true')
      expect(second.getAttribute('aria-selected')).toBe('true')
    })

    it('keeps its own selection from defaultSelectedKeys', () => {
      const view = setup({
        defaultSelectedKeys: SECOND,
        selectionMode: 'multiple',
      })
      const [, second] = view.getAllByRole('row')
      expect(second.getAttribute('aria-selected')).toBe('true')
    })

    it('does not select on its own when controlled', () => {
      const onSelectionChange = vi.fn<(keys: unknown) => void>()
      const view = setup({
        onSelectionChange,
        selectedKeys: ['first'],
        selectionMode: 'multiple',
      })
      const [first, second] = view.getAllByRole('row')

      fireEvent.click(second)

      expect(onSelectionChange).toHaveBeenCalledTimes(1)
      expect(first.getAttribute('aria-selected')).toBe('true')
      expect(second.getAttribute('aria-selected')).toBe('false')
    })
  })

  describe('removing', () => {
    it('draws no close target without onRemove', () => {
      const view = setup()
      expect(view.queryAllByRole('button', { name: /Remove/ })).toHaveLength(0)
    })

    // React Aria reports whether the group allows removing, so the close
    // target is drawn from that rather than named on every chip.
    it('draws a close target on every chip once it can remove', () => {
      const view = setup({ onRemove: vi.fn<(keys: unknown) => void>() })
      expect(view.getAllByRole('button', { name: /Remove/ })).toHaveLength(3)
    })

    it('removes the chip the close target belongs to', async () => {
      const onRemove = vi.fn<(keys: Set<unknown>) => void>()
      const view = setup({ onRemove })
      const [, second] = view.getAllByRole('button', { name: /Remove/ })

      fireEvent.click(second)

      await waitFor(() => {
        expect(onRemove).toHaveBeenCalledTimes(1)
      })
      expect([...(onRemove.mock.calls[0]?.[0] ?? [])]).toEqual(['second'])
    })

    // React Aria removes the focused chip on Backspace and Delete, which is
    // what makes a set of chips usable without reaching for the close target.
    it('names the close target after the chip it belongs to', () => {
      const view = setup({ onRemove: vi.fn<(keys: unknown) => void>() })
      // React Aria points the target's aria-labelledby at itself and then at
      // the chip, so the verb alone is what this component supplies.
      expect(
        view.getByRole('button', { name: 'Remove Second item' }),
      ).not.toBeNull()
    })

    it('takes a remove label of its own', () => {
      const view = setup({
        onRemove: vi.fn<(keys: unknown) => void>(),
        removeLabel: 'Delete',
      })
      expect(
        view.getByRole('button', { name: 'Delete First item' }),
      ).not.toBeNull()
    })

    it('removes the focused chip from the keyboard', async () => {
      const onRemove = vi.fn<(keys: Set<unknown>) => void>()
      const view = setup({ onRemove })
      const [first] = view.getAllByRole('row')

      act(() => {
        first.focus()
      })
      fireEvent.keyDown(first, { key: 'Delete' })
      fireEvent.keyUp(first, { key: 'Delete' })

      await waitFor(() => {
        expect(onRemove).toHaveBeenCalledTimes(1)
      })
    })
  })

  describe('keyboard', () => {
    // The chips are one tab stop, not many: the arrow keys move between
    // them, which is what a set of a dozen filters needs.
    it('moves between the chips with the arrow keys', () => {
      const view = setup()
      const [first, second] = view.getAllByRole('row')

      act(() => {
        first.focus()
      })
      fireEvent.keyDown(first, { key: 'ArrowRight' })
      fireEvent.keyUp(first, { key: 'ArrowRight' })

      expect(document.activeElement).toBe(second)
    })
  })

  describe('appearance', () => {
    // The pill is the chip module's, shared with the standalone Chip, so a
    // chip in a group and a chip on its own cannot drift.
    it('draws the page two containers', () => {
      const view = setup({
        defaultSelectedKeys: SECOND,
        selectionMode: 'multiple',
      })
      const [first, second] = view.getAllByRole('row')

      expect(hasClasses(second, CLASSES.selected)).toBe(true)
      expect(hasClasses(first, CLASSES.unselected)).toBe(true)
      expect(getComputedStyle(first).blockSize).toBe('32px')
      expect(getComputedStyle(first).borderTopLeftRadius).toBe('8px')
    })

    it('draws a disabled chip in the disabled role', () => {
      const view = setup({ disabledKeys: SECOND })
      const [, second] = view.getAllByRole('row')
      expect(hasClasses(second, CLASSES.disabled)).toBe(true)
    })

    it('takes the error role on the label when there is an error', () => {
      const view = setup({ error: 'Choose one' })
      expect(hasClasses(view.getByText('Label'), CLASSES.error)).toBe(true)
    })
  })

  // The check is the chip module's, so this asks the same question
  // chip/index.test.tsx asks of a chip on its own: what a reader who does not
  // see colour has to go on.
  describe('the check', () => {
    it('draws it on the chosen chips alone', () => {
      const view = setup({
        defaultSelectedKeys: SECOND,
        selectionMode: 'multiple',
      })
      const [first, second, third] = view.getAllByRole('row')

      expect(checkIn(second)).not.toBeNull()
      expect(checkIn(first)).toBeNull()
      expect(checkIn(third)).toBeNull()
    })

    it('follows the selection as it moves', () => {
      const view = setup({ selectionMode: 'single' })
      const [first, second] = view.getAllByRole('row')

      fireEvent.click(first)
      expect(checkIn(first)).not.toBeNull()

      fireEvent.click(second)
      expect(checkIn(second)).not.toBeNull()
      expect(checkIn(first)).toBeNull()
    })

    // A chip that is both chosen and removable carries one glyph on each side
    // of its label, so this pins that the check went before the label rather
    // than the close target having been counted twice.
    it('sits before the label, with the close target after it', () => {
      const onRemove = vi.fn<() => void>()
      const view = setup({
        defaultSelectedKeys: SECOND,
        onRemove,
        selectionMode: 'multiple',
      })
      const [, second] = view.getAllByRole('row')
      const check = checkIn(second)
      const close = view.getByRole('button', { name: 'Remove Second item' })
      if (check === null) {
        throw new Error('expected the chosen chip to draw a check')
      }

      expect(second.querySelectorAll('svg')).toHaveLength(2)
      expect(close.contains(check)).toBe(false)
      expect(
        check.compareDocumentPosition(close) & Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeGreaterThan(0)
    })

    it("draws it at the page's 18dp icon size", () => {
      const view = setup({
        defaultSelectedKeys: SECOND,
        selectionMode: 'multiple',
      })
      const [, second] = view.getAllByRole('row')
      const slot = checkIn(second)?.parentElement?.getBoundingClientRect()
      const border = Number.parseFloat(getComputedStyle(second).borderLeftWidth)

      expect(slot?.width).toBe(18)
      // The page's 8dp padding on the side an icon is on, which the slot
      // pulls back out of the chip's own 16.
      expect(
        (slot?.left ?? 0) - second.getBoundingClientRect().left - border,
      ).toBe(8)
    })
  })

  // React Aria reads `items` only when the chips are a function of each
  // item, so without that form the prop could never take effect.
  describe('from data', () => {
    it('renders a chip for each item, selected by its id', () => {
      const onSelectionChange = vi.fn<(keys: Selection) => void>()
      const view = render(
        <ChipGroup
          items={ITEMS}
          label="Label"
          onSelectionChange={onSelectionChange}
          selectionMode="multiple"
        >
          {chipFor}
        </ChipGroup>,
      )
      const rows = view.getAllByRole('row')

      expect(rows.map((row) => row.textContent)).toEqual([
        'First item',
        'Second item',
        'Third item',
      ])
      fireEvent.click(rows[1])
      // React Aria's selection is a Set of its own, so its keys are compared.
      const keys = onSelectionChange.mock.calls[0]?.[0]
      expect(keys instanceof Set ? Array.from(keys) : keys).toEqual(['second'])
    })
  })

  // The icon slot is the chip module's, so this asks what chip/index.test.tsx
  // asks of a chip on its own, of a chip that is also one of a set: the
  // icon is drawn in the check's slot, and gives its place up to the check.
  describe('the icon', () => {
    it('draws it before the label, with the close target after it', () => {
      const view = setupWithIcons({ onRemove: vi.fn<() => void>() })
      const [first] = view.getAllByRole('row')
      const icon = iconIn(first)
      const close = view.getByRole('button', { name: 'Remove First item' })
      if (icon === null) {
        throw new Error('expected the chip to draw its icon')
      }
      const slot = icon.parentElement?.getBoundingClientRect()
      const border = Number.parseFloat(getComputedStyle(first).borderLeftWidth)

      expect([slot?.width, slot?.height]).toEqual([18, 18])
      expect(
        (slot?.left ?? 0) - first.getBoundingClientRect().left - border,
      ).toBe(8)
      expect(
        icon.compareDocumentPosition(close) & Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeGreaterThan(0)
    })

    it('gives its place to the check on the chosen chips alone', () => {
      const view = setupWithIcons({ selectionMode: 'single' })
      const [first, second] = view.getAllByRole('row')

      fireEvent.click(first)
      expect(iconIn(first)).toBeNull()
      expect(checkIn(first)).not.toBeNull()
      expect(iconIn(second)).not.toBeNull()

      fireEvent.click(second)
      expect(iconIn(first)).not.toBeNull()
      expect(iconIn(second)).toBeNull()
    })

    // The group hands the chip's whole render state to the slot, disabled
    // included, so a disabled chip's icon fades with its label rather than
    // keeping the primary role.
    it('fades it with a disabled chip', () => {
      const view = setupWithIcons({ disabledKeys: SECOND })
      const [first, second] = view.getAllByRole('row')

      expect(hasClasses(iconSlotOf(first), CLASSES.icon)).toBe(true)
      expect(hasClasses(iconSlotOf(second), CLASSES.icon)).toBe(false)
    })
  })
})

// A keyboard's focus draws the container's layer at the focus opacity, as
// Button's does, where it once drew the ring alone.
const focusProbeStyles = stylex.create({
  unselected: {
    backgroundColor: `color-mix(in srgb, ${colors.onSurface} calc(${stateLayerOpacity.focus} * 100%), transparent)`,
  },
})

// Focus as a keyboard brings it, which is what React Aria reports as
// focus-visible and what the layer is drawn from.
function focusByKeyboard(element: HTMLElement) {
  fireEvent.keyDown(document.body, { key: 'Tab' })
  act(() => {
    element.focus()
  })
}

// A primary mouse button going down over the element's centre, which is the
// press a ripple answers.
function pressDown(element: Element) {
  const rect = element.getBoundingClientRect()
  fireEvent(
    element,
    new PointerEvent('pointerdown', {
      bubbles: true,
      buttons: 1,
      cancelable: true,
      clientX: rect.left + rect.width / 2,
      clientY: rect.top + rect.height / 2,
      isPrimary: true,
      pointerId: 1,
      pointerType: 'mouse',
    }),
  )
}

// The ripple's inner span carries these classes only while it is pressed.
const PRESSED_RIPPLE = (stylex.props(rippleStyles.pressed).className ?? '')
  .split(' ')
  .filter(Boolean)

function ripplesIn(element: Element) {
  const ripple = element.querySelector('span[aria-hidden="true"] > span')
  return (
    ripple !== null &&
    PRESSED_RIPPLE.length > 0 &&
    PRESSED_RIPPLE.every((name) => ripple.classList.contains(name))
  )
}

describe('focus layer and ripple', () => {
  it('lays the focus layer over a chip for a keyboard', () => {
    const view = setup({ selectionMode: 'multiple' })
    const [first] = view.getAllByRole('row')
    const classes = classesOf(stylex.props(focusProbeStyles.unselected))
    expect(hasClasses(first, classes)).toBe(false)

    focusByKeyboard(first)

    expect(hasClasses(first, classes)).toBe(true)
  })

  it('ripples a chip the group lets be selected', () => {
    const view = setup({ selectionMode: 'multiple' })
    const [first] = view.getAllByRole('row')

    pressDown(first)

    expect(ripplesIn(first)).toBe(true)
  })

  // A chip in a group that selects nothing changes nothing when pressed, and
  // React Aria reports no press on it either.
  it('draws no ripple on a chip a press does nothing to', () => {
    const view = setup()
    const [first] = view.getAllByRole('row')

    pressDown(first)

    expect(first.querySelector('span[aria-hidden="true"]')).toBeNull()
  })
})
