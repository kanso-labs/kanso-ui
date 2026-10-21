'use client'

import type { ReactNode, RefAttributes } from 'react'
import type {
  CheckboxButtonRenderProps,
  CheckboxFieldRenderProps,
  PressEvent,
  CheckboxFieldProps as RACCheckboxFieldProps,
} from 'react-aria-components'

import * as stylex from '@stylexjs/stylex'
import { useContext } from 'react'
import {
  CheckboxButton,
  CheckboxField,
  CheckboxGroupStateContext,
} from 'react-aria-components'

import { ControlLabel } from '../../control'
import { controlStyles } from '../../control/styles'
import { FieldMessage } from '../../field'
import { invalidFrom, useFieldValidationBehavior } from '../../field/root'
import { CheckGlyph, IndeterminateGlyph } from '../../glyphs'
import { useRipple } from '../../hooks/useRipple'
import { focus } from '../../styles/focus'
import { mergeStatefulStyles } from '../../styles/merge'
import {
  colors,
  motion,
  stateLayerOpacity,
} from '../../tokens/design.tokens.stylex'

// The checkbox page: an 18dp box with a 2dp corner and an 18dp glyph, inside
// a 40dp state layer, with a 48dp target. Unselected, the box is a 2dp rule
// in on surface variant that turns on surface while hovered, pressed or
// focused; selected or indeterminate, it fills with primary and the glyph
// takes on primary. The error pair is error and on error, and disabled is
// on surface at the disabled opacity for the rule or the fill, with the
// glyph in surface. The state layer is on surface over an unselected box and
// primary over a selected one while hovered, and the two swap once pressed.
//
// React Aria's `CheckboxField` is the root, a div holding the description
// and error slots; its `CheckboxButton` is the label around a visually
// hidden input, and everything drawn is that label's children, chosen from
// the render state React Aria hands them. The field is a two-column grid —
// the control, then the text — and the label is `display: contents`, so the
// control and the label text each take a column and the description and
// error line up under the text rather than under the box.
//
// The adjacent label is body-large on surface, which the page keeps the same
// whether or not the box is selected. The corner is a literal: the page's
// 2dp is a step the shape scale does not carry.
//
// A change of state moves together: the fill and the rule fade, and the glyph
// fades and grows in or shrinks out with them, over the same duration and
// curve. Both glyphs are always drawn, one over the other, so a box moving
// between checked and indeterminate crosses from one to the other, and one
// being cleared fades out the mark it had.
//
// The ripple answers every press: on the control, on the text beside it, or
// from a key, and grows from the middle of the control whichever it is. The
// text runs the width of the row, so a ripple following the pointer there
// reached the control only as it finished growing. A key press ripples once
// the key has activated the checkbox, as Button's does.

// Windows High Contrast and the rest of the forced-colours modes. Spelled
// here rather than imported, for the reason src/field/styles.ts records: the
// StyleX compiler resolves a constant across files only out of a `.stylex.ts`
// module, and the generated one holds design tokens rather than queries.
const FORCED_COLORS = '@media (forced-colors: active)'

const styles = stylex.create({
  box: {
    '@media (prefers-reduced-motion: reduce)': { transitionDuration: '0s' },
    backgroundColor: 'transparent',
    blockSize: '18px',
    borderColor: colors.onSurfaceVariant,
    borderRadius: '2px',
    borderStyle: 'solid',
    borderWidth: '2px',
    boxSizing: 'border-box',
    color: colors.onPrimary,
    display: 'block',
    inlineSize: '18px',
    position: 'relative',
    transitionDuration: motion.durationShort2,
    transitionProperty: 'background-color, border-color',
    transitionTimingFunction: motion.easingStandard,
  },
  boxMarked: {
    backgroundColor: colors.primary,
    borderColor: 'transparent',
  },
  // Disabled, the box and the glyph are `GrayText` under forced colours,
  // which greys the hidden native input but not the box drawn for it.
  boxMarkedDisabled: {
    backgroundColor: `color-mix(in srgb, ${colors.onSurface} calc(${stateLayerOpacity.disabledContent} * 100%), transparent)`,
    borderColor: { default: 'transparent', [FORCED_COLORS]: 'GrayText' },
    color: { default: colors.surface, [FORCED_COLORS]: 'GrayText' },
  },
  boxMarkedError: {
    backgroundColor: colors.error,
    borderColor: 'transparent',
    color: colors.onError,
  },
  boxUnmarkedActive: {
    borderColor: colors.onSurface,
  },
  boxUnmarkedDisabled: {
    borderColor: {
      default: `color-mix(in srgb, ${colors.onSurface} calc(${stateLayerOpacity.disabledContent} * 100%), transparent)`,
      [FORCED_COLORS]: 'GrayText',
    },
  },
  boxUnmarkedError: {
    borderColor: colors.error,
  },
  // `display: contents`, so the control and the label text below sit in the
  // field's two columns themselves. The label element is still what a click
  // on either activates.
  button: {
    display: 'contents',
  },
  // The 40dp state layer, and the host of the ripple.
  // The disc is shared; its content colour is this component's own.
  control: {
    color: colors.onSurface,
  },
  // The box has 14dp of content inside its 2dp border, so the glyph is
  // placed rather than laid out: it holds its own 18dp, starts 2dp out, over
  // the border, which a marked box fills like the rest, and lies over the
  // whole box. Fitted to the content, both marks came out a fifth smaller.
  // Placing them is also what lets the two lie one over the other.
  //
  // Hidden, a glyph is clear and at half its size, and it fades and grows
  // with the fill. Under reduced motion it changes at once, as the box does.
  glyph: {
    '@media (prefers-reduced-motion: reduce)': { transitionDuration: '0s' },
    blockSize: '18px',
    display: 'block',
    inlineSize: '18px',
    insetBlockStart: '-2px',
    insetInlineStart: '-2px',
    opacity: 0,
    position: 'absolute',
    transform: 'scale(0.5)',
    transitionDuration: motion.durationShort2,
    transitionProperty: 'opacity, transform',
    transitionTimingFunction: motion.easingStandard,
  },
  glyphShown: {
    opacity: 1,
    transform: 'scale(1)',
  },
  // The description and error sit under the text, in the second column.
})

