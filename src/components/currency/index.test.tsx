import * as stylex from '@stylexjs/stylex'
import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import Currency from '.'
import { colors } from '../../tokens/design.tokens.stylex'

const MINUS_SIGN = 0x2212
const HYPHEN_MINUS = '-'

// Compared against elements styled straight from the tokens rather than hex
// literals, so the assertions pin which role a tone reaches for without also
// pinning what that role currently resolves to.
const probeStyles = stylex.create({
  negative: { color: colors.negative },
  neutral: { color: colors.onSurface },
  positive: { color: colors.positive },
})

const harnessStyles = stylex.create({
  larger: { fontSize: '37px' },
})

// Every case pins a locale. Left to the runtime these would assert against
// whatever locale the machine running them happens to use.
function setup(props: Partial<Parameters<typeof Currency>[0]> = {}) {
  const view = render(
    <Currency data-testid="currency" locale="en-US" value={0} {...props} />,
  )
  return { ...view, currency: view.getByTestId('currency') }
}

describe('currency', () => {
  describe('formatting', () => {
    it('formats as currency in the given locale', () => {
      const { currency } = setup({ value: 1284.32 })
      expect(currency.textContent).toBe('$1,284.32')
    })

    it('follows the locale for currency and separators', () => {
      const { currency } = setup({
        currency: 'EUR',
        locale: 'de-DE',
        value: 1284.32,
      })
      // German formatting puts the symbol last and swaps the separators.
      expect(currency.textContent).toBe('1.284,32 €')
    })

    it('respects a currency with no minor units', () => {
      const { currency } = setup({
        currency: 'JPY',
        locale: 'ja-JP',
        value: 1284,
      })
      expect(currency.textContent).toBe('￥1,284')
    })
  })

  describe('the minus sign', () => {
    // Intl emits U+002D HYPHEN-MINUS. The two are visually near-identical, so
    // this asserts the code point rather than comparing against a literal
    // that would look correct either way in the source.
    it('renders a true minus sign rather than a hyphen', () => {
      const { currency } = setup({ value: -12.5 })
      expect(currency.textContent.codePointAt(0)).toBe(MINUS_SIGN)
      expect(currency.textContent).not.toContain(HYPHEN_MINUS)
    })

    it('leaves the rest of the formatted value alone', () => {
      const { currency } = setup({ value: -12.5 })
      expect(currency.textContent).toBe(
        `${String.fromCodePoint(MINUS_SIGN)}$12.50`,
      )
    })
  })

  describe('sign', () => {
    it('shows no sign on a positive value by default', () => {
      const { currency } = setup({ value: 42.5 })
      expect(currency.textContent).toBe('$42.50')
    })

    it('prefixes a positive value when told to always show the sign', () => {
      const { currency } = setup({ sign: 'always', value: 42.5 })
      expect(currency.textContent).toBe('+$42.50')
    })

    it('drops the sign from a negative value when told to show none', () => {
      const { currency } = setup({ sign: 'never', value: -12.5 })
      expect(currency.textContent).toBe('$12.50')
    })
  })

  describe('tone', () => {
    function toneColors() {
      const probe = render(
        <div>
          <div data-testid="positive" {...stylex.props(probeStyles.positive)} />
          <div data-testid="negative" {...stylex.props(probeStyles.negative)} />
          <div data-testid="neutral" {...stylex.props(probeStyles.neutral)} />
        </div>,
      )
      const read = (id: string) => getComputedStyle(probe.getByTestId(id)).color
      const expected = {
        negative: read('negative'),
        neutral: read('neutral'),
        positive: read('positive'),
      }
      probe.unmount()
      return expected
    }

    it('derives the tone from the sign of the value', () => {
      const expected = toneColors()
      // Guards the comparisons below: three roles that resolved to one colour
      // would make every assertion here pass without proving anything.
      expect(new Set(Object.values(expected)).size).toBe(3)

      for (const [value, tone] of [
        [42.5, 'positive'],
        [-12.5, 'negative'],
        [0, 'neutral'],
      ] as const) {
        const { currency, unmount } = setup({ value })
        expect(getComputedStyle(currency).color).toBe(expected[tone])
        unmount()
      }
    })

    it('reads negative zero as settled rather than owing', () => {
      const expected = toneColors()
      const { currency } = setup({ value: -0 })
      expect(getComputedStyle(currency).color).toBe(expected.neutral)
    })

    it('lets an explicit tone override the sign', () => {
      const expected = toneColors()
      const { currency } = setup({ tone: 'neutral', value: -12.5 })
      expect(getComputedStyle(currency).color).toBe(expected.neutral)
    })
  })

  describe('typography', () => {
    it('renders in the mono face with tabular figures', () => {
      const { currency } = setup({ value: 42.5 })
      const computed = getComputedStyle(currency)
      expect(computed.fontVariantNumeric).toBe('tabular-nums')
      expect(computed.fontFamily).toContain('Roboto Mono')
    })

    // Size is the container's decision, so the component must not set one —
    // otherwise the same element could not serve a ledger row and a hero.
    it('takes its size from the surrounding text', () => {
      const view = render(
        <div {...stylex.props(harnessStyles.larger)}>
          <Currency data-testid="currency" locale="en-US" value={42.5} />
        </div>,
      )
      expect(getComputedStyle(view.getByTestId('currency')).fontSize).toBe(
        '37px',
      )
    })
  })
})
