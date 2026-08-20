import * as stylex from '@stylexjs/stylex'
import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import Badge from '.'
import { colors } from '../../tokens/design.tokens.stylex'

// Compared against elements styled straight from the tokens rather than hex
// literals, so the assertions pin which role a tone reaches for without also
// pinning what that role currently resolves to.
const probeStyles = stylex.create({
  negative: { color: colors.negative },
  onNegativeContainer: { color: colors.onNegativeContainer },
  onPositiveContainer: { color: colors.onPositiveContainer },
  onPrimaryContainer: { color: colors.onPrimaryContainer },
  onSurfaceVariant: { color: colors.onSurfaceVariant },
  outlineVariant: { color: colors.outlineVariant },
  positive: { color: colors.positive },
  primary: { color: colors.primary },
})

const LIST_ITEM = <li />

// The roles filled reaches for: an on-container colour against a container of
// its own, and the surface pairing for neutral.
function filledRoleColors() {
  const probe = render(
    <div>
      <div
        data-testid="negative"
        {...stylex.props(probeStyles.onNegativeContainer)}
      />
      <div
        data-testid="neutral"
        {...stylex.props(probeStyles.onSurfaceVariant)}
      />
      <div
        data-testid="positive"
        {...stylex.props(probeStyles.onPositiveContainer)}
      />
      <div
        data-testid="primary"
        {...stylex.props(probeStyles.onPrimaryContainer)}
      />
    </div>,
  )
  const read = (id: string) => getComputedStyle(probe.getByTestId(id)).color
  const expected = {
    negative: read('negative'),
    neutral: read('neutral'),
    positive: read('positive'),
    primary: read('primary'),
  }
  probe.unmount()
  return expected
}

// Outlined has no container, so it takes the tone at full strength — and
// neutral falls back to the border role every rule in the system draws from.
function outlinedRoleColors() {
  const probe = render(
    <div>
      <div data-testid="negative" {...stylex.props(probeStyles.negative)} />
      <div
        data-testid="neutral"
        {...stylex.props(probeStyles.outlineVariant)}
      />
      <div data-testid="positive" {...stylex.props(probeStyles.positive)} />
      <div data-testid="primary" {...stylex.props(probeStyles.primary)} />
    </div>,
  )
  const read = (id: string) => getComputedStyle(probe.getByTestId(id)).color
  const expected = {
    negative: read('negative'),
    neutral: read('neutral'),
    positive: read('positive'),
    primary: read('primary'),
  }
  probe.unmount()
  return expected
}

function setup(props: Partial<Parameters<typeof Badge>[0]> = {}) {
  const view = render(
    <Badge data-testid="badge" {...props}>
      Label
    </Badge>,
  )
  return { ...view, badge: view.getByTestId('badge') }
}

const TONES = ['negative', 'neutral', 'positive', 'primary'] as const

describe('badge', () => {
  describe('structure', () => {
    it('renders a span carrying its children', () => {
      const { badge } = setup()
      expect(badge.tagName).toBe('SPAN')
      expect(badge.textContent).toBe('Label')
    })

    it('renders as another element when given one', () => {
      const { badge } = setup({ render: LIST_ITEM })
      expect(badge.tagName).toBe('LI')
      expect(badge.textContent).toBe('Label')
    })

    it('passes attributes through to the element', () => {
      const { badge } = setup({ id: 'status', title: 'Supporting line' })
      expect(badge.id).toBe('status')
      expect(badge.getAttribute('title')).toBe('Supporting line')
    })
  })

  // The line between this and Chip. A chip is a two-state button and says so
  // through aria-pressed; a badge that grew any of this would put a control
  // in the accessibility tree that nothing can operate.
  describe('semantics', () => {
    it('takes no interaction', () => {
      const { badge } = setup()
      expect(badge.getAttribute('role')).toBe(null)
      expect(badge.getAttribute('aria-pressed')).toBe(null)
      expect(badge.getAttribute('tabindex')).toBe(null)
      expect(badge.closest('button')).toBe(null)
    })
  })

  describe('tone', () => {
    it('gives each filled tone its own text colour', () => {
      const expected = filledRoleColors()
      // Guards the comparisons below: four roles that resolved to one colour
      // would make every assertion here pass without proving anything.
      expect(new Set(Object.values(expected)).size).toBe(4)

      for (const tone of TONES) {
        const { badge, unmount } = setup({ tone })
        expect(getComputedStyle(badge).color).toBe(expected[tone])
        unmount()
      }
    })

    it('colours the rule as well as the text when outlined', () => {
      const expected = outlinedRoleColors()
      expect(new Set(Object.values(expected)).size).toBe(4)

      for (const tone of TONES) {
        const { badge, unmount } = setup({ tone, variant: 'outlined' })
        expect(getComputedStyle(badge).borderTopColor).toBe(expected[tone])
        unmount()
      }
    })
  })

  describe('variant', () => {
    it('fills a container, or leaves the page showing through', () => {
      const filled = setup()
      const filledBackground = getComputedStyle(filled.badge).backgroundColor
      filled.unmount()

      const outlined = setup({ variant: 'outlined' })
      expect(getComputedStyle(outlined.badge).backgroundColor).toBe(
        'rgba(0, 0, 0, 0)',
      )
      // Without this the assertion above would also pass on a filled badge
      // that had quietly lost its container.
      expect(filledBackground).not.toBe('rgba(0, 0, 0, 0)')
    })

    // Filled keeps a transparent border rather than dropping it, so
    // emphasising one badge in a row does not nudge its neighbours.
    it('keeps the same footprint in both variants', () => {
      const filled = setup()
      const filledBox = filled.badge.getBoundingClientRect()
      expect(getComputedStyle(filled.badge).borderTopWidth).toBe('1px')
      filled.unmount()

      const outlined = setup({ variant: 'outlined' })
      const outlinedBox = outlined.badge.getBoundingClientRect()
      expect(getComputedStyle(outlined.badge).borderTopWidth).toBe('1px')

      expect(filledBox.width).toBe(outlinedBox.width)
      expect(filledBox.height).toBe(outlinedBox.height)
    })
  })

  describe('typography', () => {
    // Ports, counts and versions are what a badge mostly carries, and a
    // column of them down a list wobbles on proportional digits.
    it('renders figures on a fixed advance', () => {
      const { badge } = setup({ children: '01' })
      expect(getComputedStyle(badge).fontVariantNumeric).toBe('tabular-nums')
    })
  })
})
