import * as stylex from '@stylexjs/stylex'
import { fireEvent, render } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

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
function indicatorOf(tab: HTMLElement) {
  const label = tab.firstElementChild
  if (!(label instanceof HTMLElement)) {
    throw new Error('expected the tab to wrap its label')
  }
  return getComputedStyle(label, '::after')
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
      const indicator = indicatorOf(first)

      expect(indicator.height).toBe('3px')
      expect(indicator.minWidth).toBe('24px')
      expect(indicator.backgroundColor).toBe(getComputedStyle(first).color)
      expect(indicator.borderTopLeftRadius).not.toBe('0px')
      expect(indicator.borderBottomLeftRadius).toBe('0px')
      expect(indicatorOf(second).height).toBe('auto')
    })

    // Styling comes from React Aria's state callback rather than a CSS selector,
    // so this is what proves the callback re-runs on selection.
    it('moves the indicator when the selection changes', () => {
      const { first, second } = setup()
      fireEvent.click(second)

      expect(indicatorOf(second).height).toBe('3px')
      expect(indicatorOf(first).height).toBe('auto')
      expect(hasClasses(second, CLASSES.activeColor)).toBe(true)
      expect(hasClasses(first, CLASSES.inactiveColor)).toBe(true)
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
})
