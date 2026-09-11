import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import ColorSwatch from '.'
import { parseColor } from '../../react-aria'

const OPAQUE = '#6750A4'
const TRANSPARENT = parseColor('hsla(200, 100%, 50%, 0.4)')
// Hoisted, which is what react-perf's no-new-object-as-prop is after.
const TALL = { blockSize: '64px' }

// The square the chequer is painted on, which is the swatch's parent rather
// than the swatch: React Aria writes the colour to the element's own inline
// `background-color`, and CSS paints an image over a colour rather than
// under it.
function groundOf(view: ReturnType<typeof render>) {
  const ground = view.getByRole('img').parentElement
  if (!(ground instanceof HTMLElement)) {
    throw new Error('expected the swatch to sit in a square')
  }
  return ground
}

describe('color swatch', () => {
  it('names itself from the colour it shows', () => {
    const view = render(<ColorSwatch color={OPAQUE} />)

    // React Aria's own naming, which is why a swatch needs no label.
    expect(view.getByRole('img').getAttribute('aria-label')).toBe('dark purple')
  })

  it('says how transparent a colour is, in that name', () => {
    const view = render(<ColorSwatch color={TRANSPARENT} />)

    expect(view.getByRole('img').getAttribute('aria-label')).toBe(
      'light vibrant cyan blue, 60% transparent',
    )
  })

  it('takes a name of its own instead', () => {
    const view = render(<ColorSwatch color={OPAQUE} colorName="Label" />)

    expect(view.getByRole('img').getAttribute('aria-label')).toBe('Label')
  })

  it('paints the colour itself, alpha and all', () => {
    const view = render(<ColorSwatch color={TRANSPARENT} />)

    expect(getComputedStyle(view.getByRole('img')).backgroundColor).toBe(
      'rgba(0, 170, 255, 0.4)',
    )
  })

  it('lays a chequer behind, so transparency reads as transparency', () => {
    const view = render(<ColorSwatch color={TRANSPARENT} />)
    const ground = getComputedStyle(groundOf(view))

    // Four gradients make the chequer: two per row of tiles, offset by half
    // a tile. A half-transparent colour and an opaque one of the same shade
    // are the same pixels without it.
    expect(ground.backgroundImage.split('linear-gradient').length - 1).toBe(4)
    expect(ground.backgroundSize).toContain('16px 16px')
    // Each gradient offset by half a tile rather than a whole one. At a
    // whole tile the four line up and the chequer comes out as diamonds —
    // which counting the layers alone does not catch.
    expect(ground.backgroundPosition).toBe(
      '0px 0px, 0px 8px, 8px -8px, -8px 0px',
    )
  })

  it('outlines the swatch, so a colour near the surface still has an edge', () => {
    const view = render(<ColorSwatch color="#ffffff" />)

    // A hairline inside the box rather than a border, which would otherwise
    // have to come out of the 40px square the swatch is given.
    expect(getComputedStyle(view.getByRole('img')).boxShadow).toContain('inset')
  })

  it('is sized by the square around it, which is what the call site reaches', () => {
    const view = render(<ColorSwatch color={OPAQUE} style={TALL} />)
    const ground = groundOf(view)

    // The style lands on the square, and the colour fills whatever square it
    // is given — which is what makes resizing one from outside work.
    expect(getComputedStyle(ground).blockSize).toBe('64px')
    expect(view.getByRole('img').getBoundingClientRect().height).toBe(64)
  })
})
