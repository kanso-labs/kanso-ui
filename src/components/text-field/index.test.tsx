import * as stylex from '@stylexjs/stylex'
import { act, fireEvent, render } from '@testing-library/react'
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

// The box the control sits in: the label's column is in it.
function boxOf(label: HTMLElement) {
  const box = label.parentElement?.parentElement
  if (!(box instanceof HTMLElement)) {
    throw new Error('expected the label to sit in a column in the box')
  }
  return box
}

function hasClasses(element: HTMLElement, classes: string[]) {
  return classes.every((name) => element.classList.contains(name))
}

// Finishes the label's transition before reading it — see field/index.test.tsx.
function settled(element: HTMLElement) {
  for (const animation of element.getAnimations()) {
    animation.finish()
  }
  return getComputedStyle(element)
}

function setup(props: Partial<Parameters<typeof TextField>[0]> = {}) {
  const view = render(<TextField label="Label" {...props} />)
  return {
    ...view,
    input: view.getByLabelText('Label'),
    // The outlined box's notch holds a hidden copy of the label's text, so
    // the element is found by its role rather than by the text alone.
    label: view.getByText('Label', { selector: 'label' }),
  }
}

// An icon a story or a call site would pass: sized in `em`, so it takes the
// slot's 24.
const ICON = <svg data-testid="icon" style={{ height: '1em', width: '1em' }} />
const OTHER_ICON = (
  <svg data-testid="other-icon" style={{ height: '1em', width: '1em' }} />
)

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
    // and this is what proves that state follows the input. Focus is moved
    // for real rather than fired as an event: React Aria ignores a focus
    // event whose target is not the active element, so a synthetic one never
    // reaches the state.
    it('turns the label the primary colour while focused', () => {
      const { input, label } = setup()
      expect(hasClasses(label, CLASSES.mutedLabel)).toBe(true)

      act(() => {
        input.focus()
      })
      expect(hasClasses(label, CLASSES.focusedLabel)).toBe(true)
      expect(hasClasses(label, CLASSES.mutedLabel)).toBe(false)

      act(() => {
        input.blur()
      })
      expect(hasClasses(label, CLASSES.mutedLabel)).toBe(true)
    })

    it('keeps the label in the error colour even while focused', () => {
      const view = render(<TextField error="Enter a value." label="Label" />)
      const input = view.getByLabelText('Label')
      act(() => {
        input.focus()
      })

      const label = view.getByText('Label')
      expect(hasClasses(label, CLASSES.errorText)).toBe(true)
      expect(hasClasses(label, CLASSES.focusedLabel)).toBe(false)
    })
  })

  // The field chrome's own tests cover the positions; these pin that the
  // prop reaches it and what the default is.
  describe('label', () => {
    it('floats by default: centred while empty, at the top once focused', () => {
      const { input, label } = setup({ defaultValue: '' })
      expect(settled(label).fontSize).toBe('16px')

      act(() => {
        input.focus()
      })
      expect(settled(label).fontSize).toBe('12px')
    })

    it('stays small at the top with floatingLabel={false}', () => {
      const { label } = setup({ defaultValue: '', floatingLabel: false })
      expect(settled(label).fontSize).toBe('12px')
    })
  })

  describe('outlined', () => {
    // The page's outlined field: no fill, a 1dp outline all round with 4dp
    // corners, 2dp and primary while focused, and the value centred with
    // 16dp above and below rather than the filled field's 8dp and label.
    it('draws an outline in place of the fill and the underline', () => {
      const view = setup({ variant: 'outlined' })
      const box = boxOf(view.label)
      const outline = box.querySelector('fieldset')
      if (
        !(outline instanceof SVGElement) &&
        !(outline instanceof HTMLElement)
      ) {
        throw new Error('expected the box to draw an outline')
      }
      const style = getComputedStyle(outline)
      expect(style.borderTopWidth).toBe('1px')
      expect(style.borderTopLeftRadius).toBe('4px')
      expect(style.borderBottomLeftRadius).toBe('4px')
      expect(getComputedStyle(box).backgroundColor).toBe('rgba(0, 0, 0, 0)')
      expect(getComputedStyle(box).boxShadow).toBe('none')
      expect(box.getBoundingClientRect().height).toBe(56)
    })

    it('thickens the outline while the control is focused', () => {
      const view = setup({ variant: 'outlined' })
      const outline = boxOf(view.label).querySelector('fieldset')
      if (outline === null) {
        throw new Error('expected the box to draw an outline')
      }
      expect(getComputedStyle(outline).borderTopWidth).toBe('1px')

      act(() => {
        view.input.focus()
      })
      settled(outline)
      expect(getComputedStyle(outline).borderTopWidth).toBe('2px')

      act(() => {
        view.input.blur()
      })
      settled(outline)
      expect(getComputedStyle(outline).borderTopWidth).toBe('1px')
    })

    // The notch is the legend: closed it has no width beyond its padding,
    // and open it is as wide as the label's floated text.
    it('opens the notch once the label floats', () => {
      const view = setup({ defaultValue: '', variant: 'outlined' })
      const notch = boxOf(view.label).querySelector('legend')
      if (notch === null) {
        throw new Error('expected the outline to hold a notch')
      }
      expect(notch.getBoundingClientRect().width).toBe(0)

      act(() => {
        view.input.focus()
      })
      settled(view.label)
      const open = notch.getBoundingClientRect().width
      expect(open).toBeGreaterThan(20)
      expect(
        Math.abs(open - view.label.getBoundingClientRect().width),
      ).toBeLessThan(1)
      expect(notch.getBoundingClientRect().height).toBe(0)
    })

    it('keeps the notch open under a fixed label', () => {
      const view = setup({
        defaultValue: '',
        floatingLabel: false,
        variant: 'outlined',
      })
      const notch = boxOf(view.label).querySelector('legend')
      expect(notch?.getBoundingClientRect().width ?? 0).toBeGreaterThan(20)
    })

    // Resting, the label sits on the value's line; floated, it sits on the
    // outline — a move, where the filled label only changes type.
    it('moves the label onto the outline once it floats', () => {
      const view = setup({ defaultValue: '', variant: 'outlined' })
      const box = boxOf(view.label)
      const resting = view.label.getBoundingClientRect()
      expect(resting.top - box.getBoundingClientRect().top).toBe(16)

      act(() => {
        view.input.focus()
      })
      settled(view.label)
      const floated = view.label.getBoundingClientRect()
      expect(floated.top).toBeLessThan(resting.top)
      expect(Math.round(floated.top + floated.height / 2)).toBe(
        Math.round(box.getBoundingClientRect().top),
      )
    })

    it('centres the value rather than clearing a label above it', () => {
      const view = setup({ variant: 'outlined' })
      const box = boxOf(view.label).getBoundingClientRect()
      const input = view.input.getBoundingClientRect()
      expect(input.top - box.top).toBe(16)
      expect(box.bottom - input.bottom).toBe(16)
    })
  })

  describe('icons', () => {
    // The page's measurements: 24 icons, 12 from the box's edge, 16 from the
    // text, centred in the 56.
    it('draws the icons 12 from the edges and moves the text past the leading one', () => {
      const { input, label } = setup({
        leadingIcon: ICON,
        trailingIcon: OTHER_ICON,
      })
      const box = boxOf(label).getBoundingClientRect()
      const leading = document
        .querySelector('[data-testid="icon"]')
        ?.getBoundingClientRect()
      const trailing = document
        .querySelector('[data-testid="other-icon"]')
        ?.getBoundingClientRect()
      if (leading === undefined || trailing === undefined) {
        throw new Error('expected both icons to render')
      }
      expect(leading.width).toBe(24)
      expect(leading.left - box.left).toBe(12)
      expect(leading.top - box.top).toBe(16)
      expect(label.getBoundingClientRect().left - box.left).toBe(52)
      expect(input.getBoundingClientRect().left - box.left).toBe(52)
      expect(box.right - trailing.right).toBe(12)
      expect(trailing.top - box.top).toBe(16)
    })

    it('keeps the text 16 in without icons', () => {
      const { input, label } = setup()
      const box = boxOf(label).getBoundingClientRect()
      expect(label.getBoundingClientRect().left - box.left).toBe(16)
      expect(input.getBoundingClientRect().left - box.left).toBe(16)
    })

    it('colours the icons in the muted role, and the trailing one with the error', () => {
      const view = render(
        <TextField
          error="Enter a value."
          label="Label"
          leadingIcon={ICON}
          trailingIcon={OTHER_ICON}
        />,
      )
      const leading = view.getByTestId('icon').parentElement
      const trailing = view.getByTestId('other-icon').parentElement
      if (
        !(leading instanceof HTMLElement) ||
        !(trailing instanceof HTMLElement)
      ) {
        throw new Error('expected the icons to sit in their slots')
      }
      expect(hasClasses(leading, CLASSES.mutedLabel)).toBe(true)
      expect(hasClasses(leading, CLASSES.errorText)).toBe(false)
      expect(hasClasses(trailing, CLASSES.errorText)).toBe(true)
    })
  })

  describe('prefix and suffix', () => {
    it('places the prefix before the value and the suffix after it', () => {
      const view = setup({
        defaultValue: 'Value',
        prefix: 'Prefix',
        suffix: 'Suffix',
      })
      const prefix = view.getByText('Prefix').getBoundingClientRect()
      const suffix = view.getByText('Suffix').getBoundingClientRect()
      const input = view.input.getBoundingClientRect()
      expect(input.left - prefix.right).toBe(2)
      expect(suffix.left - input.right).toBe(2)
      expect(prefix.top).toBe(input.top)
    })

    // Under a floating label the affixes show as the placeholder does: once
    // the field is focused or holds a value, since at rest the label sits
    // on their line.
    it('shows the affixes only once the field is focused or holds a value', () => {
      const view = setup({ defaultValue: '', prefix: 'Prefix' })
      const prefix = view.getByText('Prefix')
      expect(settled(prefix).color).toBe('rgba(0, 0, 0, 0)')

      act(() => {
        view.input.focus()
      })
      expect(settled(prefix).color).not.toBe('rgba(0, 0, 0, 0)')

      act(() => {
        view.input.blur()
      })
      expect(settled(prefix).color).toBe('rgba(0, 0, 0, 0)')

      act(() => {
        fireEvent.change(view.input, { target: { value: 'typed' } })
      })
      expect(settled(prefix).color).not.toBe('rgba(0, 0, 0, 0)')
    })

    it('shows the affixes at rest under a fixed label', () => {
      const view = setup({
        defaultValue: '',
        floatingLabel: false,
        suffix: 'Suffix',
      })
      expect(settled(view.getByText('Suffix')).color).not.toBe(
        'rgba(0, 0, 0, 0)',
      )
    })
  })

  describe('character count', () => {
    it('counts the characters against the limit, and follows typing', () => {
      const view = setup({
        characterCount: true,
        defaultValue: 'typed',
        maxLength: 10,
      })
      expect(view.input.getAttribute('maxlength')).toBe('10')
      expect(view.getByText('5/10')).not.toBeNull()

      act(() => {
        fireEvent.change(view.input, { target: { value: 'typed more' } })
      })
      expect(view.getByText('10/10')).not.toBeNull()
    })

    it('counts alone without a limit', () => {
      const view = setup({ characterCount: true, defaultValue: 'typed' })
      expect(view.getByText('5')).not.toBeNull()
    })

    // The page puts the counter opposite the supporting text, on one line,
    // ending where the box's padding does.
    it('sits at the end of the supporting line', () => {
      const view = setup({
        characterCount: true,
        defaultValue: 'typed',
        description: 'Supporting line',
        maxLength: 10,
      })
      const box = boxOf(view.label).getBoundingClientRect()
      const counter = view.getByText('5/10').getBoundingClientRect()
      const description = view
        .getByText('Supporting line')
        .getBoundingClientRect()
      expect(box.right - counter.right).toBe(16)
      expect(counter.top).toBe(description.top)
      expect(counter.top - box.bottom).toBe(4)
    })

    it('takes the error colour with the message', () => {
      const view = setup({
        characterCount: true,
        defaultValue: 'typed',
        error: 'Enter a value.',
        maxLength: 10,
      })
      expect(hasClasses(view.getByText('5/10'), CLASSES.errorText)).toBe(true)
      expect(view.getByText('5/10').getBoundingClientRect().top).toBe(
        view.getByText('Enter a value.').getBoundingClientRect().top,
      )
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
