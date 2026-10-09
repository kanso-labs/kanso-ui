import type { ReactElement } from 'react'

import * as stylex from '@stylexjs/stylex'
import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { page } from 'vitest/browser'

import Button from '../components/button'
import Calendar from '../components/calendar'
import Checkbox from '../components/checkbox'
import ChipGroup from '../components/chip-group'
import ColorSlider from '../components/color-slider'
import ColorSwatchPicker from '../components/color-swatch-picker'
import DateField from '../components/date-field'
import Dialog from '../components/dialog'
import IconButton from '../components/icon-button'
import List from '../components/list'
import ListBox from '../components/list-box'
import Menu from '../components/menu'
import Meter from '../components/meter'
import NavigationBar from '../components/navigation-bar'
import NavigationTree from '../components/navigation-tree'
import Popover from '../components/popover'
import ProgressIndicator from '../components/progress-indicator'
import RadioGroup, { Radio } from '../components/radio-group'
import RangeCalendar from '../components/range-calendar'
import SearchField from '../components/search-field'
import Separator from '../components/separator'
import Sheet from '../components/sheet'
import Slider from '../components/slider'
import Snackbar from '../components/snackbar'
import Switch from '../components/switch'
import Table from '../components/table'
import Tabs from '../components/tabs'
import Tooltip from '../components/tooltip'
import Tree from '../components/tree'
import { CalendarDate } from '../date'
import { dragStyles } from '../drag/styles'
import { rowStyles } from '../row/styles'
import { declarationsHeld } from './stylesheet.testing'

const FORCED_COLORS = 'forced-colors: active'

// One pixel either side of the medium breakpoint the modal panels swap at, so
// a query written with the wrong comparison fails here rather than passing on
// the round number both readings agree on.
const COMPACT = 599
const MEDIUM = 601

// Storybook and the other specs share this browser, so the viewport has to go
// back to something ordinary or whatever runs next inherits 599px.
const DEFAULT_VIEWPORT = { height: 900, width: 1200 }

// A fixed range, so the calendar cases read the same whenever they run: the
// 8th to the 15th of September 2026. Its last day is also the date a single
// calendar holds.
const RANGE = {
  end: new CalendarDate(2026, 9, 15),
  start: new CalendarDate(2026, 9, 8),
}

// A day inside that range, ruled out on its own. Hoisted so its identity is
// stable, which is what react-perf is after.
const isEleventh = (date: { day: number }) => date.day === 11

// The item a disabled case turns off, hoisted so it is one stable array,
// which is what react-perf is after.
const SECOND = ['second']

// What an icon button holds. Its drawing is beside the point here, since
// nothing below reads it.
const ICON = <svg />

/** The one button `element` renders. */
function buttonIn(element: ReactElement): Element {
  return render(element).getByRole('button')
}

// The box a checkbox draws beside its hidden input, and its label.
function checkboxOf(props: { isDisabled?: boolean; isSelected?: boolean }) {
  const view = render(<Checkbox {...props}>Label</Checkbox>)
  const control = drawnAfter(view.getByRole('checkbox'))
  return {
    box: firstChildOf(control, 'a box'),
    label: view.getByText('Label'),
  }
}

/** A lone radio's dot, drawn inside its ring only while it is chosen. */
function dotOf(props: { isDisabled?: boolean } = {}) {
  const view = render(
    <RadioGroup defaultValue="first" label="Label" {...props}>
      <Radio value="first">First item</Radio>
    </RadioGroup>,
  )
  const ring = firstChildOf(drawnAfter(view.getByRole('radio')), 'a ring')

  return firstChildOf(ring, 'a dot in the ring')
}

/**
 * The element after the one wrapping `input`. React Aria wraps the input of a
 * radio or a switch in a visually hidden element, and what the control draws
 * follows it in the label.
 */
function drawnAfter(input: HTMLElement): Element {
  const drawn = parentOf(input).nextElementSibling

  if (drawn === null) {
    throw new Error('expected the control to follow the input')
  }

  return drawn
}

