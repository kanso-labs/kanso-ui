import type { ReactNode } from 'react'
import type {
  CheckboxButtonRenderProps,
  CheckboxFieldProps as RACCheckboxFieldProps,
} from 'react-aria-components'

import * as stylex from '@stylexjs/stylex'
import { CheckboxButton, CheckboxField } from 'react-aria-components'

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
const styles = stylex.create({
  box: {
    alignItems: 'center',
    backgroundColor: 'transparent',
    blockSize: '18px',
    borderColor: colors.onSurfaceVariant,
    borderRadius: '2px',
    borderStyle: 'solid',
    borderWidth: '2px',
    boxSizing: 'border-box',
    color: colors.onPrimary,
    display: 'flex',
    inlineSize: '18px',
    justifyContent: 'center',
    transitionDuration: motion.durationShort2,
    transitionProperty: 'background-color, border-color',
    transitionTimingFunction: motion.easingStandard,
  },
  boxMarked: {
    backgroundColor: colors.primary,
    borderColor: 'transparent',
  },
  boxMarkedDisabled: {
    backgroundColor: `color-mix(in srgb, ${colors.onSurface} calc(${stateLayerOpacity.disabledContent} * 100%), transparent)`,
    borderColor: 'transparent',
    color: colors.surface,
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
    borderColor: `color-mix(in srgb, ${colors.onSurface} calc(${stateLayerOpacity.disabledContent} * 100%), transparent)`,
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
  glyph: {
    blockSize: '18px',
    display: 'block',
    inlineSize: '18px',
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

type Ripple = ReturnType<typeof useRipple<HTMLSpanElement>>

type Tone = 'error' | 'marked' | 'unmarked'

// What the label draws, chosen from the render state React Aria hands it.
// Built by a call rather than written inline at the prop, which is what
// react-perf's no-new-function-as-prop is after; the React Compiler memoises
// the result on its inputs. The ripple's handlers and surface go on the
// control while the checkbox can change, and are left off while it cannot,
// since a press that changes nothing should not look like one.
function buttonContent(children: ReactNode, ripple: Ripple) {
  return (state: CheckboxButtonRenderProps) => {
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
          {...(interactive ? ripple.handlers : {})}
          {...stylex.props(
            controlStyles.disc,
            styles.control,
            state.isReadOnly && controlStyles.controlReadOnly,
            state.isDisabled && controlStyles.controlDisabled,
            interactive && state.isHovered && hoverLayers[tone],
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
            {state.isIndeterminate ? (
              <IndeterminateGlyph {...stylex.props(styles.glyph)} />
            ) : state.isSelected ? (
              <CheckGlyph {...stylex.props(styles.glyph)} />
            ) : null}
          </span>
          {interactive ? ripple.surface : null}
        </span>
        <ControlLabel state={state}>{children}</ControlLabel>
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
 * The call site's `className` and `style` land on the field as a whole,
 * which is the element a layout positions.
 */
function Checkbox({ children, description, error, ...props }: CheckboxProps) {
  const ripple = useRipple<HTMLSpanElement>()

  const validationBehavior = useFieldValidationBehavior()

  return (
    <CheckboxField
      isInvalid={invalidFrom(error)}
      validationBehavior={validationBehavior}
      {...props}
      {...mergeStatefulStyles(stylex.props(controlStyles.field), props)}
    >
      <CheckboxButton {...stylex.props(styles.button)}>
        {buttonContent(children, ripple)}
      </CheckboxButton>
      <div {...stylex.props(controlStyles.messages)}>
        <FieldMessage description={description} error={error} inset={false} />
      </div>
    </CheckboxField>
  )
}

export type { CheckboxProps }

export default Checkbox
