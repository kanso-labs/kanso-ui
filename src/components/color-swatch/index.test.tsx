import * as stylex from '@stylexjs/stylex'
import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import ColorSwatch from '.'
import { parseColor } from '../../react-aria'
import { declarationsHeld } from '../../styles/stylesheet.testing'
import {
  colorDefaultsDarkTheme,
  colorDefaultsLightTheme,
  colors,
  tokenScope,
} from '../../tokens/design.tokens.stylex'

const FORCED_COLORS = 'forced-colors: active'
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

// The roles a swatch's edge is compared with, resolved the way the page
// resolves them.
const probeStyles = stylex.create({
  outline: { color: colors.outline },
  surface: { color: colors.surface },
})

// The library's two schemes, pinned as the Storybook toolbar pins them.
const SCHEMES = [
  ['light', [...tokenScope, colorDefaultsLightTheme]],
  ['dark', [...tokenScope, colorDefaultsDarkTheme]],
] as const

/** A role's colour as the page resolves it. */
function colourOf(style: stylex.StyleXStyles) {
  const view = render(<span {...stylex.props(style)} />)
  const probe = view.container.firstElementChild
  if (probe === null) {
    throw new Error('expected the probe to render')
  }
  const { color } = getComputedStyle(probe)
  view.unmount()
  return color
}

/** WCAG's contrast ratio between two `rgb()` colours. */
function contrastOf(one: string, two: string) {
  const a = luminanceOf(one)
  const b = luminanceOf(two)
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)
}

/** WCAG's relative luminance of an `rgb()` colour. */
function luminanceOf(colour: string) {
  const [r = 0, g = 0, b = 0] = (colour.match(/\d+/g) ?? []).map((part) => {
    const channel = Number(part) / 255
    return channel <= 0.039_28
      ? channel / 12.92
      : ((channel + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
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

  // The mode drops a background image that is not a url(), so left to it the
  // chequer goes and a translucent colour reads as a flat one. React Aria
  // already opts the swatch itself out, inline; the ground has to be too.
  it('keeps the chequer under forced colours', () => {
    const view = render(<ColorSwatch color={TRANSPARENT} />)
    const forced = declarationsHeld(groundOf(view), FORCED_COLORS)

    expect(forced.get('forced-color-adjust')).toBe('none')
  })

  it('outlines the swatch, so a colour near the surface still has an edge', () => {
    const view = render(<ColorSwatch color="#ffffff" />)

    // A hairline inside the box rather than a border, which would otherwise
    // have to come out of the 40px square the swatch is given.
    expect(getComputedStyle(view.getByRole('img')).boxShadow).toContain('inset')
  })

  // A white swatch's edge is what carries its value on a light surface, so
  // it is a boundary that has to read, which WCAG 1.4.11 puts at 3:1 against
  // what is beside it. Material Design gives that kind of boundary the
  // outline role and keeps outline variant for decoration.
  it.each(SCHEMES)(
    'edges a white swatch in the outline role, at 3:1 on the %s surface',
    (_name, scope) => {
      const classes = (stylex.props(scope).className ?? '')
        .split(' ')
        .filter(Boolean)
      document.body.classList.add(...classes)
      try {
        const view = render(<ColorSwatch color="#ffffff" />)
        const edge = getComputedStyle(view.getByRole('img')).boxShadow
        const outline = colourOf(probeStyles.outline)

        expect(edge.startsWith(outline)).toBe(true)
        expect(
          contrastOf(outline, colourOf(probeStyles.surface)),
        ).toBeGreaterThanOrEqual(3)
        view.unmount()
      } finally {
        document.body.classList.remove(...classes)
      }
    },
  )

  it('is sized by the square around it, which is what the call site reaches', () => {
    const view = render(<ColorSwatch color={OPAQUE} style={TALL} />)
    const ground = groundOf(view)

    // The style lands on the square, and the colour fills whatever square it
    // is given — which is what makes resizing one from outside work.
    expect(getComputedStyle(ground).blockSize).toBe('64px')
    expect(view.getByRole('img').getBoundingClientRect().height).toBe(64)
  })
})
