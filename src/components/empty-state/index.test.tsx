import * as stylex from '@stylexjs/stylex'
import { render } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import EmptyState from '.'
import { colors } from '../../tokens/design.tokens.stylex'

// The roles each part is drawn in, read off probes drawn in them.
const roleStyles = stylex.create({
  onPrimaryContainer: { color: colors.onPrimaryContainer },
  onSurfaceVariant: { color: colors.onSurfaceVariant },
  primary: { color: colors.primary },
  primaryContainer: { backgroundColor: colors.primaryContainer },
  surfaceContainerHighest: { backgroundColor: colors.surfaceContainerHighest },
})

// What sits above the empty state, as a screen's bar would.
const frameStyles = stylex.create({
  above: { blockSize: '64px' },
})

function Icon() {
  return (
    <svg
      aria-hidden="true"
      data-testid="icon"
      fill="currentColor"
      height="1em"
      viewBox="0 0 24 24"
      width="1em"
    >
      <circle cx="12" cy="12" r="8" />
    </svg>
  )
}

function roleOf(role: keyof typeof roleStyles) {
  const probe = document.createElement('span')
  probe.className = stylex.props(roleStyles[role]).className ?? ''
  document.body.append(probe)
  const style = getComputedStyle(probe)
  const read = { background: style.backgroundColor, color: style.color }
  probe.remove()
  return read
}

// Hoisted so each is one stable element per render, which is what
// react-perf's no-jsx-as-prop is after.
const ICON = <Icon />
// No test but the one pressing it presses this action.
const onActionPress = vi.fn<() => void>()
const ACTION = { label: 'Label', onPress: onActionPress }
const LINK_ACTION = { href: '#first', label: 'Label' }

function boxOf(element: Element) {
  return element.getBoundingClientRect()
}

/** A first-use empty state under a 64dp bar, with every part. */
function firstUse() {
  return render(
    <div>
      <div data-testid="above" {...stylex.props(frameStyles.above)} />
      <EmptyState
        action={ACTION}
        data-testid="state"
        description="Supporting line"
        icon={ICON}
        title="Headline"
      />
    </div>,
  )
}

// Never rendered: each line is a form the types refuse.
function InvalidForms() {
  return (
    <>
      {/* @ts-expect-error -- `done` draws no title */}
      <EmptyState description="Supporting line" kind="done" title="Headline" />
      {/* @ts-expect-error -- an inline row draws no button */}
      <EmptyState action={ACTION} description="Supporting line" size="inline" />
      {/* @ts-expect-error -- `status` has no inline row */}
      <EmptyState description="Supporting line" kind="status" size="inline" />
    </>
  )
}

/** The mark the icon is drawn in. */
function markOf(view: ReturnType<typeof render>) {
  const mark = view.getByTestId('icon').parentElement
  if (mark === null) {
    throw new Error('expected the icon to sit in a mark')
  }
  return mark
}

