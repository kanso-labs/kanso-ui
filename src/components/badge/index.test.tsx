import * as stylex from '@stylexjs/stylex'
import { render } from '@testing-library/react'
import { I18nProvider } from 'react-aria-components'
import { describe, expect, it } from 'vitest'

import Badge from '.'
import { declarationsHeld } from '../../styles/stylesheet.testing'
import { colors, typography } from '../../tokens/design.tokens.stylex'
import IconButton from '../icon-button'

// The badge is measured against a 24dp icon, as the badges page measures it.
const probeStyles = stylex.create({
  error: { backgroundColor: colors.error },
  icon: { blockSize: '24px', display: 'block', inlineSize: '24px' },
  labelSmall: { fontSize: typography.labelSmallSize },
  onError: { color: colors.onError },
})

// Hoisted so it is one stable element per render rather than a fresh one,
// which is what react-perf's no-jsx-as-prop is after.
const LIST_ITEM = <li />

// Every declaration reaching an element from inside the forced-colours query,
// read through the shared walker: no rendered element can be put into that
// mode here, so what is proved is that the rule exists and reaches the mark.
const FORCED_COLORS = 'forced-colors: active'

function Icon() {
  return (
    <svg
      aria-hidden="true"
      data-testid="icon"
      viewBox="0 0 24 24"
      {...stylex.props(probeStyles.icon)}
    />
  )
}

// What the badge is drawn on and the mark it draws there, which is the last
// thing it renders.
function parts(view: ReturnType<typeof render>) {
  const icon = view.getByTestId('icon')
  const mark = view.getByTestId('badge').lastElementChild
  if (!(mark instanceof HTMLElement) || mark === icon) {
    throw new Error('expected the badge to draw a mark after the icon')
  }
  return { icon: icon.getBoundingClientRect(), mark }
}

function probe(style: stylex.StyleXStyles) {
  const view = render(<span data-testid="probe" {...stylex.props(style)} />)
  const computed = getComputedStyle(view.getByTestId('probe'))
  const read = {
    background: computed.backgroundColor,
    color: computed.color,
    fontSize: computed.fontSize,
  }
  view.unmount()
  return read
}

function setup(props: Partial<Parameters<typeof Badge>[0]> = {}) {
  const view = render(
    <Badge data-testid="badge" {...props}>
      <Icon />
    </Badge>,
  )
  return { ...view, badge: view.getByTestId('badge'), ...parts(view) }
}

describe('badge', () => {
  describe('structure', () => {
    it('wraps what it is drawn on, then draws its mark', () => {
      const { badge } = setup()

      expect(badge.tagName).toBe('SPAN')
      expect(badge.firstElementChild).toBe(badge.querySelector('svg'))
    })

    it('renders as another element when given one', () => {
      const { badge } = setup({ render: LIST_ITEM })
      expect(badge.tagName).toBe('LI')
    })

    it('passes attributes through to the element', () => {
      const { badge } = setup({ id: 'first' })
      expect(badge.id).toBe('first')
    })
  })

  describe('the small badge', () => {
    it("is the page's 6dp dot on the error role", () => {
      const { mark } = setup()
      const box = mark.getBoundingClientRect()

      expect([box.width, box.height]).toEqual([6, 6])
      expect(getComputedStyle(mark).backgroundColor).toBe(
        probe(probeStyles.error).background,
      )
      expect(mark.textContent).toBe('')
    })

    it("fills the icon's top trailing corner", () => {
      const { icon, mark } = setup()
      const box = mark.getBoundingClientRect()

      expect(box.top).toBe(icon.top)
      expect(box.right).toBe(icon.right)
    })
  })

  describe('the large badge', () => {
    it('holds the count in label small on the error pair, 16dp tall', () => {
      const { mark } = setup({ count: 3 })
      const style = getComputedStyle(mark)

      expect(mark.textContent).toBe('3')
      expect(mark.getBoundingClientRect().height).toBe(16)
      expect(mark.getBoundingClientRect().width).toBe(16)
      expect(style.backgroundColor).toBe(probe(probeStyles.error).background)
      expect(style.color).toBe(probe(probeStyles.onError).color)
      expect(style.fontSize).toBe(probe(probeStyles.labelSmall).fontSize)
    })

    // The page puts the badge's bottom leading corner 14dp down and 12dp in
    // from the icon's top trailing corner.
    it('stands 2dp above the icon, its leading edge 12dp inside it', () => {
      const { icon, mark } = setup({ count: 3 })
      const box = mark.getBoundingClientRect()

      expect(box.bottom - icon.top).toBe(14)
      expect(icon.right - box.left).toBe(12)
    })

    it('grows toward the end as the count lengthens', () => {
      const one = setup({ count: 3 })
      const short = one.mark.getBoundingClientRect()
      one.unmount()

      const { mark } = setup({ count: 42 })
      const long = mark.getBoundingClientRect()

      expect(long.left).toBe(short.left)
      expect(long.width).toBeGreaterThan(short.width)
    })

    it('caps a count above max with a plus', () => {
      const capped = setup({ count: 1200 })
      expect(capped.mark.textContent).toBe('999+')
      capped.unmount()

      const lowered = setup({ count: 120, max: 99 })
      expect(lowered.mark.textContent).toBe('99+')
      lowered.unmount()

      const atMax = setup({ count: 99, max: 99 })
      expect(atMax.mark.textContent).toBe('99')
    })

    it("writes the count in the reader's own digits", () => {
      const view = render(
        <I18nProvider locale="ar-EG">
          <Badge count={3} data-testid="badge">
            <Icon />
          </Badge>
        </I18nProvider>,
      )

      expect(parts(view).mark.textContent).toBe('٣')
    })
  })

  describe('for assistive technology', () => {
    it('hides the mark, leaving the name to the control it sits on', () => {
      const view = render(
        <IconButton aria-label="Label, 3 new">
          <Badge count={3} data-testid="badge">
            <Icon />
          </Badge>
        </IconButton>,
      )

      expect(parts(view).mark).toHaveAttribute('aria-hidden', 'true')
      expect(
        view.getByRole('button', { name: 'Label, 3 new' }),
      ).toBeInTheDocument()
    })
  })

  describe('under right-to-left', () => {
    it('keeps the small badge on the trailing corner', () => {
      const view = render(
        <div dir="rtl">
          <Badge data-testid="badge">
            <Icon />
          </Badge>
        </div>,
      )
      const { icon, mark } = parts(view)
      const box = mark.getBoundingClientRect()

      expect(box.left).toBe(icon.left)
      expect(box.top).toBe(icon.top)
    })

    it('grows the large badge toward the end, from 12dp inside the icon', () => {
      const view = render(
        <div dir="rtl">
          <Badge count={42} data-testid="badge">
            <Icon />
          </Badge>
        </div>,
      )
      const { icon, mark } = parts(view)

      expect(mark.getBoundingClientRect().right - icon.left).toBe(12)
    })
  })

  describe('under forced colours', () => {
    // The mode paints the error fill over in its background, which left the
    // small badge as nothing at all; a border is what it keeps.
    it('draws a 1px border in the text colour around either badge', () => {
      for (const count of [undefined, 3]) {
        const view = setup({ count })
        const rules = declarationsHeld(view.mark, FORCED_COLORS)

        expect(rules.get('border-top-style')).toBe('solid')
        expect(rules.get('border-top-width')).toBe('1px')
        expect(rules.get('border-top-color')).toBe('canvastext')
        view.unmount()
      }
    })
  })
})
