import type {
  MouseEvent,
  MouseEventHandler,
  PointerEvent,
  PointerEventHandler,
  ReactNode,
} from 'react'

import * as stylex from '@stylexjs/stylex'
import { useCallback, useMemo, useRef, useState } from 'react'

import { rippleStyles } from '../styles/ripple'

// See src/styles/ripple.ts for the opacity half of the mechanism; this file
// owns growth and interaction timing.
const PRESS_GROW_MS = 450
const MINIMUM_PRESS_MS = 225
const INITIAL_ORIGIN_SCALE = 0.2
const PADDING = 10
const SOFT_EDGE_MINIMUM_SIZE = 75
const SOFT_EDGE_CONTAINER_RATIO = 0.35
const EASING_STANDARD = 'cubic-bezier(0.2, 0, 0, 1)'
const TOUCH_DELAY_MS = 150

// Static input, so this is computed once for every consumer of the module
// rather than once per component instance.
const surfaceProps = stylex.props(rippleStyles.surface)

/**
 * On touch: `Inactive -> TouchDelay -> WaitingForClick -> Inactive`, or
 * `Inactive -> TouchDelay -> Holding -> WaitingForClick -> Inactive` for a
 * held press.
 *
 * On mouse or pen: `Inactive -> WaitingForClick -> Inactive`.
 */
const RippleState = {
  /** A touch has been confirmed as a press (held past the touch delay). */
  Holding: 2,
  /** No press in progress. Touch down moves to TouchDelay; mouse/pen down moves to WaitingForClick. */
  Inactive: 0,
  /** Touch down received; waiting to see if it's a tap or a scroll/swipe. */
  TouchDelay: 1,
  /** The press has finished growing; waiting for the click that ends it. */
  WaitingForClick: 3,
} as const
interface RippleEventHandlers<HostElement extends HTMLElement> {
  onClick?: MouseEventHandler<HostElement>
  onContextMenu?: MouseEventHandler<HostElement>
  onPointerCancel?: PointerEventHandler<HostElement>
  onPointerDown?: PointerEventHandler<HostElement>
  onPointerLeave?: PointerEventHandler<HostElement>
  onPointerUp?: PointerEventHandler<HostElement>
}

type RippleState = (typeof RippleState)[keyof typeof RippleState]

function isTouch(event: PointerEvent) {
  return event.pointerType === 'touch'
}

/**
 * Renders a press ripple that grows from the pointer's position, or from
 * the element's center for a keyboard or other non-pointer activation.
 *
 * Growth runs via the Web Animations API on a single reused element (no
 * per-click DOM nodes to clean up), over a fixed duration independent of how
 * long the element is held — a real press-and-hold keeps the ripple
 * growing until release, while a quick tap still plays a complete,
 * `MINIMUM_PRESS_MS`-enforced animation rather than a flicker.
 *
 * Merges its own handlers with `externalHandlers` (e.g. a component's own
 * consumer-supplied props — ripple's own run first, then the external
 * ones) and returns `handlers` to spread onto the interactive element and
 * `surface`, the node to render as a child. The host element must
 * establish a positioning context (`position: relative` or similar) so
 * `surface`, which fills it via `inset: 0`, clips to its bounds and
 * inherits its shape.
 *
 * Pass `enabled: false` to opt out — no ripple listeners are attached and
 * no surface is rendered, leaving `externalHandlers` and a component's own
 * hover/press state layer (if any) untouched.
 *
 * `handlers` and `surface` are hand-memoized (not left to build-tool
 * optimization) so a consumer rendering many instances — a list of icon
 * buttons, say — can memoize around them too, and so stability doesn't
 * depend on any particular compiler being configured.
 */
