import * as stylex from '@stylexjs/stylex'
import { act, fireEvent, render, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import Tooltip from '.'
import { colors } from '../../tokens/design.tokens.stylex'
import Button from '../button'

// StyleX hashes an atomic class from the property and value, so the same
// declaration written here produces the same class the component produces.
// Asserting on class membership pins which role each part reaches for without
// depending on the browser having applied a rule these tests are the first
// thing to use — see chip/index.test.tsx for the flake behind this.
const probeStyles = stylex.create({
  container: { backgroundColor: colors.inverseSurface },
  text: { color: colors.inverseOnSurface },
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
  container: classesOf(stylex.props(probeStyles.container)),
  text: classesOf(stylex.props(probeStyles.text)),
}

function blur(element: HTMLElement) {
  act(() => {
    element.blur()
  })
}

// Focus is moved for real rather than fired as an event: React Aria ignores
// a focus event whose target is not the active element, so a synthetic one
// never reaches the tooltip's state.
function focus(element: HTMLElement) {
  act(() => {
    element.focus()
  })
}

function hasClasses(element: Element, classes: string[]) {
  return classes.every((name) => element.classList.contains(name))
}

/**
 * The tooltip, with its entry finished. It grows from 95%, so a box read
 * while that is running is short of the real one.
 */
function settled(tooltip: HTMLElement) {
  for (const animation of tooltip.getAnimations()) {
    animation.finish()
  }
  return tooltip
}

// Room above the trigger, so a tooltip asked to open there is not flipped
// for want of space. Hoisted for react-perf's no-new-object-as-prop.
const ROOM_ABOVE = { paddingBlockStart: '200px' }

function setup(props: Partial<Parameters<typeof Tooltip>[0]> = {}) {
  const view = render(
    <div style={ROOM_ABOVE}>
      <Tooltip label="Supporting text" {...props}>
        <Button>Trigger</Button>
      </Tooltip>
    </div>,
  )
  return { ...view, trigger: view.getByRole('button', { name: 'Trigger' }) }
}

describe('tooltip', () => {
  describe('semantics', () => {
    it('renders nothing until the element is hovered or focused', () => {
      const view = setup()
      expect(view.queryByRole('tooltip')).toBeNull()
      expect(view.trigger).not.toBeNull()
    })

    // React Aria opens on focus without a delay, which is what a keyboard
    // reaches the tooltip with.
    it('opens on focus and describes the element', async () => {
      const view = setup()
      focus(view.trigger)

      const tooltip = await view.findByRole('tooltip')
      expect(tooltip.textContent).toBe('Supporting text')
      expect(view.trigger.getAttribute('aria-describedby')).toBe(tooltip.id)
    })

    it('closes when focus leaves', async () => {
      const view = setup()
      focus(view.trigger)
      await view.findByRole('tooltip')

      blur(view.trigger)
      await waitFor(() => {
        expect(view.queryByRole('tooltip')).toBeNull()
      })
    })

    it('shows from the start when told to', () => {
      const view = setup({ defaultOpen: true })
      expect(view.getByRole('tooltip').textContent).toBe('Supporting text')
    })

    it('reports without opening when controlled', () => {
      const onOpenChange = vi.fn<(open: boolean) => void>()
      const view = setup({ isOpen: false, onOpenChange })
      focus(view.trigger)

      expect(onOpenChange).toHaveBeenCalledWith(true)
      expect(view.queryByRole('tooltip')).toBeNull()
    })

    it('is dismissed by Escape', async () => {
      const view = setup({ defaultOpen: true })
      expect(view.getByRole('tooltip')).not.toBeNull()

      fireEvent.keyDown(document.activeElement ?? document.body, {
        key: 'Escape',
      })
      await waitFor(() => {
        expect(view.queryByRole('tooltip')).toBeNull()
      })
    })
  })

  describe('appearance', () => {
    // The page's plain tooltip inverts the page: an inverse surface
    // container with its text in inverse on surface.
    it('draws the container on the inverse surface roles', () => {
      const view = setup({ defaultOpen: true })
      const tooltip = view.getByRole('tooltip')

      expect(hasClasses(tooltip, CLASSES.container)).toBe(true)
      expect(hasClasses(tooltip, CLASSES.text)).toBe(true)
    })

    // The page's 24dp container with 8dp of padding, holding the body-small
    // line the token viewer gives as 12 over 16.
    it("is a 24 container with the page's padding and type", () => {
      const view = setup({ defaultOpen: true })
      const tooltip = settled(view.getByRole('tooltip'))
      const style = getComputedStyle(tooltip)

      expect(style.minHeight).toBe('24px')
      expect(style.paddingLeft).toBe('8px')
      expect(style.paddingRight).toBe('8px')
      expect(style.fontSize).toBe('12px')
      expect(style.lineHeight).toBe('16px')
      expect(tooltip.getBoundingClientRect().height).toBe(24)
    })
  })

  describe('placement', () => {
    // React Aria reports where it actually put the tooltip, which is what
    // the entry's origin follows.
    it('opens above the element by default', () => {
      const view = setup({ defaultOpen: true })
      const tooltip = settled(view.getByRole('tooltip'))

      expect(tooltip.getAttribute('data-placement')).toBe('top')
      expect(tooltip.getBoundingClientRect().bottom).toBeLessThanOrEqual(
        view.trigger.getBoundingClientRect().top,
      )
    })

    // No room above at the top of the window, so it opens below instead —
    // which is React Aria's, and what the entry's origin follows.
    it('flips to the other side when there is no room', () => {
      const view = render(
        <Tooltip defaultOpen label="Supporting text">
          <Button>Trigger</Button>
        </Tooltip>,
      )
      expect(
        settled(view.getByRole('tooltip')).getAttribute('data-placement'),
      ).toBe('bottom')
    })

    it('opens on the side it is asked for', () => {
      const view = setup({ defaultOpen: true, side: 'bottom' })
      const tooltip = settled(view.getByRole('tooltip'))

      expect(tooltip.getAttribute('data-placement')).toBe('bottom')
      expect(tooltip.getBoundingClientRect().top).toBeGreaterThanOrEqual(
        view.trigger.getBoundingClientRect().bottom,
      )
    })

    it("leaves the page's 8 between the element and the tooltip", () => {
      const view = setup({ defaultOpen: true, side: 'bottom' })
      const gap =
        settled(view.getByRole('tooltip')).getBoundingClientRect().top -
        view.trigger.getBoundingClientRect().bottom

      expect(Math.round(gap)).toBe(8)
    })
  })
})
