import * as stylex from '@stylexjs/stylex'
import { fireEvent, render, waitFor } from '@testing-library/react'
import { cdp } from '@vitest/browser/context'
import { afterEach, describe, expect, it, vi } from 'vitest'

import Tabs from '.'
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
  titleSmall: classesOf(stylex.props(probeStyles.titleSmall)),
  transparent: classesOf(stylex.props(probeStyles.transparent)),
}

function hasClasses(element: HTMLElement, classes: string[]) {
  return classes.every((name) => element.classList.contains(name))
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

// Chromium's own media emulation, which is the only way to put the page in
// the state a reduced-motion reader is in — nothing in the suite sets it,
// and `matchMedia` cannot be written to.
async function reducedMotion(value: 'no-preference' | 'reduce') {
  // Vitest declares `CDPSession` as an empty interface, so the method it
  // does have at runtime is not on the type. Narrowed to the one call this
  // needs rather than left as `any`.
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- CDPSession is an empty upstream stub
  const session = cdp() as unknown as {
    send: (
      method: string,
      params: { features: { name: string; value: string }[] },
    ) => Promise<unknown>
  }
  await session.send('Emulation.setEmulatedMedia', {
    features: [{ name: 'prefers-reduced-motion', value }],
  })
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

describe('tabs', () => {
  // The emulation is the page's, not the render's, so it outlives the test
  // that set it unless this puts it back.
  afterEach(async () => {
    await reducedMotion('no-preference')
  })

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

    it('stops sliding for a reader who asked for less motion', async () => {
      await reducedMotion('reduce')
      const { first } = setup()

      // The properties stay named, so the indicator still lands in the
      // right place — it just gets there in no time at all.
      const indicator = indicatorStyleOf(first)
      expect(indicator.transitionDuration).toBe('0s')
      expect(indicator.transitionProperty).toContain('translate')
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

  describe('the panel box', () => {
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
      expect(getComputedStyle(box).overflow).toBe('hidden')
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

    it('stops animating for a reader who asked for less motion', async () => {
      await reducedMotion('reduce')
      const view = withPanels()
      const box = getComputedStyle(view.getByTestId('panels'))

      // The size stays named, so React Aria still measures and the box
      // still ends the right height — it just gets there in no time.
      expect(box.transitionDuration).toBe('0s')
      expect(box.transitionProperty).toContain('block-size')
    })

    it('is optional, and panels work without it', () => {
      const view = setup()

      expect(view.queryByTestId('panels')).toBeNull()
      expect(view.getByRole('tabpanel')).not.toBeNull()
    })
  })
})
