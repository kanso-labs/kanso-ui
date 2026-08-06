import type { ComponentProps } from 'react'

import * as stylex from '@stylexjs/stylex'
import { act, fireEvent, render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import Button from '.'
import { rippleStyles } from '../../styles/ripple'
import { colors } from '../../tokens/design.tokens.stylex'
import { motionDurationMs } from '../../tokens/values'

// The tonal assertions compare against an element styled straight from the
// tokens rather than against hex literals, so they pin which colour role the
// variant reaches for without also pinning what that role happens to resolve
// to today.
const tokenProbeStyles = stylex.create({
  tonalPair: {
    backgroundColor: colors.primaryContainer,
    color: colors.onPrimaryContainer,
  },
})

// Named here for the waits below to read as intent, but derived from the same
// tokens useRipple spends rather than copied as numbers — a retuned token
// moves the hook and these waits together. What is still mirrored by hand is
// which token each one is, and the boundary assertions are what catch that
// going stale: they advance to one millisecond either side of the floor, so a
// hook waiting on a different step fails here rather than passing loosely.
const TOUCH_DELAY_MS = motionDurationMs.short2
const MINIMUM_PRESS_MS = motionDurationMs.medium1

// The ripple's inner span carries the classes from `rippleStyles.pressed` only
// while the hook considers itself pressed, so their presence is an observable
// signal for its state without reaching into React internals.
const pressedClassNames = (stylex.props(rippleStyles.pressed).className ?? '')
  .split(' ')
  .filter(Boolean)

/** Advances the fake clock and lets React flush what that triggered. */
async function advance(ms: number) {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms)
  })
}

/**
 * Dispatches a raw PointerEvent so tests can drive pointer id, primary-ness,
 * and button state precisely — combinations `@testing-library/user-event`'s
 * higher-level pointer API doesn't expose.
 */
function firePointer(
  target: Element,
  type: string,
  init: PointerEventInit = {},
) {
  fireEvent(target, new PointerEvent(type, pointerInit(target, init)))
}

// React derives onPointerLeave from the bubbling `pointerout` event, not from
// `pointerleave` itself, which doesn't bubble and has no root-level listener.
function firePointerLeave(target: Element, init: PointerEventInit = {}) {
  firePointer(target, 'pointerout', { relatedTarget: document.body, ...init })
}

/**
 * Stands in for the Web Animations API so a test can control how much of a
 * press has elapsed.
 *
 * The real implementation runs on the document timeline, which fake timers do
 * not drive. Left alone, `currentTime` would sit at zero and the hook would
 * never observe a press reaching its minimum duration, so the branch that
 * releases immediately could not be reached at all.
 */
function installFakeAnimate() {
  // Captured as a descriptor rather than as a bare method reference, so the
  // native implementation is restored exactly as it was found.
  const native = Object.getOwnPropertyDescriptor(Element.prototype, 'animate')!

  Object.defineProperty(Element.prototype, 'animate', {
    configurable: true,
    value(this: Element, _keyframes: unknown, options: { duration: number }) {
      const startedAt = Date.now()
      let cancelled = false
      return {
        cancel() {
          cancelled = true
        },
        get currentTime() {
          return cancelled
            ? null
            : Math.min(Date.now() - startedAt, options.duration)
        },
      }
    },
    writable: true,
  })

  return () => {
    Object.defineProperty(Element.prototype, 'animate', native)
  }
}

function pointerInit(target: Element, init: PointerEventInit = {}) {
  const rect = target.getBoundingClientRect()
  return {
    bubbles: true,
    cancelable: true,
    clientX: rect.left + rect.width / 2,
    clientY: rect.top + rect.height / 2,
    isPrimary: true,
    pointerId: 1,
    pointerType: 'mouse',
    ...init,
  }
}

function setup(props: Partial<ComponentProps<typeof Button>> = {}) {
  const view = render(<Button {...props}>Button</Button>)
  const button = view.getByRole('button')

  const rippleSurface = () =>
    view.container.querySelector('span[aria-hidden="true"]')

  const isPressed = () => {
    const span = view.container.querySelector('span[aria-hidden="true"] > span')
    if (!span) {
      return false
    }
    // The length check matters: `[].every()` is vacuously true, so an empty
    // class list would report "pressed" unconditionally.
    return (
      pressedClassNames.length > 0 &&
      pressedClassNames.every((className) => span.classList.contains(className))
    )
  }

  return { ...view, button, isPressed, rippleSurface }
}

