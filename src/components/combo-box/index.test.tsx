import * as stylex from '@stylexjs/stylex'
import { act, fireEvent, render, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import ComboBox from '.'
import { colors, motion, typography } from '../../tokens/design.tokens.stylex'
import ListBox from '../list-box'

// StyleX hashes an atomic class from the property and value, so the same
// declaration written here produces the same class the component produces.
// Asserting on class membership pins which role each part reaches for without
// depending on the browser having applied a rule these tests are the first
// thing to use — see chip/index.test.tsx for the flake behind this.
const probeStyles = stylex.create({
  error: { color: colors.error },
  floated: { fontSize: typography.bodySmallSize },
  // The curve the rest of the library turns a chevron on, read back through
  // the browser so the assertion pins the role rather than the cubic-bezier
  // it currently resolves to.
  standardEasing: { transitionTimingFunction: motion.easingStandard },
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
  error: classesOf(stylex.props(probeStyles.error)),
  floated: classesOf(stylex.props(probeStyles.floated)),
}

const OPTIONS = (
  <>
    <ListBox.Item id="first">First item</ListBox.Item>
    <ListBox.Item id="second">Second item</ListBox.Item>
    <ListBox.Item id="third">Third item</ListBox.Item>
  </>
)

// The field fills what it is given, and React Aria clamps a popover to the
// viewport — so a field as wide as the runner's window would open a list
// narrower than itself for reasons that are the window's rather than the
// component's.
const WIDTH = { width: '320px' }

// The chevron is the only svg either field draws. Narrowed here rather than
// asserted at the call site, so a field that failed to draw one fails with
// that sentence instead of further down on a null.
function glyphOf(view: ReturnType<typeof render>) {
  const glyph = view.container.querySelector('svg')
  if (glyph === null) {
    throw new Error('expected the field to draw a chevron')
  }
  return glyph
}

function hasClasses(element: Element, classes: string[]) {
  return classes.every((name) => element.classList.contains(name))
}

/** The field's own input, typed so its value can be read. */
function inputOf(view: ReturnType<typeof render>) {
  const input = view.getByRole('combobox', { name: 'Label' })
  if (!(input instanceof HTMLInputElement)) {
    throw new Error('expected the field to draw an input')
  }
  return input
}

function setup(props: Partial<Parameters<typeof ComboBox<object>>[0]> = {}) {
  const view = render(
    <div style={WIDTH}>
      <ComboBox label="Label" options={OPTIONS} {...props} />
    </div>,
  )
  return {
    ...view,
    input: inputOf(view),
    toggle: view.getByRole('button'),
  }
}

const FIRST_AND_THIRD = ['first', 'third']

// A field that takes more than one option, holding two already.
function setupMultiple(
  props: Partial<Parameters<typeof ComboBox<object, 'multiple'>>[0]> = {},
) {
  const view = render(
    <div style={WIDTH}>
      <ComboBox
        defaultValue={FIRST_AND_THIRD}
        label="Label"
        options={OPTIONS}
        selectionMode="multiple"
        {...props}
      />
    </div>,
  )
  const box = view.container.querySelector('[role="group"]')
  if (!(box instanceof HTMLElement)) {
    throw new Error('expected the field to draw a box')
  }
  return {
    ...view,
    box,
    input: inputOf(view),
    label: view.getByText('Label', { selector: 'label' }),
    toggle: view.getByRole('button'),
  }
}

// Matches from the start of the text rather than anywhere in it, which the
// default contains filter does not.
function startsWith(textValue: string, inputValue: string) {
  return textValue.toLowerCase().startsWith(inputValue.toLowerCase())
}

describe('combo box', () => {
  describe('semantics', () => {
    it('renders a combo box named by its label', () => {
      const { input } = setup()
      expect(input.getAttribute('aria-expanded')).toBe('false')
      expect(input.tagName).toBe('INPUT')
    })

    it('renders no list until it is opened', () => {
      const view = setup()
      expect(view.queryByRole('listbox')).toBeNull()
    })

    it('opens the list from the chevron', async () => {
      const view = setup()
      fireEvent.click(view.toggle)
      await waitFor(() => {
        expect(view.getByRole('listbox')).not.toBeNull()
      })
      expect(view.getAllByRole('option')).toHaveLength(3)
    })

    it('reports its disabled state', () => {
      const { input } = setup({ isDisabled: true })
      expect(input.getAttribute('disabled')).not.toBeNull()
    })

    it('reports an error on the field and shows it once', () => {
      const view = setup({
        description: 'Supporting line',
        error: 'Choose an item',
      })
      expect(view.getByText('Choose an item')).not.toBeNull()
      expect(view.queryByText('Supporting line')).toBeNull()
    })
  })

  describe('filtering', () => {
    // The whole point of the component: the list narrows as it is typed.
    it('narrows the list to what was typed', async () => {
      const view = setup()
      fireEvent.click(view.toggle)
      await waitFor(() => {
        expect(view.getAllByRole('option')).toHaveLength(3)
      })

      act(() => {
        fireEvent.change(view.input, { target: { value: 'Sec' } })
      })

      await waitFor(() => {
        expect(view.getAllByRole('option')).toHaveLength(1)
      })
      expect(view.getByRole('option', { name: 'Second item' })).not.toBeNull()
    })

    it('takes a filter of its own', async () => {
      const view = setup({ defaultFilter: startsWith })

      fireEvent.click(view.toggle)
      await waitFor(() => {
        expect(view.getAllByRole('option')).toHaveLength(3)
      })

      // 'item' is in every option's text and at the start of none, so the
      // default contains filter would keep all three.
      act(() => {
        fireEvent.change(view.input, { target: { value: 'item' } })
      })

      await waitFor(() => {
        expect(view.queryAllByRole('option')).toHaveLength(0)
      })
    })
  })

  describe('choosing', () => {
    it('chooses an option and closes the list', async () => {
      const view = setup()
      fireEvent.click(view.toggle)
      await waitFor(() => {
        expect(view.getByRole('listbox')).not.toBeNull()
      })

      fireEvent.click(view.getByRole('option', { name: 'Second item' }))

      await waitFor(() => {
        expect(view.queryByRole('listbox')).toBeNull()
      })
      expect(view.input.value).toBe('Second item')
    })

    it('keeps its own choice from defaultSelectedKey', () => {
      const view = setup({ defaultValue: 'third' })
      expect(view.input.value).toBe('Third item')
    })

    it('does not change on its own when controlled', async () => {
      const onChange = vi.fn<(key: unknown) => void>()
      const view = setup({ onChange, value: 'first' })

      fireEvent.click(view.toggle)
      await waitFor(() => {
        expect(view.getByRole('listbox')).not.toBeNull()
      })
      fireEvent.click(view.getByRole('option', { name: 'Second item' }))

      await waitFor(() => {
        expect(onChange).toHaveBeenCalledWith('second')
      })
      expect(view.input.value).toBe('First item')
    })

    // Without allowsCustomValue the field cannot end up holding text that
    // means nothing: React Aria puts the last chosen option back on blur.
    it('keeps text that matches nothing only when allowed', async () => {
      const view = setup({ allowsCustomValue: true })
      act(() => {
        fireEvent.change(view.input, { target: { value: 'Anything' } })
      })
      fireEvent.blur(view.input)

      await waitFor(() => {
        expect(view.input.value).toBe('Anything')
      })
    })

    it('reverts text that matches nothing by default', async () => {
      const view = setup({ defaultValue: 'first' })
      act(() => {
        fireEvent.change(view.input, { target: { value: 'Anything' } })
      })
      fireEvent.blur(view.input)

      await waitFor(() => {
        expect(view.input.value).toBe('First item')
      })
    })
  })

  describe('multiple selection', () => {
    // The chosen options come first on the value's line and the input takes
    // what is left of it, inside the box where typing can be seen.
    it('draws the chosen options before the input, on its line', () => {
      const view = setupMultiple()
      const chosen = view
        .getByText('First item and Third item')
        .getBoundingClientRect()
      const input = view.input.getBoundingClientRect()
      const box = view.box.getBoundingClientRect()

      expect(chosen.right).toBeLessThanOrEqual(input.left)
      expect(Math.abs(chosen.top - input.top)).toBeLessThan(1)
      expect(input.bottom).toBeLessThanOrEqual(box.bottom)
    })

    // Three options run longer than the line, and it is the options that
    // give way: they end in an ellipsis, and the input keeps 3em to type in.
    it('keeps room to type when the chosen options run long', () => {
      const view = setupMultiple({
        defaultValue: ['first', 'second', 'third'],
      })
      const chosen = view.getByText('First item, Second item, and Third item')
      const text = getComputedStyle(chosen)
      expect(chosen.scrollWidth).toBeGreaterThan(chosen.clientWidth)
      expect([text.overflowX, text.textOverflow, text.whiteSpace]).toEqual([
        'hidden',
        'ellipsis',
        'nowrap',
      ])
      expect(
        Math.abs(
          view.input.getBoundingClientRect().width -
            3 * Number.parseFloat(getComputedStyle(view.input).fontSize),
        ),
      ).toBeLessThan(1)
    })

    // The input is empty while options are chosen, so it cannot be what
    // floats the label; the chosen options are.
    it('floats the label while an option is chosen', () => {
      const chosen = setupMultiple()
      expect(getComputedStyle(chosen.label).fontSize).toBe('12px')
      chosen.unmount()

      const none = setupMultiple({ defaultValue: [] })
      expect(getComputedStyle(none.label).fontSize).toBe('16px')
    })

    it('keeps the options chosen before when another is chosen', async () => {
      const view = setupMultiple()
      fireEvent.click(view.toggle)
      await waitFor(() => {
        expect(view.getByRole('listbox')).not.toBeNull()
      })

      fireEvent.click(view.getByRole('option', { name: 'Second item' }))

      await waitFor(() => {
        const text = view.box.textContent
        expect(
          ['First item', 'Second item', 'Third item'].every((name) =>
            text.includes(name),
          ),
        ).toBe(true)
      })
    })

    it('still filters the list as it is typed', async () => {
      const view = setupMultiple()
      fireEvent.click(view.toggle)
      await waitFor(() => {
        expect(view.getAllByRole('option')).toHaveLength(3)
      })

      act(() => {
        fireEvent.change(view.input, { target: { value: 'Sec' } })
      })

      await waitFor(() => {
        expect(
          view.getAllByRole('option').map((option) => option.textContent),
        ).toEqual(['Second item'])
      })
    })
  })

  describe('keyboard', () => {
    it('opens the list from the keyboard', async () => {
      const view = setup()
      act(() => {
        view.input.focus()
      })
      fireEvent.keyDown(view.input, { key: 'ArrowDown' })
      fireEvent.keyUp(view.input, { key: 'ArrowDown' })

      await waitFor(() => {
        expect(view.getByRole('listbox')).not.toBeNull()
      })
    })

    it('closes on Escape', async () => {
      const view = setup()
      fireEvent.click(view.toggle)
      await waitFor(() => {
        expect(view.getByRole('listbox')).not.toBeNull()
      })

      fireEvent.keyDown(view.input, { key: 'Escape' })

      await waitFor(() => {
        expect(view.queryByRole('listbox')).toBeNull()
      })
    })
  })

  describe('appearance', () => {
    it('floats the label once the field holds text', () => {
      const empty = setup()
      expect(hasClasses(empty.getByText('Label'), CLASSES.floated)).toBe(false)
      empty.unmount()

      const chosen = setup({ defaultValue: 'second' })
      expect(hasClasses(chosen.getByText('Label'), CLASSES.floated)).toBe(true)
    })

    it('takes the error role when there is an error', () => {
      const view = setup({ error: 'Choose an item' })
      expect(hasClasses(view.getByText('Label'), CLASSES.error)).toBe(true)
    })

    // The control is an input, so the box is not a press target — only the
    // chevron opens the list, and it is the page's 24dp trailing icon.
    it('draws the chevron as the only press target in the box', () => {
      const view = setup()
      const box = view.container.querySelector('[role="group"]')
      if (box === null) {
        throw new Error('expected the field to draw a box')
      }

      expect(box.querySelectorAll('button')).toHaveLength(1)
      expect(view.toggle.getBoundingClientRect().width).toBe(24)
      expect(view.toggle.getBoundingClientRect().height).toBe(24)
    })

    // The page draws the list under the field and as wide as it, which only
    // holds because the popover is anchored to the box rather than to the
    // 24dp button inside it.
    it('opens the list at the width of the field', async () => {
      const view = setup()
      const box = view.container.querySelector('[role="group"]')
      if (box === null) {
        throw new Error('expected the field to draw a box')
      }

      fireEvent.click(view.toggle)
      await waitFor(() => {
        expect(view.getByRole('listbox')).not.toBeNull()
      })

      const surface = view.getByRole('listbox').parentElement
      expect(surface?.style.getPropertyValue('--trigger-width')).toBe(
        `${box.getBoundingClientRect().width}px`,
      )
    })
  })
  // The turn is drawn from the motion tokens rather than written as literals,
  // which is what lets an app retime it: redeclaring
  // `--kui-motion-duration-short3` is the documented way to do that from
  // outside the StyleX toolchain, and a hard-coded duration ignores it.
  describe('the turn', () => {
    // On the document element rather than on a wrapper: StyleX compiles a
    // token into a variable of its own, declared once at the root as the
    // `--kui-*` custom property with its default as the fallback. Resolving
    // there is why an app sets these at the root too, and why setting one
    // further down reaches nothing.
    it('follows an override of the motion duration token', () => {
      const root = document.documentElement
      root.style.setProperty('--kui-motion-duration-short3', '640ms')

      try {
        const view = render(
          <div style={WIDTH}>
            <ComboBox label="Label" options={OPTIONS} />
          </div>,
        )

        expect(getComputedStyle(glyphOf(view)).transitionDuration).toBe('0.64s')
      } finally {
        root.style.removeProperty('--kui-motion-duration-short3')
      }
    })

    // Named rather than left to fall to the CSS initial value, which is
    // `ease` — not the curve every other chevron here turns on.
    it('turns on the standard easing', () => {
      const probe = render(
        <div {...stylex.props(probeStyles.standardEasing)} />,
      )
      const swatch = probe.container.firstElementChild
      if (swatch === null) {
        throw new Error('expected the probe to render an element')
      }
      const expected = getComputedStyle(swatch).transitionTimingFunction
      probe.unmount()

      const view = render(
        <div style={WIDTH}>
          <ComboBox label="Label" options={OPTIONS} />
        </div>,
      )

      expect(getComputedStyle(glyphOf(view)).transitionTimingFunction).toBe(
        expected,
      )
    })
  })
})
