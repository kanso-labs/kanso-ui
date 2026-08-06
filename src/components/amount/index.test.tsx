import * as stylex from '@stylexjs/stylex'
import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import Amount from '.'
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
function setup(props: Partial<Parameters<typeof Amount>[0]> = {}) {
  const view = render(
    <Amount data-testid="amount" locale="en-US" value={0} {...props} />,
  )
  return { ...view, amount: view.getByTestId('amount') }
}

describe('amount', () => {
  describe('formatting', () => {
    it('formats as currency in the given locale', () => {
      const { amount } = setup({ value: 1284.32 })
      expect(amount.textContent).toBe('$1,284.32')
    })

    it('follows the locale for currency and separators', () => {
      const { amount } = setup({
        currency: 'EUR',
        locale: 'de-DE',
        value: 1284.32,
      })
      // German formatting puts the symbol last and swaps the separators.
      expect(amount.textContent).toBe('1.284,32 €')
    })

    it('respects a currency with no minor units', () => {
      const { amount } = setup({
        currency: 'JPY',
        locale: 'ja-JP',
        value: 1284,
      })
      expect(amount.textContent).toBe('￥1,284')
    })
  })

  describe('the minus sign', () => {
    // Intl emits U+002D HYPHEN-MINUS. The two are visually near-identical, so
    // this asserts the code point rather than comparing against a literal
    // that would look correct either way in the source.
    it('renders a true minus sign rather than a hyphen', () => {
      const { amount } = setup({ value: -12.5 })
      expect(amount.textContent.codePointAt(0)).toBe(MINUS_SIGN)
      expect(amount.textContent).not.toContain(HYPHEN_MINUS)
    })

    it('leaves the rest of the formatted value alone', () => {
      const { amount } = setup({ value: -12.5 })
      expect(amount.textContent).toBe(
        `${String.fromCodePoint(MINUS_SIGN)}$12.50`,
      )
    })
  })

  describe('sign', () => {
    it('shows no sign on a positive value by default', () => {
      const { amount } = setup({ value: 42.5 })
      expect(amount.textContent).toBe('$42.50')
    })

    it('prefixes a positive value when told to always show the sign', () => {
      const { amount } = setup({ sign: 'always', value: 42.5 })
      expect(amount.textContent).toBe('+$42.50')
    })

    it('drops the sign from a negative value when told to show none', () => {
      const { amount } = setup({ sign: 'never', value: -12.5 })
      expect(amount.textContent).toBe('$12.50')
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
        const { amount, unmount } = setup({ value })
        expect(getComputedStyle(amount).color).toBe(expected[tone])
        unmount()
      }
    })

    it('reads negative zero as settled rather than owing', () => {
      const expected = toneColors()
      const { amount } = setup({ value: -0 })
      expect(getComputedStyle(amount).color).toBe(expected.neutral)
    })

    it('lets an explicit tone override the sign', () => {
      const expected = toneColors()
      const { amount } = setup({ tone: 'neutral', value: -12.5 })
      expect(getComputedStyle(amount).color).toBe(expected.neutral)
    })
  })

  describe('typography', () => {
    it('renders in the mono face with tabular figures', () => {
      const { amount } = setup({ value: 42.5 })
      const computed = getComputedStyle(amount)
      expect(computed.fontVariantNumeric).toBe('tabular-nums')
      expect(computed.fontFamily).toContain('Roboto Mono')
    })

    // Size is the container's decision, so the component must not set one —
    // otherwise the same element could not serve a ledger row and a hero.
    it('takes its size from the surrounding text', () => {
      const view = render(
        <div {...stylex.props(harnessStyles.larger)}>
          <Amount data-testid="amount" locale="en-US" value={42.5} />
        </div>,
      )
      expect(getComputedStyle(view.getByTestId('amount')).fontSize).toBe('37px')
    })
  })
})
