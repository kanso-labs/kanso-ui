import type { ComponentProps } from 'react'

import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import ButtonGroup from '.'
import { hasRipple } from '../../hooks/useRipple.testing'
import Button from '../button'
import IconButton from '../icon-button'

// The corners on each side of a button, read once its transitions have run.
function cornersOf(element: HTMLElement) {
  settle(element)
  const computed = getComputedStyle(element)
  return {
    left: computed.borderTopLeftRadius,
    right: computed.borderTopRightRadius,
  }
}

function Group(props: Partial<ComponentProps<typeof ButtonGroup>>) {
  return (
    <ButtonGroup aria-label="Label" {...props}>
      <Button id="first">First item</Button>
      <Button id="second">Second item</Button>
      <Button id="third">Third item</Button>
    </ButtonGroup>
  )
}

// Hoisted so each is one stable array per render, which is what react-perf's
// jsx-no-new-array-as-prop is after.
const FIRST = ['first']
const SECOND = ['second']

// Whether the corners fit the box as written. CSS scales every corner down
// together when two on one side add up to more than the side is long, which
// is what turned an 8px inner corner square beside a 9999px round end —
// and `getComputedStyle` reports the corners as written, before that.
function fitsAsWritten(element: HTMLElement) {
  const computed = getComputedStyle(element)
  const box = element.getBoundingClientRect()
  const [topLeft, topRight, bottomRight, bottomLeft] = [
    computed.borderTopLeftRadius,
    computed.borderTopRightRadius,
    computed.borderBottomRightRadius,
    computed.borderBottomLeftRadius,
  ].map((value) => Number.parseFloat(value))
  return (
    topLeft + topRight <= box.width &&
    bottomLeft + bottomRight <= box.width &&
    topLeft + bottomLeft <= box.height &&
    topRight + bottomRight <= box.height
  )
}

// Lets every transition on `element` run to its end, so a test reads the
// value it settles at rather than one on the way there.
function settle(element: Element) {
  for (const animation of element.getAnimations()) {
    animation.finish()
  }
}

function widthsOf(buttons: HTMLElement[]) {
  return buttons.map((button) => {
    settle(button)
    return button.getBoundingClientRect().width
  })
}

