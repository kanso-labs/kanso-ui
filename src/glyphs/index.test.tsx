import {
  arrowBackPath,
  arrowDownwardPath,
  arrowDropDownPath,
  arrowUpwardPath,
  calendarPath,
  checkCirclePath,
  checkPath,
  chevronDownPath,
  chevronEndPath,
  clockPath,
  closePath,
  errorPath,
  keyboardPath,
  minusPath,
  personPath,
  plusPath,
  searchPath,
} from '@kanso-labs/kanso-ui-core/glyphs'
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

// The paths @kanso-labs/kanso-ui-core publishes, read from the package rather
// than from the source under test, so a glyph drawing any other path fails its
// case. react-native-kanso-ui draws the same ones.
const PATHS: Record<keyof typeof glyphs, string> = {
  ArrowBackGlyph: arrowBackPath,
  ArrowDownwardGlyph: arrowDownwardPath,
  ArrowDropDownGlyph: arrowDropDownPath,
  ArrowUpwardGlyph: arrowUpwardPath,
  CalendarGlyph: calendarPath,
  CheckCircleGlyph: checkCirclePath,
  CheckGlyph: checkPath,
  ChevronDownGlyph: chevronDownPath,
  ChevronEndGlyph: chevronEndPath,
  ClockGlyph: clockPath,
  CloseGlyph: closePath,
  ErrorGlyph: errorPath,
  IndeterminateGlyph: minusPath,
  KeyboardGlyph: keyboardPath,
  MinusGlyph: minusPath,
  PersonGlyph: personPath,
  PlusGlyph: plusPath,
  SearchGlyph: searchPath,
}

const PATH_OF = new Map<string, string>(Object.entries(PATHS))

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

  it.each(CASES)("draws the package's path for $name", ({ Glyph, name }) => {
    const view = render(<Glyph />)
    const paths = [...view.container.querySelectorAll('svg path')]

    expect(paths.map((path) => path.getAttribute('d'))).toEqual([
      PATH_OF.get(name),
    ])
  })
})
