import * as stylex from '@stylexjs/stylex'
import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import * as glyphs from '.'

// Sized the way every call site sizes a glyph, by a class of its own, with
// padding besides so the box model shows in the width: 24 under
// `border-box`, 28 under the `content-box` an svg starts from.
const probeStyles = stylex.create({
  sized: {
    blockSize: '24px',
    inlineSize: '24px',
    padding: '2px',
  },
})

const CASES = Object.entries(glyphs).map(([name, Glyph]) => ({ Glyph, name }))

describe('glyphs', () => {
  it.each(CASES)('sizes $name in its own box', ({ Glyph }) => {
    const view = render(<Glyph {...stylex.props(probeStyles.sized)} />)
    const svg = view.container.querySelector('svg')
    if (svg === null) {
      throw new Error('expected the glyph to draw an svg')
    }

    expect(getComputedStyle(svg).boxSizing).toBe('border-box')
    expect(svg.getBoundingClientRect().width).toBe(24)
  })

  // The glyph's own class is merged with the call site's rather than
  // replacing it, and the rest of what it draws is untouched.
  it.each(CASES)('keeps the call site on $name', ({ Glyph }) => {
    const view = render(<Glyph className="call-site" data-testid="glyph" />)
    const svg = view.getByTestId('glyph')

    expect(svg.classList.contains('call-site')).toBe(true)
    expect(svg.getAttribute('aria-hidden')).toBe('true')
    expect(svg.getAttribute('viewBox')).toBe('0 0 24 24')
    expect(svg.querySelector('path')).not.toBeNull()
  })
})