describe('button group', () => {
  describe('structure', () => {
    it('is a named group of its buttons', () => {
      render(<Group />)
      const group = screen.getByRole('group', { name: 'Label' })

      expect(group.querySelectorAll('button')).toHaveLength(3)
      expect(screen.getByRole('button', { name: 'First item' })).toBeDefined()
    })

    it('makes its buttons radios that it selects one of, given single', () => {
      const onSelectionChange = vi.fn<(keys: Set<unknown>) => void>()
      render(
        <Group
          defaultSelectedKeys={FIRST}
          onSelectionChange={onSelectionChange}
          selectionMode="single"
        />,
      )
      expect(screen.getByRole('radiogroup', { name: 'Label' })).toBeDefined()
      const second = screen.getByRole('radio', { name: 'Second item' })

      fireEvent.click(second)

      expect(second).toHaveAttribute('aria-checked', 'true')
      expect(screen.getByRole('radio', { name: 'First item' })).toHaveAttribute(
        'aria-checked',
        'false',
      )
      expect([...(onSelectionChange.mock.calls[0]?.[0] ?? [])]).toEqual([
        'second',
      ])
    })

    it('makes them toggles it keeps any number of, given multiple', () => {
      render(<Group selectionMode="multiple" />)
      expect(screen.getByRole('toolbar', { name: 'Label' })).toBeDefined()
      const first = screen.getByRole('button', { name: 'First item' })
      const third = screen.getByRole('button', { name: 'Third item' })

      fireEvent.click(first)
      fireEvent.click(third)

      expect(first).toHaveAttribute('aria-pressed', 'true')
      expect(third).toHaveAttribute('aria-pressed', 'true')
    })

    // A selecting group disables its buttons through React Aria's group
    // state rather than the context a plain one uses, and the ripple has to
    // hear of it either way: a press on a disabled button that started one
    // would wait for a click that never comes.
    it.each([
      ['a plain', {}],
      ['a single-selecting', { selectionMode: 'single' }],
      ['a multiple-selecting', { selectionMode: 'multiple' }],
    ] as const)(
      'disables every button in %s group, ripple included',
      (_name, props) => {
        const view = render(<Group isDisabled {...props} />)
        const buttons = [...view.container.querySelectorAll('button')]

        expect(buttons).toHaveLength(3)
        for (const button of buttons) {
          expect(button).toBeDisabled()
          // The surface is drawn only while a press could start a ripple.
          expect(hasRipple(button)).toBe(false)
        }
      },
    )
  })

  describe('size', () => {
    it('hands its size to the buttons in it', () => {
      render(<Group size="lg" />)
      for (const button of screen.getAllByRole('button')) {
        expect(button.getBoundingClientRect().height).toBe(56)
      }
    })

    it("leaves a button's own size standing", () => {
      render(
        <ButtonGroup aria-label="Label" size="lg">
          <Button>First item</Button>
          <IconButton aria-label="Second item" size="xs">
            {null}
          </IconButton>
        </ButtonGroup>,
      )

      expect(
        screen
          .getByRole('button', { name: 'First item' })
          .getBoundingClientRect().height,
      ).toBe(56)
      expect(
        screen
          .getByRole('button', { name: 'Second item' })
          .getBoundingClientRect().height,
      ).toBe(32)
    })
  })

  describe('standard', () => {
    it.each([
      ['xs', 18],
      ['md', 12],
      ['lg', 8],
      ['xxl', 8],
    ] as const)('sets %s buttons %ipx apart', (size, gap) => {
      render(<Group size={size} />)
      const [first, second] = screen
        .getAllByRole('button')
        .map((button) => button.getBoundingClientRect())

      expect(second.left - first.right).toBeCloseTo(gap, 0)
    })

    // Material Design's own group widens a pressed button by 15% of its
    // width and narrows its neighbours to make the room.
    it('widens a pressed button and narrows both its neighbours', () => {
      render(<Group />)
      const buttons = screen.getAllByRole('button')
      const group = screen.getByRole('group')
      const before = widthsOf(buttons)
      const total = group.getBoundingClientRect().width

      fireEvent.keyDown(buttons[1], { key: ' ' })
      const pressed = widthsOf(buttons)
      const gain = before[1] * 0.15

      expect(pressed[1] - before[1]).toBeCloseTo(gain, 0)
      expect(before[0] - pressed[0]).toBeCloseTo(gain / 2, 0)
      expect(before[2] - pressed[2]).toBeCloseTo(gain / 2, 0)
      expect(group.getBoundingClientRect().width).toBeCloseTo(total, 0)

      fireEvent.keyUp(buttons[1], { key: ' ' })
      expect(widthsOf(buttons)).toEqual(before)
    })

    // An outlined button gives its border back out of its padding, and the
    // padding a group writes while it widens or narrows one has to do the
    // same, or every button it touches jumps by twice the rule.
    it('widens an outlined button by the same share', () => {
      render(
        <ButtonGroup aria-label="Label">
          <Button variant="outlined">First item</Button>
          <Button variant="outlined">Second item</Button>
          <Button variant="outlined">Third item</Button>
        </ButtonGroup>,
      )
      const buttons = screen.getAllByRole('button')
      const before = widthsOf(buttons)

      fireEvent.keyDown(buttons[1], { key: ' ' })
      const pressed = widthsOf(buttons)
      const gain = before[1] * 0.15

      expect(pressed[1] - before[1]).toBeCloseTo(gain, 0)
      expect(before[0] - pressed[0]).toBeCloseTo(gain / 2, 0)
      expect(before[2] - pressed[2]).toBeCloseTo(gain / 2, 0)
      fireEvent.keyUp(buttons[1], { key: ' ' })
    })

    it('takes all the room from the one neighbour of a button at an end', () => {
      render(<Group />)
      const buttons = screen.getAllByRole('button')
      const before = widthsOf(buttons)

      fireEvent.keyDown(buttons[0], { key: ' ' })
      const pressed = widthsOf(buttons)
      const gain = before[0] * 0.15

      expect(pressed[0] - before[0]).toBeCloseTo(gain, 0)
      expect(before[1] - pressed[1]).toBeCloseTo(gain, 0)
      expect(pressed[2]).toBeCloseTo(before[2], 0)
      fireEvent.keyUp(buttons[0], { key: ' ' })
    })

    it('widens a pressed icon button too', () => {
      render(
        <ButtonGroup aria-label="Label">
          <IconButton aria-label="First item" variant="filled">
            {null}
          </IconButton>
          <IconButton aria-label="Second item" variant="filled">
            {null}
          </IconButton>
        </ButtonGroup>,
      )
      const [first] = screen.getAllByRole('button')

      fireEvent.keyDown(first, { key: ' ' })
      settle(first)

      expect(first.getBoundingClientRect().width).toBeCloseTo(40 * 1.15, 0)
      fireEvent.keyUp(first, { key: ' ' })
    })
  })

  describe('connected', () => {
    it('sets its buttons 2px apart', () => {
      render(<Group variant="connected" />)
      const [first, second] = screen
        .getAllByRole('button')
        .map((button) => button.getBoundingClientRect())

      expect(second.left - first.right).toBeCloseTo(2, 0)
    })

    it('squares off the inner corners and keeps the ends round', () => {
      render(<Group variant="connected" />)
      const [first, second, third] = screen.getAllByRole('button')

      expect(cornersOf(first)).toEqual({ left: '20px', right: '8px' })
      expect(cornersOf(second)).toEqual({ left: '8px', right: '8px' })
      expect(cornersOf(third)).toEqual({ left: '8px', right: '20px' })
      for (const button of [first, second, third]) {
        expect(fitsAsWritten(button)).toBe(true)
      }
    })

    it.each([
      ['xs', '4px'],
      ['xl', '16px'],
      ['xxl', '20px'],
    ] as const)('gives %s buttons a %s inner corner', (size, corner) => {
      render(<Group size={size} variant="connected" />)
      const [first] = screen.getAllByRole('button')

      expect(cornersOf(first).right).toBe(corner)
    })

    it('takes the inner corner at its ends too when square', () => {
      render(<Group shape="square" variant="connected" />)
      const [first] = screen.getAllByRole('button')

      expect(cornersOf(first)).toEqual({ left: '8px', right: '8px' })
    })

    it('tightens a pressed button’s inner corners', () => {
      render(<Group variant="connected" />)
      const second = screen.getAllByRole('button')[1]

      fireEvent.keyDown(second, { key: ' ' })

      expect(cornersOf(second)).toEqual({ left: '4px', right: '4px' })
      fireEvent.keyUp(second, { key: ' ' })
    })

    it('rounds off a selected button’s inner corners', () => {
      render(
        <Group
          defaultSelectedKeys={SECOND}
          selectionMode="single"
          variant="connected"
        />,
      )
      const second = screen.getByRole('radio', { name: 'Second item' })

      expect(cornersOf(second)).toEqual({ left: '20px', right: '20px' })
      expect(fitsAsWritten(second)).toBe(true)
    })

    it('keeps the round end at the start under right-to-left', () => {
      render(
        <div dir="rtl">
          <Group variant="connected" />
        </div>,
      )
      const [first] = screen.getAllByRole('button')

      expect(cornersOf(first)).toEqual({ left: '8px', right: '20px' })
    })

    it('gives XS and S buttons the 48px touch target as a minimum width', () => {
      render(
        <ButtonGroup aria-label="Label" size="xs" variant="connected">
          <Button>A</Button>
          <Button>B</Button>
        </ButtonGroup>,
      )
      for (const button of screen.getAllByRole('button')) {
        expect(button.getBoundingClientRect().width).toBeGreaterThanOrEqual(48)
      }
    })
  })
})