// The state layer's colour follows the box: on surface over an unmarked box
// and primary over a marked one while hovered, the two swapped once pressed,
// and error throughout while invalid.
const hoverLayers = stylex.create({
  error: {
    backgroundColor: `color-mix(in srgb, ${colors.error} calc(${stateLayerOpacity.hover} * 100%), transparent)`,
  },
  marked: {
    backgroundColor: `color-mix(in srgb, ${colors.primary} calc(${stateLayerOpacity.hover} * 100%), transparent)`,
  },
  unmarked: {
    backgroundColor: `color-mix(in srgb, ${colors.onSurface} calc(${stateLayerOpacity.hover} * 100%), transparent)`,
  },
})

// A keyboard's focus draws the hover layer's colour at the focus opacity.
const focusLayers = stylex.create({
  error: {
    backgroundColor: `color-mix(in srgb, ${colors.error} calc(${stateLayerOpacity.focus} * 100%), transparent)`,
  },
  marked: {
    backgroundColor: `color-mix(in srgb, ${colors.primary} calc(${stateLayerOpacity.focus} * 100%), transparent)`,
  },
  unmarked: {
    backgroundColor: `color-mix(in srgb, ${colors.onSurface} calc(${stateLayerOpacity.focus} * 100%), transparent)`,
  },
})

const pressedLayers = stylex.create({
  error: {
    backgroundColor: `color-mix(in srgb, ${colors.error} calc(${stateLayerOpacity.pressed} * 100%), transparent)`,
  },
  marked: {
    backgroundColor: `color-mix(in srgb, ${colors.onSurface} calc(${stateLayerOpacity.pressed} * 100%), transparent)`,
  },
  unmarked: {
    backgroundColor: `color-mix(in srgb, ${colors.primary} calc(${stateLayerOpacity.pressed} * 100%), transparent)`,
  },
})

type CheckboxProps = {
  /**
   * The label, beside the box. A checkbox that a row labels some other way
   * leaves it out and passes `aria-label` instead.
   *
   * A link or a button in it acts on its own, as in a native label: a press
   * or Enter on "the terms" in "I agree to the terms" follows the link and
   * leaves the checkbox as it was. A press anywhere else in the label
   * toggles it.
   */
  children?: ReactNode
  /**
   * A hint under the label. Replaced by `error` when there is one, so the
   * two never stack.
   */
  description?: string
  /**
   * The problem with the current value, in words. Its presence is what puts
   * the checkbox in its error state — the message, the error colours and
   * `aria-invalid` all follow from it.
   *
   * Outside a `Form` the message line arrives with the message, so the
   * field grows when this does and moves what is under it. A `Form` holds
   * that space from the start; so does a permanent `description`.
   */
  error?: string
} & Omit<RACCheckboxFieldProps, 'children' | 'isInvalid' | 'validationBehavior'>

type Ripple = ReturnType<typeof useRipple<HTMLLabelElement>>

type Tone = 'error' | 'marked' | 'unmarked'

