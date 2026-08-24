import { useRender } from '@base-ui/react/use-render'
import * as stylex from '@stylexjs/stylex'

import { mergeStyles } from '../../styles/merge'
import {
  colors,
  radii,
  spacing,
  typography,
} from '../../tokens/design.tokens.stylex'

// A badge states something about what it sits beside — a count, a status, a
// version — and is never itself the thing you press. That is the whole line
// between this and Chip: a chip is a two-state button announcing itself
// through `aria-pressed`, so reaching for one to render a read-only label
// puts a control in the accessibility tree that nothing can operate.
//
// Both variants carry a 1px border and `filled` makes it transparent rather
// than dropping it, so a badge is the same size either way. Emphasising one
// badge in a row otherwise nudges its neighbours by a pixel each side.
//
// Tabular figures are unconditional, for the same reason Currency sets them:
// what ends up in a badge is mostly numeric — counts, versions, ports — and a
// stack of them down a list wobbles on proportional digits. Text that happens
// to carry no digits is unaffected.
const styles = stylex.create({
  base: {
    alignItems: 'center',
    borderRadius: radii.sm,
    borderStyle: 'solid',
    borderWidth: '1px',
    display: 'inline-flex',
    flexShrink: 0,
    fontFamily: typography.labelSmallFont,
    fontSize: typography.labelSmallSize,
    fontVariantNumeric: 'tabular-nums',
    fontWeight: typography.labelSmallWeight,
    gap: spacing.xs,
    letterSpacing: typography.labelSmallTracking,
    lineHeight: typography.labelSmallLineHeight,
    paddingBlock: spacing.xxs,
    paddingInline: spacing.sm,
    // A badge labels something else, so it should not be the element that
    // decides a row can wrap. `:6767` broken across two lines is unreadable.
    whiteSpace: 'nowrap',
  },
})

// `neutral` draws from the surface roles rather than a colour of its own,
// which is what lets it state something without ranking it. The other three
// name a direction, and are the same three Currency uses, plus primary for
// the notable-but-not-good-or-bad case. `error` is deliberately absent:
// negative already covers it, and offering both would leave the choice
// between them to taste.
const filledTones = stylex.create({
  negative: {
    backgroundColor: colors.negativeContainer,
    borderColor: 'transparent',
    color: colors.onNegativeContainer,
  },
  neutral: {
    backgroundColor: colors.surfaceContainerHighest,
    borderColor: 'transparent',
    color: colors.onSurfaceVariant,
  },
  positive: {
    backgroundColor: colors.positiveContainer,
    borderColor: 'transparent',
    color: colors.onPositiveContainer,
  },
  primary: {
    backgroundColor: colors.primaryContainer,
    borderColor: 'transparent',
    color: colors.onPrimaryContainer,
  },
})

// Outlined takes the tone at full strength for both the rule and the text,
// rather than the on-container pairing filled uses. There is no container
// here for an on-colour to be legible against — the page is the background —
// so the container roles would read as washed out.
const outlinedTones = stylex.create({
  negative: {
    backgroundColor: 'transparent',
    borderColor: colors.negative,
    color: colors.negative,
  },
  neutral: {
    backgroundColor: 'transparent',
    borderColor: colors.outlineVariant,
    color: colors.onSurfaceVariant,
  },
  positive: {
    backgroundColor: 'transparent',
    borderColor: colors.positive,
    color: colors.positive,
  },
  primary: {
    backgroundColor: 'transparent',
    borderColor: colors.primary,
    color: colors.primary,
  },
})

type BadgeProps = useRender.ComponentProps<'span'> & {
  /**
   * Which colour role the badge carries. `neutral` states without ranking;
   * the other three read as good, bad, or worth noticing.
   * @default 'neutral'
   */
  tone?: BadgeTone
  /**
   * How much weight the badge pulls. `filled` sits on a container of its own;
   * `outlined` is a rule on the page, for a badge that should not compete
   * with the thing it labels.
   * @default 'filled'
   */
  variant?: BadgeVariant
}

type BadgeTone = 'negative' | 'neutral' | 'positive' | 'primary'

type BadgeVariant = 'filled' | 'outlined'

/**
 * A short, read-only label attached to something else. It renders a `<span>`
 * and takes no interaction — for a label that can be selected, reach for Chip.
 */
function Badge({
  render,
  tone = 'neutral',
  variant = 'filled',
  ...props
}: BadgeProps) {
  const toned = variant === 'filled' ? filledTones[tone] : outlinedTones[tone]

  return useRender({
    defaultTagName: 'span',
    props: {
      ...props,
      ...mergeStyles(stylex.props(styles.base, toned), props),
    },
    render,
  })
}

export type { BadgeProps }

export default Badge
