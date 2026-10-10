'use client'

import * as stylex from '@stylexjs/stylex'
import { useLocale } from 'react-aria-components'

import type { RenderComponentProps } from '../../render/useRender'

import { useRender } from '../../render/useRender'
import { mergeStyles } from '../../styles/merge'
import { colors, typography } from '../../tokens/design.tokens.stylex'

// Deliberately sets no font-size. The same value turns up at several sizes —
// inside a list row, as a heading-scale figure, as a total — differing in
// nothing else, so the size is the container's decision. What must never vary
// is here: the mono face, tabular figures so a column of them lines up on the
// decimal point, and the medium weight that separates a figure from the prose
// around it.
//
// No Material Design page draws an amount. It is type alone: the mono face
// and medium weight from the type tokens, tabular figures, and the on surface
// role for the neutral tone. Positive and negative are the library's own
// roles, the pair Tag draws from as well.
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

type CurrencyProps = Omit<RenderComponentProps<'span'>, 'children'> & {
  /**
   * ISO 4217 code for the currency to format in.
   * @default 'USD'
   */
  currency?: string
  /**
   * BCP 47 locale to format for. Defaults to React Aria's `I18nProvider`, as
   * the date and number fields do, so an amount reads in the locale the app
   * set — and to the browser's language where there is no provider.
   */
  locale?: string
  /**
   * When to show the sign. `auto` shows one only on negatives, `always` also
   * prefixes positives with a plus, and `never` shows neither — which leaves
   * colour as the only thing separating a credit from a debt, so reach for it
   * only where the direction is already stated some other way.
   *
   * An amount that shows as zero carries no sign under any of them, since
   * there is nothing owed or owing: `-0.004` reads `$0.00`, not `−$0.00`.
   * @default 'auto'
   */
  sign?: CurrencySignDisplay
  /**
   * Which colour role to render in. `auto` follows the sign of the amount as
   * it is shown, so one that rounds to zero — float residue, or a fraction
   * of a cent — reads as neutral rather than as a gain or a debt.
   *
   * The positive and negative roles are guaranteed legible on the surface
   * family, which is what the library's own tokens and every demo scheme are
   * held to. Over a container of its own — a selected row, a filled card —
   * the pair is one colour family on top of another and is not guaranteed, so
   * a custom theme placing one there has to check that pair itself.
   * @default 'auto'
   */
  tone?: CurrencyTone
  /** The amount, in the currency's major units. */
  value: number
}

type CurrencySignDisplay = 'always' | 'auto' | 'never'

type CurrencyTone = 'auto' | 'negative' | 'neutral' | 'positive'

/**
 * An amount of money, formatted for the reader's locale in the mono face with
 * tabular figures, so a column of amounts lines up on the decimal point.
 * Negatives carry a true minus sign, and the tone follows the sign unless
 * `tone` names one.
 *
 * ```tsx
 * <Currency value={-42.5} currency="EUR" />
 * ```
 *
 * It sets no size of its own, so it takes the type around it: wrap it in a
 * Text, or put it in a heading, for a larger figure.
 *
 * The call site's `className` and `style` land on the element holding the
 * amount.
 */
function Currency({
  currency = 'USD',
  locale,
  render,
  sign = 'auto',
  tone = 'auto',
  value,
  ...props
}: CurrencyProps) {
  // React Aria holds the locale steady through hydration, where the runtime's
  // default differs between the server and the browser and the amount's text
  // would not match.
  const provided = useLocale().locale

  const amount = formatCurrency(value, {
    currency,
    fallbackLocale: provided,
    // An empty string asks for the provider's locale as `undefined` does —
    // it is what clearing a locale control leaves — rather than reaching the
    // formatter as a tag it rejects.
    locale: locale === undefined || locale === '' ? provided : locale,
    sign,
  })

  return useRender({
    defaultTagName: 'span',
    props: {
      ...props,
      children: amount.text,
      ...mergeStyles(
        stylex.props(
          styles.base,
          tones[resolveTone(value, tone, amount.shownAsZero)],
        ),
        props,
      ),
    },
    render,
  })
}

// Constructing an Intl.NumberFormat resolves the locale, loads the currency's
// data and builds the pattern; formatToParts on one already built skips all
// three, which measures about ten times cheaper per value. An instance is
// stateless once constructed, so one can be shared across every component
// asking for the same three options.
//
// What this saves is a mount and a changing amount, not an idle re-render:
// the React Compiler already memoises the call below on the four things it
// reads, so a component re-rendered with the same props never reaches here.
// That cache belongs to one component instance and counts `value` among its
// keys, which leaves two cases it cannot cover — a column of rows, where every
// instance has a cache of its own and each builds a formatter, and a single
// amount that ticks, where each new value misses.
//
// Unbounded on purpose. The keys are the option sets an app actually uses —
// its locales times its currencies times the three sign settings — so the map
// settles at that size rather than growing with renders or with values.
//
// A request the runtime rejects is cached too, under its own key, as the
// fallback it resolved to, so a bad pair costs one failed construction rather
// than one a render.
const formatters = new Map<string, ResolvedFormat>()

