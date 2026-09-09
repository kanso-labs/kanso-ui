import type { ReactNode } from 'react'
import type {
  GroupProps,
  GroupRenderProps,
  InputProps,
  InputRenderProps,
  LabelProps,
  TextAreaProps,
} from 'react-aria-components'

import * as stylex from '@stylexjs/stylex'
import { createContext, useContext } from 'react'
import {
  FieldError,
  FieldErrorContext,
  Group,
  Input,
  InputContext,
  Label,
  Text,
  TextArea,
  TextAreaContext,
  useSlottedContext,
} from 'react-aria-components'

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
// The label floats, as the text fields page draws it: body-large and centred
// in an empty, unfocused box, body-small at the top once the field is focused
// or holds a value. `floatingLabel={false}` keeps it small at the top in
// every state instead.
//
// Where the label sits depends on the box's state, and a child cannot select
// on its parent's state while the box can select on its own. So the label's
// type is set on the box and inherited: the box changes the font size and
// line height it hands down when focus is within it, or when its control
// shows something other than its placeholder, and the label transitions
// between the two. Resting, the line is the box less its padding, which is
// what centres the label without a position to move — the move to the top is
// a change of type alone. The control sets its own type, so none of this
// reaches it.
//
// The label's colour follows the control's focus the same way: the box is
// React Aria's Group, which reports focus within it as render state, and the
// label takes `labelFocused` from that.
//
// The box is a row: an icon slot at either end, if the field has one, with
// the label and control between them. The page gives the icons 24dp, 12dp
// from the box's edge and 16dp from the text, centred in the box's height;
// the slot cancels the box's top padding and stretches to its full height,
// so it centres whatever it holds — a 24dp icon, or an icon button around
// one. The label and the control sit in a column of their own, which is
// what the label is positioned against, so it moves past a leading icon
// with the text.
//
// A prefix or suffix sits on the control's line, in the control's type and
// the muted role, and shows only while the field is focused or holds a
// value, as the placeholder does — at rest the label is where it would be.
// It is the column's colour it takes, inherited, since the column can
// select on its own focus and content and the affix cannot select on
// either.
const styles = stylex.create({
  affix: {
    flexShrink: 0,
    fontFamily: typography.bodyLargeFont,
    fontSize: typography.bodyLargeSize,
    fontWeight: typography.bodyLargeWeight,
    letterSpacing: typography.bodyLargeTracking,
    lineHeight: typography.bodyLargeLineHeight,
    transitionDuration: motion.durationShort3,
    transitionProperty: 'color',
    transitionTimingFunction: motion.easingStandard,
    whiteSpace: 'nowrap',
  },
  // The control's line, holding the affixes beside it. The 2dp is Compose's
  // padding between the two, since the page gives none.
  affixLine: {
    alignItems: 'baseline',
    display: 'flex',
    gap: spacing.xxs,
  },
  // A text area and its replica in one grid cell, which is as tall as the
  // taller of the two: the rows the control asks for, or the text it holds.
  // That is what grows the box with typing without measuring anything — the
  // replica is the value in the control's own type, wrapped the same way,
  // and never seen.
  autosize: {
    display: 'grid',
  },
  autosizeCell: {
    gridArea: '1 / 1 / 2 / 2',
  },
  box: {
    alignItems: 'flex-start',
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
    display: 'flex',
    gap: spacing.lg,
    paddingBlockEnd: 0,
    paddingBlockStart: spacing.sm,
    paddingInline: spacing.lg,
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
  // The fixed label's type: label-medium, small at the top in every state.
  boxFixed: {
    fontFamily: typography.labelMediumFont,
    fontSize: typography.labelMediumSize,
    fontWeight: typography.labelMediumWeight,
    letterSpacing: typography.labelMediumTracking,
    lineHeight: typography.labelMediumLineHeight,
  },
  // The floating label's two types. Populated is read off the control itself:
  // `:placeholder-shown` holds while it is empty, whatever put the value there,
  // so a browser filling the field in floats the label as typing does. The
  // control always carries a placeholder for it — see FieldInput.
  boxFloating: {
    fontFamily: {
      ':focus-within': typography.bodySmallFont,
      ':has(:is(input, textarea):not(:placeholder-shown))':
        typography.bodySmallFont,
      default: typography.bodyLargeFont,
    },
    fontSize: {
      ':focus-within': typography.bodySmallSize,
      ':has(:is(input, textarea):not(:placeholder-shown))':
        typography.bodySmallSize,
      default: typography.bodyLargeSize,
    },
    fontWeight: {
      ':focus-within': typography.bodySmallWeight,
      ':has(:is(input, textarea):not(:placeholder-shown))':
        typography.bodySmallWeight,
      default: typography.bodyLargeWeight,
    },
    letterSpacing: {
      ':focus-within': typography.bodySmallTracking,
      ':has(:is(input, textarea):not(:placeholder-shown))':
        typography.bodySmallTracking,
      default: typography.bodyLargeTracking,
    },
    lineHeight: {
      ':focus-within': typography.bodySmallLineHeight,
      ':has(:is(input, textarea):not(:placeholder-shown))':
        typography.bodySmallLineHeight,
      default: `calc(56px - 2 * ${spacing.sm})`,
    },
  },
  // Where the box puts its label: at the top of the column the control is
  // in. Kept apart from `label`, which is the colour alone, so a field that
  // lays its label out differently — a checkbox, a slider — can take the
  // one without the other.
  boxLabel: {
    insetBlockStart: 0,
    insetInlineStart: 0,
    position: 'absolute',
  },
  // The page's 12dp beside an icon, in place of the 16dp beside text.
  boxLeading: {
    paddingInlineStart: spacing.md,
  },
  // A box that takes its height from the control inside it, for a text
  // area: the page's 56dp at least, with the 8dp under the control that the
  // page gives the box above it.
  boxMultiline: {
    blockSize: 'auto',
    minBlockSize: '56px',
    paddingBlockEnd: spacing.sm,
  },
  boxTrailing: {
    paddingInlineEnd: spacing.md,
  },
  // The label and control's column. Its colour is the affixes', which have
  // none of their own: the muted role while the field is focused or holds a
  // value, and nothing at rest under a floating label.
  column: {
    color: colors.onSurfaceVariant,
    flexGrow: 1,
    minInlineSize: 0,
    position: 'relative',
  },
  columnDisabled: {
    color: `color-mix(in srgb, ${colors.onSurface} calc(${stateLayerOpacity.disabledContent} * 100%), ${colors.surface})`,
  },
  columnDisabledFloating: {
    color: {
      ':has(:is(input, textarea):not(:placeholder-shown))': `color-mix(in srgb, ${colors.onSurface} calc(${stateLayerOpacity.disabledContent} * 100%), ${colors.surface})`,
      default: 'transparent',
    },
  },
  columnFloating: {
    color: {
      ':focus-within': colors.onSurfaceVariant,
      ':has(:is(input, textarea):not(:placeholder-shown))':
        colors.onSurfaceVariant,
      default: 'transparent',
    },
  },
  // The count of characters, at the end of the message line in tabular
  // figures so it does not jitter as it counts.
  counter: {
    flexShrink: 0,
    fontVariantNumeric: 'tabular-nums',
    marginInlineStart: 'auto',
    whiteSpace: 'nowrap',
  },
  // An icon slot: the page's 24dp icon in the muted role, centred in the
  // box's full height. An icon drawn in `em` follows the slot's size.
  icon: {
    alignItems: 'center',
    alignSelf: 'stretch',
    color: colors.onSurfaceVariant,
    display: 'flex',
    flexShrink: 0,
    fontSize: '24px',
    justifyContent: 'center',
    marginBlockStart: `calc(-1 * ${spacing.sm})`,
    transitionDuration: motion.durationShort3,
    transitionProperty: 'color',
    transitionTimingFunction: motion.easingStandard,
  },
  iconDisabled: {
    color: `color-mix(in srgb, ${colors.onSurface} calc(${stateLayerOpacity.disabledContent} * 100%), ${colors.surface})`,
  },
  // The page colours the trailing icon with the error, and the leading one
  // not.
  iconError: {
    color: colors.error,
  },
  input: {
    '::placeholder': {
      color: colors.onSurfaceVariant,
    },
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
    // The field around the control draws the focus indicator, so a second
    // ring around the control inside it would be two focus treatments for
    // one focus.
    outlineStyle: 'none',
    padding: 0,
  },
  inputDisabled: {
    '::placeholder': {
      color: `color-mix(in srgb, ${colors.onSurface} calc(${stateLayerOpacity.disabledContent} * 100%), ${colors.surface})`,
    },
    color: `color-mix(in srgb, ${colors.onSurface} calc(${stateLayerOpacity.disabledContent} * 100%), ${colors.surface})`,
  },
  // Under a floating label the placeholder shows only while the control is
  // focused: unfocused and empty, the label sits where the placeholder would.
  inputUnderFloatingLabel: {
    '::placeholder': {
      color: {
        ':focus': colors.onSurfaceVariant,
        default: 'transparent',
      },
    },
  },
  // Clears the label at the top of the box, which is one small line tall
  // whether it floated there or is fixed there.
  inputUnderLabel: {
    marginBlockStart: typography.bodySmallLineHeight,
  },
  // The colour alone. The type is inherited from whatever renders the label,
  // which is what lets the box move it — and the transition is here so the
  // inherited change animates on the label rather than snapping.
  label: {
    color: colors.onSurfaceVariant,
    transitionDuration: motion.durationShort3,
    transitionProperty: 'color, font-size, letter-spacing, line-height',
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
  },
  messageError: {
    color: colors.error,
  },
  // Indented to the box's own inline padding, so the message starts where
  // the value above it does rather than at the box's edge. A field whose
  // label is not in a box — a checkbox, a group — leaves it out.
  messageInset: {
    marginInline: spacing.lg,
  },
  // The line under the box: the message at the start, the counter at the
  // end, the page's 4dp under the box and 16dp between the two.
  messageLine: {
    alignItems: 'baseline',
    display: 'flex',
    gap: spacing.lg,
    marginBlockStart: spacing.xs,
  },
  numeric: {
    fontFamily: typography.fontFamilyMono,
    // Amounts are read in columns and compared against each other, so the
    // digits have to be one width.
    fontVariantNumeric: 'tabular-nums',
  },
  // Wrapped as the browser wraps a text area, so the two break their lines
  // at the same places.
  replica: {
    overflowWrap: 'break-word',
    visibility: 'hidden',
    whiteSpace: 'pre-wrap',
  },
  // No handle, since the page draws none; the rows scroll instead.
  textArea: {
    display: 'block',
    overflow: 'auto',
    resize: 'none',
  },
  // Growing with its text, the control never has anything to scroll.
  textAreaAutosize: {
    overflow: 'hidden',
  },
})

// How the box draws its label, for the control inside it — see the context
// below.
type BoxLabel = 'fixed' | 'floating' | 'none'

type FieldBoxProps = Omit<GroupProps, 'children'> & {
  children?: ReactNode
  /**
   * Whether the label sits in the empty box and floats to the top once the
   * field is focused or holds a value, as the text fields page draws it.
   * `false` keeps it small at the top in every state.
   * @default true
   */
  floatingLabel?: boolean
  /** What the field is for. */
  label: string
  /** An icon at the start of the box, before the label and the control. */
  leading?: ReactNode
  /**
   * Whether the box takes its height from the control inside it rather
   * than the page's 56dp, for a text area.
   * @default false
   */
  multiline?: boolean
  /** An icon at the end of the box, after the control. */
  trailing?: ReactNode
}

// `prefix` is also an HTML attribute — the RDFa one, which nothing here
// wants — and React's element types carry it as a string, so it is left out
// of the props taken from React Aria to make room for the affix.
type FieldInputProps = Omit<InputProps, 'prefix'> & {
  /**
   * Renders the value in the mono face with tabular figures, for amounts and
   * other numbers meant to be compared down a column.
   * @default false
   */
  numeric?: boolean
  /**
   * Text before the value on its line, shown while the field is focused or
   * holds a value.
   */
  prefix?: ReactNode
  /**
   * Text after the value on its line, shown while the field is focused or
   * holds a value.
   */
  suffix?: ReactNode
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
   * Whether to count the characters the control holds at the end of the
   * line, against `maxLength` where there is one. The count is read off the
   * field's own input or text area context.
   * @default false
   */
  characterCount?: boolean
  /**
   * A hint shown under the field. Replaced by `error` when there is one, so
   * the two never stack.
   */
  description?: string | undefined
  /** The problem with the current value, in words. */
  error?: string | undefined
  /**
   * Whether the line is indented to a box's inline padding, so it starts
   * where a value above it does. Off for a field with no box to line up with.
   * @default true
   */
  inset?: boolean
  /** The limit the count is shown against. */
  maxLength?: number | undefined
}

type FieldTextAreaProps = TextAreaProps & {
  /**
   * Whether the control grows with the text it holds, from the rows it asks
   * for. Off, it keeps its rows and scrolls.
   * @default false
   */
  autosize?: boolean
}

// A control under either label clears it with a margin, and one under a
// floating label carries a placeholder so the box can tell when it is
// populated, shown only while focused. The default is what a control
// rendered outside any box gets — a search bar's, which has no label over it
// and shows its placeholder in every state.
const BoxLabelContext = createContext<BoxLabel>('none')

// Written as calls rather than function literals at the prop, which is what
// react-perf's no-new-function-as-prop is after; the React Compiler memoises
// each result on its inputs.
function boxContent(
  label: string,
  children: ReactNode,
  floatingLabel: boolean,
  leading: ReactNode,
  trailing: ReactNode,
) {
  return (state: GroupRenderProps) => (
    <BoxLabelContext value={floatingLabel ? 'floating' : 'fixed'}>
      {leading === undefined ? null : (
        <span
          {...stylex.props(
            styles.icon,
            state.isDisabled && styles.iconDisabled,
          )}
        >
          {leading}
        </span>
      )}
      <div
        {...stylex.props(
          styles.column,
          floatingLabel && styles.columnFloating,
          state.isDisabled &&
            (floatingLabel
              ? styles.columnDisabledFloating
              : styles.columnDisabled),
        )}
      >
        <FieldLabel state={state} {...stylex.props(styles.boxLabel)}>
          {label}
        </FieldLabel>
        {children}
      </div>
      {trailing === undefined ? null : (
        <span
          {...stylex.props(
            styles.icon,
            state.isInvalid && styles.iconError,
            state.isDisabled && styles.iconDisabled,
          )}
        >
          {trailing}
        </span>
      )}
    </BoxLabelContext>
  )
}

function boxStyles(
  floatingLabel: boolean,
  multiline: boolean,
  leading: boolean,
  trailing: boolean,
) {
  return (state: GroupRenderProps) =>
    stylex.props(
      styles.box,
      floatingLabel ? styles.boxFloating : styles.boxFixed,
      multiline && styles.boxMultiline,
      leading && styles.boxLeading,
      trailing && styles.boxTrailing,
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
function FieldBox({
  children,
  floatingLabel = true,
  label,
  leading,
  multiline = false,
  trailing,
  ...props
}: FieldBoxProps) {
  return (
    <Group
      {...props}
      {...mergeStatefulStyles(
        boxStyles(
          floatingLabel,
          multiline,
          leading !== undefined,
          trailing !== undefined,
        ),
        props,
      )}
    >
      {boxContent(label, children, floatingLabel, leading, trailing)}
    </Group>
  )
}

/**
 * A field's text control, in a {@link FieldBox} or on its own. React Aria's
 * `Input`, which takes its label association, value and validation from the
 * field around it and reports its disabled state as render state.
 *
 * In a box it clears the label at the top, and under a floating label it
 * always carries a placeholder, since that is what the box reads to tell a
 * populated control from an empty one: its own where it was given one, a
 * blank otherwise. Outside a box it has no label over it and shows the
 * placeholder it was given in every state.
 */
function FieldInput({
  numeric = false,
  placeholder,
  prefix,
  suffix,
  ...props
}: FieldInputProps) {
  const boxLabel = useContext(BoxLabelContext)

  const control = (
    <Input
      placeholder={placeholder ?? (boxLabel === 'floating' ? ' ' : undefined)}
      {...props}
      {...mergeStatefulStyles(
        (state: InputRenderProps) =>
          stylex.props(
            styles.input,
            boxLabel !== 'none' && styles.inputUnderLabel,
            boxLabel === 'floating' && styles.inputUnderFloatingLabel,
            numeric && styles.numeric,
            state.isDisabled && styles.inputDisabled,
          ),
        props,
      )}
    />
  )

  if (prefix === undefined && suffix === undefined) {
    return control
  }

  return (
    <span {...stylex.props(styles.affixLine)}>
      {prefix === undefined ? null : (
        <span
          {...stylex.props(
            styles.affix,
            boxLabel !== 'none' && styles.inputUnderLabel,
          )}
        >
          {prefix}
        </span>
      )}
      {control}
      {suffix === undefined ? null : (
        <span
          {...stylex.props(
            styles.affix,
            boxLabel !== 'none' && styles.inputUnderLabel,
          )}
        >
          {suffix}
        </span>
      )}
    </span>
  )
}

/**
 * A field's multi-line text control, in a {@link FieldBox} drawn `multiline`.
 * React Aria's `TextArea`, with the same label association, value and
 * validation {@link FieldInput} takes from the field around it, and the same
 * placeholder under a floating label.
 *
 * Given `autosize` it grows with its text from the rows it asks for. The
 * value it grows to fit is read off the field's context rather than
 * measured: the box holds a hidden replica of it in the control's own type,
 * in the same grid cell as the control, and the cell is as tall as whichever
 * of the two is taller.
 */
function FieldTextArea({
  autosize = false,
  placeholder,
  ...props
}: FieldTextAreaProps) {
  const boxLabel = useContext(BoxLabelContext)
  const context = useSlottedContext(TextAreaContext)
  const value = typeof context?.value === 'string' ? context.value : ''

  const control = (
    <TextArea
      placeholder={placeholder ?? (boxLabel === 'floating' ? ' ' : undefined)}
      {...props}
      {...mergeStatefulStyles(
        (state: InputRenderProps) =>
          stylex.props(
            styles.input,
            boxLabel !== 'none' && styles.inputUnderLabel,
            boxLabel === 'floating' && styles.inputUnderFloatingLabel,
            styles.textArea,
            autosize && styles.textAreaAutosize,
            autosize && styles.autosizeCell,
            state.isDisabled && styles.inputDisabled,
          ),
        props,
      )}
    />
  )

  if (!autosize) {
    return control
  }

  // A trailing space keeps a final line break of the value as a line of the
  // replica, which is how the control renders it.
  return (
    <div {...stylex.props(styles.autosize)}>
      {control}
      <div
        aria-hidden="true"
        {...stylex.props(
          styles.input,
          boxLabel !== 'none' && styles.inputUnderLabel,
          styles.replica,
          styles.autosizeCell,
        )}
      >
        {value}{' '}
      </div>
    </div>
  )
}

/**
 * A field's label: the colour alone, positioned and given its type by whatever
 * renders it. React Aria's `Label`, which the field around it associates with
 * its control through context.
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
 * with server-side errors, or the browser's own, reaches it without any
 * field changing. The description steps aside for those too, which is what
 * the field's validation state is read for.
 */
function FieldMessage({
  characterCount = false,
  description,
  error,
  inset = true,
  maxLength,
}: FieldMessageProps) {
  const validation = useContext(FieldErrorContext)
  const invalid = error !== undefined || (validation?.isInvalid ?? false)
  const input = useSlottedContext(InputContext)
  const textArea = useSlottedContext(TextAreaContext)

  if (!invalid && description === undefined && !characterCount) {
    return null
  }

  const value = input?.value ?? textArea?.value ?? ''
  const length = String(value).length

  return (
    <div
      {...stylex.props(
        styles.message,
        styles.messageLine,
        inset && styles.messageInset,
      )}
    >
      <FieldError {...stylex.props(styles.message, styles.messageError)}>
        {error}
      </FieldError>
      {!invalid && description !== undefined ? (
        <Text slot="description" {...stylex.props(styles.message)}>
          {description}
        </Text>
      ) : null}
      {characterCount ? (
        <span
          {...stylex.props(
            styles.message,
            styles.counter,
            invalid && styles.messageError,
          )}
        >
          {maxLength === undefined ? length : `${length}/${maxLength}`}
        </span>
      ) : null}
    </div>
  )
}

export type {
  FieldBoxProps,
  FieldInputProps,
  FieldLabelProps,
  FieldLabelState,
  FieldMessageProps,
  FieldTextAreaProps,
}

export { FieldBox, FieldInput, FieldLabel, FieldMessage, FieldTextArea }
