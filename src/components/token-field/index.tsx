import type { ReactNode } from 'react'
import type {
  TokenFieldProps as RACTokenFieldProps,
  TokenInputProps as RACTokenInputProps,
} from 'react-aria-components'

import * as stylex from '@stylexjs/stylex'
import {
  Token as RACToken,
  TokenField as RACTokenField,
  TokenInput as RACTokenInput,
  TokenFieldValue,
} from 'react-aria-components'

import type { FieldVariant } from '../../field'

import { chipStyles } from '../../chip/styles'
import { FieldBox, FieldMessage } from '../../field'
import { fieldStyles, invalidFrom } from '../../field/root'
import { mergeStatefulStyles } from '../../styles/merge'
import { colors, spacing, typography } from '../../tokens/design.tokens.stylex'

// The chips page's input chips inside a text field: a field whose value is
// text with pills in it — a tag input, a mention field, a structured search
// box. The box, label, supporting line and error are the field chrome in
// `src/field`, shared with every other field; the pill is the chip module's
// in `src/chip`, shared with Chip and ChipGroup. What is here is React Aria's
// `TokenField` around them.
//
// The value is React Aria's `TokenFieldValue`, a list of text and token
// segments rather than a string, and this component does not wrap it. What
// counts as a token is the whole question a token field exists to answer — a
// hash tag, an @ mention, a chosen contact — and a wrapper would be a second
// place to decide it. The class is re-exported from the package so a call
// site can subclass it and override `tokenize`.
//
// Three things are worth knowing.
//
// **The editable area is not an input.** React Aria draws a contenteditable
// element, since a token cannot live inside an `<input>`. So the box is drawn
// `multiline` and grows with what it holds, and the chrome is told whether it
// is populated rather than reading an input's value — a token field is the
// third control the chrome cannot ask, after a select and a picker.
//
// **The box's whole height is the editable area.** A press anywhere in the
// box has to put the caret in the text, so the box is not covered by a press
// target the way Select's is; React Aria's own element fills the control's
// place and takes the press.
//
// **A token is drawn by the call site, or by this.** `renderToken` takes a
// segment and returns what the pill holds; without it the pill holds the
// segment's own text. Either way the pill is the page's, so a token here and
// a chip elsewhere cannot drift.

const styles = stylex.create({
  // The editable area: the input's type, wrapping rather than scrolling, and
  // tall enough for one line before anything is typed.
  //
  // Laid out as text rather than as a flex row. A flex container makes each
  // segment an item, which puts a gap either side of a space that is already
  // in the value and leaves the caret with nowhere to be between two of
  // them; the tokens are inline-flex already, so ordinary inline flow puts
  // them on the line and wraps them with the words around them.
  input: {
    boxSizing: 'border-box',
    color: colors.onSurface,
    display: 'block',
    fontFamily: typography.bodyLargeFont,
    fontSize: typography.bodyLargeSize,
    fontWeight: typography.bodyLargeWeight,
    inlineSize: '100%',
    letterSpacing: typography.bodyLargeTracking,
    // A token is 32dp tall inside a line of 24, so the line has to make room
    // for it or the pills overlap once the value wraps.
    lineHeight: '32px',
    minBlockSize: '32px',
    // The box around it draws the focus indicator, so a second ring on the
    // control inside would be two treatments for one focus.
    outlineStyle: 'none',
    paddingBlockEnd: spacing.sm,
    // Wrapped text keeps its spaces, which is what makes a caret between two
    // of them land where it looks like it should.
    whiteSpace: 'pre-wrap',
  },
  // Clears the label at the top of the box, the same way an input's value
  // does under a floating label.
  inputUnderLabel: {
    marginBlockStart: typography.bodySmallLineHeight,
  },
  // A token's own pill sits on the value's line rather than filling it, and
  // the caret has to be able to land either side of it.
  token: {
    userSelect: 'none',
    verticalAlign: 'middle',
  },
})