/** The one element matching `selector`, or a failure naming what was looked for. */
function find(element: ReactElement, selector: string): Element {
  const view = render(element)
  const found = view.container.querySelector(selector)

  if (found === null) {
    throw new Error(`No element matched ${selector}.`)
  }

  return found
}

/** The first child of `element`, or a failure naming what was looked for. */
function firstChildOf(element: Element, what: string): Element {
  const child = element.firstElementChild

  if (child === null) {
    throw new Error(`expected ${what}`)
  }

  return child
}

/**
 * Every declaration that reaches `element` from inside a forced-colours media
 * query, keyed by property and by the selector's trailing pseudo-class, read
 * through the shared walker in ./stylesheet.testing.ts.
 *
 * Forced colours is the one query taken as holding. Any other that a rule
 * sits inside is asked of the page as it stands, so a rule keyed on a
 * breakpoint as well reaches the element only at the widths it names, and a
 * case sets the viewport to read one side of it.
 */
function forcedColorRules(element: Element, pseudoElement = '') {
  return declarationsHeld(element, FORCED_COLORS, pseudoElement)
}

/**
 * The parts of the line a meter or a linear progress indicator draws under
 * its label row, in order: the active indicator, the track and the stop, or
 * for an indeterminate line the track and the two bars.
 */
