import type { ReactNode } from 'react'
import type {
  GroupProps,
  GroupRenderProps,
  InputProps,
  InputRenderProps,
  LabelProps,
} from 'react-aria-components'

import * as stylex from '@stylexjs/stylex'
import { FieldError, Group, Input, Label, Text } from 'react-aria-components'

import { mergeStatefulStyles, mergeStyles } from '../styles/merge'
import {
  colors,
  motion,
  radii,
  spacing,
  stateLayerOpacity,
  typography,
} from '../tokens/design.tokens.stylex'

// The chrome every field shares: the filled box with its label at the top, the
// control inside it, and the line of supporting text under it. TextField drew
// all of it on its own until the coverage plan brought a dozen more fields,
// each of which would otherwise have written the same box a second time.
//
// Not a component of the library's own and not exported. Each field is still
// React Aria's field component — TextField, NumberField, DateField — and these
// are the parts it renders inside, which is what keeps the label association,
// the description and error wiring, and validation on React Aria's side.
//
// The focus indicator is an inset box-shadow on the bottom edge rather than a
// border that thickens. A real border going 1px -> 2px on focus grows the
// box, which pushes every sibling below it down by a pixel — so a form
// twitches each time focus moves between its fields. A shadow is drawn inside
// the box and changes nothing about its size.
//
// The label sits at a fixed size at the top rather than floating up out of
// the control on focus: the design draws it small and in place at all times,
// so there is no transition between two positions to get right.
//
// The label's colour follows the control's focus, which no selector on the
// label alone can express — the label is the control's sibling, not its
// ancestor. The box is React Aria's Group, which reports focus within it as
// render state, and the label takes `labelFocused` from that.
const styles = stylex.create({
  box: {
    backgroundColor: colors.surfaceContainerHighest,
    blockSize: '56px',
    // Square at the bottom, where the focus indicator is drawn — a rounded
    // corner there would cut the ends off the underline.
    borderEndEndRadius: 0,
    borderEndStartRadius: 0,
    borderStartEndRadius: radii.xs,
    borderStartStartRadius: radii.xs,
    boxShadow: {
      ':focus-within': `inset 0 -2px 0 0 ${colors.primary}`,
      default: `inset 0 -1px 0 0 ${colors.outline}`,
    },
    boxSizing: 'border-box',
    paddingBlockEnd: 0,
    paddingBlockStart: spacing.sm,
    paddingInline: spacing.lg,
    position: 'relative',
    transitionDuration: motion.durationShort2,
    transitionProperty: 'box-shadow',
    transitionTimingFunction: motion.easingStandard,
  },
  boxDisabled: {
    backgroundColor: `color-mix(in srgb, ${colors.onSurface} calc(${stateLayerOpacity.disabledContainer} * 100%), ${colors.surface})`,
    boxShadow: `inset 0 -1px 0 0 color-mix(in srgb, ${colors.onSurface} calc(${stateLayerOpacity.disabledContainer} * 100%), transparent)`,
  },
  boxError: {
    boxShadow: {
      ':focus-within': `inset 0 -2px 0 0 ${colors.error}`,
      default: `inset 0 -1px 0 0 ${colors.error}`,
    },
  },
  // Where the box puts its label. Kept apart from `label`, which is the type
  // and colour alone, so a field that lays its label out differently — a
  // checkbox, a slider — can take the one without the other.
  boxLabel: {
    insetBlockStart: spacing.sm,
    insetInlineStart: spacing.lg,
    position: 'absolute',
  },
  input: {
    backgroundColor: 'transparent',
    borderWidth: 0,
    boxSizing: 'border-box',
    color: colors.onSurface,
    fontFamily: typography.bodyLargeFont,
    fontSize: typography.bodyLargeSize,
    fontWeight: typography.bodyLargeWeight,
    inlineSize: '100%',
    letterSpacing: typography.bodyLargeTracking,
    lineHeight: typography.bodyLargeLineHeight,
    // Clears the label above it. A literal because it is the offset between
    // two fixed type sizes inside a fixed-height box, not a step of the
    // spacing scale.
    marginBlockStart: '14px',
    // The box already draws the focus indicator, so a second ring around the
    // control inside it would be two focus treatments for one focus.
    outlineStyle: 'none',
    padding: 0,
  },
  inputDisabled: {
    color: `color-mix(in srgb, ${colors.onSurface} calc(${stateLayerOpacity.disabledContent} * 100%), ${colors.surface})`,
  },
  label: {
    color: colors.onSurfaceVariant,
    fontFamily: typography.labelMediumFont,
    fontSize: typography.labelMediumSize,
    fontWeight: typography.labelMediumWeight,
    letterSpacing: typography.labelMediumTracking,
    lineHeight: typography.labelMediumLineHeight,
    transitionDuration: motion.durationShort2,
    transitionProperty: 'color',
    transitionTimingFunction: motion.easingStandard,
  },
  labelDisabled: {
    color: `color-mix(in srgb, ${colors.onSurface} calc(${stateLayerOpacity.disabledContent} * 100%), ${colors.surface})`,
  },
  labelError: {
    color: colors.error,
  },
  labelFocused: {
    color: colors.primary,
  },
  message: {
    color: colors.onSurfaceVariant,
    fontFamily: typography.bodySmallFont,
    fontSize: typography.bodySmallSize,
    fontWeight: typography.bodySmallWeight,
    letterSpacing: typography.bodySmallTracking,
    lineHeight: typography.bodySmallLineHeight,
    marginBlock: 0,
    marginBlockStart: spacing.xs,
    // Indented to the box's own inline padding, so the message starts where
    // the value above it does rather than at the box's edge.
    marginInline: spacing.lg,
  },
  messageError: {
    color: colors.error,
  },
  numeric: {
    fontFamily: typography.fontFamilyMono,
    // Amounts are read in columns and compared against each other, so the
    // digits have to be one width.
    fontVariantNumeric: 'tabular-nums',
  },
})

