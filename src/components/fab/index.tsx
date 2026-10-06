'use client'

import type { ReactNode, RefAttributes } from 'react'
import type {
  ClassNameOrFunction,
  StyleOrFunction,
} from 'react-aria-components'

import * as stylex from '@stylexjs/stylex'

import type { ButtonDOMProps, ButtonState } from '../../button'

import { ButtonBase } from '../../button'
import { focus } from '../../styles/focus'
import {
  colors,
  radii,
  shadows,
  sizing,
  spacing,
  stateLayerOpacity,
  typography,
} from '../../tokens/design.tokens.stylex'

// The FAB page's floating action button, and the extended FAB page's form of
// it with a label: a screen's primary action, raised over the content on the
// pages' level 3 shadow and lifted to level 4 under a hovering pointer.
//
// Three sizes, the pages' FAB, medium FAB and large FAB: `md` is 56dp with a
// 24dp icon and a 16dp corner, `lg` 80dp with 28dp and 20dp, and `xl` 96dp
// with 36dp and 28dp. The extended form keeps the size's height and corner
// and sets a label after the icon in the size's type role — title medium,
// title large and headline small — with 16dp, 26dp and 28dp of padding and
// 8dp, 12dp and 16dp before the label. The 80dp size, the 20dp corner and
// the 26dp and 28dp paddings fall between steps of their scales and are
// written out. The pages' small FAB is gone from the newer set, so there is
// no `xs`.
//
// Six colour pairs, by `tone` and `variant`: `tonal` draws the tone's
// container pair — primary container is the pages' default — and `filled`
// the tone itself, as Button's two variants of those names do.
//
// The hover, focus and pressed layers are the label colour at the usual 8%,
// 10% and 10%, drawn as an image over the container, as the row module draws
// its layers, so one style serves all six pairs. The pages give no disabled
// FAB; a disabled one takes the 12% and 38% every disabled container takes,
// and drops its shadow.
//
// Under forced colours the shadow goes and the container is painted over, so
// the button is drawn as a 1px `ButtonText` rule, as Button's are.
//
// What every button does past its own styles — the ripple, the link form, a
// parent's disabled state — is `src/button`'s, shared with Button and
// IconButton.

// Windows High Contrast and the rest of the forced-colours modes. Spelled
// here rather than imported, for the reason src/field/styles.ts records: the
// StyleX compiler resolves a constant across files only out of a `.stylex.ts`
// module, and the generated one holds design tokens rather than queries.
const FORCED_COLORS = '@media (forced-colors: active)'

// The medium FAB's container and corner, between the steps of the control
// and radius scales.
const MEDIUM_SIZE = '80px'
const MEDIUM_CORNER = '20px'

const styles = stylex.create({
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
const extendedSizes = stylex.create({
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
const iconSizes = stylex.create({
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

const VARIANTS = { filled, tonal }

type FabProps = {
  /**
   * What the FAB does, in words. A FAB without a `label` is an icon alone,
   * which has no name of its own, so give it this; with a `label` the label
   * is its name.
   */
  'aria-label'?: string
  /** The FAB's icon, drawn at the size's icon size. */
  children?: ReactNode
  /** A function may compute the class from the FAB's render state. */
  className?: ClassNameOrFunction<ButtonState>
  /**
   * Disables the press ripple. The state layers are unaffected.
   * @default false
   */
  disableRipple?: boolean
  /**
   * Where the FAB leads. Given one, it is rendered as a link — an `<a>`,
   * announced as the link it is — with the same styles and ripple.
   */
  href?: string
  /**
   * A label after the icon, which makes this the extended FAB: as tall as
   * the size, as wide as what it holds.
   */
  label?: ReactNode
  /** The link's `rel`, when `href` is set. */
  rel?: string
  /**
   * The pages' three sizes: `md` the FAB at 56px, `lg` the medium FAB at
   * 80px and `xl` the large FAB at 96px.
   * @default 'md'
   */
  size?: FabSize
  /** A function may compute the style from the FAB's render state. */
  style?: StyleOrFunction<ButtonState>
  /** The link's `target`, when `href` is set. */
  target?: string
  /**
   * The colour role the FAB is drawn in.
   * @default 'primary'
   */
  tone?: FabTone
  /**
   * `tonal` draws the tone's container pair, the pages' default; `filled`
   * draws the tone itself.
   * @default 'tonal'
   */
  variant?: FabVariant
} & Omit<ButtonDOMProps, 'isPending'>

type FabSize = 'lg' | 'md' | 'xl'

type FabTone = 'primary' | 'secondary' | 'tertiary'

type FabVariant = 'filled' | 'tonal'

/**
 * A screen's primary action, raised over its content. Its icon is its
 * children; given a `label` it is the extended FAB, with the label after the
 * icon. Given `href` it is a link with the same appearance.
 *
 * ```tsx
 * <Fab aria-label="Label">
 *   <PlusIcon />
 * </Fab>
 * ```
 */
function Fab({
  children,
  label,
  size = 'md',
  tone = 'primary',
  variant = 'tonal',
  ...props
}: FabProps & RefAttributes<HTMLAnchorElement | HTMLButtonElement>) {
  return (
    <ButtonBase
      {...props}
      classes={fabClasses(label !== undefined, size, tone, variant)}
    >
      {children === undefined ? null : (
        <span {...stylex.props(styles.icon, iconSizes[size])}>{children}</span>
      )}
      {label}
    </ButtonBase>
  )
}

// The FAB's classes, from React Aria's render state: the layers from what it
// reports rather than from `:hover` and `:active`, for Button's reasons — see
// its header. Built by a call rather than written inline at the prop, which
// is what react-perf's no-new-function-as-prop is after.
function fabClasses(
  isExtended: boolean,
  size: FabSize,
  tone: FabTone,
  variant: FabVariant,
) {
  return (state: ButtonState) =>
    stylex.props(
      styles.base,
      focus.ring,
      VARIANTS[variant][tone],
      isExtended ? extendedSizes[size] : fabSizes[size],
      state.isHovered && styles.hovered,
      state.isFocusVisible && styles.focused,
      state.isPressed && styles.pressed,
      state.isDisabled && styles.disabled,
    )
}

export type { FabProps, FabSize, FabTone, FabVariant }

export default Fab