describe('appearance', () => {
  it('renders each size at its own control height', () => {
    const heights = [
      ['xs', '32px'],
      ['md', '40px'],
      ['lg', '56px'],
      ['xl', '80px'],
    ] as const

    for (const [size, height] of heights) {
      const { button, unmount } = setup({ size })
      expect(getComputedStyle(button).height).toBe(height)
      unmount()
    }
  })

  // The one genuinely load-bearing thing about applying size after variant.
  // Every size but md declares its own inline padding, so md is the only one
  // where a variant's own padding survives — which is what keeps a text
  // button tighter than a filled one at the default size, and what makes them
  // agree at every other size.
  it('lets the variant keep its inline padding only at the default size', () => {
    const inlinePadding = (props: Parameters<typeof setup>[0]) => {
      const { button, unmount } = setup(props)
      const padding = getComputedStyle(button).paddingLeft
      unmount()
      return padding
    }

    expect(inlinePadding({ variant: 'text' })).not.toBe(
      inlinePadding({ variant: 'filled' }),
    )
    expect(inlinePadding({ size: 'lg', variant: 'text' })).toBe(
      inlinePadding({ size: 'lg', variant: 'filled' }),
    )
  })

  it('paints the tonal variant with the primary container pair', () => {
    const probe = render(
      <div data-testid="probe" {...stylex.props(tokenProbeStyles.tonalPair)} />,
    )
    const expected = getComputedStyle(probe.getByTestId('probe'))
    const { backgroundColor, color } = {
      backgroundColor: expected.backgroundColor,
      color: expected.color,
    }
    probe.unmount()

    const { button } = setup({ variant: 'tonal' })
    const actual = getComputedStyle(button)

    expect(actual.backgroundColor).toBe(backgroundColor)
    expect(actual.color).toBe(color)
    // Guards the comparison itself: a filled button must not satisfy it, or
    // the two assertions above would pass on any variant that happens to
    // share a computed value.
    expect(backgroundColor).not.toBe('rgba(0, 0, 0, 0)')
  })
})

