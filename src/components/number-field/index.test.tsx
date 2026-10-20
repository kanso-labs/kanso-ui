import * as stylex from '@stylexjs/stylex'
import { act, fireEvent, render } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import NumberField from '.'
import { colors, spacing, typography } from '../../tokens/design.tokens.stylex'

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

// A theme with longer body lines than the defaults, which is what tells the
// stacked steppers' derived halves apart from a stated 28 — under the default
// tokens the two agree. The type is `Editorial`'s, from src/theming/themes.ts.
//
// Its `lg` is wider than Editorial's 20 so that the filled and outlined boxes
// come out at different heights: the two derive from different expressions
// that happen to agree at Editorial's own values, and a stepper taking the
// wrong one would still measure right there.
const longLineType = stylex.createTheme(typography, {
  bodyLargeLineHeight: '28px',
  bodySmallLineHeight: '20px',
})
const longLineSpacing = stylex.createTheme(spacing, { lg: '26px', sm: '10px' })

// A frame narrower than a long label, so it is cut short and where it ends
// is what decides whether it reaches the steppers.
const frameStyles = stylex.create({
  narrow: { inlineSize: '328px' },
})

const LONG_LABEL = 'A label long enough to run the whole width of the box'

// The box the control sits in: the label's column is in it.
function boxOf(container: HTMLElement) {
  const box = container.querySelector('label')?.parentElement?.parentElement
  if (!(box instanceof HTMLElement)) {
    throw new Error('expected the label to sit in a column in the box')
  }
  return box
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

  // A value typed rather than stepped leaves the steppers out, and the
  // keyboard is then the only way to step it.
  describe('without steppers', () => {
    it.each(['filled', 'outlined'] as const)(
      'draws no stepper in the %s box, where the default draws both',
      (variant) => {
        const none = render(
          <NumberField label="Label" steppers="none" variant={variant} />,
        )
        expect(none.queryAllByRole('button')).toHaveLength(0)
        none.unmount()

        const stepped = render(<NumberField label="Label" variant={variant} />)
        expect(stepped.getAllByRole('button')).toHaveLength(2)
      },
    )

    it('still steps the value from the keyboard', () => {
      const view = render(
        <NumberField defaultValue={5} label="Label" steppers="none" />,
      )
      const input = view.getByRole('textbox', { name: 'Label' })
      act(() => {
        input.focus()
      })

      fireEvent.keyDown(input, { key: 'ArrowUp' })
      expect(input).toHaveProperty('value', '6')
      fireEvent.keyDown(input, { key: 'ArrowDown' })
      fireEvent.keyDown(input, { key: 'ArrowDown' })
      expect(input).toHaveProperty('value', '4')
    })

    // With nothing at the end, the input runs to the box's own 16 of end
    // padding, as a text field's does.
    it.each(['filled', 'outlined'] as const)(
      "runs the input to the %s box's end padding",
      (variant) => {
        const view = render(
          <NumberField label="Label" steppers="none" variant={variant} />,
        )
        const box = view.getByRole('group').getBoundingClientRect()
        const input = view.getByRole('textbox').getBoundingClientRect()

        expect(box.right - input.right).toBe(16)
      },
    )
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
    // React Aria steps a focused field's value with the wheel, so scrolling
    // a form past a field left focused changed its value instead of moving
    // the page. The wheel is left to the page unless the call site asks.
    it('leaves the value to the keyboard and the page to the wheel', () => {
      const { input } = setup({ defaultValue: 5 })
      act(() => {
        input.focus()
      })
      const wheel = new WheelEvent('wheel', {
        bubbles: true,
        cancelable: true,
        deltaY: -100,
      })

      act(() => {
        input.dispatchEvent(wheel)
      })

      expect(input).toHaveProperty('value', '5')
      expect(wheel.defaultPrevented).toBe(false)
    })

    it('steps the value with the wheel when asked to', () => {
      const { input } = setup({ defaultValue: 5, isWheelDisabled: false })
      act(() => {
        input.focus()
      })

      act(() => {
        input.dispatchEvent(
          new WheelEvent('wheel', {
            bubbles: true,
            cancelable: true,
            deltaY: -100,
          }),
        )
      })

      // Which way a turn steps is React Aria's; that it steps is the point.
      expect(input).not.toHaveProperty('value', '5')
    })

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

    // A text field runs a numeric value left to right; this one's value is
    // formatted for the locale, which orders it in the page's direction.
    it('keeps the direction of a right-to-left page', () => {
      const view = render(
        <div dir="rtl">
          <NumberField defaultValue={-1} label="Label" />
        </div>,
      )
      const input = view.getByRole('textbox', { name: 'Label' })
      expect(getComputedStyle(input).direction).toBe('rtl')
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

    // The icon buttons page gives the extra-small button a 20dp icon. The
    // glyph carries no size of its own, so without one drawn in `em` it
    // fills the whole 32dp button.
    it("draws the side-by-side glyphs at the page's 20", () => {
      const { decrement, increment } = setup({ steppers: 'horizontal' })
      for (const stepper of [decrement, increment]) {
        const glyph = stepper.querySelector('svg')
        if (glyph === null) {
          throw new Error('expected each stepper to draw a glyph')
        }
        const size = glyph.getBoundingClientRect()
        expect(size.width).toBe(20)
        expect(size.height).toBe(20)
      }
    })

    it('draws the stacked glyphs at the same 20', () => {
      const { increment } = setup()
      const glyph = increment.querySelector('svg')
      expect(glyph?.getBoundingClientRect().width).toBe(20)
    })

    // The pair is flush with the box's top and bottom, so each is half of
    // whatever the box comes to rather than half of the page's 56 — a theme
    // with a longer body line makes the box taller and the halves follow.
    it.each(['filled', 'outlined'] as const)(
      'stacks two steppers over the whole height of a %s box',
      (variant) => {
        const view = render(
          <div {...stylex.props(longLineType, longLineSpacing)}>
            <NumberField label="Label" variant={variant} />
          </div>,
        )
        const box = boxOf(view.container).getBoundingClientRect().height
        const steppers = [...view.container.querySelectorAll('button')].map(
          (button) => button.getBoundingClientRect().height,
        )

        expect(box).toBeGreaterThan(56)
        expect(steppers).toHaveLength(2)
        expect(steppers[0]).toBe(box / 2)
        expect(steppers[0]).toBe(steppers[1])
      },
    )

    // In the outlined box the value sits on the box's centre, as it does with
    // the stacked steppers and in a text field. Side by side, the buttons'
    // 32dp made the row taller than the value's line and dropped both 4dp.
    it.each(['vertical', 'horizontal'] as const)(
      'centres the value and the steppers in an outlined box with %s steppers',
      (steppers) => {
        const { increment, input } = setup({ steppers, variant: 'outlined' })
        const box = input.closest('[role="group"]')?.getBoundingClientRect()
        const pair = increment.parentElement?.getBoundingClientRect()
        const value = input.getBoundingClientRect()
        if (box === undefined || pair === undefined) {
          throw new Error('expected the input and the steppers in the box')
        }
        const centre = box.top + box.height / 2

        expect(value.top + value.height / 2).toBe(centre)
        expect(pair.top + pair.height / 2).toBe(centre)
      },
    )

    // The label is positioned against the column the input and the steppers
    // share, so it ran under the steppers and a long one was cut short
    // beneath them. It ends where the input does.
    it.each([
      { steppers: 'vertical', variant: 'filled' },
      { steppers: 'horizontal', variant: 'filled' },
      { steppers: 'vertical', variant: 'outlined' },
      { steppers: 'horizontal', variant: 'outlined' },
    ] as const)(
      'keeps a long label clear of $steppers steppers in a $variant box',
      ({ steppers, variant }) => {
        const view = render(
          <div {...stylex.props(frameStyles.narrow)}>
            <NumberField
              label={LONG_LABEL}
              steppers={steppers}
              variant={variant}
            />
          </div>,
        )
        const label = view.container.querySelector('label')
        if (label === null) {
          throw new Error('expected the field to draw its label')
        }
        const steppersLeft = Math.min(
          ...[...view.container.querySelectorAll('button')].map(
            (button) => button.getBoundingClientRect().left,
          ),
        )
        const input = view.getByRole('textbox').getBoundingClientRect()

        expect(label.scrollWidth).toBeGreaterThan(label.clientWidth)
        expect(label.getBoundingClientRect().right).toBeLessThanOrEqual(
          steppersLeft,
        )
        expect(label.getBoundingClientRect().right).toBeLessThanOrEqual(
          input.right + 4,
        )
      },
    )

    // With no steppers there is nothing to stop short of, so a long label is
    // cut short where the value ends, at the box's end padding.
    it.each(['filled', 'outlined'] as const)(
      'runs a long label to the end of the value without steppers in the %s box',
      (variant) => {
        const view = render(
          <div {...stylex.props(frameStyles.narrow)}>
            <NumberField label={LONG_LABEL} steppers="none" variant={variant} />
          </div>,
        )
        const label = view.container.querySelector('label')
        if (label === null) {
          throw new Error('expected the field to draw its label')
        }
        const input = view.getByRole('textbox').getBoundingClientRect()

        expect(label.scrollWidth).toBeGreaterThan(label.clientWidth)
        expect(
          Math.abs(label.getBoundingClientRect().right - input.right),
        ).toBeLessThanOrEqual(4)
      },
    )

    // Floated in the outlined box, the label sits in a notch cut in the
    // outline, which has to end where the label does: a notch running on
    // past a cut-short label leaves a gap in the outline over the steppers.
    it.each(['vertical', 'horizontal', 'none'] as const)(
      'ends the outlined notch with a long label beside %s steppers',
      (steppers) => {
        const view = render(
          <div {...stylex.props(frameStyles.narrow)}>
            <NumberField
              defaultValue={1}
              label={LONG_LABEL}
              steppers={steppers}
              variant="outlined"
            />
          </div>,
        )
        const label = view.container.querySelector('label')
        const notch = view.container.querySelector('legend')
        if (label === null || notch === null) {
          throw new Error('expected the outlined box to draw a notch')
        }

        // Within the outline's 1px border, which the notch sits inside at
        // either end, as it does beside a trailing icon.
        expect(
          Math.abs(
            notch.getBoundingClientRect().right -
              label.getBoundingClientRect().right,
          ),
        ).toBeLessThanOrEqual(1)
      },
    )

    // Every element the library renders is border-box, so none depends on a
    // reset the consumer might not have.
    it('draws the stepper column, the box column and the message border-box', () => {
      const view = render(<NumberField error="Enter a value." label="Label" />)
      const steppers = view.getAllByRole('button')[0].parentElement
      const column = view.container.querySelector('label')?.parentElement
      const message = view.getByText('Enter a value.')
      const parts = [steppers, column, message].filter(
        (part) => part instanceof HTMLElement,
      )

      expect(parts).toHaveLength(3)
      for (const part of parts) {
        expect(getComputedStyle(part).boxSizing).toBe('border-box')
      }
    })
  })
})
