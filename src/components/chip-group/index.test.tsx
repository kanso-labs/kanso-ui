import * as stylex from '@stylexjs/stylex'
import { act, fireEvent, render, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import ChipGroup from '.'
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

function setup(props: Partial<Parameters<typeof ChipGroup<object>>[0]> = {}) {
  return render(
    <ChipGroup label="Label" {...props}>
      <ChipGroup.Chip id="first">First item</ChipGroup.Chip>
      <ChipGroup.Chip id="second">Second item</ChipGroup.Chip>
      <ChipGroup.Chip id="third">Third item</ChipGroup.Chip>
    </ChipGroup>,
  )
}

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
})
