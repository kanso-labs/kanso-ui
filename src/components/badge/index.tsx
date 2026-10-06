'use client'

import * as stylex from '@stylexjs/stylex'
import { useLocale } from 'react-aria-components'

import type { RenderComponentProps } from '../../render/useRender'

import { useRender } from '../../render/useRender'
import { mergeStyles } from '../../styles/merge'
import {
  colors,
  radii,
  spacing,
  typography,
} from '../../tokens/design.tokens.stylex'

// The badges page's badge: a mark on the corner of an icon that flags
// something new there, either as the 6dp small badge or as the 16dp large
// badge holding a count. Both are the error pair — the error role, with the
// count in on error — on a full corner, and the count is label small, capped
// at four characters with a plus, as "999+".
//
// The badge wraps what it is drawn on, usually an icon, and places the mark
// against that element's box, which is what the page measures from. The
// small badge fills the icon's top trailing 6dp square. The large badge's
// bottom leading corner sits 14dp down and 12dp in from the icon's top
// trailing corner, so it stands 2dp above the icon and grows toward the end
// as its count lengthens, to the page's 34dp at "999+". Both are logical
// insets, so the mark stays on the trailing corner under right-to-left.
//
// Given nothing to wrap, the badge is the mark alone, standing in the line
// rather than over a corner. That is the form the tabs page draws after a
// label with no icon above it.
//
// The mark is hidden from assistive technology. A count read on its own is a
// number with no subject; it belongs in the name of the control it sits on,
// where a reader meets it with what it counts — "Notifications, 3 new" — and
// the stories show it there.
//
// Under forced colours the error fill is painted over in the mode's
// background, which left the small badge as nothing at all. It takes a 1px
// border there instead, which the mode keeps and paints in its text colour.

// Windows High Contrast and the rest of the forced-colours modes. Spelled
// here rather than imported, for the reason src/field/styles.ts records: the
// StyleX compiler resolves a constant across files only out of a `.stylex.ts`
// module, and the generated one holds design tokens rather than queries.
const FORCED_COLORS = '@media (forced-colors: active)'

const styles = stylex.create({
  // What the badge is drawn on. It shrinks to what it holds, so its box is
  // the icon's and the mark lands where the page puts it.
  anchor: {
    boxSizing: 'border-box',
    display: 'inline-flex',
    position: 'relative',
  },
  // A badge with nothing to be drawn on: the mark in the line, where the
  // text before it puts it, so the insets below place nothing.
  inFlow: {
    position: 'static',
  },
  // The page's large badge, holding a count: 16dp tall and at least as wide,
  // 4dp either side of its count in label small.
  large: {
    alignItems: 'center',
    blockSize: '16px',
    color: colors.onError,
    display: 'flex',
    fontFamily: typography.labelSmallFont,
    fontSize: typography.labelSmallSize,
    fontVariantNumeric: 'tabular-nums',
    fontWeight: typography.labelSmallWeight,
    insetBlockStart: '-2px',
    insetInlineStart: 'calc(100% - 12px)',
    justifyContent: 'center',
    letterSpacing: typography.labelSmallTracking,
    lineHeight: typography.labelSmallLineHeight,
    minInlineSize: '16px',
    paddingInline: spacing.xs,
    whiteSpace: 'nowrap',
  },
  // The fill and corner both badges share, and the border forced colours
  // draw in place of the fill.
  mark: {
    backgroundColor: colors.error,
    borderColor: { default: null, [FORCED_COLORS]: 'CanvasText' },
    borderRadius: radii.pill,
    borderStyle: { default: null, [FORCED_COLORS]: 'solid' },
    borderWidth: { default: null, [FORCED_COLORS]: '1px' },
    boxSizing: 'border-box',
    pointerEvents: 'none',
    position: 'absolute',
  },
  // The page's small badge, flagging without counting.
  small: {
    blockSize: '6px',
    inlineSize: '6px',
    insetBlockStart: 0,
    insetInlineEnd: 0,
  },
})

type BadgeProps = RenderComponentProps<'span'> & {
  /**
   * The number to show, which draws the page's large badge. Left out, the
   * badge is the small 6dp dot, which flags without counting. A count of 0
   * still draws, so leave the badge out when there is nothing to count.
   */
  count?: number
  /**
   * The largest count drawn as itself. Above it the badge reads `max` and a
   * plus, which is the page's 999+ at the default.
   * @default 999
   */
  max?: number
}

/**
 * A badge on the corner of what it wraps, usually an icon: the small dot,
 * or with `count` the large badge holding a number. The mark is hidden from
 * assistive technology, so put what it says in the name of the control it
 * sits on.
 *
 * ```tsx
 * <IconButton aria-label="Notifications, 3 new">
 *   <Badge count={3}>
 *     <BellIcon />
 *   </Badge>
 * </IconButton>
 * ```
 *
 * Given no children, the mark stands alone in the line, as a tab draws it
 * after its label.
 *
 * The call site's `className` and `style` land on the element wrapping what
 * the badge is drawn on.
 */
function Badge({ children, count, max = 999, render, ...props }: BadgeProps) {
  const { locale } = useLocale()
  const numbers = new Intl.NumberFormat(locale)
  const label =
    count === undefined
      ? undefined
      : count > max
        ? `${numbers.format(max)}+`
        : numbers.format(count)

  return useRender({
    defaultTagName: 'span',
    props: {
      ...props,
      ...mergeStyles(stylex.props(styles.anchor), props),
      children: (
        <>
          {children}
          <span
            aria-hidden="true"
            {...stylex.props(
              styles.mark,
              label === undefined ? styles.small : styles.large,
              (children === undefined || children === null) && styles.inFlow,
            )}
          >
            {label}
          </span>
        </>
      ),
    },
    render,
  })
}

export type { BadgeProps }

export default Badge