/**
 * A formatter, and the currency code written beside its number when it is
 * the decimal fallback for a code the runtime rejected.
 */
type ResolvedFormat = { code: null | string; formatter: Intl.NumberFormat }

// formatToParts rather than a replace over the formatted string, so only the
// sign is substituted. A blind replace would also hit a hyphen inside a
// locale's currency name or grouping, and locales that wrap negatives in
// parentheses have no minus to swap at all — both of which this leaves alone.
function formatCurrency(
  value: number,
  options: {
    currency: string
    fallbackLocale: string
    locale: string
    sign: CurrencySignDisplay
  },
) {
  const { code, formatter } = formatterFor(
    options.locale,
    options.currency,
    options.sign,
    options.fallbackLocale,
  )
  const parts = formatter.formatToParts(value)
  const amount = parts
    .map((part) => (part.type === 'minusSign' ? MINUS_SIGN : part.value))
    .join('')
  return {
    // Whether every digit shown is a zero, which is what the tone reads
    // rather than the raw value: the two never saw the same number before.
    shownAsZero: parts.every(
      (part) =>
        (part.type !== 'integer' && part.type !== 'fraction') ||
        /^0+$/.test(part.value),
    ),
    text: code === null || code === '' ? amount : `${amount} ${code}`,
  }
}

// The sign each setting asks Intl for. `negative` and `exceptZero` are the
// forms that leave a zero bare, which `auto` and `always` do not: they put a
// minus on any negative input, and a plus on any positive one, including
// those that round to a displayed zero.
const SIGN_DISPLAY = {
  always: 'exceptZero',
  auto: 'negative',
  never: 'never',
} as const satisfies Record<
  CurrencySignDisplay,
  Intl.NumberFormatOptions['signDisplay']
>

// A component that only shows an amount must not take the page down with it,
// and `new Intl.NumberFormat` throws for a malformed locale (`xx_YY`, an
// empty string) and for a currency code that is not one (`xx`, `US`). Valid
// input takes exactly the path it always did; the rest falls back. A locale
// the runtime rejects gives way to the provider's, and a currency code it
// rejects to the plain number in that locale with the code written after it,
// so the amount still reads and what was wrong with it stays visible.
//
// Nothing is logged: the library writes to the console nowhere, and a
// warning an app cannot turn off is not its to emit.
function formatterFor(
  locale: string,
  currency: string,
  sign: CurrencySignDisplay,
  fallbackLocale: string,
) {
  // Neither a BCP 47 locale nor an ISO 4217 code can contain a vertical bar
  // and `sign` is one of three known words, so joining on one cannot make two
  // different option sets share a key.
  const key = `${locale}|${currency}|${sign}|${fallbackLocale}`
  const cached = formatters.get(key)
  if (cached) {
    return cached
  }

  const usable = [locale, fallbackLocale].find(isLocale) ?? 'en-US'
  let resolved: ResolvedFormat
  try {
    resolved = {
      code: null,
      formatter: new Intl.NumberFormat(usable, {
        currency,
        signDisplay: SIGN_DISPLAY[sign],
        style: 'currency',
      }),
    }
  } catch {
    resolved = {
      code: currency,
      formatter: new Intl.NumberFormat(usable, {
        maximumFractionDigits: 2,
        minimumFractionDigits: 2,
        signDisplay: SIGN_DISPLAY[sign],
      }),
    }
  }
  formatters.set(key, resolved)
  return resolved
}

// Whether the runtime takes `tag` as a locale at all — one it parses, whether
// or not it has data for it, which it then fills in from the nearest it has.
function isLocale(tag: string) {
  try {
    return Intl.NumberFormat.supportedLocalesOf(tag).length >= 0
  } catch {
    return false
  }
}

// An amount shown as zero is neither owed nor owing, so it takes the neutral
// role whatever the raw value's sign: negative zero, a rounded-away debt and
// float residue all read as settled. Otherwise the sign decides.
function resolveTone(value: number, tone: CurrencyTone, shownAsZero: boolean) {
  if (tone !== 'auto') {
    return tone
  }
  if (shownAsZero) {
    return 'neutral'
  }
  if (value > 0) {
    return 'positive'
  }
  if (value < 0) {
    return 'negative'
  }
  return 'neutral'
}

export type { CurrencyProps, CurrencySignDisplay, CurrencyTone }

export default Currency
