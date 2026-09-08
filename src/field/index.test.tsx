import * as stylex from '@stylexjs/stylex'
import { act, render } from '@testing-library/react'
import { Form, TextField } from 'react-aria-components'
import { describe, expect, it } from 'vitest'

import { FieldBox, FieldInput, FieldLabel, FieldMessage } from '.'
import {
  colors,
  stateLayerOpacity,
  typography,
} from '../tokens/design.tokens.stylex'
import { FIELD_VALIDATION_BEHAVIOR } from './root'

// The same declarations the module writes for its states, so they hash to the
// same atomic classes — see chip/index.test.tsx for the pattern and the flake
// behind reading computed colours instead.
const probeStyles = stylex.create({
  disabledText: {
    color: `color-mix(in srgb, ${colors.onSurface} calc(${stateLayerOpacity.disabledContent} * 100%), ${colors.surface})`,
  },
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
  disabledText: classesOf(stylex.props(probeStyles.disabledText)),
  errorText: classesOf(stylex.props(probeStyles.errorText)),
  focusedLabel: classesOf(stylex.props(probeStyles.focusedLabel)),
  mono: classesOf(stylex.props(probeStyles.mono)),
  mutedLabel: classesOf(stylex.props(probeStyles.mutedLabel)),
}

// What a server sent back for the field named `first`, hoisted rather than
// written at the prop, which is what react-perf's no-new-object-as-prop is
// after.
const SERVER_ERRORS = { first: 'Taken.' }

function hasClasses(element: HTMLElement, classes: string[]) {
  return classes.every((name) => element.classList.contains(name))
}

function placeholderColorOf(input: HTMLElement) {
  return getComputedStyle(input, '::placeholder').color
}

// The label moves through a transition, and a computed value read while one
// is running is the value part way along it. Finishing every animation on the
// element first reads the state it is heading for, without waiting for it.
function settled(element: HTMLElement) {
  for (const animation of element.getAnimations()) {
    animation.finish()
  }
  return getComputedStyle(element)
}

const TRANSPARENT = 'rgba(0, 0, 0, 0)'

// The parts only make sense inside a React Aria field, which is what
// associates the label, wires the messages and carries validation. A bare
// React Aria TextField stands in for whichever field a consumer builds.
function setup(
  props: {
    defaultValue?: string
    description?: string
    error?: string
    floatingLabel?: boolean
    isDisabled?: boolean
    numeric?: boolean
    placeholder?: string
  } = {},
) {
  const view = render(
    <TextField
      defaultValue={props.defaultValue}
      isDisabled={props.isDisabled}
      isInvalid={props.error !== undefined}
      validationBehavior={FIELD_VALIDATION_BEHAVIOR}
    >
      <FieldBox floatingLabel={props.floatingLabel} label="Label">
        <FieldInput numeric={props.numeric} placeholder={props.placeholder} />
      </FieldBox>
      <FieldMessage description={props.description} error={props.error} />
    </TextField>,
  )
  return {
    ...view,
    input: view.getByLabelText('Label'),
    label: view.getByText('Label'),
  }
}

describe('field chrome', () => {
  describe('box', () => {
    // The box is a Group only for its render state. Inside a field it must
    // not announce itself as a group of controls around the single one it
    // holds, which is what the field's context tells it.
    it('adds no group to the accessibility tree inside a field', () => {
      const view = setup()
      expect(view.queryByRole('group')).toBeNull()
    })

    it('associates its label with the control', () => {
      const { input } = setup()
      expect(input.tagName).toBe('INPUT')
    })
  })

  describe('label colour', () => {
    it('is muted at rest and primary while focus is within the box', () => {
      const { input, label } = setup()
      expect(hasClasses(label, CLASSES.mutedLabel)).toBe(true)

      act(() => {
        input.focus()
      })
      expect(hasClasses(label, CLASSES.focusedLabel)).toBe(true)

      act(() => {
        input.blur()
      })
      expect(hasClasses(label, CLASSES.focusedLabel)).toBe(false)
    })

    it('keeps the error colour over focus', () => {
      const { input, label } = setup({ error: 'Enter a value.' })
      act(() => {
        input.focus()
      })
      expect(hasClasses(label, CLASSES.errorText)).toBe(true)
      expect(hasClasses(label, CLASSES.focusedLabel)).toBe(false)
    })

    it('takes the disabled colour from the field', () => {
      const { label } = setup({ isDisabled: true })
      expect(hasClasses(label, CLASSES.disabledText)).toBe(true)
    })

    // Every state defaults off, so a label rendered outside a box — beside a
    // checkbox, say — is the muted one until told otherwise.
    it('is muted with no state at all', () => {
      const view = render(<FieldLabel>Label</FieldLabel>)
      expect(hasClasses(view.getByText('Label'), CLASSES.mutedLabel)).toBe(true)
    })
  })

  // The text fields page's label: body-large and centred in an empty,
  // unfocused box, body-small at the top once the field is focused or holds a
  // value. Read as the browser resolved it, since the label's type is what
  // the box hands down rather than a class of its own.
  describe('label position', () => {
    it('rests in the box and floats to the top on focus', () => {
      const { input, label } = setup()
      expect(settled(label).fontSize).toBe('16px')
      expect(settled(label).lineHeight).toBe('40px')

      act(() => {
        input.focus()
      })
      expect(settled(label).fontSize).toBe('12px')
      expect(settled(label).lineHeight).toBe('16px')

      act(() => {
        input.blur()
      })
      expect(settled(label).fontSize).toBe('16px')
    })

    it('stays at the top while the control holds a value', () => {
      const { label } = setup({ defaultValue: 'Value' })
      expect(settled(label).fontSize).toBe('12px')
    })

    it('stays at the top in every state when the label is fixed', () => {
      const { input, label } = setup({ floatingLabel: false })
      expect(settled(label).fontSize).toBe('12px')

      act(() => {
        input.focus()
      })
      expect(settled(label).fontSize).toBe('12px')
    })

    // The placeholder and the resting label would share the middle of the
    // box, so under a floating label the placeholder waits for focus.
    it('shows the placeholder only while focused under a floating label', () => {
      const { input } = setup({ placeholder: 'Placeholder' })
      expect(input.getAttribute('placeholder')).toBe('Placeholder')
      expect(placeholderColorOf(input)).toBe(TRANSPARENT)

      act(() => {
        input.focus()
      })
      expect(placeholderColorOf(input)).not.toBe(TRANSPARENT)
    })

    it('shows the placeholder at rest under a fixed label', () => {
      const { input } = setup({
        floatingLabel: false,
        placeholder: 'Placeholder',
      })
      expect(placeholderColorOf(input)).not.toBe(TRANSPARENT)
    })

    // A control with no placeholder of its own gets a blank one, which is what
    // `:placeholder-shown` needs to hold while the control is empty.
    it('carries a blank placeholder for the box to read', () => {
      const { input } = setup()
      expect(input.getAttribute('placeholder')).toBe(' ')
    })

    it('carries no placeholder of its own under a fixed label', () => {
      const { input } = setup({ floatingLabel: false })
      expect(input.hasAttribute('placeholder')).toBe(false)
    })
  })

  describe('input', () => {
    it('renders the value in the mono face when numeric', () => {
      const { input } = setup({ numeric: true })
      expect(hasClasses(input, CLASSES.mono)).toBe(true)
    })

    it('takes the disabled colour from its own render state', () => {
      const { input } = setup({ isDisabled: true })
      expect(input).toHaveProperty('disabled', true)
      expect(hasClasses(input, CLASSES.disabledText)).toBe(true)
    })
  })

  describe('message', () => {
    it('describes the control with the description', () => {
      const view = setup({ description: 'Supporting line' })
      const description = view.getByText('Supporting line')
      expect(view.input.getAttribute('aria-describedby')?.split(' ')).toContain(
        description.id,
      )
    })

    it('shows the error in place of the description', () => {
      const view = setup({
        description: 'Supporting line',
        error: 'Enter a value.',
      })
      expect(view.queryByText('Supporting line')).toBeNull()
      const error = view.getByText('Enter a value.')
      expect(hasClasses(error, CLASSES.errorText)).toBe(true)
      expect(view.input.getAttribute('aria-describedby')?.split(' ')).toContain(
        error.id,
      )
    })

    it('renders nothing while the field is valid and has no description', () => {
      const view = setup()
      expect(view.container.querySelectorAll('[slot]')).toHaveLength(0)
    })

    // The error goes through React Aria's FieldError so a Form can put a
    // server's message under a field without the field being told anything.
    it('shows validation errors the form supplies', () => {
      const view = render(
        <Form validationErrors={SERVER_ERRORS}>
          <TextField
            name="first"
            validationBehavior={FIELD_VALIDATION_BEHAVIOR}
          >
            <FieldBox label="Label">
              <FieldInput />
            </FieldBox>
            <FieldMessage />
          </TextField>
        </Form>,
      )
      const input = view.getByLabelText('Label')
      expect(input.getAttribute('aria-invalid')).toBe('true')
      expect(input.getAttribute('aria-describedby')?.split(' ')).toContain(
        view.getByText('Taken.').id,
      )
    })
  })
})
