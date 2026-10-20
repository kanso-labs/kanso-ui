import type { ReactElement } from 'react'

import * as stylex from '@stylexjs/stylex'
import { act, fireEvent, render } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import Switch from '.'
import { CheckGlyph, CloseGlyph } from '../../glyphs'
import { rulesReaching, valueIn } from '../../styles/stylesheet.testing'
import { colors, stateLayerOpacity } from '../../tokens/design.tokens.stylex'

// StyleX hashes an atomic class from the property and value, so the same
// declaration written here produces the same class the component produces.
// Asserting on class membership pins which role each state reaches for
// without depending on the browser having applied a rule these tests are the
// first thing to use — see chip/index.test.tsx for the flake behind this.
const probeStyles = stylex.create({
  disabledLabel: {
    color: `color-mix(in srgb, ${colors.onSurface} calc(${stateLayerOpacity.disabledContent} * 100%), ${colors.surface})`,
  },
  disabledTrack: {
    borderColor: `color-mix(in srgb, ${colors.onSurface} calc(${stateLayerOpacity.disabledContainer} * 100%), transparent)`,
  },
  errorHoverLayer: {
    backgroundColor: `color-mix(in srgb, ${colors.error} calc(${stateLayerOpacity.hover} * 100%), transparent)`,
  },
  // Drawn as text, so a computed colour can be read off it and set beside the
  // track's rule.
  errorText: { color: colors.error },
  handleError: { backgroundColor: colors.error },
  handleOff: { backgroundColor: colors.outline },
  handleOn: { backgroundColor: colors.onPrimary },
  hoverLayer: {
    backgroundColor: `color-mix(in srgb, ${colors.onSurface} calc(${stateLayerOpacity.hover} * 100%), transparent)`,
  },
  iconOff: { color: colors.surfaceContainerHighest },
  iconOffDisabled: {
    color: `color-mix(in srgb, ${colors.surfaceContainerHighest} calc(${stateLayerOpacity.disabledContent} * 100%), transparent)`,
  },
  iconOn: { color: colors.onPrimaryContainer },
  // Larger than the label's text, so an icon sized by the handle is told
  // apart from one inheriting the size around it.
  largeText: { fontSize: '40px' },
  outlineText: { color: colors.outline },
  restingText: { color: colors.onSurfaceVariant },
  trackError: { borderColor: colors.error },
  trackOff: { backgroundColor: colors.surfaceContainerHighest },
  trackOn: { backgroundColor: colors.primary },
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
  disabledLabel: classesOf(stylex.props(probeStyles.disabledLabel)),
  disabledTrack: classesOf(stylex.props(probeStyles.disabledTrack)),
  errorHoverLayer: classesOf(stylex.props(probeStyles.errorHoverLayer)),
  handleError: classesOf(stylex.props(probeStyles.handleError)),
  handleOff: classesOf(stylex.props(probeStyles.handleOff)),
  handleOn: classesOf(stylex.props(probeStyles.handleOn)),
  hoverLayer: classesOf(stylex.props(probeStyles.hoverLayer)),
  iconOff: classesOf(stylex.props(probeStyles.iconOff)),
  iconOffDisabled: classesOf(stylex.props(probeStyles.iconOffDisabled)),
  iconOn: classesOf(stylex.props(probeStyles.iconOn)),
  trackError: classesOf(stylex.props(probeStyles.trackError)),
  trackOff: classesOf(stylex.props(probeStyles.trackOff)),
  trackOn: classesOf(stylex.props(probeStyles.trackOn)),
}

/**
 * The control around the track. React Aria wraps the input in a visually
 * hidden element, and the control is what follows it in the label.
 */
function controlOf(input: HTMLElement) {
  const control = input.parentElement?.nextElementSibling
  if (!(control instanceof HTMLElement)) {
    throw new Error('expected the control to follow the input')
  }
  return control
}

/**
 * A drag across the seat, in device pixels from where it was grabbed. The
 * pointer events go to the seat, which is what carries the drag; a real
 * pointer would be captured by it, and a synthetic one is dispatched there
 * directly. `release` is left to the caller so a test can read the handle
 * mid-drag.
 */
function dragBy(seat: HTMLElement, distance: number) {
  fireEvent.pointerDown(seat, { button: 0, clientX: 100, pointerId: 1 })
  fireEvent.pointerMove(seat, { clientX: 100 + distance, pointerId: 1 })
  return {
    release: () => {
      fireEvent.pointerUp(seat, { clientX: 100 + distance, pointerId: 1 })
      // The label's own click is what flips the switch, and a drag decides
      // whether to let it through — so the click has to be sent too.
      fireEvent.click(seat)
    },
  }
}

/** What `property` comes to on `element` under forced colours. */
function forcedValue(element: Element, property: string) {
  return valueIn(
    rulesReaching(element, { holding: 'forced-colors: active' }),
    property,
  )
}

/** The path a glyph draws, to tell the check from the cross. */
function glyphPath(glyph: ReactElement) {
  const view = render(glyph)
  const path = view.container.querySelector('path')?.getAttribute('d')
  view.unmount()
  if (path === undefined || path === null) {
    throw new Error('expected the glyph to draw a path')
  }
  return path
}

function hasClasses(element: Element, classes: string[]) {
  return classes.every((name) => element.classList.contains(name))
}

/** A `1em` icon in `currentColor`, as the README asks of every icon. */
function Icon({ name }: { name: string }) {
  return (
    <svg
      aria-hidden="true"
      data-testid={name}
      fill="currentColor"
      height="1em"
      viewBox="0 0 24 24"
      width="1em"
    >
      <circle cx="12" cy="12" r="8" />
    </svg>
  )
}

/** The track, the seat the handle travels in, the state layer and the handle. */
function partsOf(input: HTMLElement) {
  const track = controlOf(input).firstElementChild
  const seat = track?.firstElementChild
  const layer = seat?.firstElementChild
  const handle = seat?.lastElementChild
  if (
    !(track instanceof HTMLElement) ||
    !(seat instanceof HTMLElement) ||
    !(layer instanceof HTMLElement) ||
    !(handle instanceof HTMLElement)
  ) {
    throw new Error(
      'expected the track to hold the seat, the layer and the handle',
    )
  }
  return { handle, layer, seat, track }
}

// Hoisted so each is one stable element, which is what react-perf's
// no-jsx-as-prop is after.
const OFF_ICON = <Icon name="off-icon" />
const ON_ICON = <Icon name="on-icon" />

/** The computed colours of the error and outline roles, as text. */
function roleColours() {
  const view = render(
    <>
      <span {...stylex.props(probeStyles.errorText)}>Error</span>
      <span {...stylex.props(probeStyles.outlineText)}>Outline</span>
    </>,
  )
  const colours = {
    error: getComputedStyle(view.getByText('Error')).color,
    outline: getComputedStyle(view.getByText('Outline')).color,
  }
  view.unmount()
  return colours
}

/** Finishes the seat's travel, so a computed inset is where it came to rest. */
function settled(seat: HTMLElement) {
  for (const animation of seat.getAnimations()) {
    animation.finish()
  }
  return getComputedStyle(seat).insetInlineStart
}

function setup(props: Partial<Parameters<typeof Switch>[0]> = {}) {
  const view = render(<Switch {...props}>Label</Switch>)
  return {
    ...view,
    input: view.getByRole('switch', { name: 'Label' }),
  }
}

/** A switch under a right-to-left writing mode, set on a wrapper. */
function setupRtl() {
  const view = render(
    <div dir="rtl">
      <Switch>Label</Switch>
    </div>,
  )
  return { ...view, input: view.getByRole('switch', { name: 'Label' }) }
}

/** Finishes the handle's growth, so a computed size is the settled one. */
function sized(handle: HTMLElement) {
  for (const animation of handle.getAnimations()) {
    animation.finish()
  }
  return getComputedStyle(handle).width
}

describe('switch', () => {
  describe('semantics', () => {
    // getByRole with a name resolves through the accessible name, so finding
    // the input this way is the label association itself, and the role is
    // what separates a switch from a checkbox to a screen reader.
    it('renders a switch named by its label', () => {
      const { input } = setup()
      expect(input.tagName).toBe('INPUT')
      expect(input.getAttribute('role')).toBe('switch')
    })

    it('describes the switch with its description', () => {
      const view = render(<Switch description="Supporting line">Label</Switch>)
      const input = view.getByRole('switch')
      expect(input.getAttribute('aria-describedby')?.split(' ')).toContain(
        view.getByText('Supporting line').id,
      )
    })

    it('marks the switch invalid and describes it with the error', () => {
      const view = render(<Switch error="Turn this on.">Label</Switch>)
      const input = view.getByRole('switch')
      expect(input.getAttribute('aria-invalid')).toBe('true')
      expect(input.getAttribute('aria-describedby')?.split(' ')).toContain(
        view.getByText('Turn this on.').id,
      )
    })

    it('has no accessible name of its own without a label', () => {
      const view = render(<Switch aria-label="Label" />)
      expect(view.getByRole('switch', { name: 'Label' })).not.toBeNull()
      expect(view.container.querySelector('label')?.textContent).toBe('')
    })
  })

  describe('state', () => {
    it('keeps its own state when uncontrolled', () => {
      const { input } = setup()
      expect(input).toHaveProperty('checked', false)
      fireEvent.click(input)
      expect(input).toHaveProperty('checked', true)
    })

    it('starts on when told to', () => {
      const { input } = setup({ defaultSelected: true })
      expect(input).toHaveProperty('checked', true)
    })

    // Controlled means the call site owns the state: a click reports it and
    // nothing moves until the prop comes back different.
    it('reports without moving when controlled', () => {
      const onChange = vi.fn<(selected: boolean) => void>()
      const { input } = setup({ isSelected: false, onChange })
      fireEvent.click(input)
      expect(onChange).toHaveBeenCalledWith(true)
      expect(input).toHaveProperty('checked', false)
    })

    it('is disabled through the input', () => {
      const { input } = setup({ isDisabled: true })
      expect(input).toHaveProperty('disabled', true)
    })

    it('does not change while read-only', () => {
      const { input } = setup({ defaultSelected: true, isReadOnly: true })
      fireEvent.click(input)
      expect(input).toHaveProperty('checked', true)
    })
  })

  // Every state is a class chosen from React Aria's render state rather than
  // a selector, so each is pinned to the role it reaches for.
  describe('appearance', () => {
    it('draws an off switch as an outlined track with a small handle', () => {
      const { input } = setup()
      const { handle, track } = partsOf(input)
      expect(hasClasses(track, CLASSES.trackOff)).toBe(true)
      expect(hasClasses(handle, CLASSES.handleOff)).toBe(true)
      expect(getComputedStyle(handle).width).toBe('16px')
    })

    it('draws an on switch as a primary track with a larger handle', () => {
      const { input } = setup({ defaultSelected: true })
      const { handle, track } = partsOf(input)
      expect(hasClasses(track, CLASSES.trackOn)).toBe(true)
      expect(hasClasses(handle, CLASSES.handleOn)).toBe(true)
      expect(getComputedStyle(handle).width).toBe('24px')
    })

    it('moves the handle to the other end when flipped', () => {
      const { input } = setup()
      const { seat } = partsOf(input)
      const before = getComputedStyle(seat).insetInlineStart
      fireEvent.click(input)
      // The travel is a transition, and a computed value read while it runs
      // is partway along it, so the animations are finished first.
      for (const animation of seat.getAnimations()) {
        animation.finish()
      }
      expect(getComputedStyle(seat).insetInlineStart).not.toBe(before)
      expect(getComputedStyle(seat).insetInlineStart).toBe('20px')
    })

    it('draws the check in the handle only while on and asked for', () => {
      const off = setup({ icon: true })
      expect(partsOf(off.input).handle.querySelector('svg')).toBeNull()
      off.unmount()

      const on = setup({ defaultSelected: true, icon: true })
      expect(partsOf(on.input).handle.querySelector('svg')).not.toBeNull()
      on.unmount()

      const plain = setup({ defaultSelected: true })
      expect(partsOf(plain.input).handle.querySelector('svg')).toBeNull()
    })

    it('dims the track and the label while disabled', () => {
      const view = render(<Switch isDisabled>Label</Switch>)
      const input = view.getByRole('switch')
      expect(hasClasses(partsOf(input).track, CLASSES.disabledTrack)).toBe(true)
      expect(hasClasses(view.getByText('Label'), CLASSES.disabledLabel)).toBe(
        true,
      )
    })

    // Material Design fades all of a disabled control's content, so the
    // description fades with the label it explains.
    it('fades the description with the label while disabled', () => {
      const view = render(
        <>
          <span {...stylex.props(probeStyles.restingText)}>Resting</span>
          <Switch description="Supporting line" isDisabled>
            Label
          </Switch>
          <Switch description="Enabled line">Enabled</Switch>
        </>,
      )
      const colourOf = (text: string) =>
        getComputedStyle(view.getByText(text)).color
      expect(colourOf('Label')).not.toBe(colourOf('Resting'))
      expect(colourOf('Supporting line')).toBe(colourOf('Label'))
      expect(colourOf('Enabled line')).toBe(colourOf('Resting'))
    })

    // React derives `onPointerEnter` from the bubbling `pointerover`, which
    // is what React Aria's hover tracking listens for.
    it('lays the on surface state layer over the handle while hovered', () => {
      const { input } = setup()
      const { layer } = partsOf(input)
      act(() => {
        fireEvent.pointerOver(layer, { pointerType: 'mouse' })
      })
      expect(hasClasses(layer, CLASSES.hoverLayer)).toBe(true)

      act(() => {
        fireEvent.pointerOut(layer, { pointerType: 'mouse' })
      })
      expect(hasClasses(layer, CLASSES.hoverLayer)).toBe(false)
    })
  })

  // The page draws the icon on the selected handle alone or in both states;
  // `icon` is the first and `unselectedIcon` adds the second.
  describe('handle icon', () => {
    it('draws a node given as icon in the handle while on, and nothing off', () => {
      const off = setup({ icon: ON_ICON })
      expect(partsOf(off.input).handle.childElementCount).toBe(0)
      off.unmount()

      const view = setup({
        defaultSelected: true,
        icon: ON_ICON,
      })
      const { handle } = partsOf(view.input)
      expect(handle.contains(view.getByTestId('on-icon'))).toBe(true)
      expect(handle.querySelectorAll('svg')).toHaveLength(1)
    })

    it('draws the check for icon set to true', () => {
      const { input } = setup({ defaultSelected: true, icon: true })
      expect(
        partsOf(input).handle.querySelector('path')?.getAttribute('d'),
      ).toBe(glyphPath(<CheckGlyph />))
    })

    it('draws the cross off and the check on, given both as true', () => {
      const { input } = setup({ icon: true, unselectedIcon: true })
      const { handle } = partsOf(input)
      expect(handle.querySelector('path')?.getAttribute('d')).toBe(
        glyphPath(<CloseGlyph />),
      )

      fireEvent.click(input)
      expect(handle.querySelector('path')?.getAttribute('d')).toBe(
        glyphPath(<CheckGlyph />),
      )
    })

    it('draws a node given as unselectedIcon while off, and nothing on', () => {
      const view = setup({ unselectedIcon: OFF_ICON })
      const { handle } = partsOf(view.input)
      expect(handle.contains(view.getByTestId('off-icon'))).toBe(true)

      fireEvent.click(view.input)
      expect(handle.childElementCount).toBe(0)
    })

    it('grows an off handle to 24 only while it holds an icon', () => {
      const plain = setup({ icon: true })
      expect(sized(partsOf(plain.input).handle)).toBe('16px')
      plain.unmount()

      const { input } = setup({ unselectedIcon: true })
      const { handle, seat } = partsOf(input)
      expect(sized(handle)).toBe('24px')

      // Pressed, it still grows to the page's 28.
      dragBy(seat, 8)
      expect(sized(handle)).toBe('28px')
    })

    // A node takes its size and colour from the handle, through `1em` and
    // `currentColor`, which is what makes any icon set fit — whatever the
    // size of the text the switch sits in.
    it('sizes a node at 16 and colours it in the icon colour of each state', () => {
      const probes = render(
        <>
          <span {...stylex.props(probeStyles.iconOff)}>Off</span>
          <span {...stylex.props(probeStyles.iconOn)}>On</span>
        </>,
      )
      const offColour = getComputedStyle(probes.getByText('Off')).color
      const onColour = getComputedStyle(probes.getByText('On')).color
      probes.unmount()
      expect(offColour).not.toBe(onColour)

      const view = render(
        <div {...stylex.props(probeStyles.largeText)}>
          <Switch icon={ON_ICON} unselectedIcon={OFF_ICON}>
            Label
          </Switch>
        </div>,
      )
      const input = view.getByRole('switch', { name: 'Label' })
      const { handle } = partsOf(input)
      const offIcon = view.getByTestId('off-icon')
      expect(getComputedStyle(offIcon).width).toBe('16px')
      expect(getComputedStyle(offIcon).color).toBe(offColour)
      expect(hasClasses(handle, CLASSES.iconOff)).toBe(true)

      fireEvent.click(input)
      const onIcon = view.getByTestId('on-icon')
      expect(getComputedStyle(onIcon).width).toBe('16px')
      expect(getComputedStyle(onIcon).color).toBe(onColour)
      expect(hasClasses(handle, CLASSES.iconOn)).toBe(true)
    })

    it('fades the off icon while disabled', () => {
      const { input } = setup({ isDisabled: true, unselectedIcon: true })
      const { handle } = partsOf(input)
      expect(hasClasses(handle, CLASSES.iconOffDisabled)).toBe(true)
      expect(hasClasses(handle, CLASSES.iconOff)).toBe(false)
    })

    // Each icon names the system colour paired with its handle's, so it
    // shows against the handle whatever the mode's palette.
    it('names the colour paired with the handle under forced colours', () => {
      const off = setup({ unselectedIcon: true })
      expect(forcedValue(partsOf(off.input).handle, 'color')).toBe('buttonface')
      off.unmount()

      const on = setup({ defaultSelected: true, icon: true })
      expect(forcedValue(partsOf(on.input).handle, 'color')).toBe('highlight')
      on.unmount()

      const disabled = setup({ isDisabled: true, unselectedIcon: true })
      expect(forcedValue(partsOf(disabled.input).handle, 'color')).toBe(
        'canvas',
      )
    })
  })

  // The switch page has no error state, so these pin the checkbox's, which the
  // component takes instead — see the comment at the top of index.tsx.
  describe('error state', () => {
    it('draws the rule and the handle of an invalid switch in error while off', () => {
      const { error, outline } = roleColours()
      const valid = setup()
      expect(getComputedStyle(partsOf(valid.input).track).borderTopColor).toBe(
        outline,
      )
      valid.unmount()

      const { input } = setup({ error: 'Supporting line' })
      const { handle, track } = partsOf(input)
      expect(getComputedStyle(track).borderTopColor).toBe(error)
      expect(hasClasses(track, CLASSES.trackError)).toBe(true)
      expect(hasClasses(track, CLASSES.trackOff)).toBe(true)
      expect(hasClasses(handle, CLASSES.handleError)).toBe(true)
    })

    it('keeps the primary track and handle of an invalid switch inside an error rule while on', () => {
      const { error } = roleColours()
      const { input } = setup({
        defaultSelected: true,
        error: 'Supporting line',
      })
      const { handle, track } = partsOf(input)
      expect(getComputedStyle(track).borderTopColor).toBe(error)
      expect(hasClasses(track, CLASSES.trackOn)).toBe(true)
      expect(hasClasses(handle, CLASSES.handleOn)).toBe(true)
      expect(hasClasses(handle, CLASSES.handleError)).toBe(false)
    })

    // The checkbox keeps its error colours while hovered too, rather than
    // giving them up to the hover role.
    it('keeps the error handle and lays an error state layer while hovered', () => {
      const { input } = setup({ error: 'Supporting line' })
      const { handle, layer } = partsOf(input)
      act(() => {
        fireEvent.pointerOver(layer, { pointerType: 'mouse' })
      })
      expect(hasClasses(layer, CLASSES.errorHoverLayer)).toBe(true)
      expect(hasClasses(layer, CLASSES.hoverLayer)).toBe(false)
      expect(hasClasses(handle, CLASSES.handleError)).toBe(true)
    })

    it('keeps its disabled colours while disabled', () => {
      const { input } = setup({ error: 'Supporting line', isDisabled: true })
      const { handle, track } = partsOf(input)
      expect(hasClasses(track, CLASSES.disabledTrack)).toBe(true)
      expect(hasClasses(track, CLASSES.trackError)).toBe(false)
      expect(hasClasses(handle, CLASSES.handleError)).toBe(false)
    })

    // The mode drops the error colour with every other, so an invalid switch
    // has to keep the system colours a valid one names, or its rule and
    // handle would take whatever the mode made of the error role.
    it('keeps the system colours under forced colours', () => {
      const off = setup({ error: 'Supporting line' })
      const offParts = partsOf(off.input)
      expect(forcedValue(offParts.track, 'border-top-color')).toBe('buttontext')
      expect(forcedValue(offParts.handle, 'background-color')).toBe(
        'buttontext',
      )
      off.unmount()

      const on = setup({ defaultSelected: true, error: 'Supporting line' })
      expect(forcedValue(partsOf(on.input).track, 'border-top-color')).toBe(
        'highlight',
      )
    })
  })

  describe('drag', () => {
    // The page's pressed switch has the handle following the pointer, and
    // the flip decided by where it is let go rather than by the press.
    it('follows the pointer across the track while dragging', () => {
      const { input } = setup()
      const { seat } = partsOf(input)
      expect(settled(seat)).toBe('0px')

      const drag = dragBy(seat, 12)
      expect(getComputedStyle(seat).insetInlineStart).toBe('12px')

      drag.release()
      expect(input).toHaveProperty('checked', true)
      expect(settled(seat)).toBe('20px')
    })

    // A touch that lands on the handle belongs to the drag. Left to the
    // browser, a finger moving across it is read as a pan of the page, which
    // takes the pointer and cancels the drag before it can settle. Read off
    // the seat, since touch-action is decided where the touch lands and the
    // state layer inside the seat is part of it.
    it('keeps a touch on the handle from panning the page', () => {
      const { input } = setup()
      expect(getComputedStyle(partsOf(input).seat).touchAction).toBe('none')
    })

    // A handle that cannot be dragged has no drag to protect, so the page
    // still pans from it — a column of disabled switches scrolls like any
    // other content.
    it('leaves a handle that cannot be dragged to the page', () => {
      const disabled = setup({ isDisabled: true })
      expect(getComputedStyle(partsOf(disabled.input).seat).touchAction).toBe(
        'auto',
      )
      disabled.unmount()

      const readOnly = setup({ isReadOnly: true })
      expect(getComputedStyle(partsOf(readOnly.input).seat).touchAction).toBe(
        'auto',
      )
    })

    it('keeps the handle inside the two ends of the track', () => {
      const { input } = setup()
      const { seat } = partsOf(input)

      dragBy(seat, 200)
      expect(getComputedStyle(seat).insetInlineStart).toBe('20px')

      fireEvent.pointerMove(seat, { clientX: -200, pointerId: 1 })
      expect(getComputedStyle(seat).insetInlineStart).toBe('0px')
    })

    it('flips the switch when the handle is let go past the middle', () => {
      const { input } = setup()
      const { seat } = partsOf(input)

      dragBy(seat, 11).release()
      expect(input).toHaveProperty('checked', true)
    })

    it('springs back when the handle is let go before the middle', () => {
      const { input } = setup()
      const { seat } = partsOf(input)

      dragBy(seat, 9).release()
      expect(input).toHaveProperty('checked', false)
      expect(settled(seat)).toBe('0px')
    })

    it('turns an on switch off by dragging back past the middle', () => {
      const { input } = setup({ defaultSelected: true })
      const { seat } = partsOf(input)
      expect(settled(seat)).toBe('20px')

      dragBy(seat, -11).release()
      expect(input).toHaveProperty('checked', false)
      expect(settled(seat)).toBe('0px')
    })

    it('leaves an on switch on when the handle does not cross back', () => {
      const { input } = setup({ defaultSelected: true })
      const { seat } = partsOf(input)

      dragBy(seat, -9).release()
      expect(input).toHaveProperty('checked', true)
      expect(settled(seat)).toBe('20px')
    })

    // A press that never moves is a tap, which the label flips as it always
    // did — the drag has to keep out of its way.
    it('still flips on a tap that never moves', () => {
      const { input } = setup()
      const { seat } = partsOf(input)

      fireEvent.pointerDown(seat, { button: 0, clientX: 100, pointerId: 1 })
      fireEvent.pointerUp(seat, { clientX: 100, pointerId: 1 })
      fireEvent.click(input)
      expect(input).toHaveProperty('checked', true)
    })

    // A finger, a mouse and a pen all move a pixel or two between pressing
    // and lifting, so a movement inside the slop is still a tap: the click
    // the release sends goes through, and the switch flips. The click lands on
    // the seat, as a real one does, since that is where the drag's guard
    // listens for it.
    it.each(['mouse', 'touch'] as const)(
      'still flips on a %s tap that jitters inside the slop',
      (pointerType) => {
        const { input } = setup()
        const { seat } = partsOf(input)

        fireEvent.pointerDown(seat, {
          button: 0,
          clientX: 100,
          pointerId: 1,
          pointerType,
        })
        fireEvent.pointerMove(seat, { clientX: 104, pointerId: 1, pointerType })
        fireEvent.pointerUp(seat, { clientX: 104, pointerId: 1, pointerType })
        fireEvent.click(seat)

        expect(input).toHaveProperty('checked', true)
      },
    )

    // A finger drifts further on an ordinary tap than a mouse does. Under the
    // mouse's slop, 6 to 10px of drift was read as a drag let go before the
    // middle, which settled where it began and dropped the tap.
    it('still flips on a touch tap that drifts 8px', () => {
      const { input } = setup()
      const { seat } = partsOf(input)

      fireEvent.pointerDown(seat, {
        button: 0,
        clientX: 100,
        pointerId: 1,
        pointerType: 'touch',
      })
      fireEvent.pointerMove(seat, {
        clientX: 108,
        pointerId: 1,
        pointerType: 'touch',
      })
      fireEvent.pointerUp(seat, {
        clientX: 108,
        pointerId: 1,
        pointerType: 'touch',
      })
      fireEvent.click(seat)

      expect(input).toHaveProperty('checked', true)
    })

    // The mouse keeps its own slop: a deliberate 7px drag let go before the
    // middle is still a drag, and springs back.
    it('springs back from a 7px mouse drag', () => {
      const { input } = setup()
      const { seat } = partsOf(input)

      fireEvent.pointerDown(seat, {
        button: 0,
        clientX: 100,
        pointerId: 1,
        pointerType: 'mouse',
      })
      fireEvent.pointerMove(seat, {
        clientX: 107,
        pointerId: 1,
        pointerType: 'mouse',
      })
      fireEvent.pointerUp(seat, {
        clientX: 107,
        pointerId: 1,
        pointerType: 'mouse',
      })
      fireEvent.click(seat)

      expect(input).toHaveProperty('checked', false)
    })

    // A tap focuses the input through the label; a drag settles the switch
    // with a programmatic click, which focuses nothing, so focus was left on
    // the page and the next Space went nowhere. With focus on the input,
    // Space is the checkbox's own; it is not pressed here, since a real key
    // goes through the page-wide channel AGENTS.md's "Media queries a test
    // cannot set" describes, which stalls under a full run.
    it('leaves focus on the input after a drag', () => {
      const { input } = setup()
      const { seat } = partsOf(input)

      dragBy(seat, 15).release()
      expect(input).toHaveProperty('checked', true)
      expect(document.activeElement).toBe(input)
    })

    it('focuses the input after a drag that settles where it began', () => {
      const { input } = setup()
      const { seat } = partsOf(input)

      dragBy(seat, 9).release()
      expect(input).toHaveProperty('checked', false)
      expect(document.activeElement).toBe(input)
    })

    // A touch dragged past the browser's own slop sends no click at all, so
    // the guard armed for that click is still set when the next tap comes —
    // and has to be cleared by the next press rather than swallow it.
    it('flips on the tap after a touch drag that sent no click', () => {
      const { input } = setup()
      const { seat } = partsOf(input)

      fireEvent.pointerDown(seat, {
        button: 0,
        clientX: 100,
        pointerId: 1,
        pointerType: 'touch',
      })
      fireEvent.pointerMove(seat, {
        clientX: 124,
        pointerId: 1,
        pointerType: 'touch',
      })
      fireEvent.pointerUp(seat, {
        clientX: 124,
        pointerId: 1,
        pointerType: 'touch',
      })
      expect(input).toHaveProperty('checked', true)

      fireEvent.pointerDown(seat, {
        button: 0,
        clientX: 100,
        pointerId: 2,
        pointerType: 'touch',
      })
      fireEvent.pointerUp(seat, {
        clientX: 100,
        pointerId: 2,
        pointerType: 'touch',
      })
      fireEvent.click(seat)
      expect(input).toHaveProperty('checked', false)
    })

    it('reports a drag on a controlled switch without moving', () => {
      const onChange = vi.fn<(selected: boolean) => void>()
      const { input } = setup({ isSelected: false, onChange })
      const { seat } = partsOf(input)

      dragBy(seat, 15).release()
      expect(onChange).toHaveBeenCalledWith(true)
      expect(input).toHaveProperty('checked', false)
    })

    // The page grows the handle to 28 while it is pressed, and a drag is a
    // press that lasts.
    it('grows the handle while it is being dragged', () => {
      const { input } = setup()
      const { handle, seat } = partsOf(input)
      expect(sized(handle)).toBe('16px')

      dragBy(seat, 8)
      expect(sized(handle)).toBe('28px')
    })

    // React Aria flips the switch from its own press, which ends on the
    // pointer being released wherever the handle has been dragged to — so a
    // drag ends that press before releasing, and settles the switch itself.
    // Synthetic pointer events do not start a React Aria press, so what a
    // browser would show is not reachable here; this pins the cancel, which
    // is the part a browser needs and a reader would otherwise delete.
    it('ends the press before settling, so nothing flips twice', () => {
      const { input } = setup()
      const { seat } = partsOf(input)
      const cancelled = vi.fn<(event: Event) => void>()
      seat.addEventListener('pointercancel', cancelled)

      dragBy(seat, 14).release()
      expect(cancelled).toHaveBeenCalledTimes(1)
      expect(input).toHaveProperty('checked', true)
    })

    // Under a right-to-left writing mode the track runs the other way: the
    // handle rests at the right and turns on at the left, so the drag reads
    // the pointer's travel from the right. Where the seat is drawn is read as
    // well as its inset, since following the pointer is a thing seen on the
    // screen rather than a number the two directions share.
    it('follows the pointer leftward under a right-to-left writing mode', () => {
      const { input } = setupRtl()
      const { seat } = partsOf(input)
      const resting = seat.getBoundingClientRect().left

      const drag = dragBy(seat, -12)
      expect(getComputedStyle(seat).insetInlineStart).toBe('12px')
      expect(seat.getBoundingClientRect().left).toBe(resting - 12)

      drag.release()
      expect(input).toHaveProperty('checked', true)
      expect(settled(seat)).toBe('20px')
    })

    it('springs back from a rightward drag under a right-to-left writing mode', () => {
      const { input } = setupRtl()
      const { seat } = partsOf(input)

      dragBy(seat, 12).release()
      expect(input).toHaveProperty('checked', false)
      expect(settled(seat)).toBe('0px')
    })

    it('does not drag while disabled or read-only', () => {
      const disabled = setup({ isDisabled: true })
      dragBy(partsOf(disabled.input).seat, 15).release()
      expect(disabled.input).toHaveProperty('checked', false)
      disabled.unmount()

      const readOnly = setup({ isReadOnly: true })
      dragBy(partsOf(readOnly.input).seat, 15).release()
      expect(readOnly.input).toHaveProperty('checked', false)
    })
  })

  describe('measurements', () => {
    it('draws a 52 by 32 track with a 2dp rule and a 40 state layer', () => {
      const { input } = setup()
      const { layer, track } = partsOf(input)
      const trackStyle = getComputedStyle(track)
      expect(trackStyle.width).toBe('52px')
      expect(trackStyle.height).toBe('32px')
      expect(trackStyle.borderTopWidth).toBe('2px')
      expect(getComputedStyle(layer).width).toBe('40px')
    })
  })
})

// A keyboard's focus draws the hover layer's colour at the focus opacity,
// as Button's does, where it once drew the ring alone.
const focusProbeStyles = stylex.create({
  off: {
    backgroundColor: `color-mix(in srgb, ${colors.onSurface} calc(${stateLayerOpacity.focus} * 100%), transparent)`,
  },
})

// Focus as a keyboard brings it, which is what React Aria reports as
// focus-visible and what the layer is drawn from.
function focusByKeyboard(element: HTMLElement) {
  fireEvent.keyDown(document.body, { key: 'Tab' })
  act(() => {
    element.focus()
  })
}

// A switch with no name is announced as an unnamed switch, and React Aria's
// own warning never fires for one, since it always renders a labelled child.
describe('its accessible name', () => {
  it('requires one of the three name sources', () => {
    // @ts-expect-error -- a switch needs a label, aria-label or aria-labelledby
    const unnamed = <Switch />

    expect(unnamed).toBeDefined()
  })

  it.each([
    ['its label', <Switch key="label">Label</Switch>],
    ['aria-label', <Switch aria-label="Label" key="aria-label" />],
    [
      'aria-labelledby',
      <>
        <span id="switch-name">Label</span>
        <Switch aria-labelledby="switch-name" key="labelledby" />
      </>,
    ],
  ])('takes its name from %s', (_source, element) => {
    const view = render(element)

    expect(view.getByRole('switch', { name: 'Label' })).not.toBeNull()
  })
})

describe('focus layer', () => {
  it('lays it over the handle for a keyboard', () => {
    const { input } = setup()
    const { layer } = partsOf(input)
    const classes = classesOf(stylex.props(focusProbeStyles.off))
    expect(hasClasses(layer, classes)).toBe(false)

    focusByKeyboard(input)

    expect(hasClasses(layer, classes)).toBe(true)
  })
})
