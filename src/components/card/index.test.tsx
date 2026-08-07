import type { ReactElement } from 'react'

import * as stylex from '@stylexjs/stylex'
import { render } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import Card from '.'
import { colors, spacing } from '../../tokens/design.tokens.stylex'

// Compared against elements styled straight from the tokens rather than
// literals, so the assertions pin which role each variant reaches for without
// also pinning what that role currently resolves to.
const probeStyles = stylex.create({
  outlineVariant: { color: colors.outlineVariant },
  padding: { padding: spacing.lg },
  surface: { backgroundColor: colors.surface },
  surfaceContainerHighest: { backgroundColor: colors.surfaceContainerHighest },
  surfaceContainerLow: { backgroundColor: colors.surfaceContainerLow },
})

// Narrows with instanceof rather than an assertion, so a card that failed to
// render fails the test here instead of further down with something obscure.
function cardIn(container: HTMLElement) {
  const card = container.firstElementChild
  if (!(card instanceof HTMLElement)) {
    throw new Error('expected the card to render an element')
  }
  return card
}

// Takes the element rather than the style, so the caller does the
// stylex.props() spread and this helper needs no StyleX types of its own.
function probe(element: ReactElement) {
  const view = render(element)
  const computed = getComputedStyle(view.getByTestId('probe'))
  const read = {
    background: computed.backgroundColor,
    color: computed.color,
    padding: computed.paddingTop,
  }
  view.unmount()
  return read
}

describe('card', () => {
  describe('element', () => {
    it('renders a plain container by default', () => {
      const view = render(<Card>content</Card>)
      expect(view.queryByRole('button')).toBeNull()
      expect(view.container.firstElementChild?.tagName).toBe('DIV')
    })

    // The whole point of `interactive`: a card that is itself the control has
    // to be focusable and activatable, which a div is not.
    it('renders a button when interactive', () => {
      const view = render(<Card interactive>content</Card>)
      const button = view.getByRole('button')
      expect(button.tagName).toBe('BUTTON')
      expect(button.getAttribute('type')).toBe('button')
    })

    it('calls onClick when an interactive card is pressed', () => {
      const onClick = vi.fn<() => void>()
      const view = render(
        <Card interactive onClick={onClick}>
          content
        </Card>,
      )
      view.getByRole('button').click()
      expect(onClick).toHaveBeenCalledTimes(1)
    })

    it('renders no ripple surface when it is not interactive', () => {
      const view = render(<Card>content</Card>)
      expect(
        view.container.querySelector('span[aria-hidden="true"]'),
      ).toBeNull()
    })

    it('renders a ripple surface when it is interactive', () => {
      const view = render(<Card interactive>content</Card>)
      expect(
        view.container.querySelector('span[aria-hidden="true"]'),
      ).not.toBeNull()
    })
  })

  describe('variants', () => {
    it('gives each variant its own surface', () => {
      const expected = {
        elevated: probe(
          <div
            data-testid="probe"
            {...stylex.props(probeStyles.surfaceContainerLow)}
          />,
        ).background,
        filled: probe(
          <div
            data-testid="probe"
            {...stylex.props(probeStyles.surfaceContainerHighest)}
          />,
        ).background,
        outlined: probe(
          <div data-testid="probe" {...stylex.props(probeStyles.surface)} />,
        ).background,
      }
      // Guards the comparisons: three roles resolving to one colour would let
      // every assertion below pass without proving anything.
      expect(new Set(Object.values(expected)).size).toBe(3)

      for (const variant of ['elevated', 'filled', 'outlined'] as const) {
        const view = render(<Card variant={variant}>content</Card>)
        expect(getComputedStyle(cardIn(view.container)).backgroundColor).toBe(
          expected[variant],
        )
        view.unmount()
      }
    })

    it('draws a border on the outlined variant only', () => {
      const borderColor = probe(
        <div
          data-testid="probe"
          {...stylex.props(probeStyles.outlineVariant)}
        />,
      ).color

      const outlined = render(<Card variant="outlined">content</Card>)
      const outlinedStyle = getComputedStyle(cardIn(outlined.container))
      expect(outlinedStyle.borderTopWidth).toBe('1px')
      expect(outlinedStyle.borderTopColor).toBe(borderColor)
      outlined.unmount()

      const elevated = render(<Card variant="elevated">content</Card>)
      expect(getComputedStyle(cardIn(elevated.container)).borderTopWidth).toBe(
        '0px',
      )
    })

    it('casts a shadow on the elevated variant only', () => {
      const elevated = render(<Card variant="elevated">content</Card>)
      const shadow = getComputedStyle(cardIn(elevated.container)).boxShadow
      expect(shadow).not.toBe('none')
      elevated.unmount()

      const filled = render(<Card variant="filled">content</Card>)
      expect(getComputedStyle(cardIn(filled.container)).boxShadow).toBe('none')
    })
  })

  describe('shape', () => {
    // A child that reaches the card's edges is square where the card is
    // round, so its background — a row's hover tint, a ripple — paints over
    // the corner arcs unless the card clips. Asserted together with the
    // radius, since clipping only matters while there is a corner to clip to.
    it('clips its contents to its rounded corners', () => {
      const view = render(<Card padding="none">content</Card>)
      const computed = getComputedStyle(cardIn(view.container))
      expect(computed.overflow).toBe('hidden')
      expect(computed.borderRadius).not.toBe('0px')
    })
  })

  describe('padding', () => {
    it('pads its contents by default', () => {
      const expected = probe(
        <div data-testid="probe" {...stylex.props(probeStyles.padding)} />,
      ).padding
      const view = render(<Card>content</Card>)
      expect(getComputedStyle(cardIn(view.container)).paddingTop).toBe(expected)
      expect(expected).not.toBe('0px')
    })

    // This is what makes the design's bordered list container possible: rows
    // reach the card's edges and the rules between them span its full width.
    it('drops its padding entirely when asked', () => {
      const view = render(<Card padding="none">content</Card>)
      const computed = getComputedStyle(cardIn(view.container))
      expect(computed.paddingTop).toBe('0px')
      expect(computed.paddingLeft).toBe('0px')
    })
  })
})
