// The leading and trailing slots take nodes, so passing JSX to them is this
// component's API rather than a misuse of it — and in a list the node depends
// on the row's own data, so there is nothing to hoist. react-perf guards
// against a fresh element identity defeating memoization, which the React
// Compiler this repo builds with already handles.
// oxlint-disable react-perf/jsx-no-jsx-as-prop

import type { StyleXStyles } from '@stylexjs/stylex'
import type { ReactElement } from 'react'

import * as stylex from '@stylexjs/stylex'
import { act, fireEvent, render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import ListItem from '.'
import { rippleStyles } from '../../styles/ripple'
import {
  colors,
  stateLayerOpacity,
  typography,
} from '../../tokens/design.tokens.stylex'
import { motionDurationMs } from '../../tokens/values'

const probeStyles = stylex.create({
  bodyLarge: { fontSize: typography.bodyLargeSize },
  bodyMedium: { fontSize: typography.bodyMediumSize },
  disabled: {
    color: `color-mix(in srgb, ${colors.onSurface} calc(${stateLayerOpacity.disabledContent} * 100%), ${colors.surface})`,
  },
  labelSmall: { fontSize: typography.labelSmallSize },
  onSurfaceVariant: { color: colors.onSurfaceVariant },
  // The interactive row's two tints and nothing else, written as the row
  // module writes them so they hash to the same atomic classes.
  tints: {
    backgroundColor: {
      ':active': `color-mix(in srgb, ${colors.onSurface} calc(${stateLayerOpacity.pressed} * 100%), transparent)`,
      ':hover': `color-mix(in srgb, ${colors.onSurface} calc(${stateLayerOpacity.hover} * 100%), transparent)`,
      default: null,
    },
  },
})

// An empty list would make an `every` vacuously true and a `some` vacuously
// false, so it is a broken assertion rather than a passing one.
function classesOf(style: StyleXStyles) {
  const classes = (stylex.props(style).className ?? '')
    .split(' ')
    .filter(Boolean)
  if (classes.length === 0) {
    throw new Error('expected the style to generate at least one class')
  }
  return classes
}

function probeColor(element: ReactElement) {
  const view = render(element)
  const color = getComputedStyle(view.getByTestId('probe')).color
  view.unmount()
  return color
}

function probeFontSize(element: ReactElement) {
  const view = render(element)
  const size = getComputedStyle(view.getByTestId('probe')).fontSize
  view.unmount()
  return size
}

// Narrows with instanceof rather than an assertion, so a row that failed to
// render fails here instead of further down with something obscure.
function rowIn(container: HTMLElement) {
  const row = container.firstElementChild
  if (!(row instanceof HTMLElement)) {
    throw new Error('expected the row to render an element')
  }
  return row
}

// The floor the hook holds a short press open to, taken from the token it
// spends rather than copied as a number.
const MINIMUM_PRESS_MS = motionDurationMs.medium1

// The ripple's inner span carries these classes only while the hook considers
// itself pressed, so their presence reads its state off the DOM rather than
// out of React.
const pressedClassNames = (stylex.props(rippleStyles.pressed).className ?? '')
  .split(' ')
  .filter(Boolean)

/** Advances the fake clock and lets React flush what that triggered. */
async function advance(ms: number) {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms)
  })
}

function firePointer(
  target: Element,
  type: string,
  init: PointerEventInit = {},
) {
  fireEvent(target, new PointerEvent(type, pointerInit(target, init)))
}

