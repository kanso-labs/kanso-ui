import type { ComponentProps } from 'react'

import * as stylex from '@stylexjs/stylex'
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react'
import { I18nProvider } from 'react-aria-components'
import { describe, expect, it, vi } from 'vitest'

import FabMenu from '.'
import {
  declarationsHeld,
  reducedMotionOf,
} from '../../styles/stylesheet.testing'
import { colors, spacing, typography } from '../../tokens/design.tokens.stylex'

const FORCED_COLORS = 'forced-colors: active'

// Each pair compared by what it resolves to, so a test pins the role rather
// than the colour it happens to be today.
// Where a FAB sits on a screen: the bottom trailing corner, 16px in from the
// edges, with room above it for the actions. React Aria keeps a surface 12px
// clear of the viewport's edge, so a FAB flush against one would have its
// actions shifted off its edge.
const frameStyles = stylex.create({
  frame: {
    alignItems: 'flex-end',
    blockSize: '400px',
    boxSizing: 'border-box',
    display: 'flex',
    justifyContent: 'flex-end',
    padding: spacing.lg,
  },
})

const probeStyles = stylex.create({
  primary: { backgroundColor: colors.primary, color: colors.onPrimary },
  primaryContainer: {
    backgroundColor: colors.primaryContainer,
    color: colors.onPrimaryContainer,
  },
  tertiary: { backgroundColor: colors.tertiary, color: colors.onTertiary },
  tertiaryContainer: {
    backgroundColor: colors.tertiaryContainer,
    color: colors.onTertiaryContainer,
  },
  titleMedium: { fontSize: typography.titleMediumSize },
})

// An icon as the README asks for one. Hoisted, since react-perf rejects an
// element built at the prop.
const ICON = (
  <svg
    aria-hidden="true"
    data-testid="fab-icon"
    fill="currentColor"
    height="1em"
    viewBox="0 0 24 24"
    width="1em"
  />
)
const ITEM_ICON = (
  <svg
    aria-hidden="true"
    data-testid="item-icon"
    fill="currentColor"
    height="1em"
    viewBox="0 0 24 24"
    width="1em"
  />
)

function Menu(props: Partial<ComponentProps<typeof FabMenu>>) {
  return (
    <div {...stylex.props(frameStyles.frame)}>
      <FabMenu aria-label="Label" icon={ICON} {...props}>
        <FabMenu.Item icon={ITEM_ICON} id="first">
          First item
        </FabMenu.Item>
        <FabMenu.Item id="second">Second item</FabMenu.Item>
        <FabMenu.Item id="third">Third item</FabMenu.Item>
      </FabMenu>
    </div>
  )
}

// What a probe style resolves to in the page, with the probe torn down again.
function resolved(style: stylex.StyleXStyles) {
  const view = render(<div data-testid="probe" {...stylex.props(style)} />)
  const computed = getComputedStyle(view.getByTestId('probe'))
  const values = {
    background: computed.backgroundColor,
    color: computed.color,
    fontSize: computed.fontSize,
  }
  view.unmount()
  return values
}

