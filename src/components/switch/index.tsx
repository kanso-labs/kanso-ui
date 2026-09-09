import type { ReactNode } from 'react'
import type {
  SwitchFieldProps as RACSwitchFieldProps,
  SwitchButtonRenderProps,
} from 'react-aria-components'

import * as stylex from '@stylexjs/stylex'
import { SwitchButton, SwitchField } from 'react-aria-components'

import { FieldMessage } from '../../field'
import { invalidFrom, useFieldValidationBehavior } from '../../field/root'
import { CheckGlyph } from '../../glyphs'
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

// The switch page: a 52 by 32dp track with a 2dp outline and a full corner,
// a handle that is 16dp off, 24dp on and 28dp while pressed, a 16dp icon in
// the handle when asked for, a 40dp state layer around the handle and a 48dp
// target. Off, the track is surface container highest inside an outline
// rule and the handle is outline, turning on surface variant while hovered,
// pressed or focused; on, the track is primary and the handle on primary,
// turning primary container in the same states, with the icon in on primary
// container. Disabled, the track and its rule are on surface at the
// disabled container opacity and the handle on surface at the disabled
// content opacity, or surface when on. The state layer is on surface off and
// primary on.
//
// React Aria's `SwitchField` is the root, a div holding the description and
// error slots; its `SwitchButton` is the label around a visually hidden
// input, and everything drawn is that label's children, chosen from the
// render state React Aria hands them. The field is the two-column grid the
// checkbox uses, with the label `display: contents`, so the description and
// error line up under the text.
//
// The handle travels between the two ends of the track and grows between
// its three sizes on the same transition, `motion.durationShort2` with the
// standard easing; the state layer and the ripple sit on a 40dp disc centred
// on the handle, so they move with it. The adjacent label is body-large on
// surface, which the page keeps the same whichever way the switch is.
const styles = stylex.create({
  // `display: contents`, so the control and the label text sit in the
  // field's two columns themselves. The label element is still what a click
  // on either activates.
  button: {
    display: 'contents',
  },
  // The 48dp target, as tall as the label's line, with the track centred in
  // it.
  control: {
    alignItems: 'center',
    blockSize: '40px',
    boxSizing: 'border-box',
    cursor: 'pointer',
    display: 'flex',
    flexShrink: 0,
    inlineSize: '52px',
    justifyContent: 'center',
  },
  controlDisabled: {
    cursor: 'not-allowed',
  },
  controlReadOnly: {
    cursor: 'default',
  },
  field: {
    alignItems: 'start',
    boxSizing: 'border-box',
    columnGap: spacing.sm,
    display: 'grid',
    gridTemplateColumns: 'auto 1fr',
  },
  glyph: {
    blockSize: '16px',
    display: 'block',
    inlineSize: '16px',
  },
  // The handle itself, centred in its travelling box and sized by state.
  handle: {
    alignItems: 'center',
    backgroundColor: colors.outline,
    blockSize: '16px',
    borderRadius: radii.full,
    boxSizing: 'border-box',
    color: colors.onPrimaryContainer,
    display: 'flex',
    inlineSize: '16px',
    justifyContent: 'center',
    transitionDuration: motion.durationShort2,
    transitionProperty: 'background-color, block-size, inline-size',
    transitionTimingFunction: motion.easingStandard,
  },
  handleActive: {
    backgroundColor: colors.onSurfaceVariant,
  },
  handleDisabled: {
    backgroundColor: `color-mix(in srgb, ${colors.onSurface} calc(${stateLayerOpacity.disabledContent} * 100%), transparent)`,
  },
  handleOn: {
    backgroundColor: colors.onPrimary,
    blockSize: '24px',
    inlineSize: '24px',
  },
  handleOnActive: {
    backgroundColor: colors.primaryContainer,
  },
  handleOnDisabled: {
    backgroundColor: colors.surface,
    color: `color-mix(in srgb, ${colors.onSurface} calc(${stateLayerOpacity.disabledContent} * 100%), transparent)`,
  },
  handlePressed: {
    blockSize: '28px',
    inlineSize: '28px',
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
  // The 40dp state layer, centred on the handle: the ripple's host, and
  // where hover and press are painted.
  layer: {
    backgroundColor: 'transparent',
    blockSize: '40px',
    borderRadius: radii.full,
    boxSizing: 'border-box',
    inlineSize: '40px',
    inset: '-6px',
    position: 'absolute',
    transitionDuration: motion.durationShort2,
    transitionProperty: 'background-color',
    transitionTimingFunction: motion.easingStandard,
  },
  // The description and error sit under the text, in the second column.
  messages: {
    gridColumnStart: 2,
  },
  // The handle's travelling box: the pressed handle's 28dp, centred 16dp from
  // the start of the track while off and 16dp from its end while on, which
  // is where the page's handles sit. The insets are measured from inside the
  // track's 2dp rule, so zero puts the box's centre 16dp from the edge.
  seat: {
    alignItems: 'center',
    blockSize: '28px',
    boxSizing: 'border-box',
    display: 'flex',
    inlineSize: '28px',
    insetBlockStart: 0,
    insetInlineStart: 0,
    justifyContent: 'center',
    position: 'absolute',
    transitionDuration: motion.durationShort2,
    transitionProperty: 'inset-inline-start',
    transitionTimingFunction: motion.easingStandard,
  },
  seatOn: {
    insetInlineStart: '20px',
  },
  track: {
    backgroundColor: colors.surfaceContainerHighest,
    blockSize: '32px',
    borderColor: colors.outline,
    borderRadius: radii.full,
    borderStyle: 'solid',
    borderWidth: '2px',
    boxSizing: 'border-box',
    flexShrink: 0,
    inlineSize: '52px',
    position: 'relative',
    transitionDuration: motion.durationShort2,
    transitionProperty: 'background-color, border-color',
    transitionTimingFunction: motion.easingStandard,
  },
  trackDisabled: {
    backgroundColor: `color-mix(in srgb, ${colors.surfaceContainerHighest} calc(${stateLayerOpacity.disabledContainer} * 100%), transparent)`,
    borderColor: `color-mix(in srgb, ${colors.onSurface} calc(${stateLayerOpacity.disabledContainer} * 100%), transparent)`,
  },
  trackFocused: {
    outlineColor: colors.primary,
    outlineOffset: '2px',
    outlineStyle: 'solid',
    outlineWidth: '2px',
  },
  trackOn: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  trackOnDisabled: {
    backgroundColor: `color-mix(in srgb, ${colors.onSurface} calc(${stateLayerOpacity.disabledContainer} * 100%), transparent)`,
    borderColor: 'transparent',
  },
})

// The state layer over the handle: on surface while the switch is off and
// primary while it is on, at the hover or the pressed opacity.
const hoverLayers = stylex.create({
  off: {
    backgroundColor: `color-mix(in srgb, ${colors.onSurface} calc(${stateLayerOpacity.hover} * 100%), transparent)`,
  },
  on: {
    backgroundColor: `color-mix(in srgb, ${colors.primary} calc(${stateLayerOpacity.hover} * 100%), transparent)`,
  },
})

const pressedLayers = stylex.create({
  off: {
    backgroundColor: `color-mix(in srgb, ${colors.onSurface} calc(${stateLayerOpacity.pressed} * 100%), transparent)`,
  },
  on: {
    backgroundColor: `color-mix(in srgb, ${colors.primary} calc(${stateLayerOpacity.pressed} * 100%), transparent)`,
  },
})

type Ripple = ReturnType<typeof useRipple<HTMLSpanElement>>

type SwitchProps = {
  /**
   * The label, beside the switch. A switch that a row labels some other way
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
   * the switch in its error state — the message and `aria-invalid` follow
   * from it.
   */
  error?: string
  /**
   * Draws the check in the handle while the switch is on, the page's
   * "icon on selected switch" form.
   * @default false
   */
  icon?: boolean
} & Omit<RACSwitchFieldProps, 'children' | 'isInvalid' | 'validationBehavior'>

// What the label draws, chosen from the render state React Aria hands it.
// Built by a call rather than written inline at the prop, which is what
// react-perf's no-new-function-as-prop is after; the React Compiler memoises
// the result on its inputs. The ripple's handlers and surface go on the
// state layer while the switch can change, and are left off while it
// cannot, since a press that changes nothing should not look like one.
function buttonContent(children: ReactNode, icon: boolean, ripple: Ripple) {
  return (state: SwitchButtonRenderProps) => {
    const interactive = !state.isDisabled && !state.isReadOnly
    const on = state.isSelected
    const active =
      interactive &&
      (state.isHovered || state.isPressed || state.isFocusVisible)

    return (
      <>
        <span
          {...stylex.props(
            styles.control,
            state.isReadOnly && styles.controlReadOnly,
            state.isDisabled && styles.controlDisabled,
          )}
        >
          <span
            {...stylex.props(
              styles.track,
              on && styles.trackOn,
              state.isDisabled &&
                (on ? styles.trackOnDisabled : styles.trackDisabled),
              state.isFocusVisible && styles.trackFocused,
            )}
          >
            <span {...stylex.props(styles.seat, on && styles.seatOn)}>
              <span
                {...(interactive ? ripple.handlers : {})}
                {...stylex.props(
                  styles.layer,
                  interactive &&
                    state.isHovered &&
                    hoverLayers[on ? 'on' : 'off'],
                  interactive &&
                    state.isPressed &&
                    pressedLayers[on ? 'on' : 'off'],
                )}
              >
                {interactive ? ripple.surface : null}
              </span>
              <span
                {...stylex.props(
                  styles.handle,
                  on && styles.handleOn,
                  active && (on ? styles.handleOnActive : styles.handleActive),
                  interactive && state.isPressed && styles.handlePressed,
                  state.isDisabled &&
                    (on ? styles.handleOnDisabled : styles.handleDisabled),
                )}
              >
                {icon && on ? (
                  <CheckGlyph {...stylex.props(styles.glyph)} />
                ) : null}
              </span>
            </span>
          </span>
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

/**
 * A switch that turns a setting on or off, with its label and optionally a
 * description or an error under it. Its state is React Aria's: pass
 * `isSelected` with `onChange` to control it, or `defaultSelected` to let it
 * keep its own. A switch takes effect as it is flipped, which is what sets
 * it apart from a checkbox in a form.
 *
 * The call site's `className` and `style` land on the field as a whole,
 * which is the element a layout positions.
 */
function Switch({
  children,
  description,
  error,
  icon = false,
  ...props
}: SwitchProps) {
  const ripple = useRipple<HTMLSpanElement>()

  const validationBehavior = useFieldValidationBehavior()

  return (
    <SwitchField
      isInvalid={invalidFrom(error)}
      validationBehavior={validationBehavior}
      {...props}
      {...mergeStatefulStyles(stylex.props(styles.field), props)}
    >
      <SwitchButton {...stylex.props(styles.button)}>
        {buttonContent(children, icon, ripple)}
      </SwitchButton>
      <div {...stylex.props(styles.messages)}>
        <FieldMessage description={description} error={error} inset={false} />
      </div>
    </SwitchField>
  )
}

export type { SwitchProps }

export default Switch
