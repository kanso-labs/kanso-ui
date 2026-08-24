import { useRender } from '@base-ui/react/use-render'
import * as stylex from '@stylexjs/stylex'

import { mergeStyles } from '../../styles/merge'
import { colors, typography } from '../../tokens/design.tokens.stylex'

// Deliberately sets no font-size. The same value turns up at several sizes —
// inside a list row, as a heading-scale figure, as a total — differing in
// nothing else, so the size is the container's decision. What must never vary
// is here: the mono face, tabular figures so a column of them lines up on the
// decimal point, and the medium weight that separates a figure from the prose
// around it.
const styles = stylex.create({
  base: {
    boxSizing: 'border-box',
    fontFamily: typography.fontFamilyMono,
    fontVariantNumeric: 'tabular-nums',
    fontWeight: typography.weightMedium,
  },
})

const tones = stylex.create({
  negative: {
    color: colors.negative,
  },
  neutral: {
    color: colors.onSurface,
  },
  positive: {
    color: colors.positive,
  },
})

// U+2212 MINUS SIGN, not the U+002D hyphen Intl actually emits. The hyphen is
// a typographic stand-in: it is narrower than the plus it pairs with and does
// not sit on the same optical centre as the digits, which shows up as a
// wobbling column the moment amounts are stacked.
const MINUS_SIGN = '−'

type CurrencyProps = Omit<useRender.ComponentProps<'span'>, 'children'> & {
  /**
   * ISO 4217 code for the currency to format in.
   * @default 'USD'
   */
  currency?: string
  /**
   * BCP 47 locale to format for. Defaults to the runtime's own locale, so an
   * app that has not chosen one still formats the way its reader expects.
   */
  locale?: string
  /**
   * When to show the sign. `auto` shows one only on negatives, `always` also
   * prefixes positives with a plus, and `never` shows neither — which leaves
   * colour as the only thing separating a credit from a debt, so reach for it
   * only where the direction is already stated some other way.
   * @default 'auto'
   */
  sign?: SignDisplay
  /**
   * Which colour role to render in. `auto` follows the sign of `value`, with
   * zero reading as neutral.
   * @default 'auto'
   */
  tone?: Tone
  /** The amount, in the currency's major units. */
  value: number
}

type SignDisplay = 'always' | 'auto' | 'never'

type Tone = 'auto' | 'negative' | 'neutral' | 'positive'

function Currency({
  currency = 'USD',
  locale,
  render,
  sign = 'auto',
  tone = 'auto',
  value,
  ...props
}: CurrencyProps) {
  return useRender({
    defaultTagName: 'span',
    props: {
      ...props,
      children: formatCurrency(value, { currency, locale, sign }),
      ...mergeStyles(
        stylex.props(styles.base, tones[resolveTone(value, tone)]),
        props,
      ),
    },
    render,
  })
}

// formatToParts rather than a replace over the formatted string, so only the
// sign is substituted. A blind replace would also hit a hyphen inside a
// locale's currency name or grouping, and locales that wrap negatives in
// parentheses have no minus to swap at all — both of which this leaves alone.
function formatCurrency(
  value: number,
  options: { currency: string; locale: string | undefined; sign: SignDisplay },
) {
  return new Intl.NumberFormat(options.locale, {
    currency: options.currency,
    signDisplay: options.sign,
    style: 'currency',
  })
    .formatToParts(value)
    .map((part) => (part.type === 'minusSign' ? MINUS_SIGN : part.value))
    .join('')
}

// Zero is neither owed nor owing, so it takes the neutral role rather than
// being forced into one of the two. Negative zero lands here too, which is
// what a rounded-away debt should read as.
function resolveTone(value: number, tone: Tone) {
  if (tone !== 'auto') {
    return tone
  }
  if (value > 0) {
    return 'positive'
  }
  if (value < 0) {
    return 'negative'
  }
  return 'neutral'
}

export type { CurrencyProps }

export default Currency
