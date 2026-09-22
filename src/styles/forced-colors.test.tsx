import type { ReactElement } from 'react'

import { fireEvent, render } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { page } from 'vitest/browser'

import Button from '../components/button'
import ColorSlider from '../components/color-slider'
import ColorSwatchPicker from '../components/color-swatch-picker'
import DateField from '../components/date-field'
import Dialog from '../components/dialog'
import Menu from '../components/menu'
import Popover from '../components/popover'
import SearchField from '../components/search-field'
import Separator from '../components/separator'
import Sheet from '../components/sheet'
import Slider from '../components/slider'
import Tooltip from '../components/tooltip'

const FORCED_COLORS = 'forced-colors: active'

// One pixel either side of the medium breakpoint the modal panels swap at, so
// a query written with the wrong comparison fails here rather than passing on
// the round number both readings agree on.
const COMPACT = 599
const MEDIUM = 601

// Storybook and the other specs share this browser, so the viewport has to go
// back to something ordinary or whatever runs next inherits 599px.
const DEFAULT_VIEWPORT = { height: 900, width: 1200 }

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
 *
 * Forced colours is the one query taken as holding. Any other that a rule
 * sits inside is asked of the page as it stands, so a rule keyed on a
 * breakpoint as well reaches the element only at the widths it names, and a
 * case sets the viewport to read one side of it. Where two rules reach the
 * same property the later one wins, as it does in the page: StyleX writes
 * the rule under both queries after the one under forced colours alone.
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
        const forced = rule.conditionText.includes(FORCED_COLORS)

        if (forced || matchMedia(rule.conditionText).matches) {
          walk([...rule.cssRules], inForcedColors || forced)
        }
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

// The anchored overlays, open, each returning the element their surface is
// drawn on. That is the element around the one carrying the role for a menu
// and a popover, and the tooltip itself for a tooltip. Portalled to the
// end of the body, which is where the queries bound by `render` look.
function openMenu(): Element {
  const view = render(
    <Menu defaultOpen>
      <Button>Open</Button>
      <Menu.Content>
        <Menu.Item id="first">First item</Menu.Item>
      </Menu.Content>
    </Menu>,
  )

  return parentOf(view.getByRole('menu'))
}

function openPopover(): Element {
  const view = render(
    <Popover defaultOpen>
      <Button>Open</Button>
      <Popover.Content>
        <Popover.Title>Headline</Popover.Title>
      </Popover.Content>
    </Popover>,
  )

  return parentOf(view.getByRole('dialog'))
}

function openTooltip(): Element {
  const view = render(
    <Tooltip defaultOpen label="Label">
      <Button>Open</Button>
    </Tooltip>,
  )

  return view.getByRole('tooltip')
}

const SURFACES: ReadonlyArray<{ name: string; open: () => Element }> = [
  { name: "a menu's surface", open: openMenu },
  { name: "a popover's surface", open: openPopover },
  { name: 'a tooltip', open: openTooltip },
]

// The two modal panels, open, each returning the element its edge is drawn
// on: the one around the element carrying the role, as for a popover.
function openDialog(): Element {
  const view = render(
    <Dialog defaultOpen>
      <Button>Open</Button>
      <Dialog.Content>
        <Dialog.Title>Headline</Dialog.Title>
      </Dialog.Content>
    </Dialog>,
  )

  return parentOf(view.getByRole('dialog'))
}

function openSheet(): Element {
  const view = render(
    <Sheet defaultOpen>
      <Button>Open</Button>
      <Sheet.Content>
        <Sheet.Title>Headline</Sheet.Title>
      </Sheet.Content>
    </Sheet>,
  )

  return parentOf(view.getByRole('dialog'))
}

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

  // Every anchored overlay is drawn on the one surface in overlay.ts, whose
  // edge is its elevation alone. Forced colours paints that surface's fill in
  // the page's own `Canvas`, so without a border a menu's items ran straight
  // into whatever the page drew behind them. Each overlay merges styles of
  // its own over the surface, and one that wrote a border would replace this
  // one whole, so it is read off each rather than off the style once.
  it.each(SURFACES)(
    'gives $name a border, in place of its shadow',
    ({ open }) => {
      const rules = forcedColorRules(open())

      expect(rules.get('border-top-style')).toBe('solid')
      expect(rules.get('border-top-width')).toBe('1px')
      expect(rules.get('border-top-color')).toBe('canvastext')
    },
  )

  // A modal panel's edge is its elevation as well, and forced colours paints
  // the scrim behind it in `Canvas` along with the panel, so nothing else
  // sets the panel apart from the page. Each draws a border on the edges that
  // meet the page and on no others, and which edges those are is the
  // breakpoint's to decide — so these read either side of it.
  describe('a modal panel', () => {
    afterEach(async () => {
      await page.viewport(DEFAULT_VIEWPORT.width, DEFAULT_VIEWPORT.height)
    })

    it('gives a dialog a border all round, in place of its shadow', async () => {
      await page.viewport(MEDIUM, 900)
      const rules = forcedColorRules(openDialog())

      expect(rules.get('border-top-style')).toBe('solid')
      expect(rules.get('border-top-width')).toBe('1px')
      expect(rules.get('border-top-color')).toBe('canvastext')
    })

    // Full screen, every edge of it meets the edge of the window instead.
    it('draws a full-screen dialog no border', async () => {
      await page.viewport(COMPACT, 900)

      expect(forcedColorRules(openDialog()).get('border-top-style')).toBe(
        'none',
      )
    })

    // Read as the logical property, which is what moves the edge to the
    // panel's right under RTL, where the panel rests against the left.
    it('gives a side sheet a border on its inline-start edge alone', async () => {
      await page.viewport(MEDIUM, 900)
      const rules = forcedColorRules(openSheet())

      expect(rules.get('border-inline-start-style')).toBe('solid')
      expect(rules.get('border-inline-start-width')).toBe('1px')
      expect(rules.get('border-inline-start-color')).toBe('canvastext')
      expect(rules.get('border-top-style')).toBeUndefined()
    })

    it('gives a bottom sheet a border on its top edge alone', async () => {
      await page.viewport(COMPACT, 900)
      const rules = forcedColorRules(openSheet())

      expect(rules.get('border-top-style')).toBe('solid')
      expect(rules.get('border-top-width')).toBe('1px')
      expect(rules.get('border-top-color')).toBe('canvastext')
      expect(rules.get('border-inline-start-style')).toBe('none')
    })
  })
})