// What the label draws, chosen from the render state React Aria hands it.
// Built by a call rather than written inline at the prop, which is what
// react-perf's no-new-function-as-prop is after; the React Compiler memoises
// the result on its inputs. The ripple's surface goes on the control while
// the checkbox can change, and is left off while it cannot, since a press
// that changes nothing should not look like one. Its handlers are the
// label's, in `Checkbox` below.
function buttonContent(
  children: ReactNode,
  surface: Ripple['surface'],
  inGroup: boolean,
) {
  return (state: CheckboxButtonRenderProps) => {
    // A checkbox in a group is marked by the group's label rather than its
    // own: the group is what has to have a choice made in it.
    const required = state.isRequired && !inGroup
    const marked = state.isSelected || state.isIndeterminate
    const interactive = !state.isDisabled && !state.isReadOnly
    const tone: Tone = state.isInvalid
      ? 'error'
      : marked
        ? 'marked'
        : 'unmarked'
    const active = state.isHovered || state.isPressed || state.isFocusVisible

    return (
      <>
        <span
          {...stylex.props(
            controlStyles.disc,
            styles.control,
            state.isReadOnly && controlStyles.controlReadOnly,
            state.isDisabled && controlStyles.controlDisabled,
            interactive && state.isHovered && hoverLayers[tone],
            interactive && state.isFocusVisible && focusLayers[tone],
            interactive && state.isPressed && pressedLayers[tone],
            state.isFocusVisible && focus.ringVisible,
          )}
        >
          <span
            {...stylex.props(
              styles.box,
              marked && styles.boxMarked,
              !marked && state.isInvalid && styles.boxUnmarkedError,
              !marked &&
                !state.isInvalid &&
                interactive &&
                active &&
                styles.boxUnmarkedActive,
              marked && state.isInvalid && styles.boxMarkedError,
              state.isDisabled &&
                (marked
                  ? styles.boxMarkedDisabled
                  : styles.boxUnmarkedDisabled),
            )}
          >
            <CheckGlyph
              {...stylex.props(
                styles.glyph,
                state.isSelected && !state.isIndeterminate && styles.glyphShown,
              )}
            />
            <IndeterminateGlyph
              {...stylex.props(
                styles.glyph,
                state.isIndeterminate && styles.glyphShown,
              )}
            />
          </span>
          {interactive ? surface : null}
        </span>
        <ControlLabel isRequired={required} state={state}>
          {children}
        </ControlLabel>
      </>
    )
  }
}

/**
 * A checkbox with its label, and optionally a description or an error under
 * it. Its state is React Aria's: pass `isSelected` with `onChange` to
 * control it, or `defaultSelected` to let it keep its own; `isIndeterminate`
 * draws the dash for a box that stands for a partly selected set. Inside a
 * `CheckboxGroup` it takes its `value` and the group's selection instead.
 *
 * `isRequired` ends the label in the asterisk every required field's label
 * ends in. Inside a `CheckboxGroup` the group's label carries it instead,
 * since the group is what must have a choice made in it.
 *
 * The call site's `className` and `style` land on the field as a whole,
 * which is the element a layout positions.
 */
function Checkbox({
  children,
  description,
  error,
  ...props
}: CheckboxProps & RefAttributes<HTMLDivElement>) {
  const validationBehavior = useFieldValidationBehavior()

  // Whether a message can ever reach this checkbox, which is what a form
  // keeps an empty line under a field for. One in a group cannot — the
  // group owns the one message and keeps its own line for it — and one on
  // its own can only where something can find it wanting: a requirement, a
  // check of its own, or a name a form's errors can be keyed by. Without
  // this every checkbox in a form sat a line taller than it draws, and a
  // group of them in a form gained a line after every item.
  const group = useContext(CheckboxGroupStateContext)
  const inGroup = group !== null
  const reachable =
    !inGroup &&
    (props.isRequired === true ||
      props.validate !== undefined ||
      props.name !== undefined)

  // The ripple listens on the label, which hears a pointer on the control and
  // on the text alike, and grows from the middle of the control for both.
  // React Aria drops a click handler there, so a press ends on its release
  // instead. A key reaches the input rather than the label, so its press is
  // played once it activates the checkbox. React Aria reports that
  // activation twice, as the key and then as the click the browser makes of
  // it, and only the first plays. A checkbox that a press cannot change
  // listens for neither, as in `buttonContent`.
  const interactive =
    props.isDisabled !== true &&
    props.isReadOnly !== true &&
    group?.isDisabled !== true &&
    group?.isReadOnly !== true
  const ripple = useRipple<HTMLLabelElement>(interactive, {}, true, true)
  const press = {
    onPress: (event: PressEvent) => {
      if (event.pointerType === 'keyboard') {
        ripple.play()
      }
      props.onPress?.(event)
    },
  }

  return (
    <CheckboxField
      isInvalid={invalidFrom(error)}
      validationBehavior={validationBehavior}
      {...props}
      {...press}
      {...mergeStatefulStyles(stylex.props(controlStyles.field), props)}
    >
      {fieldContent(
        <CheckboxButton {...ripple.handlers} {...stylex.props(styles.button)}>
          {buttonContent(children, ripple.surface, inGroup)}
        </CheckboxButton>,
        description,
        error,
        reachable,
      )}
    </CheckboxField>
  )
}

// The button and the line under it, from the field's render state: the
// description fades with a disabled checkbox, by itself or by its group, as
// its label does. Built by a call for the same reason as `buttonContent`.
function fieldContent(
  button: ReactNode,
  description: string | undefined,
  error: string | undefined,
  reserve: boolean,
) {
  return ({ isDisabled }: CheckboxFieldRenderProps) => (
    <>
      {button}
      <div {...stylex.props(controlStyles.messages)}>
        <FieldMessage
          description={description}
          error={error}
          indent
          inset={false}
          isDisabled={isDisabled}
          reserve={reserve}
        />
      </div>
    </>
  )
}

export type { CheckboxProps }

export default Checkbox
