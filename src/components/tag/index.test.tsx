import * as stylex from '@stylexjs/stylex'
import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import Tag from '.'
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

function setup(props: Partial<Parameters<typeof Tag>[0]> = {}) {
  const view = render(
    <Tag data-testid="tag" {...props}>
      Label
    </Tag>,
  )
  return { ...view, tag: view.getByTestId('tag') }
}

const TONES = ['negative', 'neutral', 'positive', 'primary'] as const

describe('tag', () => {
  describe('structure', () => {
    it('renders a span carrying its children', () => {
      const { tag } = setup()
      expect(tag.tagName).toBe('SPAN')
      expect(tag.textContent).toBe('Label')
    })

    it('renders as another element when given one', () => {
      const { tag } = setup({ render: LIST_ITEM })
      expect(tag.tagName).toBe('LI')
      expect(tag.textContent).toBe('Label')
    })

    it('passes attributes through to the element', () => {
      const { tag } = setup({ id: 'status', title: 'Supporting line' })
      expect(tag.id).toBe('status')
      expect(tag.getAttribute('title')).toBe('Supporting line')
    })
  })

  // The line between this and Chip. A chip is a two-state button and says so
  // through aria-pressed; a tag that grew any of this would put a control
  // in the accessibility tree that nothing can operate.
  describe('semantics', () => {
    it('takes no interaction', () => {
      const { tag } = setup()
      expect(tag.getAttribute('role')).toBe(null)
      expect(tag.getAttribute('aria-pressed')).toBe(null)
      expect(tag.getAttribute('tabindex')).toBe(null)
      expect(tag.closest('button')).toBe(null)
    })
  })

  describe('tone', () => {
    it('gives each filled tone its own text colour', () => {
      const expected = filledRoleColors()
      // Guards the comparisons below: four roles that resolved to one colour
      // would make every assertion here pass without proving anything.
      expect(new Set(Object.values(expected)).size).toBe(4)

      for (const tone of TONES) {
        const { tag, unmount } = setup({ tone })
        expect(getComputedStyle(tag).color).toBe(expected[tone])
        unmount()
      }
    })

    it('colours the rule as well as the text when outlined', () => {
      const expected = outlinedRoleColors()
      expect(new Set(Object.values(expected)).size).toBe(4)

      for (const tone of TONES) {
        const { tag, unmount } = setup({ tone, variant: 'outlined' })
        expect(getComputedStyle(tag).borderTopColor).toBe(expected[tone])
        unmount()
      }
    })
  })

  describe('variant', () => {
    it('fills a container, or leaves the page showing through', () => {
      const filled = setup()
      const filledBackground = getComputedStyle(filled.tag).backgroundColor
      filled.unmount()

      const outlined = setup({ variant: 'outlined' })
      expect(getComputedStyle(outlined.tag).backgroundColor).toBe(
        'rgba(0, 0, 0, 0)',
      )
      // Without this the assertion above would also pass on a filled tag
      // that had quietly lost its container.
      expect(filledBackground).not.toBe('rgba(0, 0, 0, 0)')
    })

    // Filled keeps a transparent border rather than dropping it, so
    // emphasising one tag in a row does not nudge its neighbours.
    it('keeps the same footprint in both variants', () => {
      const filled = setup()
      const filledBox = filled.tag.getBoundingClientRect()
      expect(getComputedStyle(filled.tag).borderTopWidth).toBe('1px')
      filled.unmount()

      const outlined = setup({ variant: 'outlined' })
      const outlinedBox = outlined.tag.getBoundingClientRect()
      expect(getComputedStyle(outlined.tag).borderTopWidth).toBe('1px')

      expect(filledBox.width).toBe(outlinedBox.width)
      expect(filledBox.height).toBe(outlinedBox.height)
    })
  })

  describe('typography', () => {
    // Ports, counts and versions are what a tag mostly carries, and a
    // column of them down a list wobbles on proportional digits.
    it('renders figures on a fixed advance', () => {
      const { tag } = setup({ children: '01' })
      expect(getComputedStyle(tag).fontVariantNumeric).toBe('tabular-nums')
    })
  })
})
