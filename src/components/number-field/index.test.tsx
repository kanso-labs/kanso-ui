import * as stylex from '@stylexjs/stylex'
import { act, fireEvent, render } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import NumberField from '.'
import { colors, typography } from '../../tokens/design.tokens.stylex'

// StyleX hashes an atomic class from the property and value, so the same
// declaration written here produces the same class the component produces.
// Asserting on class membership pins which role each part reaches for
// without depending on the browser having applied a rule these tests are the
// first thing to use — see chip/index.test.tsx for the flake behind this.
const probeStyles = stylex.create({
  errorText: { color: colors.error },
  mono: { fontFamily: typography.fontFamilyMono },
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
  errorText: classesOf(stylex.props(probeStyles.errorText)),
  mono: classesOf(stylex.props(probeStyles.mono)),
}

// Hoisted so it is one stable object per render rather than a fresh one,
// which is what react-perf's no-new-object-as-prop is after.
const EURO = { currency: 'EUR', style: 'currency' } as const

function hasClasses(element: Element, classes: string[]) {
  return classes.every((name) => element.classList.contains(name))
}

function setup(props: Partial<Parameters<typeof NumberField>[0]> = {}) {
  const view = render(<NumberField label="Label" {...props} />)
  return {
    ...view,
    decrement: view.getByRole('button', { name: /^Decrease/ }),
    increment: view.getByRole('button', { name: /^Increase/ }),
    input: view.getByRole('textbox', { name: 'Label' }),
  }
}

describe('number field', () => {
  describe('semantics', () => {
    // getByRole with a name resolves through the accessible name, so finding
    // the input this way is the label association itself. React Aria names a
    // stepper by its own label and then the field's, "Decrease Label", and
    // keeps both out of the tab order, since the arrow keys step the value.
    it('names the input with its label, and the steppers with theirs', () => {
      const { decrement, increment, input } = setup()
      expect(input.tagName).toBe('INPUT')
      expect(input.getAttribute('inputmode')).toBe('numeric')
      expect(decrement.tagName).toBe('BUTTON')
      expect(increment.tagName).toBe('BUTTON')
      expect(increment.getAttribute('tabindex')).toBe('-1')
    })

    it('takes other names for the steppers', () => {
      const view = render(
        <NumberField
          decrementLabel="Fewer"
          incrementLabel="More"
          label="Label"
        />,
      )
      expect(view.getByRole('button', { name: /^Fewer/ })).not.toBeNull()
      expect(view.getByRole('button', { name: /^More/ })).not.toBeNull()
    })

    it('groups the box and the steppers as one control', () => {
      const view = setup()
      expect(view.getByRole('group')).toContainElement(view.increment)
    })

    it('associates the description with the input', () => {
      const view = setup({ description: 'Supporting line' })
      expect(view.input.getAttribute('aria-describedby')?.split(' ')).toContain(
        view.getByText('Supporting line').id,
      )
    })

    it('marks the input invalid and shows the error', () => {
      const view = setup({ error: 'Enter a number.' })
      expect(view.input.getAttribute('aria-invalid')).toBe('true')
      expect(
        hasClasses(view.getByText('Enter a number.'), CLASSES.errorText),
      ).toBe(true)
    })
  })

  describe('value', () => {
    it('steps the value from the steppers', () => {
      const { decrement, increment, input } = setup({
        defaultValue: 5,
        step: 5,
      })
      expect(input).toHaveProperty('value', '5')
      fireEvent.click(increment)
      expect(input).toHaveProperty('value', '10')
      fireEvent.click(decrement)
      fireEvent.click(decrement)
      expect(input).toHaveProperty('value', '0')
    })

    it('steps the value from the keyboard', () => {
      const { input } = setup({ defaultValue: 5 })
      act(() => {
        input.focus()
      })
      fireEvent.keyDown(input, { key: 'ArrowUp' })
      expect(input).toHaveProperty('value', '6')
    })

    it('keeps the value between its bounds and disables the stepper at each', () => {
      const { decrement, increment, input } = setup({
        defaultValue: 9,
        maxValue: 10,
        minValue: 0,
      })
      fireEvent.click(increment)
      expect(input).toHaveProperty('value', '10')
      expect(increment).toHaveProperty('disabled', true)
      expect(decrement).toHaveProperty('disabled', false)
    })

    // Controlled means the call site owns the value: a step reports it and
    // nothing moves until the prop comes back different.
    it('reports without moving when controlled', () => {
      const onChange = vi.fn<(value: number) => void>()
      const { increment, input } = setup({ onChange, value: 5 })
      fireEvent.click(increment)
      expect(onChange).toHaveBeenCalledWith(6)
      expect(input).toHaveProperty('value', '5')
    })

    // Formatting is React Aria's, in the page's locale — the runner's is
    // en-US, which is what the symbols and separators below are.
    it('reads the value in the format it is given', () => {
      const { input } = setup({ defaultValue: 1234.5, formatOptions: EURO })
      expect(input).toHaveProperty('value', '€1,234.50')
    })

    it('disables the input and both steppers', () => {
      const { decrement, increment, input } = setup({ isDisabled: true })
      expect(input).toHaveProperty('disabled', true)
      expect(increment).toHaveProperty('disabled', true)
      expect(decrement).toHaveProperty('disabled', true)
    })

    // The side-by-side steppers are icon buttons, disabled through the
    // field's context like the stacked pair rather than by a prop of their
    // own — at a bound and with the field.
    it('disables the side-by-side steppers the same way', () => {
      const atBound = setup({
        defaultValue: 10,
        maxValue: 10,
        steppers: 'horizontal',
      })
      expect(atBound.increment).toHaveProperty('disabled', true)
      expect(atBound.decrement).toHaveProperty('disabled', false)
      atBound.unmount()

      const { decrement, increment } = setup({
        isDisabled: true,
        steppers: 'horizontal',
      })
      expect(increment).toHaveProperty('disabled', true)
      expect(decrement).toHaveProperty('disabled', true)
    })
  })

  describe('appearance', () => {
    it('sets the value in the mono face by default', () => {
      const { input } = setup()
      expect(hasClasses(input, CLASSES.mono)).toBe(true)
    })

    it('leaves the mono face off when asked', () => {
      const { input } = setup({ numeric: false })
      expect(hasClasses(input, CLASSES.mono)).toBe(false)
    })

    // Stacked, the pair is flush with the box's top, end and bottom, each
    // half of its 56.
    it('stacks the steppers flush with the box, the plus over the minus, by default', () => {
      const { decrement, increment } = setup()
      const box = increment.closest('[role="group"]')
      if (!(box instanceof HTMLElement)) {
        throw new Error('expected the steppers to sit in the box')
      }
      const edge = box.getBoundingClientRect()
      const plus = increment.getBoundingClientRect()
      const minus = decrement.getBoundingClientRect()
      expect(plus.top).toBe(edge.top)
      expect(plus.right).toBe(edge.right)
      expect(plus.bottom).toBe(minus.top)
      expect(minus.bottom).toBe(edge.bottom)
      expect(plus.left).toBe(minus.left)
      expect(plus.height).toBe(28)
    })

    // Side by side, the icon buttons are the page's trailing icons: 12 from
    // the end, out of the box's 16 of padding.
    it('sets the steppers side by side, 12 from the end, when asked', () => {
      const { decrement, increment } = setup({ steppers: 'horizontal' })
      const box = increment.closest('[role="group"]')
      if (!(box instanceof HTMLElement)) {
        throw new Error('expected the steppers to sit in the box')
      }
      const plus = increment.getBoundingClientRect()
      const minus = decrement.getBoundingClientRect()
      expect(plus.top).toBe(minus.top)
      expect(minus.right).toBeLessThanOrEqual(plus.left)
      expect(plus.height).toBe(32)
      expect(box.getBoundingClientRect().right - plus.right).toBe(12)
    })
  })
})
