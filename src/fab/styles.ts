import * as stylex from '@stylexjs/stylex'

import {
  colors,
  radii,
  shadows,
  sizing,
  spacing,
  stateLayerOpacity,
  typography,
} from '../tokens/design.tokens.stylex'

// The FAB's styles, shared by Fab and by the FAB that opens FabMenu, which is
// the same button until its menu opens. Apart from either component, and
// outside `src/components`, for the reason src/row gives. See Fab's header
// for the values and where they come from.

// Windows High Contrast and the rest of the forced-colours modes. Spelled
// here rather than imported, for the reason src/field/styles.ts records: the
// StyleX compiler resolves a constant across files only out of a `.stylex.ts`
// module, and the generated one holds design tokens rather than queries.
const FORCED_COLORS = '@media (forced-colors: active)'

// The medium FAB's container and corner, between the steps of the control
// and radius scales.
const MEDIUM_SIZE = '80px'
const MEDIUM_CORNER = '20px'

const fabStyles = stylex.create({
  base: {
    alignItems: 'center',
    // The container's rule under forced colours — see the header.
    borderColor: { default: null, [FORCED_COLORS]: 'ButtonText' },
    borderStyle: { default: null, [FORCED_COLORS]: 'solid' },
    borderWidth: { default: 0, [FORCED_COLORS]: '1px' },
    boxShadow: shadows.elevation3,
    boxSizing: 'border-box',
    cursor: 'pointer',
    display: 'inline-flex',
    flexShrink: 0,
    justifyContent: 'center',
    padding: 0,
    position: 'relative',
    // `href` makes a FAB an <a>, and an <a> arrives underlined.
    textDecoration: 'none',
  },
  disabled: {
    backgroundColor: `color-mix(in srgb, ${colors.onSurface} calc(${stateLayerOpacity.disabledContainer} * 100%), ${colors.surface})`,
    backgroundImage: 'none',
    borderColor: { default: null, [FORCED_COLORS]: 'GrayText' },
    boxShadow: 'none',
    color: {
      default: `color-mix(in srgb, ${colors.onSurface} calc(${stateLayerOpacity.disabledContent} * 100%), ${colors.surface})`,
      [FORCED_COLORS]: 'GrayText',
    },
    cursor: 'not-allowed',
  },
  // The layers, in the label's own colour over whatever the container is.
  // A gradient from one colour to itself is how a flat colour is laid over
  // a background colour rather than replacing it.
  focused: {
    backgroundImage: `linear-gradient(color-mix(in srgb, currentColor calc(${stateLayerOpacity.focus} * 100%), transparent), color-mix(in srgb, currentColor calc(${stateLayerOpacity.focus} * 100%), transparent))`,
  },
  hovered: {
    backgroundImage: `linear-gradient(color-mix(in srgb, currentColor calc(${stateLayerOpacity.hover} * 100%), transparent), color-mix(in srgb, currentColor calc(${stateLayerOpacity.hover} * 100%), transparent))`,
    boxShadow: shadows.elevation4,
  },
  // The slot the icon is drawn in. Its size is the font size `iconSizes`
  // sets, which an icon drawn in `em` follows.
  icon: {
    alignItems: 'center',
    display: 'inline-flex',
    flexShrink: 0,
    justifyContent: 'center',
  },
  pressed: {
    backgroundImage: `linear-gradient(color-mix(in srgb, currentColor calc(${stateLayerOpacity.pressed} * 100%), transparent), color-mix(in srgb, currentColor calc(${stateLayerOpacity.pressed} * 100%), transparent))`,
    boxShadow: shadows.elevation3,
  },
})

// The FAB on its own: a square of the size's edge, at its corner.
const fabSizes = stylex.create({
  lg: {
    blockSize: MEDIUM_SIZE,
    borderRadius: MEDIUM_CORNER,
    inlineSize: MEDIUM_SIZE,
  },
  md: {
    blockSize: sizing.controlLg,
    borderRadius: radii.lg,
    inlineSize: sizing.controlLg,
  },
  xl: {
    blockSize: sizing.controlXl,
    borderRadius: radii.xl,
    inlineSize: sizing.controlXl,
  },
})

// The extended form: the size's height and corner, with its padding, the gap
// before the label and the label's type role.
const extendedFabSizes = stylex.create({
  lg: {
    blockSize: MEDIUM_SIZE,
    borderRadius: MEDIUM_CORNER,
    fontFamily: typography.titleLargeFont,
    fontSize: typography.titleLargeSize,
    fontWeight: typography.titleLargeWeight,
    gap: spacing.md,
    letterSpacing: typography.titleLargeTracking,
    lineHeight: typography.titleLargeLineHeight,
    paddingInline: '26px',
  },
  md: {
    blockSize: sizing.controlLg,
    borderRadius: radii.lg,
    fontFamily: typography.titleMediumFont,
    fontSize: typography.titleMediumSize,
    fontWeight: typography.titleMediumWeight,
    gap: spacing.sm,
    letterSpacing: typography.titleMediumTracking,
    lineHeight: typography.titleMediumLineHeight,
    paddingInline: spacing.lg,
  },
  xl: {
    blockSize: sizing.controlXl,
    borderRadius: radii.xl,
    fontFamily: typography.headlineSmallFont,
    fontSize: typography.headlineSmallSize,
    fontWeight: typography.headlineSmallWeight,
    gap: spacing.lg,
    letterSpacing: typography.headlineSmallTracking,
    lineHeight: typography.headlineSmallLineHeight,
    paddingInline: '28px',
  },
})

// The icon each size draws.
const fabIconSizes = stylex.create({
  lg: { fontSize: '28px' },
  md: { fontSize: '24px' },
  xl: { fontSize: '36px' },
})

// The six colour pairs: each tone's container pair, and the tone itself.
const tonal = stylex.create({
  primary: {
    backgroundColor: colors.primaryContainer,
    color: colors.onPrimaryContainer,
  },
  secondary: {
    backgroundColor: colors.secondaryContainer,
    color: colors.onSecondaryContainer,
  },
  tertiary: {
    backgroundColor: colors.tertiaryContainer,
    color: colors.onTertiaryContainer,
  },
})

const filled = stylex.create({
  primary: { backgroundColor: colors.primary, color: colors.onPrimary },
  secondary: { backgroundColor: colors.secondary, color: colors.onSecondary },
  tertiary: { backgroundColor: colors.tertiary, color: colors.onTertiary },
})

const fabTones = { filled, tonal }

export { extendedFabSizes, fabIconSizes, fabSizes, fabStyles, fabTones }
