import type { TextFieldProps as RACTextFieldProps } from 'react-aria-components'

import * as stylex from '@stylexjs/stylex'
import { TextField as RACTextField } from 'react-aria-components'

import { FieldBox, FieldMessage, FieldTextArea } from '../../field'
import { FIELD_VALIDATION_BEHAVIOR, fieldStyles } from '../../field/root'
import { mergeStatefulStyles } from '../../styles/merge'

// The text fields page's multi-line configuration of the filled field: the
// same box, floating label, underline and message as TextField, holding a
// text area rather than an input. The page gives the box 56dp by default
// and 8dp of padding above and below, with the label vertically centred
// while the field is empty; a box holding more than one line keeps the
// padding and grows, which is the chrome's `multiline` box. The page draws
// no resize handle, and none is drawn here.
//
// Its own component rather than a prop of TextField, so `rows` and
// `autosize` stay off TextField's type and `numeric` stays off this one.

type TextAreaProps = {
  /**
   * Whether the field grows with the text it holds, from `rows` up. `false`
   * keeps it at `rows` and scrolls the text inside.
   * @default true
   */
  autosize?: boolean
  /**
   * A hint shown under the field. Replaced by `error` when there is one, so
   * the two never stack.
   */
  description?: string
  /**
   * The problem with the current value, in words. Its presence is what puts
   * the field in its error state — the message, the red underline, and
   * `aria-invalid` all follow from it.
   */
  error?: string
  /**
   * Whether the label sits in the empty box and floats to the top once the
   * field is focused or holds a value, as the text fields page draws it.
   * `false` keeps it small at the top in every state.
   * @default true
   */
  floatingLabel?: boolean
  /**
   * What the field is for. Required rather than optional: a text area with
   * no label is a box a screen reader cannot name.
   */
  label: string
  /**
   * How many lines of text the field shows: the least it shows while it
   * grows, or all it shows when it does not.
   * @default 3
   */
  rows?: number
} & Omit<RACTextFieldProps, 'children' | 'isInvalid' | 'validationBehavior'>

/**
 * A labelled multi-line input. Its value is React Aria's: pass `value` with
 * `onChange` to control it, or `defaultValue` to let it keep its own — and
 * `onChange` is handed the string, not the event. The call site's
 * `className` and `style` land on the field as a whole, which is the element
 * a layout positions.
 *
 * The box, label, control and message are the field chrome in `src/field`,
 * shared with every other field; this component is what React Aria's
 * `TextField` puts around them.
 */
function TextArea({
  autosize = true,
  description,
  error,
  floatingLabel = true,
  isDisabled = false,
  label,
  rows = 3,
  ...props
}: TextAreaProps) {
  return (
    <RACTextField
      isDisabled={isDisabled}
      isInvalid={error !== undefined}
      validationBehavior={FIELD_VALIDATION_BEHAVIOR}
      {...props}
      {...mergeStatefulStyles(stylex.props(fieldStyles.root), props)}
    >
      <FieldBox floatingLabel={floatingLabel} label={label} multiline>
        <FieldTextArea autosize={autosize} rows={rows} />
      </FieldBox>
      <FieldMessage description={description} error={error} />
    </RACTextField>
  )
}

export type { TextAreaProps }

export default TextArea
