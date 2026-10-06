import * as stylex from '@stylexjs/stylex'
import { act, fireEvent, render, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import Tabs from '.'
import { reducedMotionOf } from '../../styles/stylesheet.testing'
import {
  colors,
  stateLayerOpacity,
  typography,
} from '../../tokens/design.tokens.stylex'

// StyleX hashes an atomic class from the property and value, so the same
// declaration written here produces the same class the component produces.
// Asserting on class membership pins which role each state reaches for
// without depending on the browser having applied a rule these tests are the
// first thing to use — see chip/index.test.tsx for the flake behind this.
const probeStyles = stylex.create({
  activeColor: { color: colors.primary },
  disabledColor: {
    color: `color-mix(in srgb, ${colors.onSurface} calc(${stateLayerOpacity.disabledContent} * 100%), ${colors.surface})`,
  },
  divider: { boxShadow: `inset 0 -1px 0 0 ${colors.outlineVariant}` },
  inactiveColor: { color: colors.onSurfaceVariant },
  onSurfaceColor: { color: colors.onSurface },
  // A phone's width: three equal sections of about 109px each, narrower than
  // either long label below on one line.
  phone: { inlineSize: '360px' },
  primary: { backgroundColor: colors.primary },
  secondaryHover: {
    backgroundColor: `color-mix(in srgb, ${colors.onSurface} calc(${stateLayerOpacity.hover} * 100%), transparent)`,
  },
  titleSmall: { fontSize: typography.titleSmallSize },
  transparent: { backgroundColor: 'transparent' },
})

function classesOf(props: { className?: string | undefined }) {
  const classes = (props.className ?? '').split(' ').filter(Boolean)
  // An empty list would make every `every` below vacuously true, so it is a
  // broken assertion rather than a passing one.
  if (classes.length === 0) {
    throw new Error('expected the probe style to generate at least one class')
  }
  return classes
}

const CLASSES = {
  activeColor: classesOf(stylex.props(probeStyles.activeColor)),
  disabledColor: classesOf(stylex.props(probeStyles.disabledColor)),
  divider: classesOf(stylex.props(probeStyles.divider)),
  inactiveColor: classesOf(stylex.props(probeStyles.inactiveColor)),
  onSurfaceColor: classesOf(stylex.props(probeStyles.onSurfaceColor)),
  secondaryHover: classesOf(stylex.props(probeStyles.secondaryHover)),
  titleSmall: classesOf(stylex.props(probeStyles.titleSmall)),
  transparent: classesOf(stylex.props(probeStyles.transparent)),
}

// An icon as the README asks for one: hidden from assistive technology,
// drawn in `currentColor`, and `1em` square so the slot's size is its own.
const ICON = (
  <svg
    aria-hidden="true"
    data-testid="icon"
    fill="currentColor"
    height="1em"
    viewBox="0 0 24 24"
    width="1em"
  >
    <circle cx="12" cy="12" r="8" />
  </svg>
)

function centreOf(box: {
  bottom: number
  left: number
  right: number
  top: number
}) {
  return { x: (box.left + box.right) / 2, y: (box.top + box.bottom) / 2 }
}

function hasClasses(element: HTMLElement, classes: string[]) {
  return classes.every((name) => element.classList.contains(name))
}

// The slot a tab draws its icon in: the first thing in its label.
function iconSlotOf(tab: HTMLElement) {
  const slot = tab.firstElementChild?.firstElementChild
  if (!(slot instanceof HTMLElement) || slot.querySelector('svg') === null) {
    throw new Error('expected the tab to draw an icon slot first')
  }
  return slot
}

// The active indicator is the label span's `::after`, so it is read as the
// browser resolved it rather than as a class: a tab without one has no
// generated box, and its height reads as `auto`.
// The indicator is an element React Aria renders inside the selected tab
// alone, so an unselected tab has none at all. While it slides, the tab it
// came from keeps its own marked `data-exiting` until the transition ends —
// so "the indicator" is the one that is not on its way out.
function indicatorOf(tab: HTMLElement) {
  const found = tab.querySelector('[data-rac]:not([data-exiting])')
  return found instanceof HTMLElement ? found : null
}

// The badge's mark, which is hidden from assistive technology.
function markIn(tab: HTMLElement) {
  const mark = tab.querySelector('span[aria-hidden="true"]')
  if (!(mark instanceof HTMLElement)) {
    throw new Error('expected the tab to draw a badge')
  }
  return mark
}

// A colour as the browser resolves it, read off an element drawn in it.
function probe(style: stylex.StyleXStyles) {
  const view = render(<span data-testid="probe" {...stylex.props(style)} />)
  const colour = getComputedStyle(view.getByTestId('probe')).backgroundColor
  view.unmount()
  return colour
}

// A two-tab bar whose tabs both take `tab`, in the style `props` names.
function setupWith(
  props: Partial<Parameters<typeof Tabs>[0]> = {},
  tab: Partial<Parameters<typeof Tabs.Tab>[0]> = {},
) {
  return render(
    <Tabs defaultSelectedKey="first" {...props}>
      <Tabs.List>
        <Tabs.Tab id="first" {...tab}>
          First item
        </Tabs.Tab>
        <Tabs.Tab id="second" {...tab}>
          Second item
        </Tabs.Tab>
      </Tabs.List>
    </Tabs>,
  )
}

// The box a label's text is laid out in: its line, which is what the page
// measures the icon and the badge from.
function textBoxOf(tab: HTMLElement, text: string) {
  const span = [...tab.querySelectorAll('span')].find(
    (element) =>
      element.childElementCount === 0 && element.textContent === text,
  )
  if (span === undefined) {
    throw new Error(`expected the tab to carry the text "${text}"`)
  }
  return span.getBoundingClientRect()
}

// Hoisted, which is what react-perf's no-new-object-as-prop is after.
const TALL = { blockSize: '200px' }

// Every indicator the bar is drawing, which is two while one is sliding.
function indicatorsIn(view: ReturnType<typeof setup>) {
  return [
    ...view.getByRole('tablist').querySelectorAll('[role="tab"] > span > div'),
  ]
}

function indicatorStyleOf(tab: HTMLElement) {
  const indicator = indicatorOf(tab)
  if (indicator === null) {
    throw new Error('expected the tab to carry an indicator')
  }
  return getComputedStyle(indicator)
}

/**
 * The box a tab's label is painted in: its text's own extent, cut to any
 * element inside the tab that clips what overflows it. A clamped label
 * still lays out the lines it hides, and those are not painted.
 */
function paintedTextOf(tab: HTMLElement) {
  const range = document.createRange()
  range.selectNodeContents(tab)
  let { bottom, left, right, top } = range.getBoundingClientRect()
  for (const element of tab.querySelectorAll('*')) {
    if (getComputedStyle(element).overflow !== 'visible') {
      const clip = element.getBoundingClientRect()
      bottom = Math.min(bottom, clip.bottom)
      left = Math.max(left, clip.left)
      right = Math.min(right, clip.right)
      top = Math.max(top, clip.top)
    }
  }
  return { bottom, height: bottom - top, left, right, top }
}

function setup(props: Partial<Parameters<typeof Tabs>[0]> = {}) {
  const view = render(
    <Tabs defaultSelectedKey="first" {...props}>
      <Tabs.List>
        <Tabs.Tab id="first">First</Tabs.Tab>
        <Tabs.Tab id="second">Second</Tabs.Tab>
        <Tabs.Tab id="third">Third</Tabs.Tab>
      </Tabs.List>
      <Tabs.Panel id="first">First panel</Tabs.Panel>
      <Tabs.Panel id="second">Second panel</Tabs.Panel>
      <Tabs.Panel id="third">Third panel</Tabs.Panel>
    </Tabs>,
  )
  return {
    ...view,
    first: view.getByRole('tab', { name: 'First' }),
    second: view.getByRole('tab', { name: 'Second' }),
  }
}

/**
 * The two transition durations that reach `element` — the one it rests at and
 * the one `@media (prefers-reduced-motion: reduce)` gives it — read out of the
 * stylesheet through the shared walker in src/styles/stylesheet.testing.ts.
 */
function transitionDurations(element: Element) {
  return reducedMotionOf(element, 'transition-duration')
}

// A tab set whose second panel is taller than its first, which is what gives
// the panel box two heights to measure between.
function withPanels() {
  return render(
    <Tabs defaultSelectedKey="first">
      <Tabs.List aria-label="Label">
        <Tabs.Tab id="first">First item</Tabs.Tab>
        <Tabs.Tab id="second">Second item</Tabs.Tab>
      </Tabs.List>
      <Tabs.Panels data-testid="panels">
        <Tabs.Panel id="first">First item</Tabs.Panel>
        <Tabs.Panel id="second">
          <div style={TALL}>Second item</div>
        </Tabs.Panel>
      </Tabs.Panels>
    </Tabs>,
  )
}

describe('tabs', () => {
  describe('semantics', () => {
    // The roles are the reason this wraps React Aria rather than styling a row
    // of buttons: a tab announces that it selects a panel, and a button does
    // not.
    it('exposes a tablist of tabs and the selected panel', () => {
      const view = render(
        <Tabs defaultSelectedKey="first">
          <Tabs.List>
            <Tabs.Tab id="first">First</Tabs.Tab>
          </Tabs.List>
          <Tabs.Panel id="first">First panel</Tabs.Panel>
        </Tabs>,
      )
      expect(view.getByRole('tablist')).not.toBeNull()
      expect(view.getByRole('tab')).not.toBeNull()
      expect(view.getByRole('tabpanel')).not.toBeNull()
    })

    it('marks only the active tab selected', () => {
      const { first, second } = setup()
      expect(first.getAttribute('aria-selected')).toBe('true')
      expect(second.getAttribute('aria-selected')).toBe('false')
    })

    it('points the active tab at the panel it controls', () => {
      const view = render(
        <Tabs defaultSelectedKey="first">
          <Tabs.List>
            <Tabs.Tab id="first">First</Tabs.Tab>
          </Tabs.List>
          <Tabs.Panel id="first">First panel</Tabs.Panel>
        </Tabs>,
      )
      const controls = view.getByRole('tab').getAttribute('aria-controls')
      expect(controls).not.toBeNull()
      expect(view.getByRole('tabpanel').id).toBe(controls)
    })
  })

  describe('selection', () => {
    it('keeps its own selection when uncontrolled', () => {
      const { first, second } = setup()
      fireEvent.click(second)
      expect(second.getAttribute('aria-selected')).toBe('true')
      expect(first.getAttribute('aria-selected')).toBe('false')
    })

    // React Aria unmounts a panel the moment it is deselected, so the panel
    // on show is the only one in the DOM — getByRole throws if there were
    // two, which is what makes it the assertion.
    it('shows only the selected panel', () => {
      const view = render(
        <Tabs defaultSelectedKey="first">
          <Tabs.List>
            <Tabs.Tab id="first">First</Tabs.Tab>
            <Tabs.Tab id="second">Second</Tabs.Tab>
          </Tabs.List>
          <Tabs.Panel id="first">First panel</Tabs.Panel>
          <Tabs.Panel id="second">Second panel</Tabs.Panel>
        </Tabs>,
      )

      expect(view.getByRole('tabpanel').textContent).toBe('First panel')

      fireEvent.click(view.getByRole('tab', { name: 'Second' }))
      expect(view.getByRole('tabpanel').textContent).toBe('Second panel')
    })

    // Controlled means the call site owns the value: a click reports it and
    // nothing moves until the prop comes back different.
    it('does not move on its own when controlled', () => {
      const onSelectionChange = vi.fn<() => void>()
      const { first, second } = setup({
        onSelectionChange,
        selectedKey: 'first',
      })
      fireEvent.click(second)
      expect(onSelectionChange).toHaveBeenCalledTimes(1)
      expect(first.getAttribute('aria-selected')).toBe('true')
    })
  })

  describe('appearance', () => {
    it('sets the active label in primary and an inactive one in on surface variant', () => {
      const { first, second } = setup()
      expect(hasClasses(first, CLASSES.activeColor)).toBe(true)
      expect(hasClasses(first, CLASSES.titleSmall)).toBe(true)
      expect(hasClasses(second, CLASSES.inactiveColor)).toBe(true)
      expect(hasClasses(second, CLASSES.activeColor)).toBe(false)
    })

    it('leaves every tab transparent so the bar shows the surface it sits on', () => {
      const { first, second } = setup()
      expect(hasClasses(first, CLASSES.transparent)).toBe(true)
      expect(hasClasses(second, CLASSES.transparent)).toBe(true)
    })

    // The tabs page's indicator: 3dp, in primary, rounded along its top, and
    // never shorter than 24dp. The colour is read against the active label's,
    // which is the same role.
    it('draws the indicator under the active label alone', () => {
      const { first, second } = setup()
      const indicator = indicatorStyleOf(first)

      expect(indicator.height).toBe('3px')
      expect(indicator.minWidth).toBe('24px')
      expect(indicator.backgroundColor).toBe(getComputedStyle(first).color)
      expect(indicator.borderTopLeftRadius).not.toBe('0px')
      expect(indicator.borderBottomLeftRadius).toBe('0px')
      expect(indicatorOf(second)).toBeNull()
    })

    it('moves the indicator when the selection changes', () => {
      const { first, second } = setup()
      fireEvent.click(second)

      expect(indicatorStyleOf(second).height).toBe('3px')
      expect(hasClasses(second, CLASSES.activeColor)).toBe(true)
      expect(hasClasses(first, CLASSES.inactiveColor)).toBe(true)
    })

    // What makes it a slide rather than a switch: for as long as it is
    // moving, the tab it came from still holds an indicator, and only once
    // the animation has finished is that one taken away. A switch would put
    // one tab's indicator down and the next tab's up in the same frame.
    it('slides from one tab to the next rather than switching', async () => {
      const view = setup()
      const [first, second] = view.getAllByRole('tab')

      expect(indicatorsIn(view)).toHaveLength(1)

      fireEvent.click(second)

      // React Aria puts the new indicator where the old one was — an inline
      // translate of the gap between them — and takes it off a frame later
      // so the transition carries it home. That offset is the slide: a
      // switch would draw it in its final place from the first frame.
      const arriving = indicatorOf(second)
      const offset = Number.parseFloat(arriving?.style.translate ?? '')
      // Finite first: an unset `translate` parses to NaN, and NaN is not 0,
      // so the plain inequality passes on an indicator that never moved.
      expect(Number.isFinite(offset)).toBe(true)
      expect(offset).not.toBe(0)

      // And for as long as it is moving, the tab it came from keeps its own.
      expect(indicatorsIn(view)).toHaveLength(2)

      await waitFor(() => {
        expect(indicatorsIn(view)).toHaveLength(1)
      })
      expect(indicatorOf(second)).not.toBeNull()
      expect(indicatorOf(first)).toBeNull()
    })

    // The line that makes it slide, and the one most easily lost: React
    // Aria's shared element snapshots only the properties a transition
    // names, and reads `none` as an element that does not animate. Without
    // it the indicator still draws in the right place and never moves.
    it('names the properties it slides on, which is what animates it', () => {
      const { first } = setup()
      const indicator = indicatorStyleOf(first)

      expect(indicator.transitionProperty).toContain('translate')
      expect(indicator.transitionProperty).toContain('inline-size')
      expect(indicator.transitionDuration).not.toBe('0s')
    })

    // The page's bar: 48 tall with the divider inside it, divided into equal
    // sections whatever the labels measure.
    it('is a 48 bar of equal sections with the divider inside it', () => {
      const view = setup()
      const list = view.getByRole('tablist')
      const [first, second, third] = view.getAllByRole('tab')

      expect(hasClasses(list, CLASSES.divider)).toBe(true)
      expect(getComputedStyle(list).height).toBe('48px')
      expect(getComputedStyle(first).height).toBe('48px')
      expect(first.getBoundingClientRect().width).toBeCloseTo(
        second.getBoundingClientRect().width,
        0,
      )
      expect(second.getBoundingClientRect().width).toBeCloseTo(
        third.getBoundingClientRect().width,
        0,
      )
    })
  })

  describe('disabled', () => {
    // React Aria marks a disabled tab with aria-disabled and data-disabled and
    // leaves the native `disabled` attribute off, so a `:disabled` rule never
    // matches it — the first version of this component styled it that way and
    // a disabled tab rendered identically to an enabled one.
    it('dims a disabled tab', () => {
      const view = render(
        <Tabs defaultSelectedKey="first">
          <Tabs.List>
            <Tabs.Tab id="first">First</Tabs.Tab>
            <Tabs.Tab id="second" isDisabled>
              Second
            </Tabs.Tab>
          </Tabs.List>
        </Tabs>,
      )
      const disabled = view.getByRole('tab', { name: 'Second' })
      const enabled = view.getByRole('tab', { name: 'First' })

      expect(disabled.getAttribute('aria-disabled')).toBe('true')
      expect(hasClasses(disabled, CLASSES.disabledColor)).toBe(true)
      expect(hasClasses(disabled, CLASSES.inactiveColor)).toBe(false)
      // The enabled neighbour must not share the dimming, or the assertion
      // above would hold however the disabled tab was styled.
      expect(hasClasses(enabled, CLASSES.disabledColor)).toBe(false)
    })
  })

  // Arrow-key navigation is deliberately not tested here. React Aria's roving
  // focus runs through the browser's own focus handling, which a synthetic
  // keyDown does not drive — a test written against it reports on the test
  // harness rather than on the component. It is verified in a real browser
  // instead, and the result is recorded in the pull request.

  // Three parts move: the indicator slides between tabs, the panel box
  // resizes to the panel it holds, and a tab's colours change with its
  // state. Each stops for a reader who asked for less motion, and each is
  // pinned at rest too — a duration of `0s` in both is a transition nobody
  // wrote, not a media query doing its job.
  describe('reduced motion', () => {
    const PARTS: ReadonlyArray<{ find: () => Element; name: string }> = [
      {
        find: () => {
          const indicator = indicatorOf(setup().first)
          if (indicator === null) {
            throw new Error('expected the tab to carry an indicator')
          }
          return indicator
        },
        name: 'the indicator',
      },
      { find: () => withPanels().getByTestId('panels'), name: 'the panel box' },
      { find: () => setup().first, name: 'a tab' },
    ]

    it.each(PARTS)('moves $name at all', ({ find }) => {
      const { resting } = transitionDurations(find())

      expect(resting).toBeDefined()
      expect(resting).not.toBe('0s')
    })

    it.each(PARTS)(
      'stops moving $name for a reader who asked for less motion',
      ({ find }) => {
        expect(transitionDurations(find()).reduced).toBe('0s')
      },
    )
  })

  describe('the panel box', () => {
    it('takes its height from the variable React Aria measures', () => {
      const view = withPanels()
      const box = view.getByTestId('panels')
      const natural = getComputedStyle(box).blockSize

      // Set by hand rather than by a change of panel: what is under test is
      // that the box reads the variable at all, and a computed height is a
      // pixel value either way — so comparing it to `auto` proves nothing.
      box.style.setProperty('--tab-panel-height', '321px')

      expect(getComputedStyle(box).blockSize).toBe('321px')
      expect(getComputedStyle(box).blockSize).not.toBe(natural)
      expect(getComputedStyle(box).overflow).toBe('clip')
    })

    // A control flush with a panel's edge keeps its whole ring: a ring
    // reaches 4px past its control, and the box clips 4px past its own edge.
    it("clips 4px past its edge, where a flush control's ring ends", () => {
      const box = getComputedStyle(withPanels().getByTestId('panels'))

      expect(box.overflow).toBe('clip')
      expect(box.overflowClipMargin).toBe('4px')
    })

    // A panel with nothing focusable inside it takes focus itself. Drawn
    // around the panel, its ring fell wholly outside the box above, which
    // clips — a keyboard reaching the panel saw no ring at all.
    it("draws a focused panel's ring inside the panel", () => {
      const panel = withPanels().getByRole('tabpanel')

      fireEvent.keyDown(document.body, { key: 'Tab' })
      act(() => {
        panel.focus()
      })
      const computed = getComputedStyle(panel)

      expect(panel.matches(':focus-visible')).toBe(true)
      expect(computed.outlineStyle).toBe('solid')
      expect(computed.outlineWidth).toBe('2px')
      expect(computed.outlineOffset).toBe('-2px')
    })

    // The line that makes it animate, and the one most easily lost: React
    // Aria reads the box's computed transition once and does none of the
    // measuring unless it names a size. Without it the panels still swap
    // and the box still resizes — it just jumps.
    it('names a size to transition, which is what animates it', () => {
      const view = withPanels()
      const box = getComputedStyle(view.getByTestId('panels'))

      expect(box.transitionProperty).toContain('block-size')
      expect(box.transitionDuration).not.toBe('0s')
    })

    it('measures the new panel and animates the box to it', () => {
      const view = withPanels()
      const box = view.getByTestId('panels')

      expect(box.style.getPropertyValue('--tab-panel-height')).toBe('')

      fireEvent.click(view.getByRole('tab', { name: 'Second item' }))

      // React Aria puts the old height back and then sets the new one, so
      // the transition carries the box between them.
      const height = Number.parseFloat(
        box.style.getPropertyValue('--tab-panel-height'),
      )
      expect(Number.isFinite(height)).toBe(true)
      expect(height).toBeGreaterThan(200)
    })

    it('is optional, and panels work without it', () => {
      const view = setup()

      expect(view.queryByTestId('panels')).toBeNull()
      expect(view.getByRole('tabpanel')).not.toBeNull()
    })
  })

  // A label has only its tab's equal share of the bar. A single word longer
  // than that — common in German, Finnish and Dutch — cannot break at a
  // space, and a sentence wraps to as many lines as it takes; neither may
  // leave the tab, run into a neighbour or spill out of the 48dp bar.
  describe('a label longer than its section', () => {
    const LONG_WORD = 'Unterstützungszeile'
    const LONG_SENTENCE =
      'A label long enough that it has nowhere left to go on one line'

    function setupLong() {
      const view = render(
        <div {...stylex.props(probeStyles.phone)}>
          <Tabs defaultSelectedKey="first">
            <Tabs.List>
              <Tabs.Tab id="first">{LONG_WORD}</Tabs.Tab>
              <Tabs.Tab id="second">{LONG_SENTENCE}</Tabs.Tab>
              <Tabs.Tab id="third">Third item</Tabs.Tab>
            </Tabs.List>
          </Tabs>
        </div>,
      )
      return view
    }

    it.each([LONG_WORD, LONG_SENTENCE])('keeps "%s" inside its tab', (name) => {
      const view = setupLong()
      const tab = view.getByRole('tab', { name })
      const box = tab.getBoundingClientRect()
      const text = paintedTextOf(tab)

      expect(text.left).toBeGreaterThanOrEqual(box.left)
      expect(text.right).toBeLessThanOrEqual(box.right)
      expect(text.top).toBeGreaterThanOrEqual(box.top)
      expect(text.bottom).toBeLessThanOrEqual(box.bottom)
    })

    // Two lines at most, then an ellipsis, which is what MDC-Android's tab
    // allows; the name a screen reader reads stays whole.
    it('cuts a long sentence at two lines, keeping its whole name', () => {
      const view = setupLong()
      const tab = view.getByRole('tab', { name: LONG_SENTENCE })
      const lineHeight = Number.parseFloat(getComputedStyle(tab).lineHeight)

      expect(paintedTextOf(tab).height).toBeLessThanOrEqual(lineHeight * 2 + 1)
      expect(tab.textContent).toBe(LONG_SENTENCE)
    })

    // Under a stacked icon the 64dp tab has room for one line.
    it('cuts it at one line under an icon', () => {
      const view = render(
        <div {...stylex.props(probeStyles.phone)}>
          <Tabs defaultSelectedKey="first">
            <Tabs.List>
              <Tabs.Tab icon={ICON} id="first">
                {LONG_SENTENCE}
              </Tabs.Tab>
              <Tabs.Tab icon={ICON} id="second">
                Second item
              </Tabs.Tab>
            </Tabs.List>
          </Tabs>
        </div>,
      )
      const tab = view.getByRole('tab', { name: LONG_SENTENCE })
      const lineHeight = Number.parseFloat(getComputedStyle(tab).lineHeight)

      expect(paintedTextOf(tab).height).toBeLessThanOrEqual(lineHeight + 1)
      expect(tab.getBoundingClientRect().height).toBe(64)
    })
  })

  // The page's tab with an icon: 24dp, stacked over the label on a primary
  // tab, which is 64dp tall, and set before it on a secondary one, which
  // stays 48.
  describe('icons', () => {
    it("stacks a primary tab's icon over its label, 2dp apart, at 64", () => {
      const view = setupWith({}, { icon: ICON })
      const tab = view.getByRole('tab', { name: 'First item' })
      const icon = iconSlotOf(tab).getBoundingClientRect()
      const text = textBoxOf(tab, 'First item')

      expect(tab.getBoundingClientRect().height).toBe(64)
      expect([icon.width, icon.height]).toEqual([24, 24])
      expect(text.top - icon.bottom).toBeCloseTo(2, 0)
      expect(centreOf(icon).x).toBeCloseTo(centreOf(text).x, 0)
    })

    // The list stretches every tab to the tallest, so one icon is enough to
    // make the whole bar the page's 64.
    it('grows the whole bar with one stacked tab', () => {
      const view = render(
        <Tabs defaultSelectedKey="first">
          <Tabs.List>
            <Tabs.Tab icon={ICON} id="first">
              First item
            </Tabs.Tab>
            <Tabs.Tab id="second">Second item</Tabs.Tab>
          </Tabs.List>
        </Tabs>,
      )

      expect(view.getByRole('tablist').getBoundingClientRect().height).toBe(64)
      for (const tab of view.getAllByRole('tab')) {
        expect(tab.getBoundingClientRect().height).toBe(64)
      }
    })

    it("sets a secondary tab's icon before its label, 8dp from it, at 48", () => {
      const view = setupWith({ variant: 'secondary' }, { icon: ICON })
      const tab = view.getByRole('tab', { name: 'First item' })
      const icon = iconSlotOf(tab).getBoundingClientRect()
      const text = textBoxOf(tab, 'First item')

      expect(tab.getBoundingClientRect().height).toBe(48)
      expect(text.left - icon.right).toBeCloseTo(8, 0)
      expect(centreOf(icon).y).toBeCloseTo(centreOf(text).y, 0)
    })

    // The page gives the icon the label's role in every state of both
    // styles, so it takes the tab's own colour rather than one of its own.
    it("draws the icon in the tab's own colour", () => {
      const view = setupWith({}, { icon: ICON })
      const [first, second] = view.getAllByRole('tab')

      for (const tab of [first, second]) {
        expect(getComputedStyle(iconSlotOf(tab)).color).toBe(
          getComputedStyle(tab).color,
        )
      }
    })
  })

  // The page's secondary tabs, for a strip under a primary one: the active
  // label stays on surface, and the indicator is a 2dp line across the tab.
  describe('secondary', () => {
    it('draws the active label in on surface and an inactive one in on surface variant', () => {
      const view = setupWith({ variant: 'secondary' })
      const [first, second] = view.getAllByRole('tab')

      expect(hasClasses(first, CLASSES.onSurfaceColor)).toBe(true)
      expect(hasClasses(first, CLASSES.activeColor)).toBe(false)
      expect(hasClasses(second, CLASSES.inactiveColor)).toBe(true)
    })

    it('draws a 2dp primary indicator across the whole tab', () => {
      const view = setupWith({ variant: 'secondary' })
      const [first, second] = view.getAllByRole('tab')
      const indicator = indicatorOf(first)
      if (indicator === null) {
        throw new Error('expected the active tab to carry an indicator')
      }
      const style = getComputedStyle(indicator)

      expect(style.height).toBe('2px')
      expect(style.backgroundColor).toBe(probe(probeStyles.primary))
      expect(style.borderTopLeftRadius).toBe('0px')
      expect(indicator.getBoundingClientRect().width).toBe(
        first.getBoundingClientRect().width,
      )
      expect(indicatorOf(second)).toBeNull()
    })

    it('slides on the properties the primary one does', () => {
      const view = setupWith({ variant: 'secondary' })
      const [first] = view.getAllByRole('tab')
      const style = indicatorStyleOf(first)

      expect(style.transitionProperty).toContain('translate')
      expect(style.transitionDuration).not.toBe('0s')
    })

    // The page's secondary layers are on surface over an active tab and an
    // inactive one alike, where a primary active tab's are primary.
    it('lays the on-surface layer under a hovering pointer, active or not', () => {
      const view = setupWith({ variant: 'secondary' })
      const [first, second] = view.getAllByRole('tab')

      for (const tab of [first, second]) {
        fireEvent.pointerOver(tab, { pointerType: 'mouse' })
        expect(hasClasses(tab, CLASSES.secondaryHover)).toBe(true)
        fireEvent.pointerOut(tab, {
          pointerType: 'mouse',
          relatedTarget: document.body,
        })
      }
    })
  })

  // The page's badge: on a stacked icon where there is one, and 4dp after
  // the label anywhere else. Hidden from assistive technology, so the tab's
  // name is its label alone.
  describe('badges', () => {
    it('puts a badge on a stacked icon', () => {
      const view = setupWith({}, { badge: 3, icon: ICON })
      const tab = view.getByRole('tab', { name: 'First item' })
      const mark = markIn(tab)
      const anchor = tab.querySelector('[data-testid="icon"]')?.parentElement

      expect(mark.textContent).toBe('3')
      expect(anchor?.contains(mark)).toBe(true)
      expect(iconSlotOf(tab).contains(mark)).toBe(true)
    })

    it('puts a badge 4dp after a label with no icon over it', () => {
      const view = setupWith({}, { badge: true })
      const tab = view.getByRole('tab', { name: 'First item' })
      const mark = markIn(tab).getBoundingClientRect()
      const text = textBoxOf(tab, 'First item')

      expect([mark.width, mark.height]).toEqual([6, 6])
      expect(mark.left - text.right).toBeCloseTo(4, 0)
      expect(centreOf(mark).y).toBeCloseTo(centreOf(text).y, 0)
    })

    it("puts it after a secondary tab's label, past its icon", () => {
      const view = setupWith({ variant: 'secondary' }, { badge: 3, icon: ICON })
      const tab = view.getByRole('tab', { name: 'First item' })
      const mark = markIn(tab)

      expect(iconSlotOf(tab).contains(mark)).toBe(false)
      expect(
        mark.getBoundingClientRect().left - textBoxOf(tab, 'First item').right,
      ).toBeCloseTo(4, 0)
    })

    it('draws none for false', () => {
      const view = setupWith({}, { badge: false })
      const tab = view.getByRole('tab', { name: 'First item' })

      expect(tab.querySelector('span[aria-hidden="true"]')).toBeNull()
    })
  })
})
