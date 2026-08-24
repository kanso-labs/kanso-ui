import type { ReactElement } from 'react'

import * as stylex from '@stylexjs/stylex'
import { render } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import IconButton from '.'
import { colors, radii } from '../../tokens/design.tokens.stylex'

// Compared against elements styled straight from the tokens rather than
// literals, so the assertions pin which role each variant reaches for without
// also pinning what that role currently resolves to.
const probeStyles = stylex.create({
  onSurfaceVariant: { color: colors.onSurfaceVariant },
  primary: { backgroundColor: colors.primary },
  primaryContainer: { backgroundColor: colors.primaryContainer },
  radiusFull: { borderRadius: radii.full },
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

function setup(props: Partial<Parameters<typeof IconButton>[0]> = {}) {
  const view = render(
    <IconButton aria-label="Add" {...props}>
      <svg data-testid="icon" />
    </IconButton>,
  )
  return { ...view, button: view.getByRole('button') }
}

// Hoisted for react-perf's no-jsx-as-prop, the way the other suites hoist
// their `render` templates.
// Empty on purpose — the component injects the children, so jsx-a11y is
// reading a template whose content it cannot see, the same way text/'s
// HEADING_2 template is read.
// oxlint-disable-next-line jsx-a11y/anchor-has-content, jsx-a11y/control-has-associated-label -- filled by the component
const LINK = <a href="#label" />

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
      const { button } = setup({ disabled: true })
      expect(button).toHaveProperty('disabled', true)
    })

    // The same inference Button makes, for the same reason — see the "as a
    // link" block in button/index.test.tsx, which pins the rest of it.
    it('infers that an anchor given to `render` is not a native button', () => {
      const error = vi.spyOn(console, 'error').mockImplementation(() => {})

      const { button } = setup({ render: LINK })

      expect(error).not.toHaveBeenCalled()
      expect(button.tagName).toBe('A')
      error.mockRestore()
    })
  })

  describe('appearance', () => {
    it('renders each size square at its own control height', () => {
      const sizes = [
        ['xs', '32px'],
        ['md', '40px'],
        ['lg', '56px'],
      ] as const

      for (const [size, edge] of sizes) {
        const { button, unmount } = setup({ size })
        const computed = getComputedStyle(button)
        expect(computed.width).toBe(edge)
        expect(computed.height).toBe(edge)
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
            {...stylex.props(probeStyles.primaryContainer)}
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
