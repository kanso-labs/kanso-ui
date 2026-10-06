'use client'

import type { ReactNode, Ref, RefAttributes } from 'react'
import type { TextFieldProps as RACTextFieldProps } from 'react-aria-components'

import * as stylex from '@stylexjs/stylex'
import { TextField as RACTextField } from 'react-aria-components'

import type { FieldVariant } from '../../field'

import { FieldBox, FieldMessage, FieldTextArea } from '../../field'
import {
  fieldStyles,
  invalidFrom,
  useFieldValidationBehavior,
} from '../../field/root'
import { mergeStatefulStyles } from '../../styles/merge'

// The text fields page's multi-line configuration of the filled field: the
// same box, floating label, icons, underline and message as TextField,
// holding a text area rather than an input. The page gives the box 56dp by
// default and 8dp of padding above and below, with the label vertically
// centred while the field is empty; a box holding more than one line keeps
// the padding and grows, which is the chrome's `multiline` box, and its
// icons stay centred in its height as it does. The page draws no resize
// handle, and none is drawn here.
//
// Its own component rather than a prop of TextField, so `rows` and
// `autosize` stay off TextField's type and `numeric` stays off this one.

type TextAreaProps = Omit<
  RACTextFieldProps,
  'children' | 'isInvalid' | 'validationBehavior'
> & {
  /**
   * Whether the field grows with the text it holds, from `rows` up. `false`
   * keeps it at `rows` and scrolls the text inside.
   * @default true
   */
  autosize?: boolean
  /**
   * Whether to count the characters the field holds at the end of the
   * supporting line, against `maxLength` where there is one, as the text
   * fields page's character counter does. The count is written in the
   * `I18nProvider`'s digits and grouping.
   * @default false
   */
  characterCount?: boolean
  /**
   * How the limit is said to a screen reader, where there is a `maxLength`.
   * Read with the field on focus rather than as the value changes, so it
   * names the limit and not what is left of it. The visible count is hidden
   * from the tree, which is what this replaces. Left out, it is the
   * sentence for it in the I18nProvider's locale — "Up to 20 characters" in
   * English, singular for a limit of one.
   */
  characterLimitLabel?: string
  /**
   * A hint shown under the field. Replaced by `error` when there is one, so
   * the two never stack.
   */
  description?: string
  /**
   * The problem with the current value, in words. Its presence is what puts
   * the field in its error state — the message, the red underline, and
   * `aria-invalid` all follow from it.
   *
   * Outside a `Form` the message line arrives with the message, so the
   * field grows when this does and moves what is under it. A `Form` holds
   * that space from the start; so does a permanent `description`.
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
   * A ref to the field's own `<textarea>`, which is the element a call site
   * moves focus to — after a server's error, say. `ref` is the field as a
   * whole.
   */
  inputRef?: Ref<HTMLTextAreaElement>
  /**
   * What the field is for. Required rather than optional: a text area with
   * no label is a box a screen reader cannot name.
   */
  label: string
  /**
   * An icon at the start of the box, before the label and the text: the
   * page's 24dp leading icon, in the muted role. An icon drawn in `em` takes
   * that size from the slot.
   */
  leadingIcon?: ReactNode
  /**
   * How many lines of text the field shows: the least it shows while it
   * grows, or all it shows when it does not.
   * @default 3
   */
  rows?: number
  /**
   * An icon at the end of the box, after the text: the page's 24dp trailing
   * icon, in the muted role and the error role while the field has an error.
   * An icon drawn in `em` takes that size from the slot.
   */
  trailingIcon?: ReactNode
  /**
   * The filled box, or the outlined one: no fill, an outline that thickens
   * and takes the primary role while focused, and the label cutting it once
   * it floats — the text fields page's two fields.
   * @default 'filled'
   */
  variant?: FieldVariant
}

/**
 * A labelled multi-line input. Its value is React Aria's: pass `value` with
 * `onChange` to control it, or `defaultValue` to let it keep its own — and
 * `onChange` is handed the string, not the event. The call site's
 * `className` and `style` land on the field as a whole, which is the element
 * a layout positions.
 *
 * The text fields page's configurations are props: `leadingIcon` and
 * `trailingIcon` at the box's ends, and `characterCount` opposite the
 * supporting text, counting against `maxLength`.
 *
 * The box, label, control and message are the field chrome in `src/field`,
 * shared with every other field; this component is what React Aria's
 * `TextField` puts around them.
 */
function TextArea({
  autosize = true,
  characterCount = false,
  characterLimitLabel,
  description,
  error,
  floatingLabel = true,
  inputRef,
  isDisabled = false,
  label,
  leadingIcon,
  rows = 3,
  trailingIcon,
  variant = 'filled',
  ...props
}: RefAttributes<HTMLDivElement> & TextAreaProps) {
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
        multiline
        trailing={trailingIcon}
        variant={variant}
      >
        <FieldTextArea autosize={autosize} ref={inputRef} rows={rows} />
      </FieldBox>
      <FieldMessage
        characterCount={characterCount}
        characterLimitLabel={characterLimitLabel}
        description={description}
        error={error}
        maxLength={props.maxLength}
      />
    </RACTextField>
  )
}

export type { TextAreaProps }

export default TextArea