type TokenFieldProps<T extends TokenFieldValue = TokenFieldValue> = {
  /** A function may compute the class from the field's render state. */
  className?: RACTokenFieldProps<T>['className']
  /**
   * A hint shown under the field. Replaced by `error` when there is one, so
   * the two never stack.
   */
  description?: string
  /**
   * The problem with the current value, in words. Its presence is what puts
   * the field in its error state — the message and the red underline both
   * follow from it.
   */
  error?: string
  /**
   * Whether the label sits in the empty box and floats to the top once the
   * field is focused or holds something. `false` keeps it small at the top in
   * every state.
   * @default true
   */
  floatingLabel?: boolean
  /**
   * What the field is for. Required rather than optional: a field with no
   * label is a box a screen reader cannot name.
   */
  label: string
  /**
   * An icon at the start of the box, before the label and the value: the
   * page's 24dp leading icon, in the muted role.
   */
  leadingIcon?: ReactNode
  /**
   * What each token holds. Given a segment, return what to draw inside its
   * pill; without it the pill holds the segment's own text.
   */
  renderToken?: (segment: TokenSegment) => ReactNode
  /** A function may compute the style from the field's render state. */
  style?: RACTokenFieldProps<T>['style']
  /**
   * An icon at the end of the box, after the value: the page's 24dp trailing
   * icon, in the muted role and the error role once the field has an error.
   */
  trailingIcon?: ReactNode
  /**
   * The filled box, or the outlined one, as the text fields page draws them.
   * @default 'filled'
   */
  variant?: FieldVariant
} & Omit<RACTokenFieldProps<T>, 'children' | 'className' | 'style'>

// One token, as React Aria hands it to the editable area's render function.
// Taken from that prop rather than imported, since the type lives in
// `react-stately`, which this package does not depend on directly.
type TokenSegment = Parameters<RACTokenInputProps['children']>[0]

// Whether the field holds anything, for the floating label. A token field's
// editable area is a contenteditable element rather than an input, so the
// chrome cannot read a value off it and is told instead.
function isPopulated(value: TokenFieldValue | undefined) {
  if (value === undefined) {
    return undefined
  }
  return value.segments.some((segment) => segment.text.length > 0)
}

// What each token draws. Built by a call rather than written inline at the
// prop, which is what react-perf's no-new-function-as-prop is after; the
// React Compiler memoises the result on its input.
function tokenContent(renderToken: TokenFieldProps['renderToken']) {
  return (segment: TokenSegment) => (
    <RACToken
      {...stylex.props(chipStyles.base, chipStyles.unselected, styles.token)}
    >
      {renderToken === undefined ? segment.text : renderToken(segment)}
    </RACToken>
  )
}

/**
 * A labelled field whose value is text with inline tokens — a tag input, a
 * mention field, a structured search box. Its value is React Aria's
 * `TokenFieldValue`: pass `value` with `onChange` to control it, or
 * `defaultValue` to let it keep its own.
 *
 * ```tsx
 * const [value, setValue] = useState(new TokenFieldValue([]))
 *
 * <TokenField label="Label" onChange={setValue} value={value} />
 * ```
 *
 * What counts as a token is the call site's: subclass `TokenFieldValue` and
 * override `tokenize`, which the package re-exports for that. `renderToken`
 * decides what each pill holds; without it, the segment's own text.
 *
 * The box, label, supporting line and error are the field chrome in
 * `src/field`, and the pill is the chip module's, shared with Chip and
 * ChipGroup.
 *
 * The call site's `className` and `style` land on the field as a whole,
 * which is the element a layout positions.
 */
function TokenField<T extends TokenFieldValue = TokenFieldValue>({
  description,
  error,
  floatingLabel = true,
  label,
  leadingIcon,
  renderToken,
  trailingIcon,
  variant = 'filled',
  ...props
}: TokenFieldProps<T>) {
  const populated = isPopulated(props.value ?? props.defaultValue)

  return (
    <RACTokenField<T>
      {...props}
      {...mergeStatefulStyles(stylex.props(fieldStyles.root), props)}
    >
      <FieldBox
        floatingLabel={floatingLabel}
        // React Aria's `TextField` hands its group the field's disabled and
        // invalid state through context; its `TokenField` does not, so the
        // box is told outright or its label and its underline never turn.
        isDisabled={props.isDisabled}
        isInvalid={invalidFrom(error)}
        isPopulated={populated}
        label={label}
        leading={leadingIcon}
        multiline
        trailing={trailingIcon}
        variant={variant}
      >
        <RACTokenInput<T>
          {...stylex.props(
            styles.input,
            variant === 'filled' && styles.inputUnderLabel,
          )}
        >
          {tokenContent(renderToken)}
        </RACTokenInput>
      </FieldBox>
      <FieldMessage description={description} error={error} />
    </RACTokenField>
  )
}

export type { TokenFieldProps, TokenSegment }

export default TokenField
