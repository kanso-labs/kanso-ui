import type { ReactNode } from 'react'
import type { ColorFieldProps as RACColorFieldProps } from 'react-aria-components'

import * as stylex from '@stylexjs/stylex'
import { ColorField as RACColorField } from 'react-aria-components'

import { FieldBox, FieldInput, FieldMessage } from '../../field'
import {
  fieldStyles,
  invalidFrom,
  useFieldValidationBehavior,
} from '../../field/root'
import { mergeStatefulStyles } from '../../styles/merge'

// A colour typed rather than picked. React Aria renders a plain text input
// holding the colour's own notation, so this is the text fields page's box
// with nothing added — the same chrome `TextField` draws through, which is
// what makes a colour field on a form the same shape as the field beside
// it.
//
// Two things are worth knowing about what it holds.
//
// **`channel` turns it from a colour into a number.** Without one the field
// holds the whole colour — `#6750A4` — and parses what is typed. With one
// it holds that channel alone, as a number a reader can step, which is what
// a picker's three boxes beside a plane are.
//
// **A swatch is the natural leading icon.** The field's value is a colour,
// and the chrome already has a slot for something at the box's leading end;
// passing a `ColorSwatch` there is what makes the field show the colour it
// holds. It is left to the call site rather than drawn here, since a field
// inside a picker sits beside a swatch already.

type ColorFieldProps = Omit<
  RACColorFieldProps,
  'children' | 'className' | 'style'
> & {
  /** A function may compute the class from the field's render state. */
  className?: RACColorFieldProps['className']
  /** Supporting text under the field. */
  description?: string
  /** The message shown instead of the description, which also marks the field invalid. */
  error?: string
  /**
   * Whether the label floats into the box's top once the field holds a
   * value, rather than sitting above it.
   * @default true
   */
  floatingLabel?: boolean
  /** What the field is for. Always rendered; never a placeholder. */
  label: string
  /** An icon at the box's leading end. A `ColorSwatch` shows the value. */
  leadingIcon?: ReactNode
  /** A function may compute the style from the field's render state. */
  style?: RACColorFieldProps['style']
  /** An icon at the box's trailing end. */
  trailingIcon?: ReactNode
  /**
   * Which of the text fields page's two boxes to draw.
   * @default 'filled'
   */
  variant?: 'filled' | 'outlined'
}

/**
 * A colour typed into a field. The value is React Aria's — pass `value` with
 * `onChange` to control it, or `defaultValue` — as a CSS colour string or a
 * `Color` from `parseColor`, which this package re-exports.
 *
 * ```tsx
 * <ColorField defaultValue="#6750A4" label="Label" />
 * ```
 *
 * Without `channel` the field holds the whole colour and parses what is
 * typed; with one it holds that channel alone as a number. `colorSpace`
 * decides which space a channel belongs to, the same as on `ColorSlider`.
 *
 * The box, label and message are the field chrome in `src/field`, shared
 * with every other field. The call site's `className` and `style` land on
 * the field as a whole, which is the element a layout positions.
 */
function ColorField({
  description,
  error,
  floatingLabel = true,
  isDisabled = false,
  label,
  leadingIcon,
  trailingIcon,
  variant = 'filled',
  ...props
}: ColorFieldProps) {
  const validationBehavior = useFieldValidationBehavior()

  return (
    <RACColorField
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
        variant={variant}
      >
        <FieldInput />
      </FieldBox>
      <FieldMessage description={description} error={error} />
    </RACColorField>
  )
}

export type { ColorFieldProps }

export default ColorField