describe('empty state', () => {
  describe('first use', () => {
    it('draws a 64dp mark in the primary container, its glyph at 32dp', () => {
      const view = firstUse()
      const mark = markOf(view)
      const style = getComputedStyle(mark)

      expect([boxOf(mark).width, boxOf(mark).height]).toEqual([64, 64])
      expect(style.borderTopLeftRadius).not.toBe('0px')
      expect(style.backgroundColor).toBe(roleOf('primaryContainer').background)
      expect(style.color).toBe(roleOf('onPrimaryContainer').color)
      expect(boxOf(view.getByTestId('icon')).width).toBe(32)
      expect(mark).toHaveAttribute('aria-hidden', 'true')
    })

    it('titles it in title large at level 2, the line in body medium on on surface variant', () => {
      const view = firstUse()
      const title = view.getByRole('heading', { level: 2, name: 'Headline' })
      const line = view.getByText('Supporting line')

      expect(getComputedStyle(title).fontSize).toBe('22px')
      expect(getComputedStyle(line).fontSize).toBe('14px')
      expect(getComputedStyle(line).color).toBe(
        roleOf('onSurfaceVariant').color,
      )
      expect(boxOf(line).width).toBeLessThanOrEqual(280)
    })

    it('spaces the mark, title, line and button 16, 8 and 24 apart', () => {
      const view = firstUse()
      const mark = boxOf(markOf(view))
      const title = boxOf(view.getByRole('heading'))
      const line = boxOf(view.getByText('Supporting line'))
      const button = boxOf(view.getByRole('button', { name: 'Label' }))

      expect(title.top - mark.bottom).toBe(16)
      expect(line.top - title.bottom).toBe(8)
      expect(button.top - line.bottom).toBe(24)
    })

    it('starts 40dp under what is above, centred across', () => {
      const view = firstUse()
      const above = boxOf(view.getByTestId('above'))
      const state = boxOf(view.getByTestId('state'))
      const mark = boxOf(markOf(view))

      expect(mark.top - above.bottom).toBe(40)
      expect(mark.left - state.left).toBeCloseTo(state.right - mark.right, 0)
    })

    it('draws one filled button that runs its action', () => {
      const view = render(
        <EmptyState
          action={ACTION}
          description="Supporting line"
          title="Headline"
        />,
      )

      view.getByRole('button', { name: 'Label' }).click()
      expect(onActionPress).toHaveBeenCalledOnce()
      expect(view.getAllByRole('button')).toHaveLength(1)
    })

    it('draws the button as a link where it has somewhere to go', () => {
      const view = render(<EmptyState action={LINK_ACTION} title="Headline" />)

      expect(view.getByRole('link', { name: 'Label' })).toHaveAttribute(
        'href',
        '#first',
      )
    })

    it('sets the title at the level the app chooses', () => {
      const view = render(<EmptyState headingLevel={3} title="Headline" />)

      expect(
        view.getByRole('heading', { level: 3, name: 'Headline' }),
      ).toBeVisible()
    })
  })

  describe('inline', () => {
    it('draws a 72dp row with a 40dp mark, its glyph at 20dp, and the line alone', () => {
      const view = render(
        <EmptyState
          data-testid="state"
          description="Supporting line"
          icon={ICON}
          size="inline"
        />,
      )
      const state = boxOf(view.getByTestId('state'))
      const mark = markOf(view)

      expect(state.height).toBe(72)
      expect([boxOf(mark).width, boxOf(mark).height]).toEqual([40, 40])
      expect(boxOf(view.getByTestId('icon')).width).toBe(20)
      expect(getComputedStyle(mark).backgroundColor).toBe(
        roleOf('primaryContainer').background,
      )
      expect(view.queryByRole('heading')).toBeNull()
      expect(view.queryByRole('button')).toBeNull()
      // Left-aligned, after the mark, as a row's headline is.
      expect(boxOf(view.getByText('Supporting line')).left).toBeGreaterThan(
        boxOf(mark).right,
      )
    })
  })

  describe('done', () => {
    it('draws a 24dp check in the primary role and the line, in a 56dp row', () => {
      const view = render(
        <EmptyState
          data-testid="state"
          description="Supporting line"
          kind="done"
        />,
      )
      const state = view.getByTestId('state')
      const check = state.querySelector('svg')
      if (check === null) {
        throw new Error('expected a check')
      }

      expect(boxOf(state).height).toBe(56)
      expect([boxOf(check).width, boxOf(check).height]).toEqual([24, 24])
      expect(getComputedStyle(check).color).toBe(roleOf('primary').color)
      expect(check).toHaveAttribute('aria-hidden', 'true')
      // Lined up where the rows were: 16dp in, as a row's leading slot is.
      expect(boxOf(check).left - boxOf(state).left).toBe(16)
      expect(view.queryByRole('heading')).toBeNull()
      expect(view.queryByRole('button')).toBeNull()
    })
  })

  describe('status', () => {
    it('draws the first-use layout with a neutral mark and an outlined button', () => {
      const view = render(
        <EmptyState
          action={ACTION}
          description="Supporting line"
          icon={ICON}
          kind="status"
          title="Headline"
        />,
      )
      const mark = markOf(view)
      const button = view.getByRole('button', { name: 'Label' })

      expect(boxOf(mark).width).toBe(64)
      expect(getComputedStyle(mark).backgroundColor).toBe(
        roleOf('surfaceContainerHighest').background,
      )
      expect(getComputedStyle(mark).color).toBe(
        roleOf('onSurfaceVariant').color,
      )
      // Outlined: a rule and no fill, where the filled button has a fill.
      expect(getComputedStyle(button).borderTopStyle).toBe('solid')
      expect(getComputedStyle(button).backgroundColor).toBe('rgba(0, 0, 0, 0)')
      expect(view.getByRole('heading', { name: 'Headline' })).toBeVisible()
    })
  })

  // Each form's props are its own, so a part a layout does not draw is a
  // compile error rather than something quietly left out.
  it('takes only the parts each form draws', () => {
    expect(typeof InvalidForms).toBe('function')
  })
})