function useRipple<HostElement extends HTMLElement = HTMLElement>(
  enabled = true,
  externalHandlers: RippleEventHandlers<HostElement> = {},
): {
  handlers: RippleEventHandlers<HostElement>
  surface: ReactNode
} {
  const [pressed, setPressed] = useState(false)
  const rippleRef = useRef<HTMLSpanElement>(null)
  const state = useRef<RippleState>(RippleState.Inactive)
  const growAnimation = useRef<Animation | undefined>(undefined)
  const rippleStartEvent = useRef<PointerEvent<HostElement> | undefined>(
    undefined,
  )
  const initialSize = useRef(0)
  const rippleScale = useRef('1')

  const shouldReactToEvent = useCallback((event: PointerEvent<HostElement>) => {
    if (!event.isPrimary) {
      return false
    }
    const startEvent = rippleStartEvent.current
    if (startEvent && startEvent.pointerId !== event.pointerId) {
      return false
    }
    return isTouch(event) || event.buttons === 1
  }, [])

  const determineRippleSize = useCallback((rect: DOMRect) => {
    const { height, width } = rect
    const maxDimension = Math.max(height, width)
    const softEdgeSize = Math.max(
      SOFT_EDGE_CONTAINER_RATIO * maxDimension,
      SOFT_EDGE_MINIMUM_SIZE,
    )
    const size = Math.floor(maxDimension * INITIAL_ORIGIN_SCALE)
    const hypotenuse = Math.hypot(width, height)
    const maxRadius = hypotenuse + PADDING

    initialSize.current = size
    rippleScale.current = `${(maxRadius + softEdgeSize) / size}`
    return `${size}px`
  }, [])

  const getTranslationCoordinates = useCallback(
    (rect: DOMRect, positionEvent?: PointerEvent<HostElement>) => {
      const { height, left, top, width } = rect
      const size = initialSize.current
      const endPoint = {
        x: (width - size) / 2,
        y: (height - size) / 2,
      }

      const origin = positionEvent
        ? { x: positionEvent.clientX - left, y: positionEvent.clientY - top }
        : { x: width / 2, y: height / 2 }
      const startPoint = {
        x: origin.x - size / 2,
        y: origin.y - size / 2,
      }

      return { endPoint, startPoint }
    },
    [],
  )

  const startPressAnimation = useCallback(
    (target: HostElement, positionEvent?: PointerEvent<HostElement>) => {
      const ripple = rippleRef.current
      if (!ripple) {
        return
      }

      setPressed(true)
      growAnimation.current?.cancel()

      // Read once and share: the two helpers below both only need the
      // target's rect, and a second `getBoundingClientRect()` call back to
      // back with the first would be a redundant layout read.
      const rect = target.getBoundingClientRect()
      const size = determineRippleSize(rect)
      const { endPoint, startPoint } = getTranslationCoordinates(
        rect,
        positionEvent,
      )

      ripple.style.width = size
      ripple.style.height = size

      growAnimation.current = ripple.animate(
        {
          transform: [
            `translate(${startPoint.x}px, ${startPoint.y}px) scale(1)`,
            `translate(${endPoint.x}px, ${endPoint.y}px) scale(${rippleScale.current})`,
          ],
        },
        {
          duration: PRESS_GROW_MS,
          easing: EASING_STANDARD,
          fill: 'forwards',
        },
      )
    },
    [determineRippleSize, getTranslationCoordinates],
  )

  const endPressAnimation = useCallback(async () => {
    rippleStartEvent.current = undefined
    state.current = RippleState.Inactive

    const animation = growAnimation.current
    const elapsed =
      typeof animation?.currentTime === 'number'
        ? animation.currentTime
        : Infinity

    if (elapsed >= MINIMUM_PRESS_MS) {
      setPressed(false)
      return
    }

    await new Promise((resolve) => {
      setTimeout(resolve, MINIMUM_PRESS_MS - elapsed)
    })

    if (growAnimation.current !== animation) {
      // A newer press started; let it own the pressed state instead.
      return
    }
    setPressed(false)
  }, [])

  // Reads through a function so a stale narrowing of `state.current` from
  // before the `await` below isn't (incorrectly) carried across it — the
  // ref can change via a different handler while this one is suspended.
  const getState = useCallback(() => state.current, [])

  const handlePointerDownAsync = useCallback(
    async (event: PointerEvent<HostElement>) => {
      if (!shouldReactToEvent(event)) {
        return
      }

      rippleStartEvent.current = event
      const target = event.currentTarget

      if (!isTouch(event)) {
        state.current = RippleState.WaitingForClick
        startPressAnimation(target, event)
        return
      }

      // Delay so a scroll/swipe starting on the element doesn't flash a
      // ripple — only a held (or quickly released) touch counts as a press.
      state.current = RippleState.TouchDelay
      await new Promise((resolve) => {
        setTimeout(resolve, TOUCH_DELAY_MS)
      })

      if (getState() !== RippleState.TouchDelay) {
        return
      }

      state.current = RippleState.Holding
      startPressAnimation(target, event)
    },
    [getState, shouldReactToEvent, startPressAnimation],
  )

  const handlePointerDown = useCallback(
    (event: PointerEvent<HostElement>) => {
      void handlePointerDownAsync(event)
    },
    [handlePointerDownAsync],
  )

  const handlePointerUp = useCallback(
    (event: PointerEvent<HostElement>) => {
      if (!shouldReactToEvent(event)) {
        return
      }

      if (state.current === RippleState.Holding) {
        state.current = RippleState.WaitingForClick
        return
      }

      if (state.current === RippleState.TouchDelay) {
        // Released before the delay elapsed: treat as a completed tap.
        state.current = RippleState.WaitingForClick
        startPressAnimation(event.currentTarget, rippleStartEvent.current)
      }
    },
    [shouldReactToEvent, startPressAnimation],
  )

  const handlePointerLeave = useCallback(
    (event: PointerEvent<HostElement>) => {
      if (isTouch(event) || !shouldReactToEvent(event)) {
        return
      }
      if (state.current !== RippleState.Inactive) {
        void endPressAnimation()
      }
    },
    [endPressAnimation, shouldReactToEvent],
  )

  const handlePointerCancel = useCallback(
    (event: PointerEvent<HostElement>) => {
      if (!shouldReactToEvent(event)) {
        return
      }
      void endPressAnimation()
    },
    [endPressAnimation, shouldReactToEvent],
  )

  const handleClick = useCallback(
    (event: MouseEvent<HostElement>) => {
      if (state.current === RippleState.WaitingForClick) {
        void endPressAnimation()
        return
      }

      if (state.current === RippleState.Inactive) {
        // No pointerdown preceded this click — keyboard activation, a
        // programmatic `.click()`, or assistive-tech-synthesized activation.
        // Play a complete, centered press immediately.
        startPressAnimation(event.currentTarget)
        void endPressAnimation()
      }
    },
    [endPressAnimation, startPressAnimation],
  )

  const handleContextMenu = useCallback(() => {
    void endPressAnimation()
  }, [endPressAnimation])

  const {
    onClick: onClickProp,
    onContextMenu: onContextMenuProp,
    onPointerCancel: onPointerCancelProp,
    onPointerDown: onPointerDownProp,
    onPointerLeave: onPointerLeaveProp,
    onPointerUp: onPointerUpProp,
  } = externalHandlers

  const onClick = useCallback(
    (event: MouseEvent<HostElement>) => {
      handleClick(event)
      onClickProp?.(event)
    },
    [handleClick, onClickProp],
  )

  const onContextMenu = useCallback(
    (event: MouseEvent<HostElement>) => {
      handleContextMenu()
      onContextMenuProp?.(event)
    },
    [handleContextMenu, onContextMenuProp],
  )

  const onPointerCancel = useCallback(
    (event: PointerEvent<HostElement>) => {
      handlePointerCancel(event)
      onPointerCancelProp?.(event)
    },
    [handlePointerCancel, onPointerCancelProp],
  )

  const onPointerDown = useCallback(
    (event: PointerEvent<HostElement>) => {
      handlePointerDown(event)
      onPointerDownProp?.(event)
    },
    [handlePointerDown, onPointerDownProp],
  )

  const onPointerLeave = useCallback(
    (event: PointerEvent<HostElement>) => {
      handlePointerLeave(event)
      onPointerLeaveProp?.(event)
    },
    [handlePointerLeave, onPointerLeaveProp],
  )

  const onPointerUp = useCallback(
    (event: PointerEvent<HostElement>) => {
      handlePointerUp(event)
      onPointerUpProp?.(event)
    },
    [handlePointerUp, onPointerUpProp],
  )

  const handlers = useMemo(
    () => ({
      onClick,
      onContextMenu,
      onPointerCancel,
      onPointerDown,
      onPointerLeave,
      onPointerUp,
    }),
    [
      onClick,
      onContextMenu,
      onPointerCancel,
      onPointerDown,
      onPointerLeave,
      onPointerUp,
    ],
  )

  const surface = useMemo(
    () => (
      <span aria-hidden="true" {...surfaceProps}>
        <span
          ref={rippleRef}
          {...stylex.props(rippleStyles.press, pressed && rippleStyles.pressed)}
        />
      </span>
    ),
    [pressed],
  )

  // Two separate memos rather than one branching on `enabled`, so that
  // whichever branch is actually active stays keyed only on its own
  // inputs — the enabled result doesn't get a new identity every time
  // `externalHandlers` does (a component typically passes a fresh object
  // literal each render), and vice versa.
  const enabledResult = useMemo(
    () => ({ handlers, surface }),
    [handlers, surface],
  )
  const disabledResult = useMemo(
    () => ({ handlers: externalHandlers, surface: null }),
    [externalHandlers],
  )

  return enabled ? enabledResult : disabledResult
}

export { useRipple }
