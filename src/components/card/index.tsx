import type { HTMLAttributes, ReactNode } from 'react'

import * as stylex from '@stylexjs/stylex'

import { useRipple } from '../../hooks/useRipple'
import {
  colors,
  radii,
  shadows,
  spacing,
  stateLayerOpacity,
} from '../../tokens/design.tokens.stylex'

// The three variants differ only in how they separate themselves from the
// page: a shadow, a darker fill, or a border. Each therefore sits on a
// different background, which is why the interaction styles below are keyed
// by variant too — a state layer composites an 'on-color' over whatever the
// container already is, so it cannot be written once for all three.
//
// color-mix() is inlined at each property rather than factored into a helper:
// @stylexjs/babel-plugin only statically recognizes expressions written
// directly as property values. Button's header comment records the same
// constraint, and the :not(:disabled) guard there applies here for the same
// reason — stylex's fixed pseudo-class ordering puts :hover after :disabled.
const styles = stylex.create({
  base: {
    borderRadius: radii.lg,
    borderWidth: 0,
    display: 'block',
    // A child that reaches the card's edges — a row in a list, an image
    // across the top — is square where the card is round, so its background
    // paints over the corner arcs unless the card clips. The rounding is the
    // card's, so containing it is the card's job too: nothing a child can
    // set fixes this, since a row has no way to know it is the first or last
    // one and so no way to round only the corners that need it.
    //
    // Clips the card's contents, not the card: an element's own box-shadow
    // and outline are drawn outside its border box and are unaffected, which
    // is what keeps the elevated variant's shadow and the interactive
    // variant's focus ring intact.
    overflow: 'hidden',
    // Positioning context for the ripple surface, which fills the card.
    position: 'relative',
  },
  elevated: {
    backgroundColor: colors.surfaceContainerLow,
    boxShadow: shadows.elevation1,
  },
  filled: {
    backgroundColor: colors.surfaceContainerHighest,
  },
  // Resets the parts of a <button> that would otherwise fight the card: its
  // centred text, its own font, and its shrink-to-fit width. Without these an
  // interactive card would lay its contents out differently from a static one
  // holding exactly the same children.
  interactive: {
    cursor: 'pointer',
    font: 'inherit',
    inlineSize: '100%',
    outlineColor: colors.primary,
    outlineOffset: '2px',
    outlineStyle: { ':focus-visible': 'solid', default: 'none' },
    outlineWidth: '2px',
    textAlign: 'start',
  },
  outlined: {
    backgroundColor: colors.surface,
    borderColor: colors.outlineVariant,
    borderStyle: 'solid',
    borderWidth: '1px',
  },
  // A card holding a list wants none, so its rows can run to the edges and
  // the separators between them can span the full width. That is the whole
  // of the design's "bordered list container" — an outlined card with no
  // padding of its own — which is why there is no separate List component.
  paddingDefault: {
    padding: spacing.lg,
  },
  paddingNone: {
    padding: 0,
  },
})

const interactionStyles = stylex.create({
  elevated: {
    backgroundColor: {
      ':active': `color-mix(in srgb, ${colors.onSurface} calc(${stateLayerOpacity.pressed} * 100%), ${colors.surfaceContainerLow})`,
      ':hover': `color-mix(in srgb, ${colors.onSurface} calc(${stateLayerOpacity.hover} * 100%), ${colors.surfaceContainerLow})`,
      default: colors.surfaceContainerLow,
    },
    boxShadow: {
      ':active': shadows.elevation1,
      ':hover': shadows.elevation2,
      default: shadows.elevation1,
    },
  },
  filled: {
    backgroundColor: {
      ':active': `color-mix(in srgb, ${colors.onSurface} calc(${stateLayerOpacity.pressed} * 100%), ${colors.surfaceContainerHighest})`,
      ':hover': `color-mix(in srgb, ${colors.onSurface} calc(${stateLayerOpacity.hover} * 100%), ${colors.surfaceContainerHighest})`,
      default: colors.surfaceContainerHighest,
    },
  },
  outlined: {
    backgroundColor: {
      ':active': `color-mix(in srgb, ${colors.onSurface} calc(${stateLayerOpacity.pressed} * 100%), ${colors.surface})`,
      ':hover': `color-mix(in srgb, ${colors.onSurface} calc(${stateLayerOpacity.hover} * 100%), ${colors.surface})`,
      default: colors.surface,
    },
  },
})

// Typed as the attributes a <div> and a <button> both accept, because
// `interactive` decides which one renders. Anything element-specific — a
// button's `type`, a div's ref type — would be wrong for one of the two, so
// the shared surface is what the prop type can honestly promise.
type CardProps = {
  children?: ReactNode
  /**
   * Renders a `<button>` that ripples and lifts on hover, for a card that is
   * itself the thing you press. Leave it off for a card that merely holds
   * content, including one containing its own buttons.
   * @default false
   */
  interactive?: boolean
  /**
   * `none` removes the card's own padding, for a card whose children run to
   * its edges — a list of rows separated by rules.
   * @default 'default'
   */
  padding?: 'default' | 'none'
  /**
   * How the card separates itself from the page: `elevated` casts a shadow,
   * `filled` sits on a darker surface, `outlined` draws a border.
   * @default 'elevated'
   */
  variant?: CardVariant
} & HTMLAttributes<HTMLElement>

type CardVariant = 'elevated' | 'filled' | 'outlined'

function Card({
  children,
  interactive = false,
  padding = 'default',
  variant = 'elevated',
  ...props
}: CardProps) {
  const ripple = useRipple<HTMLButtonElement>(interactive)
  const padded = padding === 'none' ? styles.paddingNone : styles.paddingDefault

  if (!interactive) {
    return (
      <div {...props} {...stylex.props(styles.base, styles[variant], padded)}>
        {children}
      </div>
    )
  }

  return (
    <button
      type="button"
      {...ripple.handlers}
      {...props}
      {...stylex.props(
        styles.base,
        styles[variant],
        padded,
        styles.interactive,
        interactionStyles[variant],
      )}
    >
      {children}
      {ripple.surface}
    </button>
  )
}

export type { CardProps }

export default Card
