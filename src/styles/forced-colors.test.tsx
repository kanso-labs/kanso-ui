import type { ReactElement } from 'react'

import { fireEvent, render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import ColorSlider from '../components/color-slider'
import ColorSwatchPicker from '../components/color-swatch-picker'
import DateField from '../components/date-field'
import SearchField from '../components/search-field'
import Separator from '../components/separator'
import Slider from '../components/slider'

const FORCED_COLORS = 'forced-colors: active'

/** The one element matching `selector`, or a failure naming what was looked for. */
function find(element: ReactElement, selector: string): Element {
  const view = render(element)
  const found = view.container.querySelector(selector)

  if (found === null) {
    throw new Error(`No element matched ${selector}.`)
  }

  return found
}

/**
 * Every declaration that reaches `element` from inside a forced-colours media
 * query, keyed by property and by the selector's trailing pseudo-class.
 *
 * Copied from src/field/forced-colors.test.tsx rather than shared with it,
 * which is the arrangement AGENTS.md asks for. Reading the stylesheet is the
 * only way to check this: Chromium exposes forced-colours emulation through
 * CDP alone, which no test file here may drive, so what a test can prove is
 * that the rules exist and that the element carries the classes they are
 * written against.
 */
function forcedColorRules(element: Element): Map<string, string> {
  const found = new Map<string, string>()

  for (const sheet of document.styleSheets) {
    walk([...sheet.cssRules], false)
  }

  return found

  function walk(rules: CSSRule[], inForcedColors: boolean) {
    for (const rule of rules) {
      if (rule instanceof CSSMediaRule) {
        walk(
          [...rule.cssRules],
          inForcedColors || rule.conditionText.includes(FORCED_COLORS),
        )
        continue
      }

      if (rule instanceof CSSGroupingRule) {
        walk([...rule.cssRules], inForcedColors)
        continue
      }

      if (!inForcedColors || !(rule instanceof CSSStyleRule)) {
        continue
      }

      // A rule can carry several selectors, not one. StyleX gives each
      // declaration its own class, but two modules that happen to write the
      // same declaration under the same query share a rule — the date
      // segment's focus outline and the search bar's arrive as
      // `.abc.abc:focus-within, .def.def:focus`. Reading only the first
      // would report the rule as missing for whichever component lost the
      // race, which is a false negative rather than a gap.
      for (const selectorText of rule.selectorText.split(',')) {
        // Each is a run of one class repeated to raise specificity, plus an
        // optional pseudo-class: `.abc.abc:focus-within`.
        const [selector, pseudo = ''] = selectorText.trim().split(':', 2)
        const className = selector.split('.').find(Boolean)

        if (className === undefined || !element.classList.contains(className)) {
          continue
        }

        for (const property of rule.style) {
          found.set(
            pseudo === '' ? property : `${property}:${pseudo}`,
            rule.style.getPropertyValue(property),
          )
        }
      }
    }
  }
}

/**
 * The element a style is on is not always the one a role or an attribute
 * names — React Aria puts the input that carries the role inside the box that
 * carries the appearance — so these walk out to the parent rather than
 * assuming a depth.
 */
function parentOf(element: Element): Element {
  const parent = element.parentElement

  if (parent === null) {
    throw new Error('expected the element to sit inside another')
  }

  return parent
}

const HUE = <ColorSlider channel="hue" defaultValue="hsl(200, 100%, 50%)" />

describe('a boundary drawn in a shadow or a fill', () => {
  // The handle is a ring around a fill that is the value itself, and the ring
  // is two stacked shadows. Both go, leaving a bare circle of whatever colour
  // the track runs through at that point.
  it('gives the colour handle a border, in place of its shadow ring', () => {
    const rules = forcedColorRules(parentOf(find(HUE, 'input[type="range"]')))

    expect(rules.get('border-top-style')).toBe('solid')
    expect(rules.get('border-top-width')).toBe('1px')
  })

  it('keeps that handle a focus ring apart from its boundary', () => {
    const rules = forcedColorRules(parentOf(find(HUE, 'input[type="range"]')))

    expect(rules.get('outline-color')).toBe('highlight')
  })

  // A segment suppresses the browser's own ring and shows focus as a filled
  // shape, so the fill going takes the whole signal with it.
  it('gives a focused date segment an outline, in place of its fill', () => {
    const rules = forcedColorRules(
      find(<DateField label="Label" />, '[data-type="month"]'),
    )

    expect(rules.get('outline-style:focus')).toBe('solid')
    expect(rules.get('outline-color')).toBe('highlight')
  })

  it('gives the search bar a boundary and a ring, in place of its shadow', () => {
    const rules = forcedColorRules(
      parentOf(find(<SearchField label="Label" />, 'input')),
    )

    expect(rules.get('border-top-style')).toBe('solid')
    expect(rules.get('outline-style:focus-within')).toBe('solid')
    expect(rules.get('outline-color')).toBe('highlight')
  })

  // A rule that divides content rather than decorating it, so it is held to
  // the same bar as a boundary — unlike a Card's elevation or the rule under
  // a Tabs, which this library lets flatten.
  it('gives the separator a border, in place of its fill', () => {
    const rules = forcedColorRules(find(<Separator />, '[role="separator"]'))

    expect(rules.get('border-top-style')).toBe('solid')
    expect(rules.get('border-top-color')).toBe('canvastext')
  })

  // Everything a slider says about its value is a background: how far the
  // filled part runs, where the empty part stops, where the handle sits. The
  // track's parts are spans in order — filled, empty — with the handle after
  // them, which is what these two reach for.
  it('draws the slider handle a boundary of its own', () => {
    const view = render(<Slider defaultValue={40} label="Label" />)
    const thumb = view.container.querySelector('div[data-rac][style*="left"]')

    if (thumb === null) {
      throw new Error('expected the slider to place a handle')
    }

    expect(forcedColorRules(thumb).get('border-top-style')).toBe('solid')
  })

  it('tells the filled part of that track from the empty part', () => {
    const view = render(<Slider defaultValue={40} label="Label" />)
    const parts = [
      ...view.container.querySelectorAll('[data-orientation] > span'),
    ]

    if (parts.length < 2) {
      throw new Error('expected the slider to draw both parts of its track')
    }

    const [filled, empty] = parts
    const filledRules = forcedColorRules(filled)

    expect(filledRules.get('background-color')).toBe('highlight')
    expect(forcedColorRules(empty).get('background-color')).not.toBe(
      filledRules.get('background-color'),
    )
  })

  // Under forced colours every outline is repainted in one system colour, so
  // a hover ring the same shape as the selection ring would read as a second
  // chosen swatch. Dashed there, it cannot.
  it('draws a hovered swatch its ring dashed, apart from the chosen one', () => {
    const view = render(
      <ColorSwatchPicker aria-label="Label" defaultValue="#6750A4">
        <ColorSwatchPicker.Item color="#6750A4" />
        <ColorSwatchPicker.Item color="#625B71" />
      </ColorSwatchPicker>,
    )
    const [chosen, other] = view.getAllByRole('option')

    fireEvent.pointerOver(other, { pointerType: 'mouse' })

    expect(forcedColorRules(other).get('outline-style')).toBe('dashed')
    expect(forcedColorRules(chosen).get('outline-style')).toBeUndefined()
  })
})
