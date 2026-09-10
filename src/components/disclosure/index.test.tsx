import * as stylex from '@stylexjs/stylex'
import { fireEvent, render } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import Disclosure from '.'
import { colors, stateLayerOpacity } from '../../tokens/design.tokens.stylex'

// StyleX hashes an atomic class from the property and value, so the same
// declaration written here produces the same class the component produces.
// Asserting on class membership pins which role each part reaches for without
// depending on the browser having applied a rule these tests are the first
// thing to use — see chip/index.test.tsx for the flake behind this.
const probeStyles = stylex.create({
  disabled: {
    color: `color-mix(in srgb, ${colors.onSurface} calc(${stateLayerOpacity.disabledContent} * 100%), ${colors.surface})`,
  },
  open: { gridTemplateRows: '1fr' },
  turned: {
    transform: { ':dir(rtl)': 'rotate(-90deg)', default: 'rotate(90deg)' },
  },
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
  disabled: classesOf(stylex.props(probeStyles.disabled)),
  open: classesOf(stylex.props(probeStyles.open)),
  turned: classesOf(stylex.props(probeStyles.turned)),
}

function hasClasses(element: Element, classes: string[]) {
  return classes.every((name) => element.classList.contains(name))
}

function setup(props: Partial<Parameters<typeof Disclosure>[0]> = {}) {
  const view = render(
    <Disclosure {...props}>
      <Disclosure.Header supporting="Supporting line">
        Headline
      </Disclosure.Header>
      <Disclosure.Panel>Panel body</Disclosure.Panel>
    </Disclosure>,
  )
  const trigger = view.getByRole('button')
  const panel = () => view.container.querySelector('[role="group"]')
  const track = () => panel()?.parentElement ?? null

  return { ...view, panel, track, trigger }
}

describe('disclosure', () => {
  describe('semantics', () => {
    // React Aria wants a heading around the trigger — the heading is what a
    // screen reader jumps between, the button is what opens the section — so
    // the header renders the pair rather than leaving a call site to
    // remember.
    it('renders the trigger inside a heading', () => {
      const view = setup()
      const heading = view.getByRole('heading', { level: 3 })

      expect(heading.querySelector('button')).not.toBeNull()
      expect(view.trigger.textContent).toContain('Headline')
    })

    it('takes a heading level of its own', () => {
      const view = render(
        <Disclosure>
          <Disclosure.Header headingLevel={2}>Headline</Disclosure.Header>
          <Disclosure.Panel>Panel body</Disclosure.Panel>
        </Disclosure>,
      )
      expect(view.getByRole('heading', { level: 2 })).not.toBeNull()
    })

    it('reports what the trigger controls and whether it is open', () => {
      const view = setup()

      expect(view.trigger.getAttribute('aria-expanded')).toBe('false')
      expect(view.trigger.getAttribute('aria-controls')).toBe(
        view.panel()?.getAttribute('id'),
      )
    })

    it('names the panel by the trigger', () => {
      const view = setup({ defaultExpanded: true })
      expect(view.panel()?.getAttribute('aria-labelledby')).toBe(
        view.trigger.getAttribute('id'),
      )
    })

    it('hides the panel from a screen reader while it is closed', () => {
      const view = setup()
      expect(view.panel()?.getAttribute('aria-hidden')).toBe('true')
    })
  })

  describe('opening', () => {
    it('opens and closes on a press', () => {
      const view = setup()

      fireEvent.click(view.trigger)
      expect(view.trigger.getAttribute('aria-expanded')).toBe('true')

      fireEvent.click(view.trigger)
      expect(view.trigger.getAttribute('aria-expanded')).toBe('false')
    })

    it('keeps its own state from defaultExpanded', () => {
      const view = setup({ defaultExpanded: true })
      expect(view.trigger.getAttribute('aria-expanded')).toBe('true')
    })

    it('does not open on its own when controlled', () => {
      const onExpandedChange = vi.fn<(isExpanded: boolean) => void>()
      const view = setup({ isExpanded: false, onExpandedChange })

      fireEvent.click(view.trigger)

      expect(onExpandedChange).toHaveBeenCalledWith(true)
      expect(view.trigger.getAttribute('aria-expanded')).toBe('false')
    })

    it('opens from the keyboard', () => {
      const view = setup()

      fireEvent.keyDown(view.trigger, { key: ' ' })
      fireEvent.keyUp(view.trigger, { key: ' ' })

      expect(view.trigger.getAttribute('aria-expanded')).toBe('true')
    })

    it('stops responding while disabled', () => {
      const onExpandedChange = vi.fn<(isExpanded: boolean) => void>()
      const view = setup({ isDisabled: true, onExpandedChange })

      fireEvent.click(view.trigger)

      expect(onExpandedChange).not.toHaveBeenCalled()
      expect(view.trigger).toHaveProperty('disabled', true)
    })
  })

  describe('the chevron', () => {
    it('points along the row while the section is closed', () => {
      const view = setup()
      const chevron = view.container.querySelector('svg')

      expect(chevron).not.toBeNull()
      expect(hasClasses(chevron!, CLASSES.turned)).toBe(false)
    })

    it('turns a quarter once the section is open', () => {
      const view = setup({ defaultExpanded: true })
      const chevron = view.container.querySelector('svg')

      expect(hasClasses(chevron!, CLASSES.turned)).toBe(true)
    })
  })

  describe('appearance', () => {
    // The header is the row every list here draws, so a section above a list
    // of rows lines up with them: the lists page's 56dp floor and 16dp inset.
    it('draws the header as the shared row', () => {
      const view = setup()
      const style = getComputedStyle(view.trigger)

      expect(style.minBlockSize).toBe('56px')
      expect(style.paddingLeft).toBe('16px')
      expect(style.paddingRight).toBe('16px')
    })

    it('fades the header while disabled', () => {
      const view = setup({ isDisabled: true })
      expect(hasClasses(view.trigger, CLASSES.disabled)).toBe(true)
    })

    // The track goes from nothing to the content's own height, so no height
    // is read from the DOM and none is written down. The closed measurement
    // is what the panel's padding placement buys: `hidden="until-found"`
    // skips an element's contents but keeps its own box, so padding on the
    // panel itself would leave a closed section a band of empty space tall.
    it('measures nothing while the section is closed', () => {
      const view = setup()
      const track = view.track()

      expect(track).not.toBeNull()
      expect(getComputedStyle(track!).gridTemplateRows).toBe('0px')
      expect(hasClasses(track!, CLASSES.open)).toBe(false)
    })

    it('opens to the height its content turns out to have', () => {
      const view = setup({ defaultExpanded: true })
      const track = view.track()!
      const rows = getComputedStyle(track).gridTemplateRows

      // The `1fr` is what makes the height the content's own rather than one
      // read from the DOM; the resolved pixels are what it turns into.
      expect(hasClasses(track, CLASSES.open)).toBe(true)
      expect(Number.parseFloat(rows)).toBeGreaterThan(0)
    })

    it('puts the panel padding inside what React Aria hides', () => {
      const view = setup({ defaultExpanded: true })
      const panel = view.panel()
      const inner = panel?.firstElementChild

      expect(getComputedStyle(panel!).paddingLeft).toBe('0px')
      expect(getComputedStyle(inner!).paddingLeft).toBe('16px')
    })
  })
})
