import type {
  ToggleProps as BaseUIToggleProps,
  ToggleState as BaseUIToggleState,
} from '@base-ui/react/toggle'

import { Toggle as BaseUIToggle } from '@base-ui/react/toggle'
import * as stylex from '@stylexjs/stylex'

import { mergeStatefulStyles } from '../../styles/merge'
import {
  colors,
  motion,
  radii,
  spacing,
  stateLayerOpacity,
  typography,
} from '../../tokens/design.tokens.stylex'

// Each state composites an 'on-color' over its own container at the
// interaction state's opacity rather than swapping in a separate hover color.
// calc(<opacity> * 100%) turns the token's unitless 0-1 ratio into the
// percentage color-mix() takes, and it is inlined at each property because
// @stylexjs/babel-plugin only statically recognizes expressions written
// directly as property values.
//
// The selected chip drops its border rather than recolouring it: it has a
// container of its own to define its edge, and a border on top of that reads
// as a second, competing outline.
const styles = stylex.create({
  base: {
    alignItems: 'center',
    blockSize: '32px',
    borderRadius: radii.sm,
    borderStyle: 'solid',
    borderWidth: '1px',
    boxSizing: 'border-box',
    cursor: { ':disabled': 'not-allowed', default: 'pointer' },
    display: 'inline-flex',
    flexShrink: 0,
    fontFamily: typography.labelLargeFont,
    fontSize: typography.labelLargeSize,
    fontWeight: typography.labelLargeWeight,
    gap: spacing.sm,
    letterSpacing: typography.labelLargeTracking,
    lineHeight: typography.labelLargeLineHeight,
    outlineColor: colors.primary,
    outlineOffset: '2px',
    outlineStyle: { ':focus-visible': 'solid', default: 'none' },
    outlineWidth: '2px',
    paddingBlock: 0,
    paddingInline: spacing.md,
    transitionDuration: motion.durationShort2,
    transitionProperty: 'background-color, border-color, color',
    transitionTimingFunction: motion.easingStandard,
  },
  selected: {
    backgroundColor: {
      ':active:not(:disabled)': `color-mix(in srgb, ${colors.onSecondaryContainer} calc(${stateLayerOpacity.pressed} * 100%), ${colors.secondaryContainer})`,
      ':disabled': `color-mix(in srgb, ${colors.onSurface} calc(${stateLayerOpacity.disabledContainer} * 100%), ${colors.surface})`,
      ':hover:not(:disabled)': `color-mix(in srgb, ${colors.onSecondaryContainer} calc(${stateLayerOpacity.hover} * 100%), ${colors.secondaryContainer})`,
      default: colors.secondaryContainer,
    },
    borderColor: 'transparent',
    color: {
      ':disabled': `color-mix(in srgb, ${colors.onSurface} calc(${stateLayerOpacity.disabledContent} * 100%), ${colors.surface})`,
      default: colors.onSecondaryContainer,
    },
  },
  unselected: {
    backgroundColor: {
      ':active:not(:disabled)': `color-mix(in srgb, ${colors.onSurface} calc(${stateLayerOpacity.pressed} * 100%), transparent)`,
      ':hover:not(:disabled)': `color-mix(in srgb, ${colors.onSurface} calc(${stateLayerOpacity.hover} * 100%), transparent)`,
      default: 'transparent',
    },
    borderColor: {
      ':disabled': `color-mix(in srgb, ${colors.onSurface} calc(${stateLayerOpacity.disabledContainer} * 100%), transparent)`,
      default: colors.outline,
    },
    color: {
      ':disabled': `color-mix(in srgb, ${colors.onSurface} calc(${stateLayerOpacity.disabledContent} * 100%), ${colors.surface})`,
      default: colors.onSurfaceVariant,
    },
  },
})

type ChipProps<Value extends string = string> = BaseUIToggleProps<Value>

/**
 * A chip is a two-state button, so its selected state is Base UI's `pressed`:
 * pass `pressed` with `onPressedChange` to control it, or `defaultPressed` to
 * let it keep its own state. Selection is announced through `aria-pressed`
 * rather than a role of its own.
 */
function Chip<Value extends string = string>({
  children,
  ...props
}: ChipProps<Value>) {
  return (
    <BaseUIToggle {...props} {...mergeStatefulStyles(propsFor, props)}>
      {children}
    </BaseUIToggle>
  )
}

// StyleX has no way to target [data-pressed] on the element it is styling, so
// the selected styles cannot be chosen in CSS. Base UI's answer is to let
// className and style be functions of the component's own state, which is
// what this is — and it is why an uncontrolled chip styles itself correctly
// without this component keeping a copy of the state.
//
// mergeStatefulStyles takes the function rather than a computed result for
// exactly that reason, and combines it with whatever the call site passed.
function propsFor(state: BaseUIToggleState) {
  return stylex.props(
    styles.base,
    state.pressed ? styles.selected : styles.unselected,
  )
}

export type { ChipProps }

export default Chip
