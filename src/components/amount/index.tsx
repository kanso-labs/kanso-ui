import { useRender } from '@base-ui/react/use-render'
import * as stylex from '@stylexjs/stylex'

import { colors, typography } from '../../tokens/design.tokens.stylex'

// Deliberately sets no font-size. Amounts appear at four different sizes in
// the design — a ledger row, a person row, a hero figure, a settle-up total —
// and they differ in nothing else, so size is the container's decision.
// What must never vary is here: the mono face, tabular figures so a column of
// amounts lines up on the decimal point, and the weight the design gives
// every one of them.
const styles = stylex.create({
  base: {
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

type AmountProps = Omit<useRender.ComponentProps<'span'>, 'children'> & {
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

function Amount({
  currency = 'USD',
  locale,
  render,
  sign = 'auto',
  tone = 'auto',
  value,
  ...props
}: AmountProps) {
  // stylex.props() spreads after `props` for the same reason Text does it: it
  // wins over a consumer-supplied className rather than merging with one.
  return useRender({
    defaultTagName: 'span',
    props: {
      ...props,
      children: formatAmount(value, { currency, locale, sign }),
      ...stylex.props(styles.base, tones[resolveTone(value, tone)]),
    },
    render,
  })
}

// formatToParts rather than a replace over the formatted string, so only the
// sign is substituted. A blind replace would also hit a hyphen inside a
// locale's currency name or grouping, and locales that wrap negatives in
// parentheses have no minus to swap at all — both of which this leaves alone.
function formatAmount(
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

export type { AmountProps }

export default Amount
