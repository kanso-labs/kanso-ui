'use client'

import type { CSSProperties, RefAttributes } from 'react'
import type { FormProps as RACFormProps } from 'react-aria-components'

import * as stylex from '@stylexjs/stylex'
import { Form as RACForm } from 'react-aria-components'

import { FIELD_VALIDATION_BEHAVIOR } from '../../field/root'
import { mergeStyles } from '../../styles/merge'

// No page of its own: a form is the fields inside it, and the text fields
// page is what each of them draws — the error a form reports lands in the
// field's supporting text, in the error role, under the box. The form
// draws nothing, and lays nothing out either; a Stack inside it is what
// spaces the fields.
//
// React Aria's `Form` is the element. It hands two things to the fields
// inside it through context: `validationErrors`, keyed by each field's
// `name`, which is how a server's answer reaches the fields without any of
// them changing, and `validationBehavior`, which every field reads in place
// of its own default. React Aria's own default for that is `native`; the
// library's is `aria`, set here so a form and a field agree, with `native`
// the opt-in.
const styles = stylex.create({
  base: {
    boxSizing: 'border-box',
  },
})

type FormProps = {
  className?: string
  style?: CSSProperties
  /**
   * How the fields inside validate. `aria` marks a field invalid and shows
   * its message as soon as the field says so, and lets the form submit
   * regardless. `native` hands validation to the browser: a required or
   * malformed field blocks submission, and its message is the browser's
   * own, shown once submission is tried.
   *
   * Under `aria`, `isRequired` marks a field and checks nothing. The label
   * takes its asterisk and the control `aria-required`, but an empty
   * required field neither stops the form submitting nor shows a message,
   * since the control carries no `required` for the browser to enforce. A
   * form that must not go out with one empty checks it in `onSubmit` and
   * hands the field its `error`, as the Client validation story does.
   *
   * Under `aria`, moving focus after a server answers is the call site's.
   * The errors are associated — `aria-invalid` on each control, the message
   * in its `aria-describedby` — and each is read out politely as it appears
   * under its field, but nothing moves, because no part of the form knows a
   * round trip happened. `validationErrors` is a prop rather than an event,
   * so a form cannot tell a submission coming back from a first render that
   * was given errors to begin with. The Async submit story shows the move.
   * @default 'aria'
   */
  validationBehavior?: 'aria' | 'native'
} & Omit<RACFormProps, 'className' | 'style' | 'validationBehavior'>

/**
 * A form: the fields inside it and what they are told about validation. Pass
 * `validationErrors`, an object keyed by field `name`, to show what a server
 * sent back under each field, and `validationBehavior="native"` to let the
 * browser's own constraint validation block submission. `onSubmit` is handed
 * the submit event; call `preventDefault` on it to handle the submission
 * yourself, and read the values from `new FormData(event.currentTarget)`.
 *
 * Handing `validationErrors` back from a submission is where a reader has to
 * be told something arrived: see `validationBehavior` for what the form does
 * and what it leaves to the call site.
 *
 * A form also reserves each field's message line. A field on its own draws
 * that line only once it has something to say, so an error arriving after a
 * submit or an async check makes the field taller and moves everything below
 * it down the page. Inside a form the line is there from the start, empty
 * and one line tall, so a message that fits on it moves nothing when it
 * arrives — which is the whole reason a form is where a message arrives
 * after the fact. A longer message wraps, and each line past the first
 * pushes everything below it down, so keep a message that arrives after the
 * fact to one line.
 *
 * The call site's `className` and `style` land on the form element, which is
 * the element a layout positions.
 */
function Form({
  validationBehavior = FIELD_VALIDATION_BEHAVIOR,
  ...props
}: FormProps & RefAttributes<HTMLFormElement>) {
  return (
    <RACForm
      validationBehavior={validationBehavior}
      {...props}
      {...mergeStyles(stylex.props(styles.base), props)}
    />
  )
}

export type { FormProps }

export default Form
