import * as stylex from '@stylexjs/stylex'
import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import Keycap from '.'
import { colors } from '../../tokens/design.tokens.stylex'

// Compared against an element styled straight from the token rather than a hex
// literal, so the assertion pins which role the border reaches for without
// also pinning what that role currently resolves to.
const probeStyles = stylex.create({
  outline: { color: colors.outline },
})

const harnessStyles = stylex.create({
  prose: { fontFamily: 'Georgia, serif', fontSize: '32px' },
})

const ABBREVIATION = <abbr />

function outlineColor() {
  const probe = render(
    <div data-testid="probe" {...stylex.props(probeStyles.outline)} />,
  )
  const value = getComputedStyle(probe.getByTestId('probe')).color
  probe.unmount()
  return value
}

function setup(props: Partial<Parameters<typeof Keycap>[0]> = {}) {
  const view = render(
    <Keycap data-testid="keycap" {...props}>
      Enter
    </Keycap>,
  )
  return { ...view, keycap: view.getByTestId('keycap') }
}

describe('keycap', () => {
  describe('structure', () => {
    it('renders a kbd element carrying its children', () => {
      const { keycap } = setup()
      expect(keycap.tagName).toBe('KBD')
      expect(keycap.textContent).toBe('Enter')
    })

    it('renders as another element when given one', () => {
      const { keycap } = setup({ render: ABBREVIATION })
      expect(keycap.tagName).toBe('ABBR')
    })

    it('passes attributes through to the element', () => {
      const { keycap } = setup({ title: 'Return' })
      expect(keycap.getAttribute('title')).toBe('Return')
    })
  })

  describe('typography', () => {
    it('renders in the mono face', () => {
      const { keycap } = setup()
      expect(getComputedStyle(keycap).fontFamily).toContain('Roboto Mono')
    })

    // A key named in a footnote and one named in a paragraph are the same
    // component, so a fixed size would be wrong for one of them.
    it('scales with the text it interrupts', () => {
      const view = render(
        <div {...stylex.props(harnessStyles.prose)}>
          <Keycap data-testid="keycap">Enter</Keycap>
        </div>,
      )
      // 0.8125em against the harness's 32px.
      expect(getComputedStyle(view.getByTestId('keycap')).fontSize).toBe('26px')
    })
  })

  describe('the cap', () => {
    it('draws its edge from the border role', () => {
      const expected = outlineColor()
      const { keycap } = setup()
      const computed = getComputedStyle(keycap)
      expect(computed.borderTopWidth).toBe('1px')
      expect(computed.borderTopColor).toBe(expected)
    })

    // Transparent rather than filled, so a keycap inside a Card or a Sheet
    // does not read as a nested surface. The border alone carries it.
    it('paints no surface of its own', () => {
      const { keycap } = setup()
      expect(getComputedStyle(keycap).backgroundColor).toBe('rgba(0, 0, 0, 0)')
    })

    // 'Enter' broken across two lines stops reading as one key.
    it('keeps a multi-letter key on one line', () => {
      const { keycap } = setup()
      expect(getComputedStyle(keycap).whiteSpace).toBe('nowrap')
    })

    // An inline box takes horizontal padding only, so the vertical padding
    // and the border would sit flush against the glyphs.
    it('opens its box on all four sides', () => {
      const { keycap } = setup()
      expect(getComputedStyle(keycap).display).toBe('inline-block')
    })
  })
})
