import type { ReactElement } from 'react'

import * as stylex from '@stylexjs/stylex'
import { fireEvent, render } from '@testing-library/react'
import { ButtonContext } from 'react-aria-components'
import { describe, expect, it, vi } from 'vitest'

import IconButton from '.'
import { colors, radii } from '../../tokens/design.tokens.stylex'

// Compared against elements styled straight from the tokens rather than
// literals, so the assertions pin which role each variant reaches for without
// also pinning what that role currently resolves to.
const probeStyles = stylex.create({
  inversePair: {
    backgroundColor: colors.inverseSurface,
    color: colors.inverseOnSurface,
  },
  onSurfaceVariant: { color: colors.onSurfaceVariant },
  outlineVariant: { borderColor: colors.outlineVariant },
  pressedLarge: { borderRadius: { ':active': radii.lg, default: radii.full } },
  pressedMedium: { borderRadius: { ':active': radii.md, default: radii.full } },
  pressedSmall: { borderRadius: { ':active': radii.sm, default: radii.full } },
  primary: { backgroundColor: colors.primary },
  primaryText: { color: colors.primary },
  radiusFull: { borderRadius: radii.full },
  radiusSmall: { borderRadius: radii.sm },
  secondary: { backgroundColor: colors.secondary },
  secondaryContainer: { backgroundColor: colors.secondaryContainer },
  surfaceContainer: { backgroundColor: colors.surfaceContainer },
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

    // The page's outlined icon button: transparent with a rule around it and
    // the muted icon, where filled and tonal carry a container.
    it('draws the outlined variant as a rule with no container', () => {
      const reference = render(
        <div
          data-testid="probe"
          {...stylex.props(probeStyles.outlineVariant)}
        />,
      )
      const expected = getComputedStyle(
        reference.getByTestId('probe'),
      ).borderTopColor
      reference.unmount()

      const { button } = setup({ variant: 'outlined' })
      const style = getComputedStyle(button)

      expect(style.backgroundColor).toBe('rgba(0, 0, 0, 0)')
      expect(style.borderTopColor).toBe(expected)
      expect(style.borderTopStyle).toBe('solid')
      expect(style.borderTopWidth).toBe('1px')
    })

    // The border thickens with the size the way Button's does, so the two
    // line up beside each other at every height.
    it('thickens the outlined border with the size', () => {
      const widths = [
        ['xs', '1px'],
        ['md', '1px'],
        ['lg', '1px'],
        ['xl', '2px'],
        ['xxl', '3px'],
      ] as const

      for (const [size, width] of widths) {
        const { button, unmount } = setup({ size, variant: 'outlined' })
        expect(getComputedStyle(button).borderTopWidth).toBe(width)
        unmount()
      }
    })

    it('draws no border on a variant that carries a container', () => {
      const { button } = setup({ size: 'xl', variant: 'filled' })
      expect(getComputedStyle(button).borderTopWidth).toBe('0px')
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

  // Given any of `isSelected`, `defaultSelected` or `onChange` the button is
  // React Aria's ToggleButton instead of its Button, which reports the state
  // through `aria-pressed` rather than a role of its own.
  describe('toggle', () => {
    it('reports no state until one of the three props makes it a toggle', () => {
      const { button } = setup()
      expect(button.hasAttribute('aria-pressed')).toBe(false)
    })

    it.each([
      ['defaultSelected', { defaultSelected: true }],
      ['isSelected', { isSelected: true }],
    ])('reports its state when given %s', (_name, props) => {
      const { button } = setup(props)
      expect(button.getAttribute('aria-pressed')).toBe('true')
    })

    it('becomes a toggle from onChange alone', () => {
      const { button } = setup({ onChange: () => {} })
      expect(button.getAttribute('aria-pressed')).toBe('false')
    })

    it('keeps its own state from defaultSelected', () => {
      const onChange = vi.fn<(isSelected: boolean) => void>()
      const { button } = setup({ defaultSelected: false, onChange })

      fireEvent.click(button)

      expect(button.getAttribute('aria-pressed')).toBe('true')
      expect(onChange).toHaveBeenCalledWith(true)
    })

    it('does not change on its own when controlled', () => {
      const onChange = vi.fn<(isSelected: boolean) => void>()
      const { button } = setup({ isSelected: false, onChange })

      fireEvent.click(button)

      expect(onChange).toHaveBeenCalledWith(true)
      expect(button.getAttribute('aria-pressed')).toBe('false')
    })

    it('toggles from the keyboard', () => {
      const { button } = setup({ defaultSelected: false })

      fireEvent.keyDown(button, { key: ' ' })
      fireEvent.keyUp(button, { key: ' ' })

      expect(button.getAttribute('aria-pressed')).toBe('true')
    })

    it('stays a toggle while disabled, and stops responding', () => {
      const onChange = vi.fn<(isSelected: boolean) => void>()
      const { button } = setup({ isDisabled: true, isSelected: true, onChange })

      fireEvent.click(button)

      expect(button.getAttribute('aria-pressed')).toBe('true')
      expect(onChange).not.toHaveBeenCalled()
    })

    it('still renders a ripple surface', () => {
      const view = setup({ defaultSelected: true })
      expect(
        view.container.querySelector('span[aria-hidden="true"]'),
      ).not.toBeNull()
    })

    // The page gives each style a second pair of colour roles for its toggle,
    // and they are not the plain button's: an unchosen filled toggle rests on
    // surface container rather than primary, and a chosen tonal one takes
    // secondary rather than the secondary container pair.
    describe('colour', () => {
      it('rests an unchosen filled toggle on surface container', () => {
        const expected = probe(
          <div
            data-testid="probe"
            {...stylex.props(probeStyles.surfaceContainer)}
          />,
        ).background
        const plain = probe(
          <div data-testid="probe" {...stylex.props(probeStyles.primary)} />,
        ).background
        expect(expected).not.toBe(plain)

        const { button } = setup({ isSelected: false, variant: 'filled' })
        expect(getComputedStyle(button).backgroundColor).toBe(expected)
      })

      it('gives a chosen filled toggle the plain filled container', () => {
        const expected = probe(
          <div data-testid="probe" {...stylex.props(probeStyles.primary)} />,
        ).background
        const { button } = setup({ isSelected: true, variant: 'filled' })
        expect(getComputedStyle(button).backgroundColor).toBe(expected)
      })

      it('moves a chosen tonal toggle from the container to secondary', () => {
        const expected = probe(
          <div data-testid="probe" {...stylex.props(probeStyles.secondary)} />,
        ).background
        const unchosen = probe(
          <div
            data-testid="probe"
            {...stylex.props(probeStyles.secondaryContainer)}
          />,
        ).background
        expect(expected).not.toBe(unchosen)

        const selected = setup({ isSelected: true, variant: 'tonal' })
        expect(getComputedStyle(selected.button).backgroundColor).toBe(expected)
        selected.unmount()

        const { button } = setup({ isSelected: false, variant: 'tonal' })
        expect(getComputedStyle(button).backgroundColor).toBe(unchosen)
      })

      // The one place a toggle here inverts rather than tints: the page
      // swaps the outlined rule for the inverse surface pair.
      it('swaps a chosen outlined toggle for the inverse surface pair', () => {
        const reference = render(
          <div
            data-testid="probe"
            {...stylex.props(probeStyles.inversePair)}
          />,
        )
        const expected = getComputedStyle(reference.getByTestId('probe'))
        const { background, color } = {
          background: expected.backgroundColor,
          color: expected.color,
        }
        reference.unmount()

        const selected = setup({ isSelected: true, variant: 'outlined' })
        const style = getComputedStyle(selected.button)
        expect(style.backgroundColor).toBe(background)
        expect(style.color).toBe(color)
        // The rule goes when the container arrives, or the two compete.
        expect(style.borderTopWidth).toBe('0px')
        expect(background).not.toBe('rgba(0, 0, 0, 0)')
        selected.unmount()

        const { button } = setup({ isSelected: false, variant: 'outlined' })
        const unchosen = getComputedStyle(button)
        expect(unchosen.backgroundColor).toBe('rgba(0, 0, 0, 0)')
        expect(unchosen.borderTopWidth).toBe('1px')
      })

      it('moves a chosen standard toggle icon to primary, keeping no container', () => {
        const expected = probe(
          <div
            data-testid="probe"
            {...stylex.props(probeStyles.primaryText)}
          />,
        ).color
        const muted = probe(
          <div
            data-testid="probe"
            {...stylex.props(probeStyles.onSurfaceVariant)}
          />,
        ).color
        expect(expected).not.toBe(muted)

        const selected = setup({ isSelected: true })
        expect(getComputedStyle(selected.button).color).toBe(expected)
        expect(getComputedStyle(selected.button).backgroundColor).toBe(
          'rgba(0, 0, 0, 0)',
        )
        selected.unmount()

        const { button } = setup({ isSelected: false })
        expect(getComputedStyle(button).color).toBe(muted)
      })
    })

    // The page's shape morph: a toggle rests round while unchosen and square
    // once chosen, at the corner its size otherwise presses to.
    describe('shape', () => {
      it('rests round while unchosen and square once chosen', () => {
        const round = probe(
          <div data-testid="probe" {...stylex.props(probeStyles.radiusFull)} />,
        ).radius
        const square = probe(
          <div
            data-testid="probe"
            {...stylex.props(probeStyles.radiusSmall)}
          />,
        ).radius
        expect(round).not.toBe(square)

        const unchosen = setup({ isSelected: false })
        expect(getComputedStyle(unchosen.button).borderTopLeftRadius).toBe(
          round,
        )
        unchosen.unmount()

        const { button } = setup({ isSelected: true })
        expect(getComputedStyle(button).borderTopLeftRadius).toBe(square)
      })

      it('keeps the chosen shape while disabled', () => {
        const square = probe(
          <div
            data-testid="probe"
            {...stylex.props(probeStyles.radiusSmall)}
          />,
        ).radius
        const { button } = setup({ isDisabled: true, isSelected: true })
        expect(getComputedStyle(button).borderTopLeftRadius).toBe(square)
      })
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

  // React Aria's pending state keeps the button focusable while it stops
  // responding to a press, and wants the progress bar in the accessibility
  // tree the moment it goes pending.
  describe('pending', () => {
    it('draws a progress bar in place of the label', () => {
      const view = render(
        <IconButton aria-label="Add" isPending>
          <svg />
        </IconButton>,
      )
      const bar = view.getByRole('progressbar', { name: 'Loading' })

      expect(bar).not.toBeNull()
      expect(bar.getAttribute('aria-valuenow')).toBeNull()
    })

    it('takes another name for it', () => {
      const view = render(
        <IconButton aria-label="Add" isPending pendingLabel="Saving">
          <svg />
        </IconButton>,
      )
      expect(view.getByRole('progressbar', { name: 'Saving' })).not.toBeNull()
    })

    it('draws none until it is pending', () => {
      const view = render(
        <IconButton aria-label="Add">
          <svg />
        </IconButton>,
      )
      expect(view.queryByRole('progressbar')).toBeNull()
    })

    // The label stays in the flow, so the button keeps the width it had —
    // a form that resized as it was submitted would move everything under
    // the pointer.
    it('keeps the width the label gave it', () => {
      const idle = render(
        <IconButton aria-label="Add">
          <svg />
        </IconButton>,
      )
      const before = idle.getByRole('button').getBoundingClientRect().width
      idle.unmount()

      const pending = render(
        <IconButton aria-label="Add" isPending>
          <svg />
        </IconButton>,
      )
      expect(pending.getByRole('button').getBoundingClientRect().width).toBe(
        before,
      )
    })

    it('stops responding to a press while staying focusable', () => {
      const onPress = vi.fn<() => void>()
      const view = render(
        <IconButton aria-label="Add" isPending onPress={onPress}>
          <svg />
        </IconButton>,
      )
      const button = view.getByRole('button')

      fireEvent.click(button)
      expect(onPress).not.toHaveBeenCalled()
      expect(button.hasAttribute('disabled')).toBe(false)
      expect(button.getAttribute('aria-disabled')).toBe('true')
    })
  })
})