type FieldBoxProps = Omit<GroupProps, 'children'> & {
  children?: ReactNode
  /** What the field is for, drawn small at the top of the box. */
  label: string
}

type FieldInputProps = InputProps & {
  /**
   * Renders the value in the mono face with tabular figures, for amounts and
   * other numbers meant to be compared down a column.
   * @default false
   */
  numeric?: boolean
}

type FieldLabelProps = LabelProps & {
  /**
   * The states the colour follows. Disabled wins over error, and error over
   * focus, so a focused invalid field keeps its error colour.
   */
  state?: Partial<FieldLabelState>
}

type FieldLabelState = Pick<
  GroupRenderProps,
  'isDisabled' | 'isFocusWithin' | 'isInvalid'
>

interface FieldMessageProps {
  /**
   * A hint shown under the field. Replaced by `error` when there is one, so
   * the two never stack.
   */
  description?: string | undefined
  /** The problem with the current value, in words. */
  error?: string | undefined
}

// Written as a call rather than a function literal at the prop, which is what
// react-perf's no-new-function-as-prop is after; the React Compiler memoises
// the result on its two inputs.
function boxContent(label: string, children: ReactNode) {
  return (state: GroupRenderProps) => (
    <>
      <FieldLabel state={state} {...stylex.props(styles.boxLabel)}>
        {label}
      </FieldLabel>
      {children}
    </>
  )
}

function boxStyles(state: GroupRenderProps) {
  return stylex.props(
    styles.box,
    state.isInvalid && styles.boxError,
    state.isDisabled && styles.boxDisabled,
  )
}

/**
 * The filled box a control sits in, with its label. React Aria's `Group`, so
 * the field around it hands down `isDisabled` and `isInvalid` through context
 * and the box reports focus within it as render state, which is what the
 * label's colour follows. A field that provides no group context — one built
 * on a button rather than an input — passes the two states itself.
 */
function FieldBox({ children, label, ...props }: FieldBoxProps) {
  return (
    <Group {...props} {...mergeStatefulStyles(boxStyles, props)}>
      {boxContent(label, children)}
    </Group>
  )
}

/**
 * The text control inside a {@link FieldBox}. React Aria's `Input`, which
 * takes its label association, value and validation from the field around it
 * and reports its disabled state as render state.
 */
function FieldInput({ numeric = false, ...props }: FieldInputProps) {
  return (
    <Input
      {...props}
      {...mergeStatefulStyles(
        (state: InputRenderProps) =>
          stylex.props(
            styles.input,
            numeric && styles.numeric,
            state.isDisabled && styles.inputDisabled,
          ),
        props,
      )}
    />
  )
}

/**
 * A field's label: the type and colour alone, positioned by whatever renders
 * it. React Aria's `Label`, which the field around it associates with its
 * control through context.
 */
// Hoisted rather than written as the parameter's default, which would be a
// new object on every render.
const NO_STATE: Partial<FieldLabelState> = {}

function FieldLabel({ state = NO_STATE, ...props }: FieldLabelProps) {
  const { isDisabled = false, isFocusWithin = false, isInvalid = false } = state

  return (
    <Label
      {...props}
      {...mergeStyles(
        stylex.props(
          styles.label,
          isDisabled && styles.labelDisabled,
          isInvalid && styles.labelError,
          !isDisabled && !isInvalid && isFocusWithin && styles.labelFocused,
        ),
        props,
      )}
    />
  )
}

/**
 * The line under a field: the error while there is one, the description
 * otherwise. The error goes through React Aria's `FieldError`, which renders
 * only while the field is invalid and falls back to whatever validation
 * errors the field carries when no message is given — which is how a `Form`
 * with server-side errors will reach it without any field changing.
 */
function FieldMessage({ description, error }: FieldMessageProps) {
  return (
    <>
      <FieldError {...stylex.props(styles.message, styles.messageError)}>
        {error}
      </FieldError>
      {error === undefined && description !== undefined ? (
        <Text slot="description" {...stylex.props(styles.message)}>
          {description}
        </Text>
      ) : null}
    </>
  )
}

export type {
  FieldBoxProps,
  FieldInputProps,
  FieldLabelProps,
  FieldLabelState,
  FieldMessageProps,
}

export { FieldBox, FieldInput, FieldLabel, FieldMessage }
