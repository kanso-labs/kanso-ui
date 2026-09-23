import * as stylex from '@stylexjs/stylex'
import { act, fireEvent } from '@testing-library/react'
import { vi } from 'vitest'

import { rippleStyles } from '../styles/ripple'
import { motionDurationMs } from '../tokens/values'

// What a test pressing a component needs to read its ripple, shared so each
// such test does not carry its own copy. Kept out of coverage with the tests
// themselves, since it is theirs rather than the library's.

/**
 * The floor the hook holds a short press open to, taken from the token it
 * spends rather than copied as a number.
 */
const MINIMUM_PRESS_MS = motionDurationMs.medium1

// The ripple's inner span carries these classes only while the hook considers
// itself pressed, so their presence reads its state off the DOM rather than
// out of React.
const pressedClassNames = (stylex.props(rippleStyles.pressed).className ?? '')
  .split(' ')
  .filter(Boolean)

const surfaceClassNames = (stylex.props(rippleStyles.surface).className ?? '')
  .split(' ')
  .filter(Boolean)

/** Advances the fake clock and lets React flush what that triggered. */
async function advance(ms: number) {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms)
  })
}

/** Fires a pointer event of `type` at the middle of `target`. */
function firePointer(
  target: Element,
  type: string,
  init: PointerEventInit = {},
) {
  const rect = target.getBoundingClientRect()
  fireEvent(
    target,
    new PointerEvent(type, {
      bubbles: true,
      cancelable: true,
      clientX: rect.left + rect.width / 2,
      clientY: rect.top + rect.height / 2,
      isPrimary: true,
      pointerId: 1,
      pointerType: 'mouse',
      ...init,
    }),
  )
}

/** Whether `host` holds a ripple surface at all. */
function hasRipple(host: Element) {
  return [...host.querySelectorAll('span')].some(
    (span) =>
      surfaceClassNames.length > 0 &&
      surfaceClassNames.every((name) => span.classList.contains(name)),
  )
}

/**
 * Stands in for the Web Animations API, whose document timeline fake timers do
 * not drive — left alone `currentTime` stays at zero and the hook never sees a
 * press reach its minimum. Returns what puts the real one back.
 */
function installFakeAnimate() {
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

/** Whether the ripple inside `host` is drawn as pressed. */
function isPressed(host: Element) {
  return [...host.querySelectorAll('span')].some(
    (span) =>
      pressedClassNames.length > 0 &&
      pressedClassNames.every((name) => span.classList.contains(name)),
  )
}

export {
  advance,
  firePointer,
  hasRipple,
  installFakeAnimate,
  isPressed,
  MINIMUM_PRESS_MS,
}
