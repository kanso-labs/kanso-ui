import * as stylex from '@stylexjs/stylex'
import { act, fireEvent, render } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import Checkbox from '.'
import {
  advance,
  firePointer,
  hasRipple,
  installFakeAnimate,
  isPressed,
  MINIMUM_PRESS_MS,
} from '../../hooks/useRipple.testing'
import { reducedMotionOf, transitionOf } from '../../styles/stylesheet.testing'
import { colors, stateLayerOpacity } from '../../tokens/design.tokens.stylex'
import Form from '../form'

// StyleX hashes an atomic class from the property and value, so the same
// declaration written here produces the same class the component produces.
// Asserting on class membership pins which role each state reaches for
// without depending on the browser having applied a rule these tests are the
// first thing to use — see chip/index.test.tsx for the flake behind this.
const probeStyles = stylex.create({
  disabledLabel: {
    color: `color-mix(in srgb, ${colors.onSurface} calc(${stateLayerOpacity.disabledContent} * 100%), ${colors.surface})`,
  },
  disabledRule: {
    borderColor: `color-mix(in srgb, ${colors.onSurface} calc(${stateLayerOpacity.disabledContent} * 100%), transparent)`,
  },
  errorFill: { backgroundColor: colors.error },
  errorRule: { borderColor: colors.error },
  hoverLayer: {
    backgroundColor: `color-mix(in srgb, ${colors.onSurface} calc(${stateLayerOpacity.hover} * 100%), transparent)`,
  },
  markedFill: { backgroundColor: colors.primary },
  restingRule: { borderColor: colors.onSurfaceVariant },
  restingText: { color: colors.onSurfaceVariant },
  shownGlyph: { opacity: 1, transform: 'scale(1)' },
})

