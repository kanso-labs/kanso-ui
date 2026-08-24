import type { HTMLAttributes, ReactNode } from 'react'

import * as stylex from '@stylexjs/stylex'

import { useRipple } from '../../hooks/useRipple'
import { mergeStyles } from '../../styles/merge'
import {
  colors,
  spacing,
  stateLayerOpacity,
  typography,
} from '../../tokens/design.tokens.stylex'

// Laid out with flex rather than the grid the design draws. The design's
// three columns are `auto 1fr auto`, which is what flex does natively — and
// unlike a fixed three-column grid it stays correct when a row has no leading
// or no trailing content, where the remaining children would otherwise slide
// into the wrong columns.
//
// Rows align with each other through their leading content being the same
// size, not through a fixed column width: a list of Avatars all at one size
// lines up, and that is the same thing the design's 40px column achieves.
//
// The state layer composites over `transparent` rather than over a container
// colour, because a row's own background is transparent and it therefore
// tints whatever it happens to be sitting on — a card, or the page.
const styles = stylex.create({
  base: {
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderWidth: 0,
    color: colors.onSurface,
    display: 'flex',
    gap: spacing.lg,
    inlineSize: '100%',
    minBlockSize: '56px',
    paddingBlock: spacing.md,
    paddingInline: spacing.lg,
    position: 'relative',
    textAlign: 'start',
  },
  headline: {
    fontFamily: typography.labelLargeFont,
    fontSize: typography.labelLargeSize,
    fontWeight: typography.labelLargeWeight,
    letterSpacing: typography.labelLargeTracking,
    lineHeight: typography.labelLargeLineHeight,
  },
  interactive: {
    backgroundColor: {
      ':active': `color-mix(in srgb, ${colors.onSurface} calc(${stateLayerOpacity.pressed} * 100%), transparent)`,
      ':hover': `color-mix(in srgb, ${colors.onSurface} calc(${stateLayerOpacity.hover} * 100%), transparent)`,
      default: 'transparent',
    },
    cursor: 'pointer',
    font: 'inherit',
    outlineColor: colors.primary,
    // Drawn inside the row rather than around it, so a focused row inside a
    // list container shows its full ring instead of having the half that
    // falls outside clipped by the container's edge.
    outlineOffset: '-2px',
    outlineStyle: { ':focus-visible': 'solid', default: 'none' },
    outlineWidth: '2px',
  },
  // Prose wraps, so this column's min-content width is usually one word and
  // it shrinks happily. min-width: 0 is for the case that cannot wrap — a
  // long unbroken string, a URL, an email — where a flex item otherwise
  // refuses to go below its content's width and shoves the trailing slot off
  // the end of the row. Nothing here truncates; a headline that needs two
  // lines takes two, and the row grows past its 56px floor.
  main: {
    display: 'flex',
    flexDirection: 'column',
    flexGrow: 1,
    gap: spacing.xxs,
    minInlineSize: 0,
  },
  slot: {
    alignItems: 'center',
    display: 'flex',
    flexShrink: 0,
  },
  supporting: {
    color: colors.onSurfaceVariant,
    fontFamily: typography.bodySmallFont,
    fontSize: typography.bodySmallSize,
    fontWeight: typography.bodySmallWeight,
    letterSpacing: typography.bodySmallTracking,
    lineHeight: typography.bodySmallLineHeight,
  },
})

type ListItemProps = {
  /** The row's headline — the one thing it is mostly about. */
  children?: ReactNode
  /**
   * Renders a `<button>` that ripples and tints on hover, for a row that is
   * itself pressable. Leave it off for a row that only presents.
   * @default false
   */
  interactive?: boolean
  /** Content before the headline: an avatar, an icon, a checkbox. */
  leading?: ReactNode
  /** A second line under the headline, in the muted role. */
  supporting?: ReactNode
  /** Content after the headline, such as an amount or a control. */
  trailing?: ReactNode
} & HTMLAttributes<HTMLElement>

function ListItem({
  children,
  interactive = false,
  leading,
  supporting,
  trailing,
  ...props
}: ListItemProps) {
  const ripple = useRipple<HTMLButtonElement>(interactive)

  const content = (
    <>
      {leading === undefined ? null : (
        <span {...stylex.props(styles.slot)}>{leading}</span>
      )}
      <span {...stylex.props(styles.main)}>
        <span {...stylex.props(styles.headline)}>{children}</span>
        {supporting === undefined ? null : (
          <span {...stylex.props(styles.supporting)}>{supporting}</span>
        )}
      </span>
      {trailing === undefined ? null : (
        <span {...stylex.props(styles.slot)}>{trailing}</span>
      )}
    </>
  )

  if (!interactive) {
    return (
      <div {...props} {...mergeStyles(stylex.props(styles.base), props)}>
        {content}
      </div>
    )
  }

  return (
    <button
      type="button"
      {...ripple.handlers}
      {...props}
      {...mergeStyles(stylex.props(styles.base, styles.interactive), props)}
    >
      {content}
      {ripple.surface}
    </button>
  )
}

export type { ListItemProps }

export default ListItem
