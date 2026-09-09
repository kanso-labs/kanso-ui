import type { ReactNode } from 'react'
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
   * Whether to count the characters the field holds at the end of the
   * supporting line, against `maxLength` where there is one, as the text
   * fields page's character counter does.
   * @default false
   */
  characterCount?: boolean
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
   * An icon at the start of the box, before the label and the value: the
   * page's 24dp leading icon, in the muted role. An icon drawn in `em`
   * takes that size from the slot.
   */
  leadingIcon?: ReactNode
  /**
   * Renders the value in the mono face with tabular figures, for amounts and
   * other numbers meant to be compared down a column.
   * @default false
   */
  numeric?: boolean
  /**
   * Text before the value on its line, in the muted role, shown while the
   * field is focused or holds a value.
   */
  prefix?: ReactNode
  /**
   * Text after the value on its line, in the muted role, shown while the
   * field is focused or holds a value.
   */
  suffix?: ReactNode
  /**
   * An icon at the end of the box, after the value: the page's 24dp trailing
   * icon, in the muted role and the error role while the field has an error.
   */
  trailingIcon?: ReactNode
} & Omit<
  RACTextFieldProps,
  'children' | 'isInvalid' | 'prefix' | 'validationBehavior'
>

/**
 * A labelled single-line input. Its value is React Aria's: pass `value` with
 * `onChange` to control it, or `defaultValue` to let it keep its own — and
 * `onChange` is handed the string, not the event. The call site's
 * `className` and `style` land on the field as a whole, which is the element
 * a layout positions.
 *
 * The text fields page's configurations are props: `leadingIcon` and
 * `trailingIcon` at the box's ends, `prefix` and `suffix` on the value's
 * line, and `characterCount` opposite the supporting text, counting against
 * `maxLength`.
 *
 * The box, label, input and message are the field chrome in `src/field`,
 * shared with every other field; this component is what React Aria's
 * `TextField` puts around them.
 */
function TextField({
  characterCount = false,
  description,
  error,
  floatingLabel = true,
  isDisabled = false,
  label,
  leadingIcon,
  numeric = false,
  prefix,
  suffix,
  trailingIcon,
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
      <FieldBox
        floatingLabel={floatingLabel}
        label={label}
        leading={leadingIcon}
        trailing={trailingIcon}
      >
        <FieldInput numeric={numeric} prefix={prefix} suffix={suffix} />
      </FieldBox>
      <FieldMessage
        characterCount={characterCount}
        description={description}
        error={error}
        maxLength={props.maxLength}
      />
    </RACTextField>
  )
}

export type { TextFieldProps }

export default TextField