function lineOf(element: ReactElement): Element[] {
  const view = render(element)
  const indicator = view.queryByRole('meter') ?? view.queryByRole('progressbar')
  const line = indicator?.lastElementChild

  if (line === null || line === undefined) {
    throw new Error('expected the indicator to draw a line')
  }

  return [...line.children]
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

/**
 * A switch's track and the handle travelling in it. The handle is the last
 * child of the seat, the track's first child, after the state layer.
 */
function switchOf(props: { isDisabled?: boolean; isSelected?: boolean }) {
  const view = render(<Switch {...props}>Label</Switch>)
  const input = view.getByRole('switch')
  const track = firstChildOf(drawnAfter(input), 'a track')
  const handle = firstChildOf(track, 'a seat').lastElementChild

  if (handle === null) {
    throw new Error('expected the seat to hold the handle')
  }

  return { handle, input, track }
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

  // A filled, tonal or elevated button is bounded by its container alone —
  // its fill, and an elevated one's shadow — and the mode drops both. What
  // was left was a label with nothing round it, which reads as text rather
  // than as a control.
  it.each(['elevated', 'filled', 'tonal'] as const)(
    'gives a %s button a border, in place of its container',
    (variant) => {
      const rules = forcedColorRules(
        buttonIn(<Button variant={variant}>Label</Button>),
      )

      expect(rules.get('border-top-style')).toBe('solid')
      expect(rules.get('border-top-width')).toBe('1px')
      expect(rules.get('border-top-color')).toBe('buttontext')
    },
  )

  // Every form of a filled or tonal icon button is bounded by a fill,
  // toggles chosen or not included.
  it.each([
    { name: 'a filled icon button', props: { variant: 'filled' } },
    { name: 'a tonal icon button', props: { variant: 'tonal' } },
    {
      name: 'an unchosen filled toggle',
      props: { defaultSelected: false, variant: 'filled' },
    },
    {
      name: 'a chosen filled toggle',
      props: { defaultSelected: true, variant: 'filled' },
    },
    {
      name: 'an unchosen tonal toggle',
      props: { defaultSelected: false, variant: 'tonal' },
    },
    {
      name: 'a chosen tonal toggle',
      props: { defaultSelected: true, variant: 'tonal' },
    },
  ] as const)(
    'gives $name a border, in place of its container',
    ({ props }) => {
      const rules = forcedColorRules(
        buttonIn(
          <IconButton aria-label="Label" {...props}>
            {ICON}
          </IconButton>,
        ),
      )

      expect(rules.get('border-top-style')).toBe('solid')
      expect(rules.get('border-top-width')).toBe('1px')
      expect(rules.get('border-top-color')).toBe('buttontext')
    },
  )

  // The page draws no boundary round a text button or a standard icon
  // button, and neither does the mode.
  it.each([
    { element: <Button variant="text">Label</Button>, name: 'a text button' },
    {
      element: (
        <IconButton aria-label="Label" variant="standard">
          {ICON}
        </IconButton>
      ),
      name: 'a standard icon button',
    },
  ])('draws $name no border', ({ element }) => {
    expect(
      forcedColorRules(buttonIn(element)).get('border-top-width'),
    ).toBeUndefined()
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

  // A meter and a linear progress indicator say everything they say with
  // backgrounds too — the active indicator, the track and the stop — so the
  // mode left them drawing nothing at all. The value takes `Highlight`, as
  // the slider's does, and the track keeps an edge, so the line is still a
  // shape with the value along it.
  it.each([
    { element: <Meter label="Label" value={40} />, name: 'a meter' },
    {
      element: <ProgressIndicator label="Label" value={40} />,
      name: 'a linear progress indicator',
    },
    {
      element: <Meter label="Label" tone="negative" value={40} />,
      name: 'a negative meter',
    },
    {
      element: <Meter label="Label" tone="positive" value={40} />,
      name: 'a positive meter',
    },
    {
      element: <ProgressIndicator label="Label" tone="inherit" value={40} />,
      name: 'a progress indicator of the inherited tone',
    },
  ])(
    'draws the value of $name in Highlight on an edged track',
    ({ element }) => {
      const [active, track, stop] = lineOf(element)

      expect(forcedColorRules(active).get('background-color')).toBe('highlight')
      expect(forcedColorRules(stop).get('background-color')).toBe('highlight')
      expect(forcedColorRules(track).get('outline-style')).toBe('solid')
      expect(forcedColorRules(track).get('outline-color')).toBe('canvastext')
    },
  )

  it.each([
    { name: 'an indeterminate line', tone: 'primary' },
    { name: 'an indeterminate line of the inherited tone', tone: 'inherit' },
  ] as const)(
    'draws the bars of $name in Highlight on an edged track',
    ({ tone }) => {
      const [track, ...bars] = lineOf(
        <ProgressIndicator isIndeterminate label="Label" tone={tone} />,
      )

      expect(bars).toHaveLength(2)
      for (const bar of bars) {
        expect(
          forcedColorRules(firstChildOf(bar, 'a bar')).get('background-color'),
        ).toBe('highlight')
      }
      expect(forcedColorRules(track).get('outline-style')).toBe('solid')
      expect(forcedColorRules(track).get('outline-color')).toBe('canvastext')
    },
  )

  // Under forced colours every ring is repainted in one system colour, so a
  // hover ring the same shape as the selection ring would read as a second
  // chosen swatch. Dashed there, it cannot. Both are the border of the box
  // after the swatch, which is what keeps the swatch's outline free for the
  // focus ring.
  it('draws a hovered swatch its ring dashed, apart from the chosen one', () => {
    const view = render(
      <ColorSwatchPicker aria-label="Label" defaultValue="#6750A4">
        <ColorSwatchPicker.Item color="#6750A4" />
        <ColorSwatchPicker.Item color="#625B71" />
      </ColorSwatchPicker>,
    )
    const [chosen, other] = view.getAllByRole('option')

    fireEvent.pointerOver(other, { pointerType: 'mouse' })

    expect(forcedColorRules(other, 'after').get('border-top-style')).toBe(
      'dashed',
    )
    expect(
      forcedColorRules(chosen, 'after').get('border-top-style'),
    ).toBeUndefined()
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

// A radio says it is chosen, and a switch that it is on, through fills alone,
// and forced colours paints every author fill in the page's own `Canvas`. A
// chosen radio's dot vanished into its ring, and a switch lost its handle
// and drew on and off as the same empty pill. System colours are kept rather
// than repainted, so each fill names one.
describe('a state told by a fill alone', () => {
  it('draws the chosen radio its dot in Highlight', () => {
    expect(forcedColorRules(dotOf()).get('background-color')).toBe('highlight')
  })

  it('draws a disabled radio its dot in GrayText', () => {
    expect(
      forcedColorRules(dotOf({ isDisabled: true })).get('background-color'),
    ).toBe('graytext')
  })

  it('fills the track of a switch that is on, with the handle over it', () => {
    const { handle, track } = switchOf({ isSelected: true })
    const trackRules = forcedColorRules(track)

    expect(trackRules.get('background-color')).toBe('highlight')
    expect(trackRules.get('border-top-color')).toBe('highlight')
    expect(forcedColorRules(handle).get('background-color')).toBe(
      'highlighttext',
    )
  })

  // The check is drawn in the handle's text colour, so it takes the other
  // half of the pair the handle's fill is from.
  it('draws the check of a switch that is on in Highlight', () => {
    const { handle } = switchOf({ isSelected: true })

    expect(forcedColorRules(handle).get('color')).toBe('highlight')
  })

  it('draws the handle of a switch that is off over an empty track', () => {
    const { handle, track } = switchOf({})
    const trackRules = forcedColorRules(track)

    expect(trackRules.get('background-color')).toBe('canvas')
    expect(trackRules.get('border-top-color')).toBe('buttontext')
    expect(forcedColorRules(handle).get('background-color')).toBe('buttontext')
  })

  // The handle takes a fill of its own while hovered, pressed or focused,
  // and a fill written without the query would replace the one written with
  // it — so the handle would vanish exactly while it was being pointed at.
  it.each([
    { expected: 'buttontext', isSelected: false, name: 'off' },
    { expected: 'highlighttext', isSelected: true, name: 'on' },
  ])(
    'keeps the handle of a switch that is $name while it is hovered',
    ({ expected, isSelected }) => {
      const { handle, input } = switchOf({ isSelected })

      fireEvent.pointerOver(parentOf(input), { pointerType: 'mouse' })

      expect(forcedColorRules(handle).get('background-color')).toBe(expected)
    },
  )

  it('draws a disabled switch that is off in GrayText', () => {
    const { handle, track } = switchOf({ isDisabled: true })

    expect(forcedColorRules(track).get('border-top-color')).toBe('graytext')
    expect(forcedColorRules(handle).get('background-color')).toBe('graytext')
  })

  it('fills the track of a disabled switch that is on in GrayText', () => {
    const { handle, track } = switchOf({ isDisabled: true, isSelected: true })

    expect(forcedColorRules(track).get('background-color')).toBe('graytext')
    expect(forcedColorRules(handle).get('background-color')).toBe('canvas')
  })

  // A disabled button is a faded label on a faded container or rule, which
  // the mode repaints at full strength. Chromium greys a disabled `<button>`
  // there by itself, but not the `<span>` React Aria renders for a disabled
  // link, so each disabled style names `GrayText` rather than leave it to the
  // browser.
  it('draws the label of a disabled link button in GrayText', () => {
    const view = render(
      <Button href="#label" isDisabled>
        Label
      </Button>,
    )

    expect(forcedColorRules(view.getByRole('link')).get('color')).toBe(
      'graytext',
    )
  })

  it.each(['elevated', 'filled', 'outlined', 'text', 'tonal'] as const)(
    'draws the label of a disabled %s button in GrayText',
    (variant) => {
      expect(
        forcedColorRules(
          buttonIn(
            <Button isDisabled variant={variant}>
              Label
            </Button>,
          ),
        ).get('color'),
      ).toBe('graytext')
    },
  )

  it.each(['elevated', 'filled', 'outlined', 'tonal'] as const)(
    'draws the edge of a disabled %s button in GrayText',
    (variant) => {
      expect(
        forcedColorRules(
          buttonIn(
            <Button isDisabled variant={variant}>
              Label
            </Button>,
          ),
        ).get('border-top-color'),
      ).toBe('graytext')
    },
  )

  it.each(['filled', 'outlined', 'standard', 'tonal'] as const)(
    'draws the icon of a disabled %s icon button in GrayText',
    (variant) => {
      expect(
        forcedColorRules(
          buttonIn(
            <IconButton aria-label="Label" isDisabled variant={variant}>
              {ICON}
            </IconButton>,
          ),
        ).get('color'),
      ).toBe('graytext')
    },
  )

  it.each(['filled', 'outlined', 'tonal'] as const)(
    'draws the edge of a disabled %s icon button in GrayText',
    (variant) => {
      expect(
        forcedColorRules(
          buttonIn(
            <IconButton aria-label="Label" isDisabled variant={variant}>
              {ICON}
            </IconButton>,
          ),
        ).get('border-top-color'),
      ).toBe('graytext')
    },
  )

  // A toggle says it is chosen through its fill, or a standard one through
  // its icon's colour alone, and the mode repaints both, so a chosen toggle
  // looked the same as an unchosen one.
  it.each(['filled', 'outlined', 'standard', 'tonal'] as const)(
    'draws a chosen %s toggle in Highlight',
    (variant) => {
      const rules = forcedColorRules(
        buttonIn(
          <IconButton aria-label="Label" defaultSelected variant={variant}>
            {ICON}
          </IconButton>,
        ),
      )

      expect(rules.get('background-color')).toBe('highlight')
      expect(rules.get('color')).toBe('highlighttext')
    },
  )

  // A chosen filled toggle has the plain filled button's colours, and the
  // two are only told apart here.
  it.each([
    { name: 'a filled icon button', props: {} },
    { name: 'an unchosen filled toggle', props: { defaultSelected: false } },
  ])('keeps $name out of Highlight', ({ props }) => {
    expect(
      forcedColorRules(
        buttonIn(
          <IconButton aria-label="Label" variant="filled" {...props}>
            {ICON}
          </IconButton>,
        ),
      ).get('background-color'),
    ).toBeUndefined()
  })

  // A selected date is a fill with its text over it, and a range adds a band
  // that is a fill alone, so the mode left a calendar with no selection and
  // no range on it — only today's outline, which is a border.
  it('draws the selected date in Highlight', () => {
    const view = render(
      <Calendar aria-label="Label" defaultValue={RANGE.end} />,
    )
    const rules = forcedColorRules(
      view.getByRole('button', { name: /September 15, 2026/ }),
    )

    expect(rules.get('background-color')).toBe('highlight')
    expect(rules.get('color')).toBe('highlighttext')
  })

  // Left to adjust, the mode lays a `Canvas` backplate behind the date, and
  // `HighlightText` on it is a blank box. So the chosen cells opt out, and
  // name a system colour for the two other things they draw: today's
  // outline, into the fill, and the focus ring, on the page around it.
  it('takes the chosen pair as it is, today and the focus ring included', () => {
    const view = render(
      <Calendar aria-label="Label" defaultValue={RANGE.end} />,
    )
    const rules = forcedColorRules(
      view.getByRole('button', { name: /September 15, 2026/ }),
    )

    expect(rules.get('forced-color-adjust')).toBe('none')
    expect(rules.get('border-top-color')).toBe('highlight')
    expect(rules.get('outline-color')).toBe('canvastext')
  })

  // A day ruled out inside a range, and a date in a disabled calendar, draw
  // no fill of their own and name no system colour, so they are the mode's
  // to colour again.
  it('hands a day ruled out inside a range back to the mode', () => {
    const view = render(
      <RangeCalendar
        aria-label="Label"
        defaultValue={RANGE}
        isDateUnavailable={isEleventh}
      />,
    )
    const rules = forcedColorRules(
      view.getByRole('button', { name: /September 11, 2026/ }),
    )

    expect(rules.get('forced-color-adjust')).toBe('auto')
  })

  it('hands the date a disabled calendar holds back to the mode', () => {
    const view = render(
      <Calendar aria-label="Label" defaultValue={RANGE.end} isDisabled />,
    )
    const rules = forcedColorRules(
      view.getByRole('button', { name: /September 15, 2026/ }),
    )

    expect(rules.get('forced-color-adjust')).toBe('auto')
  })

  it.each([
    { label: /September 8, 2026/, name: 'first day' },
    { label: /September 12, 2026/, name: 'band' },
    // Matched with the word React Aria ends the name with, since both ends
    // name the whole range first and the first one names this day too.
    { label: /September 15, 2026 selected/, name: 'last day' },
  ])('draws the $name of a range in Highlight', ({ label }) => {
    const view = render(
      <RangeCalendar aria-label="Label" defaultValue={RANGE} />,
    )
    const rules = forcedColorRules(view.getByRole('button', { name: label }))

    expect(rules.get('background-color')).toBe('highlight')
    expect(rules.get('color')).toBe('highlighttext')
  })
})

// A selection drawn as a fill alone: forced colours paint the fill in
// `Canvas` and the text in `CanvasText`, so a chosen option, the current
// page in a drawer and the open tab looked like everything around them.
// Each is drawn in `Highlight` instead, a row under `HighlightText` and out
// of the mode's adjusting, as the calendar's chosen dates are.
const FIRST_KEY = ['first']

/** The row a selecting list draws for its first, selected, item. */
function selectedRowOf(element: ReactElement, role: string): Element {
  const view = render(element)
  const row = view
    .getAllByRole(role)
    .find((candidate) => candidate.getAttribute('aria-selected') === 'true')

  if (row === undefined) {
    throw new Error(`expected a selected ${role}`)
  }

  return row
}

const SELECTED_ROWS: ReadonlyArray<{ name: string; row: () => Element }> = [
  {
    name: 'a ListBox option',
    row: () =>
      selectedRowOf(
        <ListBox
          aria-label="Label"
          defaultSelectedKeys={FIRST_KEY}
          selectionMode="single"
        >
          <ListBox.Item id="first">First item</ListBox.Item>
          <ListBox.Item id="second">Second item</ListBox.Item>
        </ListBox>,
        'option',
      ),
  },
  {
    name: 'a List row',
    row: () =>
      selectedRowOf(
        <List
          aria-label="Label"
          defaultSelectedKeys={FIRST_KEY}
          selectionMode="single"
        >
          <List.Item id="first">First item</List.Item>
          <List.Item id="second">Second item</List.Item>
        </List>,
        'row',
      ),
  },
  {
    name: 'a Tree row',
    row: () =>
      selectedRowOf(
        <Tree
          aria-label="Label"
          defaultSelectedKeys={FIRST_KEY}
          selectionMode="single"
        >
          <Tree.Item headline="First item" id="first" />
          <Tree.Item headline="Second item" id="second" />
        </Tree>,
        'row',
      ),
  },
  {
    name: 'a Table row',
    row: () =>
      selectedRowOf(
        <Table
          aria-label="Label"
          defaultSelectedKeys={FIRST_KEY}
          selectionMode="single"
        >
          <Table.Header>
            <Table.Column id="colName" isRowHeader>
              Label
            </Table.Column>
          </Table.Header>
          <Table.Body>
            <Table.Row id="first">
              <Table.Cell>First item</Table.Cell>
            </Table.Row>
            <Table.Row id="second">
              <Table.Cell>Second item</Table.Cell>
            </Table.Row>
          </Table.Body>
        </Table>,
        'row',
      ),
  },
  {
    name: 'a Menu item',
    row: () => {
      render(
        <Menu defaultOpen>
          <Button>Open</Button>
          <Menu.Content defaultSelectedKeys={FIRST_KEY} selectionMode="single">
            <Menu.Item id="first">First item</Menu.Item>
            <Menu.Item id="second">Second item</Menu.Item>
          </Menu.Content>
        </Menu>,
      )
      const item = screen
        .getAllByRole('menuitemradio')
        .find((candidate) => candidate.getAttribute('aria-checked') === 'true')
      if (item === undefined) {
        throw new Error('expected a checked menu item')
      }
      return item
    },
  },
  {
    name: "a NavigationTree's current row",
    row: () => {
      const view = render(
        <NavigationTree aria-label="Label" selectedRoute="#first">
          <NavigationTree.Item href="#first" id="first" label="First item" />
          <NavigationTree.Item href="#second" id="second" label="Second item" />
        </NavigationTree>,
      )
      const row = view
        .getAllByRole('row')
        .find((candidate) => candidate.getAttribute('data-current') === 'true')
      if (row === undefined) {
        throw new Error('expected a current row')
      }
      return row
    },
  },
]

describe('a selection told by a fill alone', () => {
  it.each(SELECTED_ROWS)('draws $name in Highlight', ({ row }) => {
    const rules = forcedColorRules(row())

    expect(rules.get('background-color')).toBe('highlight')
    expect(rules.get('color')).toBe('highlighttext')
    expect(rules.get('forced-color-adjust')).toBe('none')
  })

  // Out of the mode's adjusting, a child naming a colour of its own keeps
  // it, so the supporting line under a selected row names one too.
  it("draws a selected row's supporting line in HighlightText", () => {
    const view = render(
      <ListBox
        aria-label="Label"
        defaultSelectedKeys={FIRST_KEY}
        selectionMode="single"
      >
        <ListBox.Item id="first" supporting="Supporting line">
          First item
        </ListBox.Item>
      </ListBox>,
    )

    expect(
      forcedColorRules(view.getByText('Supporting line')).get('color'),
    ).toBe('highlighttext')
  })

  // A row's ring takes its text's colour, which is `HighlightText` on a
  // selected row and whatever the mode gives the text on any other.
  it("draws a row's focus ring in the row's own colour", () => {
    const view = render(<div {...stylex.props(rowStyles.focusVisible)} />)
    const ring = view.container.firstElementChild

    if (ring === null) {
      throw new Error('expected the probe to render')
    }

    expect(forcedColorRules(ring).get('outline-color')).toBe('currentcolor')
  })

  // A disabled row hands its colours back to the mode, whatever it was.
  it('hands a disabled selected row back to the mode', () => {
    const view = render(
      <ListBox
        aria-label="Label"
        defaultSelectedKeys={FIRST_KEY}
        disabledKeys={FIRST_KEY}
        selectionMode="single"
      >
        <ListBox.Item id="first">First item</ListBox.Item>
      </ListBox>,
    )

    expect(
      forcedColorRules(view.getByRole('option')).get('forced-color-adjust'),
    ).toBe('auto')
  })

  // The indicator is the only mark of the open tab: the active label
  // differs from the others in colour alone, which the mode takes too.
  it("draws the open tab's indicator as a Highlight border", () => {
    const view = render(
      <Tabs defaultSelectedKey="first">
        <Tabs.List aria-label="Label">
          <Tabs.Tab id="first">First item</Tabs.Tab>
          <Tabs.Tab id="second">Second item</Tabs.Tab>
        </Tabs.List>
      </Tabs>,
    )
    const tab = view.getByRole('tab', { name: 'First item' })
    const indicator = [...tab.querySelectorAll('*')].find(
      (element) =>
        forcedColorRules(element).get('border-top-color') === 'highlight',
    )

    expect(indicator).toBeDefined()
    expect(forcedColorRules(indicator!).get('border-top-width')).toBe('3px')
  })

  // React Aria draws a drop line only while a drag is in flight, which a
  // test cannot start, so the line's styles are applied directly.
  it('draws the line a drag will land on as a Highlight border', () => {
    const view = render(
      <div
        {...stylex.props(dragStyles.indicator, dragStyles.indicatorActive)}
      />,
    )
    const line = view.container.firstElementChild

    if (line === null) {
      throw new Error('expected the probe to render')
    }

    const rules = forcedColorRules(line)
    expect(rules.get('border-top-style')).toBe('solid')
    expect(rules.get('border-top-color')).toBe('highlight')
  })

  // The strip is an inverse fill under a shadow, and the mode removes both,
  // so the message sat on the page with nothing at its edge.
  it("gives a snackbar's strip a CanvasText border", () => {
    const queue = new Snackbar.Queue()
    queue.add('First item')
    render(<Snackbar queue={queue} />)
    const strip = screen.getByText('First item').closest('[role="alertdialog"]')

    if (strip === null) {
      throw new Error('expected the message to sit in its strip')
    }

    const rules = forcedColorRules(strip)
    expect(rules.get('border-top-style')).toBe('solid')
    expect(rules.get('border-top-width')).toBe('1px')
    expect(rules.get('border-top-color')).toBe('canvastext')
  })
})

// A disabled control is a faded label and outline, and the mode repaints
// each at full strength. It greys a native `:disabled` control by itself,
// which the hidden inputs here are, but nothing drawn beside one and
// nothing marked aria-disabled — so each of these drew a disabled item
// exactly as it drew an enabled one, and each disabled style now names
// `GrayText`. The enabled item is checked beside it, so a `GrayText` that
// applied to every state would fail.
describe('a disabled item', () => {
  it('draws a disabled checkbox and its label in GrayText', () => {
    const { box, label } = checkboxOf({ isDisabled: true })

    expect(forcedColorRules(box).get('border-top-color')).toBe('graytext')
    expect(forcedColorRules(label).get('color')).toBe('graytext')
  })

  it('draws the box and check of a disabled checked checkbox in GrayText', () => {
    const rules = forcedColorRules(
      checkboxOf({ isDisabled: true, isSelected: true }).box,
    )

    expect(rules.get('border-top-color')).toBe('graytext')
    expect(rules.get('color')).toBe('graytext')
  })

  it('leaves an enabled checkbox to the mode', () => {
    const { box, label } = checkboxOf({})

    expect(forcedColorRules(box).get('border-top-color')).toBeUndefined()
    expect(forcedColorRules(label).get('color')).toBeUndefined()
  })

  // The ring is drawn in the control's colour, so the colour is the rule.
  it('draws a disabled radio, its label and its group label in GrayText', () => {
    const view = render(
      <RadioGroup isDisabled label="Group">
        <Radio value="first">First item</Radio>
      </RadioGroup>,
    )

    expect(
      forcedColorRules(drawnAfter(view.getByRole('radio'))).get('color'),
    ).toBe('graytext')
    expect(forcedColorRules(view.getByText('First item')).get('color')).toBe(
      'graytext',
    )
    expect(forcedColorRules(view.getByText('Group')).get('color')).toBe(
      'graytext',
    )
  })

  it('leaves an enabled radio to the mode', () => {
    const view = render(
      <RadioGroup label="Group">
        <Radio value="first">First item</Radio>
      </RadioGroup>,
    )

    expect(
      forcedColorRules(drawnAfter(view.getByRole('radio'))).get('color'),
    ).toBeUndefined()
  })

  it('draws a disabled list row in GrayText', () => {
    const view = render(
      <List aria-label="Label" disabledKeys={SECOND}>
        <List.Item id="first">First item</List.Item>
        <List.Item id="second">Second item</List.Item>
      </List>,
    )
    const [enabled, disabled] = view.getAllByRole('row')

    expect(forcedColorRules(disabled).get('color')).toBe('graytext')
    expect(forcedColorRules(enabled).get('color')).not.toBe('graytext')
  })

  it('draws a disabled menu item in GrayText', () => {
    render(
      <Menu defaultOpen>
        <Button>Open</Button>
        <Menu.Content>
          <Menu.Item id="first">First item</Menu.Item>
          <Menu.Item id="second" isDisabled>
            Second item
          </Menu.Item>
        </Menu.Content>
      </Menu>,
    )
    const [enabled, disabled] = screen.getAllByRole('menuitem')

    expect(forcedColorRules(disabled).get('color')).toBe('graytext')
    expect(forcedColorRules(enabled).get('color')).not.toBe('graytext')
  })

  it('draws a disabled chip and its outline in GrayText', () => {
    const view = render(
      <ChipGroup disabledKeys={SECOND} label="Label">
        <ChipGroup.Chip id="first">First item</ChipGroup.Chip>
        <ChipGroup.Chip id="second">Second item</ChipGroup.Chip>
      </ChipGroup>,
    )
    const [enabled, disabled] = view.getAllByRole('row')
    const rules = forcedColorRules(disabled)

    expect(rules.get('color')).toBe('graytext')
    expect(rules.get('border-top-color')).toBe('graytext')
    expect(forcedColorRules(enabled).get('color')).toBeUndefined()
  })

  it('draws a disabled destination in GrayText', () => {
    const view = render(
      <NavigationBar aria-label="Label" selectedRoute="#first">
        <NavigationBar.Item href="#first" icon={ICON}>
          First item
        </NavigationBar.Item>
        <NavigationBar.Item href="#second" icon={ICON} isDisabled>
          Second item
        </NavigationBar.Item>
      </NavigationBar>,
    )
    const [enabled, disabled] = view.getAllByRole('link')

    expect(forcedColorRules(disabled).get('color')).toBe('graytext')
    expect(forcedColorRules(enabled).get('color')).not.toBe('graytext')
  })
})
