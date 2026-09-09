import type { ComponentProps } from 'react'

import * as stylex from '@stylexjs/stylex'
import { act, fireEvent, render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import Button from '.'
import { rippleStyles } from '../../styles/ripple'
import { colors, typography } from '../../tokens/design.tokens.stylex'
import { motionDurationMs } from '../../tokens/values'

// The variant assertions compare against an element styled straight from
// the tokens rather than against hex literals, so they pin which colour role
// the variant reaches for without also pinning what that role happens to
// resolve to today. The pairs are the buttons spec page's.
// One probe per type role a size takes, compared by computed value so the
// assertion pins the role rather than the numbers it resolves to today.
const typeProbeStyles = stylex.create({
  headlineLarge: {
    fontFamily: typography.headlineLargeFont,
    fontSize: typography.headlineLargeSize,
    fontWeight: typography.headlineLargeWeight,
  },
  headlineSmall: {
    fontFamily: typography.headlineSmallFont,
    fontSize: typography.headlineSmallSize,
    fontWeight: typography.headlineSmallWeight,
  },
  labelLarge: {
    fontFamily: typography.labelLargeFont,
    fontSize: typography.labelLargeSize,
    fontWeight: typography.labelLargeWeight,
  },
  titleMedium: {
    fontFamily: typography.titleMediumFont,
    fontSize: typography.titleMediumSize,
    fontWeight: typography.titleMediumWeight,
  },
})

const tokenProbeStyles = stylex.create({
  outlinedPair: {
    borderColor: colors.outlineVariant,
    color: colors.onSurfaceVariant,
  },
  tonalPair: {
    backgroundColor: colors.secondaryContainer,
    color: colors.onSecondaryContainer,
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
  // The five sizes are the buttons spec page's size token sets: height,
  // inline padding and the outlined border's width, XS to XL.
  it("renders each size at the spec's height, padding and outline width", () => {
    const sizes = [
      ['xs', '32px', '16px', '1px'],
      ['md', '40px', '16px', '1px'],
      ['lg', '56px', '24px', '1px'],
      ['xl', '96px', '48px', '2px'],
      ['xxl', '136px', '64px', '3px'],
    ] as const

    for (const [size, height, padding, outline] of sizes) {
      const { button, unmount } = setup({ size, variant: 'outlined' })
      const computed = getComputedStyle(button)
      expect(computed.height).toBe(height)
      expect(computed.paddingLeft).toBe(padding)
      expect(computed.borderLeftWidth).toBe(outline)
      unmount()
    }
  })

  // Padding belongs to the size, not the variant, so a text button and a
  // filled one agree at every size — including the default, where the text
  // button used to be tighter.
  it('gives every variant the same inline padding at a size', () => {
    const inlinePadding = (props: Parameters<typeof setup>[0]) => {
      const { button, unmount } = setup(props)
      const padding = getComputedStyle(button).paddingLeft
      unmount()
      return padding
    }

    for (const size of ['md', 'lg'] as const) {
      expect(inlinePadding({ size, variant: 'text' })).toBe(
        inlinePadding({ size, variant: 'filled' }),
      )
    }
  })

  // The type role per size is the page's: label-large up to md, then
  // title-medium, headline-small and headline-large, face and weight included.
  it('sets each size in the type role the spec gives it', () => {
    const roles = [
      ['xs', typeProbeStyles.labelLarge],
      ['md', typeProbeStyles.labelLarge],
      ['lg', typeProbeStyles.titleMedium],
      ['xl', typeProbeStyles.headlineSmall],
      ['xxl', typeProbeStyles.headlineLarge],
    ] as const

    for (const [size, role] of roles) {
      const probe = render(<span data-testid="probe" {...stylex.props(role)} />)
      const expected = getComputedStyle(probe.getByTestId('probe'))
      const { fontFamily, fontSize, fontWeight } = {
        fontFamily: expected.fontFamily,
        fontSize: expected.fontSize,
        fontWeight: expected.fontWeight,
      }
      probe.unmount()

      const { button, unmount } = setup({ size })
      const actual = getComputedStyle(button)
      expect(actual.fontSize).toBe(fontSize)
      expect(actual.fontWeight).toBe(fontWeight)
      expect(actual.fontFamily).toBe(fontFamily)
      unmount()
    }
  })

  it('paints the tonal variant with the secondary container pair', () => {
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

  // The outlined button's container is invisible at rest, so its border and
  // its label are the two roles that identify it.
  it('draws the outlined variant with the outline variant and on surface variant pair', () => {
    const probe = render(
      <div
        data-testid="probe"
        {...stylex.props(tokenProbeStyles.outlinedPair)}
      />,
    )
    const expected = getComputedStyle(probe.getByTestId('probe'))
    const { borderColor, color } = {
      borderColor: expected.borderColor,
      color: expected.color,
    }
    probe.unmount()

    const { button } = setup({ variant: 'outlined' })
    const actual = getComputedStyle(button)

    expect(actual.borderTopColor).toBe(borderColor)
    expect(actual.color).toBe(color)
    expect(actual.backgroundColor).toBe('rgba(0, 0, 0, 0)')
    // Guards the comparison: the two roles must differ from each other, or a
    // button painting both from one role would pass.
    expect(borderColor).not.toBe(color)
  })
})

// `href` is how a button becomes an <a> that navigates: the same styles and
// ripple, announced as the link it is. React Aria renders it as a link
// outright rather than giving an anchor button semantics, so nothing here
// has to be told what the element is.
describe('as a link', () => {
  // Card resets this and Button did not, so the same control rendered as an
  // anchor was underlined in one and not the other.
  it('drops the underline an anchor arrives with', () => {
    const view = render(<Button href="#label">Button</Button>)

    expect(getComputedStyle(view.getByRole('link')).textDecorationLine).toBe(
      'none',
    )
  })

  it('renders an anchor when given href', () => {
    const view = render(<Button href="#label">Button</Button>)
    const anchor = view.getByRole('link')

    expect(anchor.tagName).toBe('A')
    expect(anchor).toHaveAttribute('href', '#label')
    // `type` belongs to the button form — on an <a> it would be a hint
    // about what is being linked to.
    expect(anchor).not.toHaveAttribute('type')
  })

  // A disabled link is no link at all: React Aria renders a <span> in its
  // place, so the disabled styles have to come from the render state rather
  // than from `:disabled`, which the span never matches.
  it('renders a disabled link as a span', () => {
    const view = render(
      <Button href="#label" isDisabled>
        Button
      </Button>,
    )
    const element = view.getByText('Button')

    expect(element.tagName).toBe('SPAN')
    expect(element).toHaveAttribute('data-disabled')
    expect(getComputedStyle(element).cursor).toBe('not-allowed')
  })

  it('leaves the default button native', () => {
    const view = render(<Button>Button</Button>)

    expect(view.getByRole('button')).toHaveAttribute('type', 'button')
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
    // `isDisabled` gates interaction; the surface itself still renders.
    it('neither fires handlers nor ripples while disabled', async () => {
      const onClick = vi.fn<() => void>()
      const { button, isPressed } = setup({ isDisabled: true, onClick })

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

// React Aria's pending state keeps the button focusable while it stops
// responding to a press, and wants the progress bar in the accessibility
// tree the moment it goes pending.
describe('pending', () => {
  it('draws a progress bar in place of the label', () => {
    const view = render(<Button isPending>Label</Button>)
    const bar = view.getByRole('progressbar', { name: 'Loading' })

    expect(bar).not.toBeNull()
    expect(bar.getAttribute('aria-valuenow')).toBeNull()
  })

  it('takes another name for it', () => {
    const view = render(
      <Button isPending pendingLabel="Saving">
        Label
      </Button>,
    )
    expect(view.getByRole('progressbar', { name: 'Saving' })).not.toBeNull()
  })

  it('draws none until it is pending', () => {
    const view = render(<Button>Label</Button>)
    expect(view.queryByRole('progressbar')).toBeNull()
  })

  // The label stays in the flow, so the button keeps the width it had —
  // a form that resized as it was submitted would move everything under
  // the pointer.
  it('keeps the width the label gave it', () => {
    const idle = render(<Button>Label</Button>)
    const before = idle.getByRole('button').getBoundingClientRect().width
    idle.unmount()

    const pending = render(<Button isPending>Label</Button>)
    expect(pending.getByRole('button').getBoundingClientRect().width).toBe(
      before,
    )
  })

  // The page's primary is a filled button's own fill, so a ring drawn in it
  // would be invisible. It takes the button's content colour instead.
  it("draws the ring in the button's colour, not the page's primary", () => {
    const view = render(<Button isPending>Label</Button>)
    const button = view.getByRole('button')
    const arc = button.querySelector('svg circle')
    if (!(arc instanceof SVGElement)) {
      throw new Error('expected the ring to draw an arc')
    }

    const label = getComputedStyle(button).color
    expect(getComputedStyle(arc).stroke).toBe(label)
    expect(label).not.toBe(getComputedStyle(button).backgroundColor)
  })

  it('stops responding to a press while staying focusable', () => {
    const onPress = vi.fn<() => void>()
    const view = render(
      <Button isPending onPress={onPress}>
        Label
      </Button>,
    )
    const button = view.getByRole('button')

    fireEvent.click(button)
    expect(onPress).not.toHaveBeenCalled()
    expect(button.hasAttribute('disabled')).toBe(false)
    expect(button.getAttribute('aria-disabled')).toBe('true')
  })
})