// A box that takes its content's width, as the slot of a list row does, since
// a field on its own is a block as wide as whatever holds it.
const fitStyles = stylex.create({
  content: { display: 'inline-flex' },
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
  disabledRule: classesOf(stylex.props(probeStyles.disabledRule)),
  errorFill: classesOf(stylex.props(probeStyles.errorFill)),
  errorRule: classesOf(stylex.props(probeStyles.errorRule)),
  hoverLayer: classesOf(stylex.props(probeStyles.hoverLayer)),
  markedFill: classesOf(stylex.props(probeStyles.markedFill)),
  restingRule: classesOf(stylex.props(probeStyles.restingRule)),
  shownGlyph: classesOf(stylex.props(probeStyles.shownGlyph)),
}

// A glyph as the page draws it once nothing is moving: a shown one whole, a
// hidden one clear and at half its size.
const SHOWN = { opacity: '1', transform: 'matrix(1, 0, 0, 1, 0, 0)' }
const HIDDEN = { opacity: '0', transform: 'matrix(0.5, 0, 0, 0.5, 0, 0)' }

const DASH_PATH = 'M19 13H5v-2h14v2z'

/** The 18dp box inside the control. */
function boxOf(input: HTMLElement) {
  const box = controlOf(input).firstElementChild
  if (!(box instanceof HTMLElement)) {
    throw new Error('expected the control to hold the box')
  }
  return box
}

/**
 * The 40dp control around the box. React Aria wraps the input in a visually
 * hidden element, and the control is what follows it in the label.
 */
function controlOf(input: HTMLElement) {
  const control = input.parentElement?.nextElementSibling
  if (!(control instanceof HTMLElement)) {
    throw new Error('expected the control to follow the input')
  }
  return control
}

/** How the page draws `glyph`: its opacity and its transform. */
function drawnAs(glyph: Element) {
  const { opacity, transform } = getComputedStyle(glyph)
  return { opacity, transform }
}

/** The check and the dash, both of which the box always holds. */
function glyphsOf(input: HTMLElement) {
  const glyphs = [...boxOf(input).querySelectorAll('svg')]
  const dash = glyphs.find(
    (glyph) => glyph.querySelector('path')?.getAttribute('d') === DASH_PATH,
  )
  const check = glyphs.find((glyph) => glyph !== dash)
  if (glyphs.length !== 2 || check === undefined || dash === undefined) {
    throw new Error('expected the box to hold a check and a dash')
  }
  return { check, dash }
}

function hasClasses(element: Element, classes: string[]) {
  return classes.every((name) => element.classList.contains(name))
}

/**
 * Records every animation started while `run` runs, as the transform it
 * starts and ends at, and puts the real `animate` back afterwards.
 */
function recordRipples(run: () => void) {
  const animate = vi.spyOn(Element.prototype, 'animate')
  try {
    run()
    return animate.mock.calls.map(([keyframes]) => transformsOf(keyframes))
  } finally {
    animate.mockRestore()
  }
}

function setup(props: Partial<Parameters<typeof Checkbox>[0]> = {}) {
  const view = render(<Checkbox {...props}>Label</Checkbox>)
  return {
    ...view,
    input: view.getByRole('checkbox', { name: 'Label' }),
  }
}

/**
 * Whether a ripple grows where it starts, which is the middle of the control:
 * one that follows a pointer moves there from wherever the pointer was.
 */
function startsInTheMiddle({ end, start }: { end: string; start: string }) {
  return translationOf(start) === translationOf(end)
}

/** The transform a ripple's keyframes start and end at. */
function transformsOf(keyframes: Keyframe[] | null | PropertyIndexedKeyframes) {
  const transform =
    keyframes === null || Array.isArray(keyframes)
      ? undefined
      : keyframes.transform
  const [start, end] = Array.isArray(transform) ? transform : []
  if (typeof start !== 'string' || typeof end !== 'string') {
    throw new TypeError(
      'expected a ripple to move from one transform to another',
    )
  }
  return { end, start }
}

/** Where a ripple's transform puts it, without how large it is. */
function translationOf(transform: string) {
  return transform.replace(/ scale\(.*\)$/u, '')
}

describe('checkbox', () => {
  describe('semantics', () => {
    // getByRole with a name resolves through the accessible name, so finding
    // the input this way is the label association itself.
    it('renders a checkbox named by its label', () => {
      const { input } = setup()
      expect(input.tagName).toBe('INPUT')
      expect(input.getAttribute('type')).toBe('checkbox')
    })

    it('describes the checkbox with its description', () => {
      const view = render(
        <Checkbox description="Supporting line">Label</Checkbox>,
      )
      const input = view.getByRole('checkbox')
      expect(input.getAttribute('aria-describedby')?.split(' ')).toContain(
        view.getByText('Supporting line').id,
      )
    })

    it('marks the checkbox invalid and describes it with the error', () => {
      const view = render(<Checkbox error="Choose one.">Label</Checkbox>)
      const input = view.getByRole('checkbox')
      expect(input.getAttribute('aria-invalid')).toBe('true')
      expect(input.getAttribute('aria-describedby')?.split(' ')).toContain(
        view.getByText('Choose one.').id,
      )
    })

    // The description and the error occupy the same line, so showing both
    // would move the checkbox's neighbours as an error appears and clears.
    it('replaces the description with the error rather than stacking them', () => {
      const view = render(
        <Checkbox description="Supporting line" error="Choose one.">
          Label
        </Checkbox>,
      )
      expect(view.queryByText('Supporting line')).toBeNull()
      expect(view.getByText('Choose one.')).not.toBeNull()
    })

    it('has no accessible name of its own without a label', () => {
      const view = render(<Checkbox aria-label="Label" />)
      expect(view.getByRole('checkbox', { name: 'Label' })).not.toBeNull()
      expect(view.container.querySelector('label')?.textContent).toBe('')
    })
  })

  describe('selection', () => {
    it('keeps its own state when uncontrolled', () => {
      const { input } = setup()
      expect(input).toHaveProperty('checked', false)
      fireEvent.click(input)
      expect(input).toHaveProperty('checked', true)
    })

    it('starts selected when told to', () => {
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

    it('stands for a partly selected set while indeterminate', () => {
      const { input } = setup({ isIndeterminate: true })
      expect(input).toHaveProperty('indeterminate', true)
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
    // Both glyphs are drawn whatever the box holds, so each has something to
    // fade from and to.
    it('draws an unselected box as a rule in on surface variant, its glyphs hidden', () => {
      const { input } = setup()
      const box = boxOf(input)
      expect(hasClasses(box, CLASSES.restingRule)).toBe(true)
      expect(hasClasses(box, CLASSES.markedFill)).toBe(false)
      const { check, dash } = glyphsOf(input)
      expect(drawnAs(check)).toEqual(HIDDEN)
      expect(drawnAs(dash)).toEqual(HIDDEN)
    })

    it('fills a selected box with primary and draws the check', () => {
      const { input } = setup({ defaultSelected: true })
      const box = boxOf(input)
      expect(hasClasses(box, CLASSES.markedFill)).toBe(true)
      const { check, dash } = glyphsOf(input)
      expect(drawnAs(check)).toEqual(SHOWN)
      expect(drawnAs(dash)).toEqual(HIDDEN)
    })

    // Indeterminate is drawn over whatever the value underneath is.
    it.each([
      ['', { isIndeterminate: true }],
      [
        ' over a selected value',
        { defaultSelected: true, isIndeterminate: true },
      ],
    ] as const)(
      'fills an indeterminate box the same way, with the dash%s',
      (_over, props) => {
        const { input } = setup(props)
        const box = boxOf(input)
        expect(hasClasses(box, CLASSES.markedFill)).toBe(true)
        const { check, dash } = glyphsOf(input)
        expect(drawnAs(check)).toEqual(HIDDEN)
        expect(drawnAs(dash)).toEqual(SHOWN)
      },
    )

    // Read off the classes rather than the page, which is still part way
    // through the fade straight after the click.
    it('moves to the filled box and the check when clicked', () => {
      const { input } = setup()
      expect(hasClasses(glyphsOf(input).check, CLASSES.shownGlyph)).toBe(false)
      fireEvent.click(input)
      expect(hasClasses(boxOf(input), CLASSES.markedFill)).toBe(true)
      expect(hasClasses(glyphsOf(input).check, CLASSES.shownGlyph)).toBe(true)
      expect(hasClasses(glyphsOf(input).dash, CLASSES.shownGlyph)).toBe(false)
    })

    it('takes the error pair while invalid', () => {
      const unselected = setup({ error: 'Choose one.' })
      expect(hasClasses(boxOf(unselected.input), CLASSES.errorRule)).toBe(true)
      unselected.unmount()

      const selected = setup({ defaultSelected: true, error: 'Choose one.' })
      expect(hasClasses(boxOf(selected.input), CLASSES.errorFill)).toBe(true)
    })

    it('dims the rule and the label while disabled', () => {
      const view = render(<Checkbox isDisabled>Label</Checkbox>)
      const input = view.getByRole('checkbox')
      expect(hasClasses(boxOf(input), CLASSES.disabledRule)).toBe(true)
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
          <Checkbox description="Supporting line" isDisabled>
            Label
          </Checkbox>
          <Checkbox description="Enabled line">Enabled</Checkbox>
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
    it('lays the on surface state layer over the control while hovered', () => {
      const { input } = setup()
      const control = controlOf(input)
      expect(hasClasses(control, CLASSES.hoverLayer)).toBe(false)

      act(() => {
        fireEvent.pointerOver(control, { pointerType: 'mouse' })
      })
      expect(hasClasses(control, CLASSES.hoverLayer)).toBe(true)

      act(() => {
        fireEvent.pointerOut(control, { pointerType: 'mouse' })
      })
      expect(hasClasses(control, CLASSES.hoverLayer)).toBe(false)
    })

    it('shows no state layer while disabled', () => {
      const { input } = setup({ isDisabled: true })
      const control = controlOf(input)
      act(() => {
        fireEvent.pointerOver(control, { pointerType: 'mouse' })
      })
      expect(hasClasses(control, CLASSES.hoverLayer)).toBe(false)
    })
  })

  describe('measurements', () => {
    it('draws an 18 box inside a 40 state layer', () => {
      const { input } = setup()
      const control = getComputedStyle(controlOf(input))
      const box = getComputedStyle(boxOf(input))
      expect(control.width).toBe('40px')
      expect(control.height).toBe('40px')
      expect(box.width).toBe('18px')
      expect(box.height).toBe('18px')
      expect(box.borderTopLeftRadius).toBe('2px')
      expect(box.borderTopWidth).toBe('2px')
    })

    // The spec's 18dp icon, the size of the box itself, so a mark lies over
    // the whole fill rather than inside the border. The box's content is
    // 14dp, which is what the glyph shrank to.
    it.each([
      { mark: 'check', props: { isSelected: true } },
      { mark: 'dash', props: { isIndeterminate: true } },
    ] as const)(
      'draws the $mark at 18 over the whole box',
      ({ mark, props }) => {
        const { input } = setup(props)
        const glyph = glyphsOf(input)[mark]
        expect(glyph.getBoundingClientRect().toJSON()).toEqual(
          boxOf(input).getBoundingClientRect().toJSON(),
        )
      },
    )

    // A checkbox a row or a cell names has nothing in the label's column but
    // its message line, which is out of the flow until there is something to
    // say. The 8dp a label is held off the control by went with it once, as
    // a padding on the column, and a list's selection checkbox came to 48.
    it('is as wide as its control with no label of its own', () => {
      const view = render(
        <div {...stylex.props(fitStyles.content)}>
          <Checkbox aria-label="Label" />
        </div>,
      )
      const field = view.container.firstElementChild?.firstElementChild
      if (!(field instanceof HTMLElement)) {
        throw new Error('expected the checkbox to render a field')
      }
      const control = controlOf(view.getByRole('checkbox', { name: 'Label' }))

      expect(field.getBoundingClientRect().width).toBe(40)
      expect(field.getBoundingClientRect().right).toBe(
        control.getBoundingClientRect().right,
      )
    })

    // The 8dp is the line's own now rather than the column's, so a
    // description still starts where the label's text does, and 8dp off a
    // control that has no label.
    it('starts its description where its label does', () => {
      const { getByText, input } = setup({ description: 'Supporting line' })
      const label = getByText('Label')
      const start =
        label.getBoundingClientRect().left +
        Number.parseFloat(getComputedStyle(label).paddingInlineStart)

      expect(getByText('Supporting line').getBoundingClientRect().left).toBe(
        start,
      )
      expect(start - controlOf(input).getBoundingClientRect().right).toBe(8)
    })

    it('starts the description of a checkbox with no label 8 off its control', () => {
      const view = render(
        <Checkbox aria-label="Label" description="Supporting line" />,
      )
      const control = controlOf(view.getByRole('checkbox', { name: 'Label' }))

      expect(
        view.getByText('Supporting line').getBoundingClientRect().left -
          control.getBoundingClientRect().right,
      ).toBe(8)
    })
  })
})

// The glyph changes with the fill rather than a frame ahead of it: it fades
// and grows over the box's own duration and curve.
describe('the glyph', () => {
  it.each(['check', 'dash'] as const)(
    'fades and grows the %s with the fill',
    (mark) => {
      const { input } = setup()
      const box = transitionOf(boxOf(input))
      const glyph = transitionOf(glyphsOf(input)[mark])

      expect(glyph.properties).toEqual(['opacity', 'transform'])
      expect(glyph.durations).toEqual([box.durations[0]])
      expect(glyph.easings).toEqual([box.easings[0]])
      expect(box.durations[0]).not.toBe('0s')
    },
  )

  it.each(['check', 'dash'] as const)(
    'changes the %s at once for a reader who asked for less motion',
    (mark) => {
      const { input } = setup()
      const box = reducedMotionOf(boxOf(input), 'transition-duration')
      const glyph = reducedMotionOf(
        glyphsOf(input)[mark],
        'transition-duration',
      )

      expect(glyph).toEqual({ reduced: '0s', resting: box.resting })
      expect(box.resting).toBeDefined()
      expect(box.resting).not.toBe('0s')
    },
  )
})

// The label hears a press on the control and on the text beside it alike,
// and a key reaches the input inside it. Each grows from the middle of the
// control: the text runs the width of the row, and a press at its far end
// is far from the control.
describe('the ripple', () => {
  it.each([
    ['the text beside the control', 'text'],
    ['the corner of the control', 'control'],
  ] as const)('ripples a press on %s from the middle', (_where, target) => {
    const { getByText, input } = setup()
    const control = controlOf(input)
    const pressed = target === 'text' ? getByText('Label') : control
    const { right, top } = pressed.getBoundingClientRect()

    const ripples = recordRipples(() => {
      firePointer(pressed, 'pointerdown', {
        buttons: 1,
        clientX: right - 1,
        clientY: top + 1,
      })
    })

    expect(ripples.map(startsInTheMiddle)).toEqual([true])
    expect(isPressed(control)).toBe(true)
  })

  // React Aria keeps the label's click to itself, so a press that waited for
  // one held the ripple at its pressed opacity until the pointer left.
  it('lets the ripple go once the press is released', async () => {
    vi.useFakeTimers()
    const restoreAnimate = installFakeAnimate()

    try {
      const { getByText, input } = setup()
      const text = getByText('Label')
      firePointer(text, 'pointerdown', { buttons: 1 })
      firePointer(text, 'pointerup')
      expect(isPressed(controlOf(input))).toBe(true)

      await advance(MINIMUM_PRESS_MS)
      expect(isPressed(controlOf(input))).toBe(false)
    } finally {
      restoreAnimate()
      vi.useRealTimers()
    }
  })

  // React Aria reports a key's activation twice, as the key and then as the
  // click the browser makes of it, which carries no pointer. The click is
  // dispatched here as the browser would, after the key comes up.
  it('ripples a key press once, from the middle of the control, on its release', () => {
    const { input } = setup()

    const held = recordRipples(() => {
      fireEvent.keyDown(input, { code: 'Space', key: ' ' })
    })
    const released = recordRipples(() => {
      fireEvent.keyUp(input, { code: 'Space', key: ' ' })
      fireEvent.click(input, { detail: 0 })
    })

    expect(input).toHaveProperty('checked', true)
    expect(held).toEqual([])
    expect(released.map(startsInTheMiddle)).toEqual([true])
  })

  // A key that activates the checkbox while a pointer holds it down leaves
  // the pointer's press where it is rather than starting another.
  it('leaves a press in flight to its pointer', () => {
    const { getByText, input } = setup()

    const ripples = recordRipples(() => {
      firePointer(getByText('Label'), 'pointerdown', { buttons: 1 })
      fireEvent.keyDown(input, { code: 'Space', key: ' ' })
      fireEvent.keyUp(input, { code: 'Space', key: ' ' })
    })

    expect(ripples).toHaveLength(1)
    expect(isPressed(controlOf(input))).toBe(true)
  })

  it.each([
    ['disabled', { isDisabled: true }],
    ['read-only', { isReadOnly: true }],
  ] as const)('draws no ripple while %s', (_state, props) => {
    const { getByText, input } = setup(props)

    const ripples = recordRipples(() => {
      firePointer(getByText('Label'), 'pointerdown', { buttons: 1 })
      fireEvent.keyDown(input, { code: 'Space', key: ' ' })
      fireEvent.keyUp(input, { code: 'Space', key: ' ' })
    })

    expect(hasRipple(controlOf(input))).toBe(false)
    expect(ripples).toEqual([])
  })
})

// A keyboard's focus draws the hover layer's colour at the focus opacity,
// as Button's does, where it once drew the ring alone.
const focusProbeStyles = stylex.create({
  marked: {
    backgroundColor: `color-mix(in srgb, ${colors.primary} calc(${stateLayerOpacity.focus} * 100%), transparent)`,
  },
  unmarked: {
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

// How far each label sits below the one before it, which is the height a
// stacked checkbox takes.
function pitches(view: ReturnType<typeof render>, labels: string[]) {
  const tops = labels.map(
    (label) => view.getByText(label).getBoundingClientRect().top,
  )
  return tops.slice(1).map((top, index) => top - (tops[index] ?? 0))
}

// A form keeps an empty line under a field a message can reach after the
// fact, so the fields below do not move when it does. A checkbox nothing can
// find wanting gets no message, and took the line anyway.
describe('in a form', () => {
  it('keeps no empty line under a checkbox no message can reach', () => {
    const view = render(
      <Form>
        <Checkbox>First item</Checkbox>
        <Checkbox>Second item</Checkbox>
        <Checkbox>Third item</Checkbox>
      </Form>,
    )

    expect(pitches(view, ['First item', 'Second item', 'Third item'])).toEqual([
      40, 40,
    ])
  })

  // A name is what a form's errors are keyed by, and a requirement is what
  // the browser checks on submit, so either can bring a message.
  it.each([
    ['named', { name: 'first' }],
    ['required', { isRequired: true }],
  ] as const)('keeps the line under a %s checkbox', (_kind, props) => {
    const view = render(
      <Form>
        <Checkbox {...props}>First item</Checkbox>
        <Checkbox>Second item</Checkbox>
      </Form>,
    )

    expect(pitches(view, ['First item', 'Second item'])).toEqual([60])
  })
})

describe('focus layer', () => {
  it.each([
    ['an unmarked', {}, focusProbeStyles.unmarked],
    ['a marked', { defaultSelected: true }, focusProbeStyles.marked],
  ] as const)(
    'lays it over %s control for a keyboard',
    (_name, props, layer) => {
      const { input } = setup(props)
      const control = controlOf(input)
      const classes = classesOf(stylex.props(layer))
      expect(hasClasses(control, classes)).toBe(false)

      focusByKeyboard(input)

      expect(hasClasses(control, classes)).toBe(true)
    },
  )
})
