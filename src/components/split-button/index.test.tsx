import type { ComponentProps } from 'react'

import * as stylex from '@stylexjs/stylex'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import SplitButton from '.'
import { colors } from '../../tokens/design.tokens.stylex'
import Menu from '../menu'

const probeStyles = stylex.create({
  tonal: { backgroundColor: colors.secondaryContainer },
})

// The corners on each side of a half, read once its transitions have run.
function cornersOf(element: HTMLElement) {
  settle(element)
  const computed = getComputedStyle(element)
  return {
    left: computed.borderTopLeftRadius,
    right: computed.borderTopRightRadius,
  }
}

function halves() {
  return {
    action: screen.getByRole('button', { name: 'Label' }),
    trigger: screen.getByRole('button', { name: 'More options' }),
  }
}

function paddingOf(element: HTMLElement) {
  settle(element)
  const computed = getComputedStyle(element)
  return [computed.paddingLeft, computed.paddingRight]
}

// Lets every transition on `element` run to its end, so a test reads the
// value it settles at rather than one on the way there.
function settle(element: Element) {
  for (const animation of element.getAnimations()) {
    animation.finish()
  }
}

function Split({
  onAction,
  ...props
}: Partial<ComponentProps<typeof SplitButton>> & {
  onAction?: (key: unknown) => void
}) {
  return (
    <SplitButton {...props}>
      <SplitButton.Action>Label</SplitButton.Action>
      <SplitButton.Menu aria-label="More options" onAction={onAction}>
        <Menu.Item id="first">First item</Menu.Item>
        <Menu.Item id="second">Second item</Menu.Item>
      </SplitButton.Menu>
    </SplitButton>
  )
}

describe('split button', () => {
  describe('structure', () => {
    it('is an action and a menu button side by side, 2px apart', () => {
      render(<Split />)
      const { action, trigger } = halves()

      expect(trigger).toHaveAttribute('aria-haspopup', 'true')
      expect(trigger).toHaveAttribute('aria-expanded', 'false')
      expect(
        trigger.getBoundingClientRect().left -
          action.getBoundingClientRect().right,
      ).toBeCloseTo(2, 0)
    })

    it('runs its action on a press', () => {
      const onPress = vi.fn<() => void>()
      render(
        <SplitButton>
          <SplitButton.Action onPress={onPress}>Label</SplitButton.Action>
        </SplitButton>,
      )

      fireEvent.click(screen.getByRole('button', { name: 'Label' }))

      expect(onPress).toHaveBeenCalledTimes(1)
    })

    it('opens its menu and runs an item', async () => {
      const onAction = vi.fn<(key: unknown) => void>()
      render(<Split onAction={onAction} />)
      const { trigger } = halves()

      fireEvent.click(trigger)
      expect(trigger).toHaveAttribute('aria-expanded', 'true')
      fireEvent.click(screen.getByRole('menuitem', { name: 'Second item' }))

      await waitFor(() => {
        expect(onAction.mock.calls.map(([key]) => key)).toEqual(['second'])
      })
    })
  })

  describe('measurements', () => {
    it.each([
      ['xs', ['12px', '10px'], '22px'],
      ['md', ['16px', '12px'], '22px'],
      ['lg', ['24px', '24px'], '26px'],
      ['xl', ['48px', '48px'], '38px'],
      ['xxl', ['64px', '64px'], '50px'],
    ] as const)(
      'pads the %s action %j and draws the chevron at %s',
      (size, padding, chevron) => {
        render(<Split size={size} />)
        const { action, trigger } = halves()

        expect(paddingOf(action)).toEqual(padding)
        expect(getComputedStyle(trigger).fontSize).toBe(chevron)
      },
    )

    // The page's optical centring: the chevron sits toward the start while
    // the menu is closed, and centres once it opens.
    it('sets the chevron toward the start until the menu opens', () => {
      render(<Split />)
      const { trigger } = halves()
      expect(paddingOf(trigger)).toEqual(['12px', '14px'])

      fireEvent.click(trigger)

      expect(paddingOf(trigger)).toEqual(['13px', '13px'])
    })
  })

  describe('corners', () => {
    it('keeps the ends round and squares off the edges that meet', () => {
      render(<Split />)
      const { action, trigger } = halves()

      expect(cornersOf(action)).toEqual({ left: '9999px', right: '4px' })
      expect(cornersOf(trigger)).toEqual({ left: '4px', right: '9999px' })
    })

    it.each([
      ['xl', '8px'],
      ['xxl', '12px'],
    ] as const)('gives the %s pair a %s inner corner', (size, corner) => {
      render(<Split size={size} />)
      expect(cornersOf(halves().action).right).toBe(corner)
    })

    it('opens the inner corner out under a hovering pointer', () => {
      render(<Split />)
      const { action } = halves()

      fireEvent.pointerOver(action, { pointerType: 'mouse' })

      expect(cornersOf(action).right).toBe('12px')
    })

    it("rounds off the menu button's inner corner while the menu is open", () => {
      render(<Split />)
      const { trigger } = halves()

      fireEvent.click(trigger)

      expect(cornersOf(trigger)).toEqual({ left: '9999px', right: '9999px' })
    })

    it('keeps the round ends at the outside under right-to-left', () => {
      render(
        <div dir="rtl">
          <Split />
        </div>,
      )
      const { action } = halves()

      expect(cornersOf(action)).toEqual({ left: '4px', right: '9999px' })
    })
  })

  describe('colour', () => {
    it('draws both halves in the variant the root names', () => {
      const probe = render(
        <div data-testid="probe" {...stylex.props(probeStyles.tonal)} />,
      )
      const tonal = getComputedStyle(probe.getByTestId('probe')).backgroundColor
      probe.unmount()

      render(<Split variant="tonal" />)
      const { action, trigger } = halves()

      expect(getComputedStyle(action).backgroundColor).toBe(tonal)
      expect(getComputedStyle(trigger).backgroundColor).toBe(tonal)
    })
  })
})
