import type { TextFieldProps as RACTextFieldProps } from 'react-aria-components'

import * as stylex from '@stylexjs/stylex'
import { TextField as RACTextField } from 'react-aria-components'

import { FieldBox, FieldInput, FieldMessage } from '../../field'
import {
  fieldStyles,
  invalidFrom,
  useFieldValidationBehavior,
} from '../../field/root'
import { mergeStatefulStyles } from '../../styles/merge'

type TextFieldProps = {
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
   * What the field is for. Required rather than optional: a text field with
   * no label is a box a screen reader cannot name.
   */
  label: string
  /**
   * Renders the value in the mono face with tabular figures, for amounts and
   * other numbers meant to be compared down a column.
   * @default false
   */
  numeric?: boolean
} & Omit<RACTextFieldProps, 'children' | 'isInvalid' | 'validationBehavior'>

/**
 * A labelled single-line input. Its value is React Aria's: pass `value` with
 * `onChange` to control it, or `defaultValue` to let it keep its own — and
 * `onChange` is handed the string, not the event. The call site's
 * `className` and `style` land on the field as a whole, which is the element
 * a layout positions.
 *
 * The box, label, input and message are the field chrome in `src/field`,
 * shared with every other field; this component is what React Aria's
 * `TextField` puts around them.
 */
function TextField({
  description,
  error,
  floatingLabel = true,
  isDisabled = false,
  label,
  numeric = false,
  ...props
}: TextFieldProps) {
  const validationBehavior = useFieldValidationBehavior()

  return (
    <RACTextField
      isDisabled={isDisabled}
      isInvalid={invalidFrom(error)}
      validationBehavior={validationBehavior}
      {...props}
      {...mergeStatefulStyles(stylex.props(fieldStyles.root), props)}
    >
      <FieldBox floatingLabel={floatingLabel} label={label}>
        <FieldInput numeric={numeric} />
      </FieldBox>
      <FieldMessage description={description} error={error} />
    </RACTextField>
  )
}

export type { TextFieldProps }

export default TextField
