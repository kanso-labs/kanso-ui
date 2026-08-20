import * as stylex from '@stylexjs/stylex'
import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import Link from '.'
import { colors } from '../../tokens/design.tokens.stylex'

// Compared against elements styled straight from the tokens rather than hex
// literals, so the assertions pin which role a tone reaches for without also
// pinning what that role currently resolves to.
const probeStyles = stylex.create({
  primary: { color: colors.primary },
})

const harnessStyles = stylex.create({
  prose: {
    color: 'rgb(10, 20, 30)',
    fontFamily: 'Georgia, serif',
    fontSize: '29px',
  },
})

// oxlint-disable-next-line jsx-a11y/control-has-associated-label -- filled by useRender
const BUTTON = <button type="button" />

function primaryColor() {
  const probe = render(
    <div data-testid="probe" {...stylex.props(probeStyles.primary)} />,
  )
  const value = getComputedStyle(probe.getByTestId('probe')).color
  probe.unmount()
  return value
}

function setup(props: Partial<Parameters<typeof Link>[0]> = {}) {
  const view = render(
    <Link data-testid="link" href="#first" {...props}>
      Label
    </Link>,
  )
  return { ...view, link: view.getByTestId('link') }
}

describe('link', () => {
  describe('structure', () => {
    it('renders an anchor carrying its href and children', () => {
      const { link } = setup()
      expect(link.tagName).toBe('A')
      expect(link.getAttribute('href')).toBe('#first')
      expect(link.textContent).toBe('Label')
    })

    it('renders as another element when given one', () => {
      const { link } = setup({ render: BUTTON })
      expect(link.tagName).toBe('BUTTON')
    })

    it('passes attributes through to the element', () => {
      const { link } = setup({ rel: 'noreferrer', target: '_blank' })
      expect(link.getAttribute('target')).toBe('_blank')
      expect(link.getAttribute('rel')).toBe('noreferrer')
    })
  })

  // A link is a run of words inside something else, so it must not impose a
  // size or a face on the sentence it interrupts.
  describe('typography', () => {
    it('takes its type from the surrounding text', () => {
      const view = render(
        <div {...stylex.props(harnessStyles.prose)}>
          <Link data-testid="link" href="#first">
            Label
          </Link>
        </div>,
      )
      const computed = getComputedStyle(view.getByTestId('link'))
      expect(computed.fontSize).toBe('29px')
      expect(computed.fontFamily).toContain('Georgia')
    })

    it('takes the surrounding colour when told to inherit', () => {
      const view = render(
        <div {...stylex.props(harnessStyles.prose)}>
          <Link data-testid="link" href="#first" tone="inherit">
            Label
          </Link>
        </div>,
      )
      expect(getComputedStyle(view.getByTestId('link')).color).toBe(
        'rgb(10, 20, 30)',
      )
    })
  })

  describe('tone', () => {
    it('marks itself out from the surrounding text by default', () => {
      const expected = primaryColor()
      const view = render(
        <div {...stylex.props(harnessStyles.prose)}>
          <Link data-testid="link" href="#first">
            Label
          </Link>
        </div>,
      )
      const actual = getComputedStyle(view.getByTestId('link')).color
      expect(actual).toBe(expected)
      // Without this the assertion above would also pass if primary happened
      // to resolve to the prose colour the harness sets.
      expect(actual).not.toBe('rgb(10, 20, 30)')
    })
  })

  // Colour alone fails anyone who cannot separate the two hues, so the rule
  // has to be there without hovering.
  describe('underline', () => {
    it('draws the rule at rest by default', () => {
      const { link } = setup()
      expect(getComputedStyle(link).textDecorationLine).toBe('underline')
    })

    it('holds the rule back until hover when asked', () => {
      const { link } = setup({ underline: 'hover' })
      expect(getComputedStyle(link).textDecorationLine).toBe('none')
    })

    it('draws no rule at all when asked', () => {
      const { link } = setup({ underline: 'none' })
      expect(getComputedStyle(link).textDecorationLine).toBe('none')
    })
  })

  describe('focus', () => {
    // Keyboard focus has to be visible, and the ring is the only thing that
    // shows it — the colour and underline are already there at rest.
    it('shows a ring on keyboard focus and none at rest', () => {
      const { link } = setup()
      expect(getComputedStyle(link).outlineStyle).toBe('none')

      link.focus()
      expect(document.activeElement).toBe(link)
      expect(getComputedStyle(link).outlineStyle).toBe('solid')
      expect(getComputedStyle(link).outlineWidth).toBe('2px')
    })
  })
})
