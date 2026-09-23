import * as stylex from '@stylexjs/stylex'
import { act, render } from '@testing-library/react'
import { Form, TextField } from 'react-aria-components'
import { describe, expect, it } from 'vitest'

import { FieldBox, FieldInput, FieldLabel, FieldMessage } from '.'
import {
  colors,
  spacing,
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
  // Narrower than a long label on one line, which is where wrapping it and
  // cutting it short part ways.
  room: { inlineSize: '240px' },
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

// A theme with longer body lines than the defaults, which is what tells a
// derived box height apart from a stated one — under the default tokens the
// two agree by construction, so a fixed 56 looks right there whatever it is
// made of. The type is `Editorial`'s from src/theming/themes.ts, the scheme
// the showcase drew the overflow on.
//
// Its `lg` is wider than Editorial's 20 on purpose. The filled box derives
// from `sm` and both body lines, the outlined one from `lg` and the control's
// line alone, and at Editorial's own values those two expressions happen to
// come to the same 68 — so a box taking the wrong one of them would still
// measure right. At 26 they come to 68 and 80, which tells them apart.
const longLineType = stylex.createTheme(typography, {
  bodyLargeLineHeight: '28px',
  bodySmallLineHeight: '20px',
})
const longLineSpacing = stylex.createTheme(spacing, {
  lg: '26px',
  sm: '10px',
})

// The box the control sits in: the label's column is in it.
function boxOf(container: HTMLElement) {
  const box = container.querySelector('label')?.parentElement?.parentElement
  if (!(box instanceof HTMLElement)) {
    throw new Error('expected the label to sit in a column in the box')
  }
  return box
}

function controlIn(container: HTMLElement) {
  const input = container.querySelector('input')
  if (!(input instanceof HTMLElement)) {
    throw new Error('expected the box to hold a control')
  }
  return input
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

const LONG_LABEL =
  'A label long enough that it has nowhere left to go on one line'

// Where a long label ends up, read once its transition has settled. The
// column is what the label is positioned in, and so the room it has: the
// width between the box's padding and any icon at either end. An outlined
// label pads itself either side, which is why the text is measured inside
// that padding.
//
// An ellipsis is paint, which nothing here can read, so `cutShort` is every
// condition CSS sets for drawing one: text wider than its box, a box that
// clips, and `text-overflow` asking for it.
function fitOf(label: HTMLElement) {
  const column = label.parentElement
  if (column === null) {
    throw new Error('expected the label to sit in a column')
  }
  const style = settled(label)
  const own = label.getBoundingClientRect()
  const room = column.getBoundingClientRect()
  return {
    cutShort:
      style.textOverflow === 'ellipsis' &&
      style.overflowX !== 'visible' &&
      label.scrollWidth > label.clientWidth,
    inColumn: own.right - Number.parseFloat(style.paddingRight) <= room.right,
    oneLine: own.height === Number.parseFloat(style.lineHeight),
  }
}

const FITS = { cutShort: true, inColumn: true, oneLine: true }

// A box of either variant around a long label, in a room too narrow for it.
function renderLong(
  props: {
    defaultValue?: string
    trailing?: boolean
    variant?: 'filled' | 'outlined'
  } = {},
) {
  const view = render(
    <div {...stylex.props(probeStyles.room)}>
      <TextField
        defaultValue={props.defaultValue}
        validationBehavior={FIELD_VALIDATION_BEHAVIOR}
      >
        <FieldBox
          label={LONG_LABEL}
          trailing={props.trailing === true ? TRAILING_ICON : undefined}
          variant={props.variant}
        >
          <FieldInput />
        </FieldBox>
      </TextField>
    </div>,
  )
  return {
    ...view,
    label: view.getByText(LONG_LABEL, { selector: 'label' }),
  }
}

// The page's trailing icon: 24dp, the size the slot is laid out for.
const TRAILING_ICON = <svg aria-hidden="true" height="24" width="24" />

// A field of one variant, optionally under the theme whose body lines are
// longer, measured for the room its box leaves around the control.
function renderField(variant: 'filled' | 'outlined', themed: boolean) {
  const field = (
    <TextField validationBehavior={FIELD_VALIDATION_BEHAVIOR}>
      <FieldBox label="Label" variant={variant}>
        <FieldInput />
      </FieldBox>
    </TextField>
  )
  const view = render(
    themed ? (
      <div {...stylex.props(longLineType, longLineSpacing)}>{field}</div>
    ) : (
      <div>{field}</div>
    ),
  )
  const box = boxOf(view.container).getBoundingClientRect()
  const control = controlIn(view.container).getBoundingClientRect()
  return {
    box: box.height,
    roomAbove: control.top - box.top,
    roomBelow: box.bottom - control.bottom,
  }
}

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

  // A label is one line of the box, as the value is: one with no room for
  // it is cut short with an ellipsis where the column ends, as Material's own
  // fields cut theirs, rather than wrapped onto lines that run down over the
  // value and out through the bottom of the box.
  describe('a long label', () => {
    it('is cut short in a filled box, at rest and floated', () => {
      const resting = renderLong()
      expect(fitOf(resting.label)).toEqual(FITS)
      resting.unmount()

      const floated = renderLong({ defaultValue: 'Value' })
      expect(fitOf(floated.label)).toEqual(FITS)
    })

    it('is cut short in an outlined box, at rest and floated', () => {
      const resting = renderLong({ variant: 'outlined' })
      expect(fitOf(resting.label)).toEqual(FITS)
      resting.unmount()

      const floated = renderLong({ defaultValue: 'Value', variant: 'outlined' })
      expect(fitOf(floated.label)).toEqual(FITS)
    })

    it('stops before a trailing icon', () => {
      const view = renderLong({ trailing: true })
      expect(fitOf(view.label)).toEqual(FITS)
    })

    // The notch is cut by a copy of the label in the outline's legend, which
    // has to stop where the label does, or the outline stays open past the
    // ellipsis. Beside a trailing icon that is the icon's slot and its
    // spacing, which the outline takes out of the notch's room as it does at
    // a leading icon. Within the pixel the outline's own border sets it in
    // by, at either end.
    it('opens the outlined notch as wide as the cut-short label', () => {
      const view = renderLong({
        defaultValue: 'Value',
        trailing: true,
        variant: 'outlined',
      })
      const legend = view.container.querySelector('legend')
      if (legend === null) {
        throw new Error('expected the outline to hold its notch')
      }
      const label = view.label.getBoundingClientRect()
      const notch = legend.getBoundingClientRect()

      expect(Math.abs(notch.left - label.left)).toBeLessThanOrEqual(1)
      expect(Math.abs(notch.right - label.right)).toBeLessThanOrEqual(1)
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

  // The box is as tall as what it holds rather than the 56dp the page draws
  // it at. The page's number is the sum of the default tokens, so a stated
  // one is right only under those: these render under a theme whose body
  // lines are longer and check the control still fits.
  describe('box height', () => {
    // A filled box's control line ran 2px past the underline under this
    // theme, with nothing left beneath it, while the box stayed at 56.
    it('keeps the control inside a filled box under a longer body line', () => {
      const { box, roomBelow } = renderField('filled', true)

      expect(box).toBeGreaterThan(56)
      expect(roomBelow).toBeGreaterThan(0)
    })

    // The outlined box pads equally above and below, so the control is
    // centred — at a fixed 56 it sat 20 from the top and 8 from the bottom.
    it('centres the control in an outlined box under a longer body line', () => {
      const { roomAbove, roomBelow } = renderField('outlined', true)

      expect(roomAbove).toBe(roomBelow)
    })

    // The derivations come to the page's number under the default tokens,
    // which is what leaves the default stories' snapshots where they are.
    it('is the page 56dp under the default tokens', () => {
      expect(renderField('filled', false).box).toBe(56)
      expect(renderField('outlined', false).box).toBe(56)
    })
  })
})
