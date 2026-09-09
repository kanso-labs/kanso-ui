import type { CSSProperties } from 'react'
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

type FormProps = Omit<RACFormProps, 'className' | 'style'> & {
  className?: string
  style?: CSSProperties
  /**
   * How the fields inside validate. `aria` marks a field invalid and shows
   * its message as soon as the field says so, and lets the form submit
   * regardless. `native` hands validation to the browser: a required or
   * malformed field blocks submission, and its message is the browser's
   * own, shown once submission is tried.
   * @default 'aria'
   */
  validationBehavior?: 'aria' | 'native'
}

/**
 * A form: the fields inside it and what they are told about validation. Pass
 * `validationErrors`, an object keyed by field `name`, to show what a server
 * sent back under each field, and `validationBehavior="native"` to let the
 * browser's own constraint validation block submission. `onSubmit` is handed
 * the submit event; call `preventDefault` on it to handle the submission
 * yourself, and read the values from `new FormData(event.currentTarget)`.
 *
 * The call site's `className` and `style` land on the form element, which is
 * the element a layout positions.
 */
function Form({
  validationBehavior = FIELD_VALIDATION_BEHAVIOR,
  ...props
}: FormProps) {
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