describe('FAB menu', () => {
  describe('structure', () => {
    it('is a FAB named by its aria-label that says it opens a menu', () => {
      render(<Menu />)
      const fab = screen.getByRole('button', { name: 'Label' })

      expect(fab).toHaveAttribute('aria-haspopup', 'true')
      expect(fab).toHaveAttribute('aria-expanded', 'false')
      expect(screen.queryByRole('menu')).toBeNull()
    })

    it('opens a menu of its actions, named by the FAB', () => {
      render(<Menu />)
      const fab = screen.getByRole('button', { name: 'Label' })

      fireEvent.click(fab)

      const menu = screen.getByRole('menu', { name: 'Label' })
      expect(fab).toHaveAttribute('aria-expanded', 'true')
      expect(within(menu).getAllByRole('menuitem')).toHaveLength(3)
    })

    it('runs an action and closes', async () => {
      const onAction = vi.fn<(key: unknown) => void>()
      render(<Menu onAction={onAction} />)

      fireEvent.click(screen.getByRole('button', { name: 'Label' }))
      fireEvent.click(screen.getByRole('menuitem', { name: 'Second item' }))

      await waitFor(() => {
        expect(onAction.mock.calls.map(([key]) => key)).toEqual(['second'])
      })
      await waitFor(() => {
        expect(screen.queryByRole('menu')).toBeNull()
      })
    })

    it('closes on Escape', async () => {
      render(<Menu defaultOpen />)

      fireEvent.keyDown(screen.getByRole('menu'), { key: 'Escape' })

      await waitFor(() => {
        expect(screen.queryByRole('menu')).toBeNull()
      })
    })

    it('stays as the call site holds it when controlled', () => {
      const onOpenChange = vi.fn<(isOpen: boolean) => void>()
      render(<Menu isOpen onOpenChange={onOpenChange} />)

      fireEvent.keyDown(screen.getByRole('menu'), { key: 'Escape' })

      expect(onOpenChange).toHaveBeenCalledWith(false)
      expect(screen.getByRole('menu')).toBeDefined()
    })
  })

  describe('the FAB', () => {
    it('is Fab at its size while closed', () => {
      const container = resolved(probeStyles.primaryContainer)
      render(<Menu size="lg" />)
      const fab = screen.getByRole('button', { name: 'Label' })
      const box = fab.getBoundingClientRect()

      expect([box.width, box.height]).toEqual([80, 80])
      expect(getComputedStyle(fab).backgroundColor).toBe(container.background)
      expect(screen.getByTestId('fab-icon').getBoundingClientRect().width).toBe(
        28,
      )
    })

    // Read off the element once the transition has run, which the test
    // finishes rather than waits for.
    it('becomes the 56px close button in the tone itself while open', () => {
      const solid = resolved(probeStyles.primary)
      render(<Menu defaultOpen size="lg" />)
      const fab = screen.getByRole('button', { name: 'Label' })
      for (const animation of fab.getAnimations()) {
        animation.finish()
      }
      const box = fab.getBoundingClientRect()
      const style = getComputedStyle(fab)

      expect([box.width, box.height]).toEqual([56, 56])
      expect(style.borderTopLeftRadius).toBe('50%')
      expect(style.backgroundColor).toBe(solid.background)
      expect(screen.queryByTestId('fab-icon')).toBeNull()
    })

    it('eases the change, and makes it at once for reduced motion', () => {
      render(<Menu />)
      const fab = screen.getByRole('button', { name: 'Label' })

      expect(getComputedStyle(fab).transitionProperty).toContain('inline-size')
      expect(reducedMotionOf(fab, 'transition-duration').reduced).toBe('0s')
    })
  })

  describe('the actions', () => {
    it("draws each as the page's 56px pill, 24px in, its icon 8px before the label", () => {
      render(<Menu defaultOpen />)
      const item = screen.getByRole('menuitem', { name: 'First item' })
      const style = getComputedStyle(item)
      const icon = screen.getByTestId('item-icon').getBoundingClientRect()
      const label = within(item).getByText('First item').getBoundingClientRect()

      expect(item.getBoundingClientRect().height).toBe(56)
      expect(style.paddingLeft).toBe('24px')
      expect([icon.width, icon.height]).toEqual([24, 24])
      expect(label.left - icon.right).toBeCloseTo(8, 0)
      expect(style.fontSize).toBe(resolved(probeStyles.titleMedium).fontSize)
    })

    // Read once React Aria has placed the surface, which it measures and
    // moves after the first paint.
    it('stands them 4px apart, lined up on the FAB trailing edge', async () => {
      render(<Menu defaultOpen />)
      const fab = screen.getByRole('button', { name: 'Label' })

      await waitFor(() => {
        const [first, second, third] = screen
          .getAllByRole('menuitem')
          .map((item) => item.getBoundingClientRect())

        expect(second.top - first.bottom).toBe(4)
        expect(first.right).toBeCloseTo(second.right, 0)
        expect(third.right).toBeCloseTo(fab.getBoundingClientRect().right, 0)
        expect(third.bottom).toBeLessThanOrEqual(
          fab.getBoundingClientRect().top,
        )
      })
    })

    // The surface is portalled to the body and takes its direction from React
    // Aria's locale rather than from the page, so the locale is what turns it
    // over; the wrapper's `dir` turns the FAB's own row.
    it("lines them up on the FAB's trailing edge under right-to-left", async () => {
      render(
        <I18nProvider locale="ar-EG">
          <div dir="rtl">
            <Menu defaultOpen />
          </div>
        </I18nProvider>,
      )
      const fab = screen.getByRole('button', { name: 'Label' })
      const item = screen.getByRole('menuitem', { name: 'Third item' })

      await waitFor(() => {
        expect(item.getBoundingClientRect().left).toBeCloseTo(
          fab.getBoundingClientRect().left,
          0,
        )
      })
    })

    it("draws them on the tone's container pair, the close button on the tone", () => {
      const container = resolved(probeStyles.tertiaryContainer)
      const solid = resolved(probeStyles.tertiary)
      render(<Menu defaultOpen tone="tertiary" />)
      const fab = screen.getByRole('button', { name: 'Label' })
      for (const animation of fab.getAnimations()) {
        animation.finish()
      }
      const item = screen.getByRole('menuitem', { name: 'First item' })

      expect(getComputedStyle(item).backgroundColor).toBe(container.background)
      expect(getComputedStyle(item).color).toBe(container.color)
      expect(getComputedStyle(fab).backgroundColor).toBe(solid.background)
    })
  })

  // The mode drops the shadows and paints the containers over, which left
  // the FAB and the actions as text with nothing round them.
  describe('under forced colours', () => {
    it('draws the FAB and each action as a ButtonText rule', () => {
      render(<Menu defaultOpen />)
      const fab = screen.getByRole('button', { name: 'Label' })
      const item = screen.getByRole('menuitem', { name: 'First item' })

      for (const element of [fab, item]) {
        expect(
          declarationsHeld(element, FORCED_COLORS).get('border-top-color'),
        ).toBe('buttontext')
      }
    })
  })
})
