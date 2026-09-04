import * as stylex from '@stylexjs/stylex'
import { fireEvent, render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import TextField from '.'
import { colors, typography } from '../../tokens/design.tokens.stylex'

// StyleX hashes an atomic class from the property and value, so the same
// declaration written here produces the same class the component produces.
// Asserting on class membership pins which token role each state reaches for,
// and unlike reading a computed colour it does not depend on the browser
// having applied a rule these tests are the first thing to use — see
// chip/index.test.tsx for the flake that taught us the difference.
const probeStyles = stylex.create({
  errorText: { color: colors.error },
  focusedLabel: { color: colors.primary },
  mono: { fontFamily: typography.fontFamilyMono },
  mutedLabel: { color: colors.onSurfaceVariant },
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
  focusedLabel: classesOf(stylex.props(probeStyles.focusedLabel)),
  mono: classesOf(stylex.props(probeStyles.mono)),
  mutedLabel: classesOf(stylex.props(probeStyles.mutedLabel)),
}

function hasClasses(element: HTMLElement, classes: string[]) {
  return classes.every((name) => element.classList.contains(name))
}

function setup(props: Partial<Parameters<typeof TextField>[0]> = {}) {
  const view = render(<TextField label="Label" {...props} />)
  return {
    ...view,
    input: view.getByLabelText('Label'),
    label: view.getByText('Label'),
  }
}

describe('text field', () => {
  describe('labelling', () => {
    // getByLabelText resolves through the accessible name, so finding the
    // input this way is the association itself rather than a proxy for it —
    // a label merely sitting next to the box would not satisfy it.
    it('names the control with its label', () => {
      const view = render(<TextField label="Label" />)
      const input = view.getByLabelText('Label')
      expect(input.tagName).toBe('INPUT')
      expect(view.getByRole('textbox')).toBe(input)
    })

    it('associates the description with the control', () => {
      const view = render(
        <TextField description="Supporting line" label="Label" />,
      )
      const input = view.getByLabelText('Label')
      const describedBy = input.getAttribute('aria-describedby')
      expect(describedBy).not.toBeNull()
      const description = view.getByText('Supporting line')
      expect(describedBy?.split(' ')).toContain(description.id)
    })
  })

  describe('error state', () => {
    it('marks the control invalid and shows the message', () => {
      const view = render(<TextField error="Enter a value." label="Label" />)
      const input = view.getByLabelText('Label')
      expect(input.getAttribute('aria-invalid')).toBe('true')
      expect(view.getByText('Enter a value.')).not.toBeNull()
    })

    it('is not invalid without an error', () => {
      const { input } = setup()
      expect(input.getAttribute('aria-invalid')).not.toBe('true')
    })

    // The description and the error occupy the same line, so showing both
    // would move the field's neighbours as an error appears and clears.
    it('replaces the description rather than stacking with it', () => {
      const view = render(
        <TextField
          description="Supporting line"
          error="Enter a value."
          label="Label"
        />,
      )
      expect(view.queryByText('Supporting line')).toBeNull()
      expect(view.getByText('Enter a value.')).not.toBeNull()
    })

    it('associates the error message with the control', () => {
      const view = render(<TextField error="Enter a value." label="Label" />)
      const describedBy = view
        .getByLabelText('Label')
        .getAttribute('aria-describedby')
      expect(describedBy?.split(' ')).toContain(
        view.getByText('Enter a value.').id,
      )
    })

    it('turns the label the error colour', () => {
      const view = render(<TextField error="Enter a value." label="Label" />)
      expect(hasClasses(view.getByText('Label'), CLASSES.errorText)).toBe(true)
    })
  })

  describe('focus', () => {
    // The label's colour follows the field's focus, which StyleX cannot
    // express: the label is the input's sibling, so `:focus-within` on the
    // label never matches. It comes from the box's own focus state instead,
    // and this is what proves that state follows the input.
    it('turns the label the primary colour while focused', () => {
      const { input, label } = setup()
      expect(hasClasses(label, CLASSES.mutedLabel)).toBe(true)

      fireEvent.focus(input)
      expect(hasClasses(label, CLASSES.focusedLabel)).toBe(true)
      expect(hasClasses(label, CLASSES.mutedLabel)).toBe(false)

      fireEvent.blur(input)
      expect(hasClasses(label, CLASSES.mutedLabel)).toBe(true)
    })

    it('keeps the label in the error colour even while focused', () => {
      const view = render(<TextField error="Enter a value." label="Label" />)
      const input = view.getByLabelText('Label')
      fireEvent.focus(input)

      const label = view.getByText('Label')
      expect(hasClasses(label, CLASSES.errorText)).toBe(true)
      expect(hasClasses(label, CLASSES.focusedLabel)).toBe(false)
    })
  })

  describe('numeric', () => {
    it('renders the value in the mono face when numeric', () => {
      const { input } = setup({ numeric: true })
      expect(hasClasses(input, CLASSES.mono)).toBe(true)
    })

    it('leaves the value in the body face by default', () => {
      const { input } = setup()
      expect(hasClasses(input, CLASSES.mono)).toBe(false)
    })
  })

  describe('value', () => {
    it('accepts typing and reports the value', () => {
      const { input } = setup({ defaultValue: '' })
      fireEvent.change(input, { target: { value: 'typed' } })
      expect(input).toHaveProperty('value', 'typed')
    })

    it('does not accept input when disabled', () => {
      const { input } = setup({ isDisabled: true })
      expect(input).toHaveProperty('disabled', true)
    })
  })
})
