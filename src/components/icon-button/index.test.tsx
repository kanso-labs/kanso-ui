import type { ReactElement } from 'react'

import * as stylex from '@stylexjs/stylex'
import { render } from '@testing-library/react'
import { ButtonContext } from 'react-aria-components'
import { describe, expect, it, vi } from 'vitest'

import IconButton from '.'
import { colors, radii } from '../../tokens/design.tokens.stylex'

// Compared against elements styled straight from the tokens rather than
// literals, so the assertions pin which role each variant reaches for without
// also pinning what that role currently resolves to.
const probeStyles = stylex.create({
  onSurfaceVariant: { color: colors.onSurfaceVariant },
  pressedLarge: { borderRadius: { ':active': radii.lg, default: radii.full } },
  pressedMedium: { borderRadius: { ':active': radii.md, default: radii.full } },
  pressedSmall: { borderRadius: { ':active': radii.sm, default: radii.full } },
  primary: { backgroundColor: colors.primary },
  radiusFull: { borderRadius: radii.full },
  secondaryContainer: { backgroundColor: colors.secondaryContainer },
})

function probe(element: ReactElement) {
  const view = render(element)
  const computed = getComputedStyle(view.getByTestId('probe'))
  const read = {
    background: computed.backgroundColor,
    color: computed.color,
    radius: computed.borderTopLeftRadius,
  }
  view.unmount()
  return read
}

// Hoisted so the context value is one stable object rather than a fresh one
// per render, which is what react-perf's no-new-object-as-prop is after.
const DISABLED_CONTEXT = { isDisabled: true }

function setup(props: Partial<Parameters<typeof IconButton>[0]> = {}) {
  const view = render(
    <IconButton aria-label="Add" {...props}>
      <svg data-testid="icon" />
    </IconButton>,
  )
  return { ...view, button: view.getByRole('button') }
}

describe('icon button', () => {
  describe('accessibility', () => {
    // An icon carries no text, so the label is the only thing that names the
    // control. It is a required prop for exactly this reason.
    it('takes its accessible name from the label', () => {
      const view = render(
        <IconButton aria-label="Dismiss">
          <svg />
        </IconButton>,
      )
      expect(view.getByRole('button', { name: 'Dismiss' })).not.toBeNull()
    })

    it('is still a button when disabled', () => {
      const { button } = setup({ isDisabled: true })
      expect(button).toHaveProperty('disabled', true)
    })

    // A field disables the buttons it provides through React Aria's context
    // — a stepper at the end of its range, a clear button with its field —
    // and a prop given here would win over it, so the default is no prop.
    it('takes its disabled state from a button context', () => {
      const view = render(
        <ButtonContext value={DISABLED_CONTEXT}>
          <IconButton aria-label="Add">
            <svg data-testid="icon" />
          </IconButton>
        </ButtonContext>,
      )
      expect(view.getByRole('button')).toHaveProperty('disabled', true)
      expect(
        view.container.querySelector('span[aria-hidden="true"]'),
      ).toBeNull()
    })

    it('lets its own prop win over the context', () => {
      const view = render(
        <ButtonContext value={DISABLED_CONTEXT}>
          <IconButton aria-label="Add" isDisabled={false}>
            <svg data-testid="icon" />
          </IconButton>
        </ButtonContext>,
      )
      expect(view.getByRole('button')).toHaveProperty('disabled', false)
    })

    // The same link form Button has, for the same reason — see the "as a
    // link" block in button/index.test.tsx, which pins the rest of it.
    it('renders an anchor when given href', () => {
      const view = render(
        <IconButton aria-label="Add" href="#label">
          <svg />
        </IconButton>,
      )

      expect(view.getByRole('link', { name: 'Add' }).tagName).toBe('A')
    })
  })

  describe('appearance', () => {
    // The five sizes are the icon buttons spec page's size token sets: a
    // square container, the icon it holds, and the corner it presses to.
    it('renders each size square, with the icon and pressed corner the spec gives it', () => {
      const sizes = [
        ['xs', '32px', '20px', probeStyles.pressedSmall],
        ['md', '40px', '24px', probeStyles.pressedSmall],
        ['lg', '56px', '24px', probeStyles.pressedMedium],
        ['xl', '96px', '32px', probeStyles.pressedLarge],
        ['xxl', '136px', '40px', probeStyles.pressedLarge],
      ] as const

      for (const [size, edge, icon, pressed] of sizes) {
        const { button, unmount } = setup({ size })
        const computed = getComputedStyle(button)
        expect(computed.width).toBe(edge)
        expect(computed.height).toBe(edge)
        expect(computed.fontSize).toBe(icon)
        // The pressed corner is a `:active` branch, so it is pinned by class
        // rather than by a computed value nothing here can press for.
        const pressedClasses = (stylex.props(pressed).className ?? '')
          .split(' ')
          .filter(Boolean)
        expect(pressedClasses.length).toBeGreaterThan(0)
        expect(
          pressedClasses.every((name) => button.classList.contains(name)),
        ).toBe(true)
        unmount()
      }
    })

    it('gives each variant its own container', () => {
      const expected = {
        filled: probe(
          <div data-testid="probe" {...stylex.props(probeStyles.primary)} />,
        ).background,
        tonal: probe(
          <div
            data-testid="probe"
            {...stylex.props(probeStyles.secondaryContainer)}
          />,
        ).background,
      }
      expect(expected.filled).not.toBe(expected.tonal)

      const filled = setup({ variant: 'filled' })
      expect(getComputedStyle(filled.button).backgroundColor).toBe(
        expected.filled,
      )
      filled.unmount()

      const tonal = setup({ variant: 'tonal' })
      expect(getComputedStyle(tonal.button).backgroundColor).toBe(
        expected.tonal,
      )
      tonal.unmount()

      // Standard carries no container at all, which is what lets it tint
      // whatever it is placed on.
      const { button } = setup()
      expect(getComputedStyle(button).backgroundColor).toBe('rgba(0, 0, 0, 0)')
    })

    it('renders the standard variant in the muted role', () => {
      const expected = probe(
        <div
          data-testid="probe"
          {...stylex.props(probeStyles.onSurfaceVariant)}
        />,
      ).color
      const { button } = setup()
      expect(getComputedStyle(button).color).toBe(expected)
    })

    it('is a circle at rest', () => {
      const expected = probe(
        <div data-testid="probe" {...stylex.props(probeStyles.radiusFull)} />,
      ).radius
      const { button } = setup()
      expect(getComputedStyle(button).borderTopLeftRadius).toBe(expected)
      expect(expected).not.toBe('0px')
    })
  })

  describe('press behaviour', () => {
    it('calls onClick when pressed', () => {
      const onClick = vi.fn<() => void>()
      const { button } = setup({ onClick })
      button.click()
      expect(onClick).toHaveBeenCalledTimes(1)
    })

    it('renders a ripple surface by default', () => {
      const view = render(
        <IconButton aria-label="Add">
          <svg />
        </IconButton>,
      )
      expect(
        view.container.querySelector('span[aria-hidden="true"]'),
      ).not.toBeNull()
    })

    it('renders no ripple surface when the ripple is disabled', () => {
      const view = render(
        <IconButton aria-label="Add" disableRipple>
          <svg />
        </IconButton>,
      )
      expect(
        view.container.querySelector('span[aria-hidden="true"]'),
      ).toBeNull()
    })
  })
})
