import * as stylex from '@stylexjs/stylex'
import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import Keycap from '.'
import { KeycapToneContext } from '../../keycap/context'
import { colors } from '../../tokens/design.tokens.stylex'

// Compared against an element styled straight from the token rather than a hex
// literal, so the assertion pins which role the border reaches for without
// also pinning what that role currently resolves to.
const probeStyles = stylex.create({
  onSurface: { color: colors.onSurface },
  outline: { color: colors.outline },
})

const harnessStyles = stylex.create({
  // A colour no role of the keycap's own resolves to, for the text around it.
  around: { color: 'rgb(1, 2, 3)' },
  prose: { fontFamily: 'Georgia, serif', fontSize: '32px' },
})

const ABBREVIATION = <abbr />

function colorOf(style: stylex.StyleXStyles) {
  const probe = render(<div data-testid="probe" {...stylex.props(style)} />)
  const value = getComputedStyle(probe.getByTestId('probe')).color
  probe.unmount()
  return value
}

/** A keycap inside text in a colour of its own, under `tone`. */
function inTextUnder(tone?: 'inherit' | 'neutral') {
  const keycap = (
    <span {...stylex.props(harnessStyles.around)}>
      <Keycap data-testid="keycap">Enter</Keycap>
    </span>
  )
  const view = render(
    tone === undefined ? (
      keycap
    ) : (
      <KeycapToneContext value={tone}>{keycap}</KeycapToneContext>
    ),
  )
  const { borderTopColor, color } = getComputedStyle(view.getByTestId('keycap'))
  view.unmount()
  return { borderTopColor, color }
}

function outlineColor() {
  return colorOf(probeStyles.outline)
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

  // The tone a selected or disabled menu item hands the keycaps in its
  // shortcut — see the menu's own tests for the item side of it.
  describe('the tone around it', () => {
    it('keeps its own colours in text of another colour', () => {
      const onSurface = colorOf(probeStyles.onSurface)
      const outline = outlineColor()

      for (const computed of [inTextUnder(), inTextUnder('neutral')]) {
        expect(computed.color).toBe(onSurface)
        expect(computed.borderTopColor).toBe(outline)
      }
    })

    it('draws its text and its rule in the colour around it when told to', () => {
      const computed = inTextUnder('inherit')
      expect(computed.color).toBe('rgb(1, 2, 3)')
      expect(computed.borderTopColor).toBe('rgb(1, 2, 3)')
    })
  })
})
