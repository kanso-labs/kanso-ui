import * as stylex from '@stylexjs/stylex'
import { fireEvent, render } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import Tabs from '.'
import { colors, stateLayerOpacity } from '../../tokens/design.tokens.stylex'

// StyleX hashes an atomic class from the property and value, so the same
// declaration written here produces the same class the component produces.
// Asserting on class membership pins which role each state reaches for
// without depending on the browser having applied a rule these tests are the
// first thing to use — see chip/index.test.tsx for the flake behind this.
const probeStyles = stylex.create({
  activeBackground: { backgroundColor: colors.primaryContainer },
  activeColor: { color: colors.onPrimaryContainer },
  disabledColor: {
    color: `color-mix(in srgb, ${colors.onSurface} calc(${stateLayerOpacity.disabledContent} * 100%), ${colors.surface})`,
  },
  inactiveBackground: { backgroundColor: 'transparent' },
  inactiveColor: { color: colors.onSurfaceVariant },
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
  activeBackground: classesOf(stylex.props(probeStyles.activeBackground)),
  activeColor: classesOf(stylex.props(probeStyles.activeColor)),
  disabledColor: classesOf(stylex.props(probeStyles.disabledColor)),
  inactiveBackground: classesOf(stylex.props(probeStyles.inactiveBackground)),
  inactiveColor: classesOf(stylex.props(probeStyles.inactiveColor)),
}

function hasClasses(element: HTMLElement, classes: string[]) {
  return classes.every((name) => element.classList.contains(name))
}

function setup(props: Partial<Parameters<typeof Tabs>[0]> = {}) {
  const view = render(
    <Tabs defaultValue="first" {...props}>
      <Tabs.List>
        <Tabs.Tab value="first">First</Tabs.Tab>
        <Tabs.Tab value="second">Second</Tabs.Tab>
        <Tabs.Tab value="third">Third</Tabs.Tab>
      </Tabs.List>
      <Tabs.Panel value="first">First panel</Tabs.Panel>
      <Tabs.Panel value="second">Second panel</Tabs.Panel>
      <Tabs.Panel value="third">Third panel</Tabs.Panel>
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
    // The roles are the reason this wraps Base UI rather than styling a row
    // of buttons: a tab announces that it selects a panel, and a button does
    // not.
    it('exposes a tablist of tabs and the selected panel', () => {
      const view = render(
        <Tabs defaultValue="first">
          <Tabs.List>
            <Tabs.Tab value="first">First</Tabs.Tab>
          </Tabs.List>
          <Tabs.Panel value="first">First panel</Tabs.Panel>
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
        <Tabs defaultValue="first">
          <Tabs.List>
            <Tabs.Tab value="first">First</Tabs.Tab>
          </Tabs.List>
          <Tabs.Panel value="first">First panel</Tabs.Panel>
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

    // Base UI keeps the outgoing panel mounted until its exit transition
    // finishes, marking it `inert` in the meantime — so the panel on show is
    // the one that is not inert, rather than the only one in the DOM.
    it('shows only the selected panel', () => {
      const view = render(
        <Tabs defaultValue="first">
          <Tabs.List>
            <Tabs.Tab value="first">First</Tabs.Tab>
            <Tabs.Tab value="second">Second</Tabs.Tab>
          </Tabs.List>
          <Tabs.Panel value="first">First panel</Tabs.Panel>
          <Tabs.Panel value="second">Second panel</Tabs.Panel>
        </Tabs>,
      )
      const shown = () =>
        view
          .getAllByRole('tabpanel')
          .filter((panel) => !panel.hasAttribute('inert'))
          .map((panel) => panel.textContent)

      expect(shown()).toEqual(['First panel'])

      fireEvent.click(view.getByRole('tab', { name: 'Second' }))
      expect(shown()).toEqual(['Second panel'])
    })

    // Controlled means the call site owns the value: a click reports it and
    // nothing moves until the prop comes back different.
    it('does not move on its own when controlled', () => {
      const onValueChange = vi.fn<() => void>()
      const { first, second } = setup({ onValueChange, value: 'first' })
      fireEvent.click(second)
      expect(onValueChange).toHaveBeenCalledTimes(1)
      expect(first.getAttribute('aria-selected')).toBe('true')
    })
  })

  describe('appearance', () => {
    it('gives the active tab the primary container pair', () => {
      const { first } = setup()
      expect(hasClasses(first, CLASSES.activeBackground)).toBe(true)
      expect(hasClasses(first, CLASSES.activeColor)).toBe(true)
    })

    it('leaves an inactive tab transparent so it tints what it sits on', () => {
      const { second } = setup()
      expect(hasClasses(second, CLASSES.inactiveBackground)).toBe(true)
      expect(hasClasses(second, CLASSES.activeBackground)).toBe(false)
    })

    // Styling comes from Base UI's state callback rather than a CSS selector,
    // so this is what proves the callback re-runs on selection.
    it('moves the pill when the selection changes', () => {
      const { first, second } = setup()
      fireEvent.click(second)

      expect(hasClasses(second, CLASSES.activeBackground)).toBe(true)
      expect(hasClasses(first, CLASSES.activeBackground)).toBe(false)
      expect(hasClasses(first, CLASSES.inactiveBackground)).toBe(true)
    })
  })

  describe('disabled', () => {
    // Base UI marks a disabled tab with aria-disabled and data-disabled and
    // leaves the native `disabled` attribute off, so a `:disabled` rule never
    // matches it — the first version of this component styled it that way and
    // a disabled tab rendered identically to an enabled one.
    it('dims a disabled tab', () => {
      const view = render(
        <Tabs defaultValue="first">
          <Tabs.List>
            <Tabs.Tab value="first">First</Tabs.Tab>
            <Tabs.Tab disabled value="second">
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

  // Arrow-key navigation is deliberately not tested here. Base UI's roving
  // focus runs through the browser's own focus handling, which a synthetic
  // keyDown does not drive — a test written against it reports on the test
  // harness rather than on the component. It is verified in a real browser
  // instead, and the result is recorded in the pull request.
})
