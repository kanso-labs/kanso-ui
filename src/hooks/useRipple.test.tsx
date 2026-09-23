import { render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import Button from '../components/button'
import { motionDurationMs } from '../tokens/values'
import { useRipple } from './useRipple'
import {
  advance,
  firePointer,
  installFakeAnimate,
  isPressed,
  MINIMUM_PRESS_MS,
} from './useRipple.testing'

// Sized so the ripple has somewhere to grow, and positioned, as the hook asks
// of its host. Hoisted so it is one object rather than a new one per render.
const HOST_STYLE = {
  height: '40px',
  position: 'relative',
  width: '100px',
} as const

/** Presses `button` with a mouse, which is what starts the growth. */
function press(button: Element) {
  const rect = button.getBoundingClientRect()

  button.dispatchEvent(
    new PointerEvent('pointerdown', {
      bubbles: true,
      buttons: 1,
      cancelable: true,
      clientX: rect.left + rect.width / 2,
      clientY: rect.top + rect.height / 2,
      isPrimary: true,
      pointerId: 1,
      pointerType: 'mouse',
    }),
  )
}

/**
 * Stands in for `element.animate`, recording the options every call is given.
 *
 * The growth animation is the one piece of motion in the library that no
 * `@media (prefers-reduced-motion: reduce)` branch can reach, since it is a
 * Web Animations call rather than a rule — so what a test can read is the
 * duration the hook asks for, which is what this captures.
 */
function recordAnimations() {
  // Captured as a descriptor rather than as a bare method reference, so the
  // native implementation is restored exactly as it was found.
  const native = Object.getOwnPropertyDescriptor(Element.prototype, 'animate')!
  const durations: number[] = []

  Object.defineProperty(Element.prototype, 'animate', {
    configurable: true,
    value(_keyframes: unknown, options: { duration: number }) {
      durations.push(options.duration)
      return { cancel() {}, currentTime: 0 }
    },
    writable: true,
  })

  return {
    durations,
    restore() {
      Object.defineProperty(Element.prototype, 'animate', native)
    },
  }
}

/** A host that ends its press on the release, as a collection row does. */
function ReleaseHost() {
  const ripple = useRipple<HTMLDivElement>(true, {}, true)

  return (
    <div data-testid="host" style={HOST_STYLE} {...ripple.handlers}>
      {ripple.surface}
    </div>
  )
}

/**
 * Answers the reduced-motion query with `matches`, and every other query the
 * way the page would.
 *
 * A stub rather than Chromium's own emulation: `Emulation.setEmulatedMedia` is
 * a page-level command and Vitest runs every file as an iframe inside one
 * shared page, so two files driving it write one setting. The hook reads the
 * query through `window.matchMedia` and nothing else, which makes this the
 * whole of what it sees.
 */
function stubMatchMedia(matches: boolean) {
  const native = window.matchMedia.bind(window)

  vi.spyOn(window, 'matchMedia').mockImplementation((query) => {
    // The real list, with its one answer redefined, rather than an object
    // shaped like one: a stand-in would have to claim to be a MediaQueryList
    // while carrying none of its members, and the list is built per call so
    // nothing else ever sees this one.
    const list = native(query)

    if (query.includes('prefers-reduced-motion')) {
      Object.defineProperty(list, 'matches', {
        configurable: true,
        value: matches,
      })
    }

    return list
  })
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe("the ripple's growth, which is driven rather than declared", () => {
  it('grows over the motion scale for a reader who asked for nothing', () => {
    stubMatchMedia(false)
    const animate = recordAnimations()

    try {
      const view = render(<Button>Label</Button>)
      press(view.getByRole('button'))

      expect(animate.durations).toEqual([motionDurationMs.long1])
    } finally {
      animate.restore()
    }
  })

  it('lands at full size at once for a reader who asked for less', () => {
    stubMatchMedia(true)
    const animate = recordAnimations()

    try {
      const view = render(<Button>Label</Button>)
      press(view.getByRole('button'))

      expect(animate.durations).toEqual([0])
    } finally {
      animate.restore()
    }
  })

  // The resting case above is what makes the reduced one mean something: a
  // press that never animated at all would report `[0]` for both, and the pair
  // is what tells a preference being honoured from a ripple that is broken.
  it('still animates, rather than having stopped calling at all', () => {
    stubMatchMedia(false)
    const animate = recordAnimations()

    try {
      const view = render(<Button>Label</Button>)
      press(view.getByRole('button'))

      expect(animate.durations).toHaveLength(1)
      expect(motionDurationMs.long1).toBeGreaterThan(0)
    } finally {
      animate.restore()
    }
  })
})

// A collection row never hears its own click, so a host asking for it ends
// the press on the release. The rows' own tests press with a mouse; these
// are the two touch paths, where a press is only confirmed after a delay.
describe('a press that ends on its release', () => {
  let restoreAnimate: () => void

  beforeEach(() => {
    vi.useFakeTimers()
    restoreAnimate = installFakeAnimate()
  })

  afterEach(() => {
    restoreAnimate()
    vi.useRealTimers()
  })

  it('plays a touch tap released before the delay through to its end', async () => {
    const view = render(<ReleaseHost />)
    const host = view.getByTestId('host')

    firePointer(host, 'pointerdown', { pointerType: 'touch' })
    expect(isPressed(host)).toBe(false)

    firePointer(host, 'pointerup', { pointerType: 'touch' })
    expect(isPressed(host)).toBe(true)

    await advance(MINIMUM_PRESS_MS)
    expect(isPressed(host)).toBe(false)
  })

  it('lets a held touch go on its release', async () => {
    const view = render(<ReleaseHost />)
    const host = view.getByTestId('host')

    firePointer(host, 'pointerdown', { pointerType: 'touch' })
    await advance(motionDurationMs.short2)
    expect(isPressed(host)).toBe(true)

    firePointer(host, 'pointerup', { pointerType: 'touch' })
    await advance(MINIMUM_PRESS_MS)
    expect(isPressed(host)).toBe(false)
  })
})