/**
 * Stands in for the Web Animations API, whose document timeline fake timers do
 * not drive — left alone `currentTime` stays at zero and the hook never sees a
 * press reach its minimum. The pattern is Button's, in its own test file.
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

// The length check matters: `[].every()` is vacuously true, so an empty class
// list would report "pressed" unconditionally.
function isPressed(container: HTMLElement) {
  const span = container.querySelector('span[aria-hidden="true"] > span')
  if (!span) {
    return false
  }
  return (
    pressedClassNames.length > 0 &&
    pressedClassNames.every((className) => span.classList.contains(className))
  )
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

describe('list item', () => {
  describe('slots', () => {
    it('renders only the slots it was given', () => {
      const view = render(<ListItem>Headline</ListItem>)
      expect(view.getByText('Headline')).not.toBeNull()
      expect(view.queryByText('leading')).toBeNull()
      expect(view.queryByText('trailing')).toBeNull()
      // Headline only: the row is the headline's wrapper plus nothing else.
      expect(rowIn(view.container).childElementCount).toBe(1)
    })

    it('places leading, headline, supporting, and trailing in reading order', () => {
      const view = render(
        <ListItem
          leading={<span>leading</span>}
          supporting="supporting"
          trailing={<span>trailing</span>}
        >
          headline
        </ListItem>,
      )
      const text = rowIn(view.container).textContent
      expect(text).toBe('leadingheadlinesupportingtrailing')
    })

    // The lists spec page's type roles: a body-large headline over a
    // body-medium supporting line, compared by computed size against probes
    // styled from the tokens so a retuned scale moves both together.
    it('sets the headline in body-large and the supporting line in body-medium', () => {
      const headlineSize = probeFontSize(
        <div data-testid="probe" {...stylex.props(probeStyles.bodyLarge)} />,
      )
      const supportingSize = probeFontSize(
        <div data-testid="probe" {...stylex.props(probeStyles.bodyMedium)} />,
      )
      expect(headlineSize).not.toBe(supportingSize)

      const view = render(<ListItem supporting="supporting">headline</ListItem>)
      expect(getComputedStyle(view.getByText('headline')).fontSize).toBe(
        headlineSize,
      )
      expect(getComputedStyle(view.getByText('supporting')).fontSize).toBe(
        supportingSize,
      )
    })

    it('keeps the supporting line in the muted role', () => {
      const expected = probeColor(
        <div
          data-testid="probe"
          {...stylex.props(probeStyles.onSurfaceVariant)}
        />,
      )
      const view = render(<ListItem supporting="supporting">headline</ListItem>)
      const supporting = view.getByText('supporting')
      expect(getComputedStyle(supporting).color).toBe(expected)
      // Guards the comparison: the headline must not already be this colour,
      // or the assertion would hold however the supporting line was styled.
      expect(getComputedStyle(view.getByText('headline')).color).not.toBe(
        expected,
      )
    })
  })

  describe('layout', () => {
    it('holds a minimum row height even with a single line', () => {
      const view = render(<ListItem>headline</ListItem>)
      expect(getComputedStyle(rowIn(view.container)).minHeight).toBe('56px')
    })

    // Deliberately one unbroken token. Ordinary prose wraps, so its
    // min-content width is a single word and the column shrinks whether or
    // not min-width: 0 is set — a version of this test written with a normal
    // sentence passes against a component that has lost it.
    it('keeps an unbreakable headline from pushing the trailing slot out', () => {
      const view = render(
        <ListItem
          leading={<span>lead</span>}
          trailing={<span data-testid="trailing">trailing</span>}
        >
          aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
        </ListItem>,
      )
      const row = rowIn(view.container)
      row.style.width = '260px'

      const rowRight = row.getBoundingClientRect().right
      const trailingRight = view
        .getByTestId('trailing')
        .getBoundingClientRect().right
      expect(trailingRight).toBeLessThanOrEqual(rowRight)
    })
  })

  // The lists page's overline: a line above the headline in label-small,
  // taking the same muted role the supporting line does.
  describe('overline', () => {
    it('draws it above the headline', () => {
      const view = render(<ListItem overline="Overline">Headline</ListItem>)
      const main = view.getByText('Headline').parentElement

      expect(main?.textContent).toBe('OverlineHeadline')
      expect(main?.firstElementChild?.textContent).toBe('Overline')
    })

    it('sets it in the page label-small role', () => {
      const expected = probeFontSize(
        <span data-testid="probe" {...stylex.props(probeStyles.labelSmall)} />,
      )
      const view = render(<ListItem overline="Overline">Headline</ListItem>)

      expect(getComputedStyle(view.getByText('Overline')).fontSize).toBe(
        expected,
      )
      expect(expected).not.toBe(
        getComputedStyle(view.getByText('Headline')).fontSize,
      )
    })

    it('draws it in the muted role', () => {
      const expected = probeColor(
        <span
          data-testid="probe"
          {...stylex.props(probeStyles.onSurfaceVariant)}
        />,
      )
      const view = render(<ListItem overline="Overline">Headline</ListItem>)

      expect(getComputedStyle(view.getByText('Overline')).color).toBe(expected)
    })

    it('draws nothing when it is not given', () => {
      const view = render(<ListItem>Headline</ListItem>)
      expect(view.queryByText('Overline')).toBeNull()
    })
  })

  // The page's three-line item, which is the only row whose slots move: an
  // overline, a headline and a supporting line together take an 88dp
  // container with the leading and trailing slots held at the top.
  describe('three lines', () => {
    it('takes the page container height and holds its slots at the top', () => {
      const view = render(
        <ListItem overline="Overline" supporting="Supporting line">
          Headline
        </ListItem>,
      )
      const style = getComputedStyle(rowIn(view.container))

      expect(style.minHeight).toBe('88px')
      expect(style.alignItems).toBe('flex-start')
    })

    it('stays a centred two-line row with an overline alone', () => {
      const view = render(<ListItem overline="Overline">Headline</ListItem>)
      const style = getComputedStyle(rowIn(view.container))

      expect(style.minHeight).toBe('72px')
      expect(style.alignItems).toBe('center')
    })

    it('stays a centred two-line row with a supporting line alone', () => {
      const view = render(
        <ListItem supporting="Supporting line">Headline</ListItem>,
      )
      const style = getComputedStyle(rowIn(view.container))

      expect(style.minHeight).toBe('72px')
      expect(style.alignItems).toBe('center')
    })

    // Measured rather than read off `min-height`, since the container height
    // is the point: the row's own box comes to 66 with an overline and 70
    // with a supporting line, so only a rendered height proves the floor is
    // what decides a two-line row. Three lines add up to the page's 88 on
    // their own, and are here so a change to the padding or the gap that
    // moved them would be caught in the same place.
    it('renders the three container heights the page names', () => {
      const oneLine = render(<ListItem>Headline</ListItem>)
      const withOverline = render(
        <ListItem overline="Overline">Headline</ListItem>,
      )
      const withSupporting = render(
        <ListItem supporting="Supporting line">Headline</ListItem>,
      )
      const threeLine = render(
        <ListItem overline="Overline" supporting="Supporting line">
          Headline
        </ListItem>,
      )

      expect(rowIn(oneLine.container).offsetHeight).toBe(56)
      expect(rowIn(withOverline.container).offsetHeight).toBe(72)
      expect(rowIn(withSupporting.container).offsetHeight).toBe(72)
      expect(rowIn(threeLine.container).offsetHeight).toBe(88)
    })

    it('holds its slots at the top while interactive too', () => {
      const view = render(
        <ListItem interactive overline="Overline" supporting="Supporting line">
          Headline
        </ListItem>,
      )
      expect(getComputedStyle(rowIn(view.container)).alignItems).toBe(
        'flex-start',
      )
    })
  })

  describe('interactive', () => {
    it('renders a plain container with no ripple by default', () => {
      const view = render(<ListItem>headline</ListItem>)
      expect(view.queryByRole('button')).toBeNull()
      expect(
        view.container.querySelector('span[aria-hidden="true"]'),
      ).toBeNull()
    })

    it('renders a button that ripples when interactive', () => {
      const view = render(<ListItem interactive>headline</ListItem>)
      const button = view.getByRole('button')
      expect(button.getAttribute('type')).toBe('button')
      expect(
        view.container.querySelector('span[aria-hidden="true"]'),
      ).not.toBeNull()
    })

    it('calls onClick when an interactive row is pressed', () => {
      const onClick = vi.fn<() => void>()
      const view = render(
        <ListItem interactive onClick={onClick}>
          headline
        </ListItem>,
      )
      view.getByRole('button').click()
      expect(onClick).toHaveBeenCalledTimes(1)
    })

    // The row's own background is transparent so it tints whatever it sits
    // on, which is why this composites over transparent rather than over a
    // container colour the way Card's does.
    it('is transparent at rest so it takes the colour behind it', () => {
      const view = render(<ListItem interactive>headline</ListItem>)
      expect(getComputedStyle(view.getByRole('button')).backgroundColor).toBe(
        'rgba(0, 0, 0, 0)',
      )
    })
  })

  // The treatment the row module gives every disabled row, which each
  // collection item already draws from React Aria's render state.
  describe('disabled', () => {
    // Both lines take the row's faded colour rather than the muted role, which
    // at full strength under a faded headline would leave the lines the row is
    // least about as the ones that stand out.
    it('fades the headline and both of its lines', () => {
      const expected = probeColor(
        <div data-testid="probe" {...stylex.props(probeStyles.disabled)} />,
      )
      // Guards the comparison: the muted role the two lines draw at rest must
      // not already be this colour, or the assertions would hold however the
      // row was styled.
      expect(expected).not.toBe(
        probeColor(
          <div
            data-testid="probe"
            {...stylex.props(probeStyles.onSurfaceVariant)}
          />,
        ),
      )

      const view = render(
        <ListItem isDisabled overline="Overline" supporting="Supporting line">
          Headline
        </ListItem>,
      )

      expect(getComputedStyle(view.getByText('Overline')).color).toBe(expected)
      expect(getComputedStyle(view.getByText('Headline')).color).toBe(expected)
      expect(getComputedStyle(view.getByText('Supporting line')).color).toBe(
        expected,
      )
    })

    it('marks a row that only presents as disabled', () => {
      const disabled = render(<ListItem isDisabled>Headline</ListItem>)
      const enabled = render(<ListItem>Headline</ListItem>)

      expect(rowIn(disabled.container).getAttribute('aria-disabled')).toBe(
        'true',
      )
      expect(rowIn(enabled.container).hasAttribute('aria-disabled')).toBe(false)
    })

    it('disables the button an interactive row renders', () => {
      const onClick = vi.fn<() => void>()
      const view = render(
        <ListItem interactive isDisabled onClick={onClick}>
          Headline
        </ListItem>,
      )
      const button = view.getByRole('button')

      expect(button).toHaveProperty('disabled', true)
      button.click()
      expect(onClick).not.toHaveBeenCalled()
    })

    // A press on a disabled button still delivers its pointerdown and
    // pointerup, and withholds only the click, which is what ends a press.
    // With the ripple left on, the press would start and then stay drawn.
    it('draws no ripple', () => {
      const view = render(
        <ListItem interactive isDisabled>
          Headline
        </ListItem>,
      )
      const button = view.getByRole('button')

      firePointer(button, 'pointerdown', { buttons: 1 })
      firePointer(button, 'pointerup', { buttons: 0 })

      expect(
        view.container.querySelector('span[aria-hidden="true"]'),
      ).toBeNull()
    })

    // Read off the classes StyleX writes rather than hovered for real: every
    // test file is a frame in one shared page, and a real pointer aimed at
    // this one passed alone and timed out under a full run. The enabled row
    // beside it is what proves these are the tint's classes to look for.
    it('drops the hover and pressed tints and shows a not-allowed cursor', () => {
      const tints = classesOf(probeStyles.tints)
      const view = render(
        <>
          <ListItem interactive>Enabled</ListItem>
          <ListItem interactive isDisabled>
            Disabled
          </ListItem>
        </>,
      )
      const [enabled, disabled] = view.getAllByRole('button')

      expect(tints.every((name) => enabled.classList.contains(name))).toBe(true)
      expect(tints.some((name) => disabled.classList.contains(name))).toBe(
        false,
      )
      expect(getComputedStyle(disabled).cursor).toBe('not-allowed')
    })
  })

  // The six handlers the ripple returns are the six a call site can pass, so
  // a row that spread the consumer's over the hook's would lose whichever it
  // was given — the handler still fires, which is why the case above passes
  // either way, but the animation it drives is gone. Each case here presses
  // the row with one of those props set and asserts the ripple's own half
  // still ran.
  describe('ripple handlers', () => {
    let restoreAnimate: () => void

    beforeEach(() => {
      vi.useFakeTimers()
      restoreAnimate = installFakeAnimate()
    })

    afterEach(() => {
      restoreAnimate()
      vi.useRealTimers()
    })

    // Losing onClick leaves the press with no path to its end, so the row
    // stays visibly pressed however long is waited. Advancing past the floor
    // is what separates that from the hook correctly holding a short press.
    it('still ends the press when the call site passes an onClick', async () => {
      const onClick = vi.fn<() => void>()
      const view = render(
        <ListItem interactive onClick={onClick}>
          headline
        </ListItem>,
      )
      const button = view.getByRole('button')

      firePointer(button, 'pointerdown', { buttons: 1 })
      expect(isPressed(view.container)).toBe(true)

      firePointer(button, 'pointerup', { buttons: 0 })
      fireEvent.click(button)
      expect(onClick).toHaveBeenCalledTimes(1)

      await advance(MINIMUM_PRESS_MS - 1)
      expect(isPressed(view.container)).toBe(true)

      await advance(1)
      expect(isPressed(view.container)).toBe(false)
    })

    // Losing onPointerDown leaves nothing to start the animation, so the
    // surface renders with the press never reaching it.
    it('still starts the press when the call site passes an onPointerDown', () => {
      const onPointerDown = vi.fn<() => void>()
      const view = render(
        <ListItem interactive onPointerDown={onPointerDown}>
          headline
        </ListItem>,
      )
      const button = view.getByRole('button')

      firePointer(button, 'pointerdown', { buttons: 1 })

      expect(onPointerDown).toHaveBeenCalledTimes(1)
      expect(isPressed(view.container)).toBe(true)
    })

    // A presenting row has no ripple to merge with, so the hook hands the six
    // back untouched — which is the only thing putting them on the <div>,
    // since they are no longer in the rest it spreads.
    it('keeps the handlers on a row that only presents', () => {
      const onClick = vi.fn<() => void>()
      const view = render(<ListItem onClick={onClick}>headline</ListItem>)

      fireEvent.click(rowIn(view.container))

      expect(onClick).toHaveBeenCalledTimes(1)
    })
  })
})