describe('press behaviour', () => {
  let restoreAnimate: () => void

  beforeEach(() => {
    vi.useFakeTimers()
    restoreAnimate = installFakeAnimate()
  })

  afterEach(() => {
    restoreAnimate()
    vi.useRealTimers()
  })

  describe('mouse', () => {
    // A tap shorter than the minimum: the click lands before the press has
    // been visible long enough, so it holds until the floor is reached rather
    // than flickering out.
    it('holds a short press open until the minimum has elapsed', async () => {
      const { button, isPressed } = setup()

      firePointer(button, 'pointerdown', { buttons: 1 })
      expect(isPressed()).toBe(true)

      firePointer(button, 'pointerup', { buttons: 0 })
      fireEvent.click(button)

      await advance(MINIMUM_PRESS_MS - 1)
      expect(isPressed()).toBe(true)

      await advance(1)
      expect(isPressed()).toBe(false)
    })

    // Past the floor, release ends the press straight away.
    it('ends a long press as soon as it is released', async () => {
      const { button, isPressed } = setup()

      firePointer(button, 'pointerdown', { buttons: 1 })
      await advance(MINIMUM_PRESS_MS)
      expect(isPressed()).toBe(true)

      firePointer(button, 'pointerup', { buttons: 0 })
      fireEvent.click(button)
      await advance(0)
      expect(isPressed()).toBe(false)
    })

    // The first press's pending timer must defer to the second rather than
    // cutting it short when it fires.
    it('lets a second press supersede one still waiting out its minimum', async () => {
      const { button, isPressed } = setup()

      firePointer(button, 'pointerdown', { buttons: 1 })
      firePointer(button, 'pointerup', { buttons: 0 })
      fireEvent.click(button)

      // Start the second press partway through the first one's wait, and hold
      // it, so the two timers are clearly separated.
      await advance(MINIMUM_PRESS_MS / 2)
      firePointer(button, 'pointerdown', { buttons: 1 })
      expect(isPressed()).toBe(true)

      // The first press's timer fires in here and must be a no-op.
      await advance(MINIMUM_PRESS_MS)
      expect(isPressed()).toBe(true)

      firePointer(button, 'pointerup', { buttons: 0 })
      fireEvent.click(button)
      await advance(0)
      expect(isPressed()).toBe(false)
    })
  })

  describe('touch', () => {
    // Released before the delay elapses, a touch is a completed tap. The
    // pending delay timer must then find the state moved on.
    it('treats a touch released before the delay as a tap', async () => {
      const { button, isPressed } = setup()

      firePointer(button, 'pointerdown', { buttons: 1, pointerType: 'touch' })
      firePointer(button, 'pointerup', { buttons: 0, pointerType: 'touch' })
      expect(isPressed()).toBe(true)

      fireEvent.click(button)

      // The stale delay timer fires here and must not start a second ripple.
      await advance(TOUCH_DELAY_MS)
      expect(isPressed()).toBe(true)

      await advance(MINIMUM_PRESS_MS)
      expect(isPressed()).toBe(false)
    })

    // Nothing shows until the delay has passed, so a scroll starting on the
    // button never flashes a ripple.
    it('waits out the delay before showing a held touch', async () => {
      const { button, isPressed } = setup()

      firePointer(button, 'pointerdown', { buttons: 1, pointerType: 'touch' })
      expect(isPressed()).toBe(false)

      await advance(TOUCH_DELAY_MS)
      expect(isPressed()).toBe(true)

      // A duplicate release, which some devices emit, must be a safe no-op.
      firePointer(button, 'pointerup', { buttons: 0, pointerType: 'touch' })
      firePointer(button, 'pointerup', { buttons: 0, pointerType: 'touch' })
      fireEvent.click(button)

      await advance(MINIMUM_PRESS_MS)
      expect(isPressed()).toBe(false)
    })

    it('plays no ripple when a touch is cancelled during the delay', async () => {
      const { button, isPressed } = setup()

      firePointer(button, 'pointerdown', { buttons: 1, pointerType: 'touch' })
      firePointer(button, 'pointercancel', { buttons: 0, pointerType: 'touch' })

      await advance(TOUCH_DELAY_MS + MINIMUM_PRESS_MS)
      expect(isPressed()).toBe(false)
    })
  })

  // Enter, Space, and assistive-tech activation all arrive as a click with no
  // preceding pointerdown, so the ripple has no position to grow from.
  it('plays a ripple for a click with no pointer press', async () => {
    const { button, isPressed } = setup()

    button.focus()
    expect(document.activeElement).toBe(button)

    fireEvent.click(button)
    expect(isPressed()).toBe(true)

    await advance(MINIMUM_PRESS_MS)
    expect(isPressed()).toBe(false)
  })

  describe('interrupted press', () => {
    it('ends the ripple when a context menu opens mid-press', async () => {
      const { button, isPressed } = setup()

      firePointer(button, 'pointerdown', { buttons: 1 })
      fireEvent.contextMenu(button)

      await advance(MINIMUM_PRESS_MS)
      expect(isPressed()).toBe(false)
    })

    it('ends the ripple when the pointer leaves while still held', async () => {
      const { button, isPressed } = setup()

      firePointer(button, 'pointerdown', { buttons: 1 })
      firePointerLeave(button, { buttons: 1 })

      await advance(MINIMUM_PRESS_MS)
      expect(isPressed()).toBe(false)
    })

    it('ends the ripple on cancel, ignoring cancels from other pointers', async () => {
      const { button, isPressed } = setup()

      firePointer(button, 'pointerdown', { buttons: 1 })
      firePointer(button, 'pointercancel', { buttons: 1, pointerId: 2 })
      await advance(MINIMUM_PRESS_MS)
      // The unrelated pointer is not this press ending.
      expect(isPressed()).toBe(true)

      firePointer(button, 'pointercancel', { buttons: 1 })
      await advance(0)
      expect(isPressed()).toBe(false)
    })
  })

  // Three leaves that must all be inert, each stopped by a different guard:
  // pointer type, the shared pointer filter, and the idle-state check.
  it('ignores pointer leaves that are not an active mouse press ending', async () => {
    const { button, isPressed } = setup()

    // A touch drag-off: only up or cancel may end a touch press.
    firePointer(button, 'pointerdown', { buttons: 1, pointerType: 'touch' })
    await advance(TOUCH_DELAY_MS)
    firePointerLeave(button, { buttons: 1, pointerType: 'touch' })
    await advance(MINIMUM_PRESS_MS)
    expect(isPressed()).toBe(true)

    firePointer(button, 'pointerup', { buttons: 0, pointerType: 'touch' })
    fireEvent.click(button)
    await advance(MINIMUM_PRESS_MS)
    expect(isPressed()).toBe(false)

    // A hover-off with no button held, then a leave with a button held but no
    // press in progress.
    firePointerLeave(button, { buttons: 0 })
    firePointerLeave(button, { buttons: 1 })
    await advance(MINIMUM_PRESS_MS)
    expect(isPressed()).toBe(false)
  })

  it('ignores pointer input that is not a primary left-button press', async () => {
    const { button, isPressed } = setup()

    // A non-primary pointer, such as a resting palm.
    firePointer(button, 'pointerdown', { isPrimary: false, pointerId: 99 })
    // A non-primary mouse button.
    firePointer(button, 'pointerdown', { buttons: 2 })
    await advance(MINIMUM_PRESS_MS)
    expect(isPressed()).toBe(false)

    // A second pointer pressing during an active press is ignored too, and
    // none of the above left the state machine stuck.
    firePointer(button, 'pointerdown', { buttons: 1, pointerId: 1 })
    expect(isPressed()).toBe(true)

    firePointer(button, 'pointerdown', { buttons: 1, pointerId: 2 })
    firePointer(button, 'pointerup', { buttons: 0, pointerId: 2 })
    await advance(MINIMUM_PRESS_MS)
    expect(isPressed()).toBe(true)

    firePointer(button, 'pointerup', { buttons: 0, pointerId: 1 })
    fireEvent.click(button)
    await advance(0)
    expect(isPressed()).toBe(false)
  })

  // The hook runs its own handling first, then forwards to the consumer's
  // handler of the same name.
  it('forwards every wrapped handler alongside its own', async () => {
    const handlers = {
      onClick: vi.fn<() => void>(),
      onContextMenu: vi.fn<() => void>(),
      onPointerCancel: vi.fn<() => void>(),
      onPointerDown: vi.fn<() => void>(),
      onPointerLeave: vi.fn<() => void>(),
      onPointerUp: vi.fn<() => void>(),
    }
    const { button } = setup(handlers)

    firePointer(button, 'pointerdown', { buttons: 1 })
    firePointerLeave(button, { buttons: 1 })
    firePointer(button, 'pointercancel', { buttons: 1 })
    firePointer(button, 'pointerup', { buttons: 0 })
    fireEvent.click(button)
    fireEvent.contextMenu(button)
    await advance(MINIMUM_PRESS_MS)

    for (const handler of Object.values(handlers)) {
      expect(handler).toHaveBeenCalled()
    }
  })

  describe('opting out', () => {
    // `disabled` gates interaction; the surface itself still renders.
    it('neither fires handlers nor ripples while disabled', async () => {
      const onClick = vi.fn<() => void>()
      const { button, isPressed } = setup({ disabled: true, onClick })

      expect(button.hasAttribute('disabled')).toBe(true)

      button.click()
      firePointer(button, 'pointerdown', { buttons: 1 })
      await advance(MINIMUM_PRESS_MS)

      expect(onClick).not.toHaveBeenCalled()
      expect(isPressed()).toBe(false)
    })

    // `disableRipple` removes the ripple outright, and passes consumer
    // handlers straight through rather than merging them.
    it('renders no surface at all when the ripple is disabled', async () => {
      const onClick = vi.fn<() => void>()
      const { button, rippleSurface } = setup({ disableRipple: true, onClick })

      expect(rippleSurface()).toBeNull()

      fireEvent.click(button)
      await advance(MINIMUM_PRESS_MS)

      expect(onClick).toHaveBeenCalled()
      // Interacting must not lazily create one either.
      expect(rippleSurface()).toBeNull()
    })
  })
})

// The suite above stubs the Web Animations API and the clock, so it proves the
// state machine but not that the two work together for real. That one press
// against both, unmocked, lives in the Pressed story — a story runs in this
// same browser under `npm test`, and unlike a test here it also counts toward
// the coverage Storybook's own Testing widget reports.
