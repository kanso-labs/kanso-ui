import { render } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import Button from '../components/button'
import { motionDurationMs } from '../tokens/values'

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
