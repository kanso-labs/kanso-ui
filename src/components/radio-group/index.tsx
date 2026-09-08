import type { ReactNode } from 'react'
import type {
  RadioGroupProps as RACRadioGroupProps,
  RadioButtonRenderProps,
  RadioFieldProps,
  RadioGroupRenderProps,
} from 'react-aria-components'

import * as stylex from '@stylexjs/stylex'
import {
  RadioGroup as RACRadioGroup,
  RadioButton,
  RadioField,
} from 'react-aria-components'

import { FieldLabel, FieldMessage } from '../../field'
import { FIELD_VALIDATION_BEHAVIOR } from '../../field/root'
import { useRipple } from '../../hooks/useRipple'
import { mergeStatefulStyles } from '../../styles/merge'
import {
  colors,
  motion,
  radii,
  spacing,
  stateLayerOpacity,
  typography,
} from '../../tokens/design.tokens.stylex'

// The radio button page: a 20dp ring inside a 40dp state layer, with a 48dp
// target. Unselected, the ring is 2dp of on surface variant that turns on
// surface while hovered, pressed or focused; selected, the ring and the 10dp
// dot inside it are primary. Disabled is on surface at the disabled opacity
// for both. The state layer is on surface over an unselected button and
// primary over a selected one while hovered, and the two swap once pressed.
// The page draws no error state for the button itself: an invalid group
// says so through its label and message, and the buttons keep their colours.
//
// Two components from one module, since neither means anything without the
// other: a radio button is a member of a group, and the group is what holds
// the value. React Aria's `RadioGroup` is the group, a div with the label,
// description and error slots; `RadioField` is one button's root, a div with
// its description slot; and `RadioButton` is the label around the visually
// hidden input, whose children draw the button from the render state React
// Aria hands them. The field is the same two-column grid Checkbox uses, with
// the label `display: contents` so the description lines up under the text.
//
// The adjacent label is body-large on surface, which the page keeps the same
// whether or not the button is selected.
const styles = stylex.create({
  // `display: contents`, so the control and the label text sit in the
  // field's two columns themselves. The label element is still what a click
  // on either activates.
  button: {
    display: 'contents',
  },
  // The 40dp state layer, and the host of the ripple.
  control: {
    alignItems: 'center',
    backgroundColor: 'transparent',
    blockSize: '40px',
    borderRadius: radii.full,
    boxSizing: 'border-box',
    color: colors.onSurfaceVariant,
    cursor: 'pointer',
    display: 'flex',
    flexShrink: 0,
    inlineSize: '40px',
    justifyContent: 'center',
    position: 'relative',
    transitionDuration: motion.durationShort2,
    transitionProperty: 'background-color',
    transitionTimingFunction: motion.easingStandard,
  },
  controlDisabled: {
    cursor: 'not-allowed',
  },
  controlFocused: {
    outlineColor: colors.primary,
    outlineOffset: '2px',
    outlineStyle: 'solid',
    outlineWidth: '2px',
  },
  controlReadOnly: {
    cursor: 'default',
  },
  // The dot, drawn in the ring's colour so the two never disagree.
  dot: {
    backgroundColor: 'currentColor',
    blockSize: '10px',
    borderRadius: radii.full,
    inlineSize: '10px',
  },
  field: {
    alignItems: 'start',
    boxSizing: 'border-box',
    columnGap: spacing.sm,
    display: 'grid',
    gridTemplateColumns: 'auto 1fr',
  },
  // The group's buttons: one under another, or along a line when the group
  // is horizontal.
  items: {
    display: 'flex',
    flexDirection: 'column',
  },
  itemsHorizontal: {
    columnGap: spacing.lg,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  label: {
    boxSizing: 'border-box',
    color: colors.onSurface,
    cursor: 'pointer',
    fontFamily: typography.bodyLargeFont,
    fontSize: typography.bodyLargeSize,
    fontWeight: typography.bodyLargeWeight,
    letterSpacing: typography.bodyLargeTracking,
    lineHeight: typography.bodyLargeLineHeight,
    // Centres a one-line label on the 40dp control, and keeps a longer one
    // starting on that line.
    paddingBlock: spacing.sm,
  },
  labelDisabled: {
    color: `color-mix(in srgb, ${colors.onSurface} calc(${stateLayerOpacity.disabledContent} * 100%), ${colors.surface})`,
    cursor: 'not-allowed',
  },
  labelReadOnly: {
    cursor: 'default',
  },
  // The description sits under the text, in the second column.
  messages: {
    gridColumnStart: 2,
  },
  // The ring. Its colour is the control's, which the dot inherits.
  ring: {
    alignItems: 'center',
    blockSize: '20px',
    borderColor: 'currentColor',
    borderRadius: radii.full,
    borderStyle: 'solid',
    borderWidth: '2px',
    boxSizing: 'border-box',
    display: 'flex',
    inlineSize: '20px',
    justifyContent: 'center',
    transitionDuration: motion.durationShort2,
    transitionProperty: 'border-color',
    transitionTimingFunction: motion.easingStandard,
  },
  // The button's colour in each state, set on the control so the ring and
  // the dot follow it.
  toneActive: {
    color: colors.onSurface,
  },
  toneDisabled: {
    color: `color-mix(in srgb, ${colors.onSurface} calc(${stateLayerOpacity.disabledContent} * 100%), transparent)`,
  },
  toneSelected: {
    color: colors.primary,
  },
})

// The group's label: label-large, the role a field's label takes at rest,
// since a group has no box to float it in.
const groupStyles = stylex.create({
  label: {
    fontFamily: typography.labelLargeFont,
    fontSize: typography.labelLargeSize,
    fontWeight: typography.labelLargeWeight,
    letterSpacing: typography.labelLargeTracking,
    lineHeight: typography.labelLargeLineHeight,
  },
  root: {
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.xs,
  },
})

// The state layer follows the button: on surface over an unselected one and
// primary over a selected one while hovered, the two swapped once pressed.
const hoverLayers = stylex.create({
  selected: {
    backgroundColor: `color-mix(in srgb, ${colors.primary} calc(${stateLayerOpacity.hover} * 100%), transparent)`,
  },
  unselected: {
    backgroundColor: `color-mix(in srgb, ${colors.onSurface} calc(${stateLayerOpacity.hover} * 100%), transparent)`,
  },
})

const pressedLayers = stylex.create({
  selected: {
    backgroundColor: `color-mix(in srgb, ${colors.onSurface} calc(${stateLayerOpacity.pressed} * 100%), transparent)`,
  },
  unselected: {
    backgroundColor: `color-mix(in srgb, ${colors.primary} calc(${stateLayerOpacity.pressed} * 100%), transparent)`,
  },
})

type RadioGroupProps = {
  /** The radio buttons, each with a `value` of its own. */
  children?: ReactNode
  /**
   * A hint under the group. Replaced by `error` when there is one, so the
   * two never stack.
   */
  description?: string
  /**
   * The problem with the current selection, in words. Its presence is what
   * puts the group in its error state — the message, the label's colour and
   * `aria-invalid` on the group all follow from it.
   */
  error?: string
  /**
   * What the group is for. Required rather than optional: a set of radio
   * buttons with no name is a set a screen reader cannot introduce.
   */
  label: string
} & Omit<RACRadioGroupProps, 'children' | 'isInvalid' | 'validationBehavior'>

type RadioProps = Omit<RadioFieldProps, 'children'> & {
  /**
   * The label, beside the button. A button that a row labels some other way
   * leaves it out and passes `aria-label` instead.
   */
  children?: ReactNode
  /** A hint under the label, read with the button. */
  description?: string
}

type Ripple = ReturnType<typeof useRipple<HTMLSpanElement>>

// What the label draws, chosen from the render state React Aria hands it.
// Built by a call rather than written inline at the prop, which is what
// react-perf's no-new-function-as-prop is after; the React Compiler memoises
// the result on its inputs. The ripple's handlers and surface go on the
// control while the button can change, and are left off while it cannot,
// since a press that changes nothing should not look like one.
function buttonContent(children: ReactNode, ripple: Ripple) {
  return (state: RadioButtonRenderProps) => {
    const interactive = !state.isDisabled && !state.isReadOnly
    const tone = state.isSelected ? 'selected' : 'unselected'
    const active = state.isHovered || state.isPressed || state.isFocusVisible

    return (
      <>
        <span
          {...(interactive ? ripple.handlers : {})}
          {...stylex.props(
            styles.control,
            state.isSelected && styles.toneSelected,
            !state.isSelected && interactive && active && styles.toneActive,
            state.isDisabled && styles.toneDisabled,
            state.isReadOnly && styles.controlReadOnly,
            state.isDisabled && styles.controlDisabled,
            interactive && state.isHovered && hoverLayers[tone],
            interactive && state.isPressed && pressedLayers[tone],
            state.isFocusVisible && styles.controlFocused,
          )}
        >
          <span {...stylex.props(styles.ring)}>
            {state.isSelected ? <span {...stylex.props(styles.dot)} /> : null}
          </span>
          {interactive ? ripple.surface : null}
        </span>
        {children === undefined ? null : (
          <span
            {...stylex.props(
              styles.label,
              state.isReadOnly && styles.labelReadOnly,
              state.isDisabled && styles.labelDisabled,
            )}
          >
            {children}
          </span>
        )}
      </>
    )
  }
}

// The group's parts, from its render state: the label's colour follows
// disabled and invalid the way a field's follows its box.
function groupContent(
  label: string,
  children: ReactNode,
  description: string | undefined,
  error: string | undefined,
  horizontal: boolean,
) {
  return (state: RadioGroupRenderProps) => (
    <>
      <FieldLabel state={state} {...stylex.props(groupStyles.label)}>
        {label}
      </FieldLabel>
      <div
        {...stylex.props(styles.items, horizontal && styles.itemsHorizontal)}
      >
        {children}
      </div>
      <FieldMessage description={description} error={error} inset={false} />
    </>
  )
}

/**
 * One option of a `RadioGroup`, with its label and optionally a description
 * under it. It names the entry it stands for with `value`; the selection is
 * the group's. Rendered on its own, outside a group, it has no state to
 * belong to.
 *
 * The call site's `className` and `style` land on the option as a whole,
 * which is the element a layout positions.
 */
function Radio({ children, description, ...props }: RadioProps) {
  const ripple = useRipple<HTMLSpanElement>()

  return (
    <RadioField
      {...props}
      {...mergeStatefulStyles(stylex.props(styles.field), props)}
    >
      <RadioButton {...stylex.props(styles.button)}>
        {buttonContent(children, ripple)}
      </RadioButton>
      <div {...stylex.props(styles.messages)}>
        <FieldMessage description={description} inset={false} />
      </div>
    </RadioField>
  )
}

/**
 * A labelled set of radio buttons with one selected value between them. The
 * value is React Aria's: pass `value` with `onChange` to control it, or
 * `defaultValue` to let the group keep its own, and each `Radio` inside
 * names the entry it stands for. Arrow keys move the selection; disabled,
 * read-only and the error state reach every button from here, and
 * `orientation="horizontal"` lays the buttons along a line.
 *
 * The call site's `className` and `style` land on the group as a whole,
 * which is the element a layout positions.
 */
function RadioGroup({
  children,
  description,
  error,
  label,
  orientation = 'vertical',
  ...props
}: RadioGroupProps) {
  return (
    <RACRadioGroup
      isInvalid={error !== undefined}
      orientation={orientation}
      validationBehavior={FIELD_VALIDATION_BEHAVIOR}
      {...props}
      {...mergeStatefulStyles(stylex.props(groupStyles.root), props)}
    >
      {groupContent(
        label,
        children,
        description,
        error,
        orientation === 'horizontal',
      )}
    </RACRadioGroup>
  )
}

export type { RadioGroupProps, RadioProps }

export { Radio }

export default RadioGroup
