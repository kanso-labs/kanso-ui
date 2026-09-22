import * as stylex from '@stylexjs/stylex'

import {
  colors,
  motion,
  radii,
  spacing,
  stateLayerOpacity,
  typography,
} from '../../tokens/design.tokens.stylex'

// Apart from ./index.tsx so that file exports components alone, which is what
// keeps fast refresh working for it — the same arrangement `src/row` uses.
// `rootStyles` is here for a second reason: index.test.tsx applies it
// directly, because React Aria enters `isDropTarget` only inside a real drag
// session that a synthetic DragEvent does not start.

const dropZoneStyles = stylex.create({
  // What a drop target says it is for. Centred, in the muted role, and not
  // a label the call site has to position.
  label: {
    color: colors.onSurfaceVariant,
    fontFamily: typography.bodyMediumFont,
    fontSize: typography.bodyMediumSize,
    fontWeight: typography.bodyMediumWeight,
    letterSpacing: typography.bodyMediumTracking,
    lineHeight: typography.bodyMediumLineHeight,
    margin: 0,
    textAlign: 'center',
  },
  // The label of a target that will take nothing. It needs a style of its
  // own rather than inheriting the root's: `label` above states its colour
  // outright, and an inherited value never reaches an element declaring one.
  labelDisabled: {
    color: `color-mix(in srgb, ${colors.onSurface} calc(${stateLayerOpacity.disabledContent} * 100%), ${colors.surface})`,
  },
  // The outlined card's surface, rule and corner, with a dashed rule and
  // room enough to aim at.
  root: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.outlineVariant,
    borderRadius: radii.md,
    borderStyle: 'dashed',
    borderWidth: '1px',
    boxSizing: 'border-box',
    color: colors.onSurface,
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.md,
    justifyContent: 'center',
    minBlockSize: '160px',
    outlineColor: colors.primary,
    // Drawn inside the edge rather than around it, so a focused target shows
    // its whole ring instead of having the outer half clipped by a parent.
    outlineOffset: '-2px',
    outlineStyle: 'none',
    outlineWidth: '2px',
    padding: spacing.xl,
    transitionDuration: motion.durationShort3,
    transitionProperty: 'background-color, border-color',
    transitionTimingFunction: motion.easingStandard,
  },
  // A target that will take nothing. React Aria stops a disabled zone
  // responding to a drop or the keyboard either way, so this is what keeps it
  // from inviting one — the same 38% on the content role every disabled
  // control here fades to, over the rule as well as the label, since a dashed
  // rule at full strength still reads as somewhere to aim at.
  rootDisabled: {
    backgroundColor: colors.surface,
    borderColor: `color-mix(in srgb, ${colors.onSurface} calc(${stateLayerOpacity.disabledContent} * 100%), ${colors.surface})`,
    color: `color-mix(in srgb, ${colors.onSurface} calc(${stateLayerOpacity.disabledContent} * 100%), ${colors.surface})`,
    cursor: 'not-allowed',
  },
  // Applied from render state rather than `:focus-visible`, since what React
  // Aria focuses is a visually hidden button inside rather than this element.
  rootFocused: {
    outlineStyle: 'solid',
  },
  // Something is over it and would land here. The rule goes solid as well as
  // primary: a target that is about to receive something is no longer a
  // placeholder for it.
  rootOver: {
    backgroundColor: colors.primaryContainer,
    borderColor: colors.primary,
    borderStyle: 'solid',
    color: colors.onPrimaryContainer,
  },
})

// The target's own classes, from React Aria's render state. `disabled` is
// applied last so it wins over the other two, and StyleX replaces a property
// whole, so it takes their fill and their rule with it.
function rootStyles(state: {
  isDisabled: boolean
  isDropTarget: boolean
  isFocusVisible: boolean
}) {
  return stylex.props(
    dropZoneStyles.root,
    state.isFocusVisible && dropZoneStyles.rootFocused,
    state.isDropTarget && dropZoneStyles.rootOver,
    state.isDisabled && dropZoneStyles.rootDisabled,
  )
}

export { dropZoneStyles, rootStyles }
