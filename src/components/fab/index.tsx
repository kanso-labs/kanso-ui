'use client'

import type { ReactNode, RefAttributes } from 'react'
import type {
  ClassNameOrFunction,
  StyleOrFunction,
} from 'react-aria-components'

import * as stylex from '@stylexjs/stylex'

import type { ButtonDOMProps, ButtonState } from '../../button'

import { ButtonBase } from '../../button'
import {
  extendedFabSizes,
  fabIconSizes,
  fabSizes,
  fabStyles,
  fabTones,
} from '../../fab/styles'
import { focus } from '../../styles/focus'

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
// IconButton. The styles below are `src/fab`'s, shared with FabMenu's FAB.

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
        <span {...stylex.props(fabStyles.icon, fabIconSizes[size])}>
          {children}
        </span>
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
      fabStyles.base,
      focus.ring,
      fabTones[variant][tone],
      isExtended ? extendedFabSizes[size] : fabSizes[size],
      state.isHovered && fabStyles.hovered,
      state.isFocusVisible && fabStyles.focused,
      state.isPressed && fabStyles.pressed,
      state.isDisabled && fabStyles.disabled,
    )
}

export type { FabProps, FabSize, FabTone, FabVariant }

export default Fab
