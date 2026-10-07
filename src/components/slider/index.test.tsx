import * as stylex from '@stylexjs/stylex'
import { act, fireEvent, render } from '@testing-library/react'
import { I18nProvider } from 'react-aria-components'
import { describe, expect, it, vi } from 'vitest'

import type { SliderSize } from '.'

import Slider from '.'
import { declarationsHeld } from '../../styles/stylesheet.testing'
import {
  colors,
  spacing,
  stateLayerOpacity,
} from '../../tokens/design.tokens.stylex'

// StyleX hashes an atomic class from the property and value, so the same
// declaration written here produces the same class the component produces.
// Asserting on class membership pins which role each part reaches for
// without depending on the browser having applied a rule these tests are the
// first thing to use — see chip/index.test.tsx for the flake behind this.
const probeStyles = stylex.create({
  active: { backgroundColor: colors.primary },
  disabledActive: {
    backgroundColor: `color-mix(in srgb, ${colors.onSurface} calc(${stateLayerOpacity.disabledContent} * 100%), transparent)`,
  },
  // A track 420 long, so a step of ten is 42 of it.
  frame: { inlineSize: '420px' },
  icon: { color: colors.onPrimary },
  iconDisabled: { color: colors.inverseOnSurface },
  inactive: { backgroundColor: colors.secondaryContainer },
  indicator: { backgroundColor: colors.inverseSurface },
  stop: { backgroundColor: colors.onSecondaryContainer },
  stopActive: { backgroundColor: colors.onPrimary },
  stopActiveDisabled: { backgroundColor: colors.inverseOnSurface },
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
  active: classesOf(stylex.props(probeStyles.active)),
  disabledActive: classesOf(stylex.props(probeStyles.disabledActive)),
  icon: classesOf(stylex.props(probeStyles.icon)),
  iconDisabled: classesOf(stylex.props(probeStyles.iconDisabled)),
  inactive: classesOf(stylex.props(probeStyles.inactive)),
  indicator: classesOf(stylex.props(probeStyles.indicator)),
  stop: classesOf(stylex.props(probeStyles.stop)),
  stopActive: classesOf(stylex.props(probeStyles.stopActive)),
  stopActiveDisabled: classesOf(stylex.props(probeStyles.stopActiveDisabled)),
}

function hasClasses(element: Element, classes: string[]) {
  return classes.every((name) => element.classList.contains(name))
}

// Hoisted so each is one stable array per render rather than a fresh one,
// which is what react-perf's no-new-array-as-prop is after.
/** The horizontal middle of a box. */
function middleOf(rect: DOMRect) {
  return rect.left + rect.width / 2
}

const RANGE = [20, 60]
const THUMB_LABELS = ['Start', 'End']

/**
 * The track's parts, in order, and the handle around `input`. React Aria
 * wraps the range input in a visually hidden element inside the handle.
 */
// A scheme that moves the spacing scale's small step off its default 8, which
// is the value the handle's clearance used to be read from. `Editorial` in
// src/theming/themes.ts is the scheme this came from.
const looseSpacing = stylex.createTheme(spacing, { sm: '10px' })

function partsOf(input: HTMLElement) {
  const thumb = input.parentElement?.parentElement
  const track = thumb?.parentElement
  if (!(thumb instanceof HTMLElement) || !(track instanceof HTMLElement)) {
    throw new Error('expected the input to sit in a handle on the track')
  }
  const segments = [...track.children].filter(
    (child) => child.tagName === 'SPAN' && !child.contains(input),
  )
  return { segments, thumb, track }
}

function setup(props: Partial<Parameters<typeof Slider>[0]> = {}) {
  const view = render(<Slider defaultValue={40} label="Label" {...props} />)
  return {
    ...view,
    input: view.getByRole('slider', { name: 'Label' }),
  }
}

// A slider on a track 420 long, under a direction and a locale: React Aria
// mirrors the handle from the locale, and the stylesheet the parts from
// `dir`, so a right-to-left case sets both, as an app does.
function setupFramed(
  props: Partial<Parameters<typeof Slider>[0]> = {},
  {
    dir = 'ltr',
    locale = 'en-US',
  }: { dir?: 'ltr' | 'rtl'; locale?: string } = {},
) {
  const view = render(
    <I18nProvider locale={locale}>
      <div dir={dir} {...stylex.props(probeStyles.frame)}>
        <Slider defaultValue={40} label="Label" {...props} />
      </div>
    </I18nProvider>,
  )
  const [input] = view.getAllByRole('slider')
  return { ...view, input, ...partsOf(input) }
}

// The stops a part draws, as their centres along the track from its start,
// for those the part shows whole: a part clips what it holds, which is what
// hides a stop beside the handle.
function stopsIn(part: Element, track: HTMLElement, vertical = false) {
  const bounds = part.getBoundingClientRect()
  const from = track.getBoundingClientRect()
  return [...part.children]
    .filter((child) => !child.querySelector('svg'))
    .flatMap((stop) => {
      const box = stop.getBoundingClientRect()
      const whole = vertical
        ? box.top >= bounds.top - 0.5 && box.bottom <= bounds.bottom + 0.5
        : box.left >= bounds.left - 0.5 && box.right <= bounds.right + 0.5
      const centre = vertical
        ? from.bottom - (box.top + box.height / 2)
        : box.left + box.width / 2 - from.left
      return whole ? [{ centre: Math.round(centre), stop }] : []
    })
}

const ICON = (
  <svg aria-hidden="true" data-testid="icon" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="6" />
  </svg>
)

describe('slider', () => {
  describe('semantics', () => {
    // getByRole with a name resolves through the accessible name, so finding
    // the input this way is the label association itself.
    it('renders a slider named by its label', () => {
      const { input } = setup()
      expect(input.tagName).toBe('INPUT')
      expect(input.getAttribute('type')).toBe('range')
    })

    // React Aria names a handle by its own label and then the slider's, so
    // the first handle here is "Start Label".
    it('names each handle of a range', () => {
      const view = render(
        <Slider
          defaultValue={RANGE}
          label="Label"
          thumbLabels={THUMB_LABELS}
        />,
      )
      expect(view.getByRole('slider', { name: /^Start/ })).toHaveProperty(
        'value',
        '20',
      )
      expect(view.getByRole('slider', { name: /^End/ })).toHaveProperty(
        'value',
        '60',
      )
    })

    it('runs along the block axis when vertical', () => {
      const { input } = setup({ orientation: 'vertical' })
      expect(input.getAttribute('aria-orientation')).toBe('vertical')
    })
  })

  describe('value', () => {
    it('keeps its own value when uncontrolled and moves it a step at a time', () => {
      const { input } = setup({ step: 5 })
      expect(input).toHaveProperty('value', '40')
      fireEvent.keyDown(input, { key: 'ArrowRight' })
      expect(input).toHaveProperty('value', '45')
      fireEvent.keyDown(input, { key: 'End' })
      expect(input).toHaveProperty('value', '100')
    })

    // Controlled means the call site owns the value: a key reports it and
    // nothing moves until the prop comes back different.
    it('reports without moving when controlled', () => {
      const onChange = vi.fn<(value: number | number[]) => void>()
      const { input } = setup({ onChange, value: 40 })
      fireEvent.keyDown(input, { key: 'ArrowRight' })
      expect(onChange).toHaveBeenCalledWith(41)
      expect(input).toHaveProperty('value', '40')
    })

    it('keeps the handles of a range in order', () => {
      const view = render(
        <Slider
          defaultValue={RANGE}
          label="Label"
          thumbLabels={THUMB_LABELS}
        />,
      )
      const start = view.getByRole('slider', { name: /^Start/ })
      for (let step = 0; step < 50; step += 1) {
        fireEvent.keyDown(start, { key: 'ArrowRight' })
      }
      expect(start).toHaveProperty('value', '60')
    })

    it('is disabled through the input', () => {
      const { input } = setup({ isDisabled: true })
      expect(input).toHaveProperty('disabled', true)
    })
  })

  // Every state is a class chosen from React Aria's render state rather than
  // a selector, so each is pinned to the role it reaches for.
  describe('appearance', () => {
    it('draws the active part in primary and the inactive part in secondary container, with the stop', () => {
      const { input } = setup()
      const { segments } = partsOf(input)
      expect(segments).toHaveLength(2)
      expect(hasClasses(segments[0], CLASSES.active)).toBe(true)
      expect(hasClasses(segments[1], CLASSES.inactive)).toBe(true)
      expect(hasClasses(segments[1].firstElementChild!, CLASSES.stop)).toBe(
        true,
      )
    })

    it('draws a range as an inactive part on each side of the active one', () => {
      const view = render(
        <Slider
          defaultValue={RANGE}
          label="Label"
          thumbLabels={THUMB_LABELS}
        />,
      )
      const { segments } = partsOf(view.getByRole('slider', { name: /^Start/ }))
      expect(segments).toHaveLength(3)
      expect(hasClasses(segments[0], CLASSES.inactive)).toBe(true)
      expect(hasClasses(segments[1], CLASSES.active)).toBe(true)
      expect(hasClasses(segments[2], CLASSES.inactive)).toBe(true)
    })

    it('dims the parts while disabled', () => {
      const { input } = setup({ isDisabled: true })
      const { segments } = partsOf(input)
      expect(hasClasses(segments[0], CLASSES.disabledActive)).toBe(true)
    })

    // The indicator is the page's value label, and React Aria's output, so
    // what it shows is what the slider announces. Keyboard focus is what
    // brings it up here: React Aria treats focus as visible once a key has
    // been pressed anywhere on the page.
    // The indicator's inset is logical and its centring translate has to
    // follow it: a physical one put it a whole width to the left of the
    // handle under right-to-left. React Aria mirrors the handle itself from
    // the locale, and the stylesheet the indicator from `dir`, so the case
    // sets both, as an app does.
    it.each([
      ['left-to-right', 'en-US', 'ltr'],
      ['right-to-left', 'he-IL', 'rtl'],
    ] as const)('centres the value on the handle, %s', (_, locale, dir) => {
      const view = render(
        <I18nProvider locale={locale}>
          <div dir={dir}>
            <Slider defaultValue={40} label="Label" />
          </div>
        </I18nProvider>,
      )
      const input = view.getByRole('slider', { name: 'Label' })

      fireEvent.keyDown(document.body, { key: 'Tab' })
      act(() => {
        input.focus()
      })
      const output = view.container.querySelector('output')
      if (output === null) {
        throw new Error('expected the handle to show its value')
      }
      const { thumb } = partsOf(input)

      expect(
        Math.abs(
          middleOf(output.getBoundingClientRect()) -
            middleOf(thumb.getBoundingClientRect()),
        ),
      ).toBeLessThan(1)
    })

    it('shows the value over the handle while it has keyboard focus', () => {
      const { input, queryByRole } = setup()
      expect(queryByRole('status')).toBeNull()

      fireEvent.keyDown(document.body, { key: 'Tab' })
      act(() => {
        input.focus()
      })
      const output = document.querySelector('output')
      expect(output).not.toBeNull()
      expect(output?.textContent).toBe('40')
      expect(hasClasses(output!, CLASSES.indicator)).toBe(true)
    })
  })

  describe('measurements', () => {
    it("draws a 16 track in the handle's 44, with the parts 8 clear of the handle's centre", () => {
      const { input } = setup()
      const { segments, thumb, track } = partsOf(input)
      const active = segments[0].getBoundingClientRect()
      const inactive = segments[1].getBoundingClientRect()
      const centre =
        thumb.getBoundingClientRect().x +
        thumb.getBoundingClientRect().width / 2

      expect(getComputedStyle(track).height).toBe('44px')
      expect(active.height).toBe(16)
      expect(getComputedStyle(thumb).width).toBe('4px')
      expect(getComputedStyle(thumb).height).toBe('44px')
      expect(centre - active.right).toBeCloseTo(8, 0)
      expect(inactive.left - centre).toBeCloseTo(8, 0)
    })

    // The clearance is the page's 6dp plus half the handle, both constants of
    // the component. Read off the spacing scale it came to the same 8 under
    // the default tokens and opened up under a scheme that moves that step,
    // leaving the parts further from the handle than the stop is from the end.
    it("keeps the parts 8 clear when the spacing scale's small step moves", () => {
      const view = render(
        <div {...stylex.props(looseSpacing)}>
          <Slider defaultValue={40} label="Label" />
        </div>,
      )
      const input = view.getByRole('slider', { name: 'Label' })
      const { segments, thumb } = partsOf(input)
      const thumbBox = thumb.getBoundingClientRect()
      const centre = thumbBox.x + thumbBox.width / 2

      expect(centre - segments[0].getBoundingClientRect().right).toBeCloseTo(
        8,
        0,
      )
      expect(segments[1].getBoundingClientRect().left - centre).toBeCloseTo(
        8,
        0,
      )
    })
  })

  // The page's sizes, by the track's thickness, its outer corner and the
  // handle's length. The strip is centred in the handle's length at each.
  describe('sizes', () => {
    it.each([
      ['xs', 16, 44, '8px'],
      ['sm', 24, 44, '8px'],
      ['md', 40, 52, '12px'],
      ['lg', 56, 68, '16px'],
      ['xl', 96, 108, '28px'],
    ] as const)(
      'draws %s as a %i track in a %i handle, with a %s corner',
      (size, track, handle, corner) => {
        const view = setupFramed({ size })
        const strip = view.segments[1].getBoundingClientRect()
        const box = view.track.getBoundingClientRect()

        expect(box.height).toBe(handle)
        expect(view.thumb.getBoundingClientRect().height).toBe(handle)
        expect(view.thumb.getBoundingClientRect().width).toBe(4)
        expect(strip.height).toBe(track)
        expect(strip.top - box.top).toBe((handle - track) / 2)
        // The inactive part's outer end is the track's end, at the full
        // corner; its end against the handle stays at 2.
        const inactive = view.segments[1]
        expect(getComputedStyle(inactive).borderTopRightRadius).toBe(corner)
        expect(getComputedStyle(inactive).borderTopLeftRadius).toBe('2px')
      },
    )

    it('keeps the parts 8 clear of the handle at every size', () => {
      for (const size of ['sm', 'md', 'lg', 'xl'] as const) {
        const view = setupFramed({ size })
        const thumb = view.thumb.getBoundingClientRect()
        const centre = thumb.left + thumb.width / 2

        expect(
          centre - view.segments[0].getBoundingClientRect().right,
        ).toBeCloseTo(8, 0)
        expect(
          view.segments[1].getBoundingClientRect().left - centre,
        ).toBeCloseTo(8, 0)
        view.unmount()
      }
    })

    it('runs a vertical slider across the same thickness', () => {
      const view = setupFramed({ orientation: 'vertical', size: 'lg' })

      expect(view.track.getBoundingClientRect().width).toBe(68)
      expect(view.segments[0].getBoundingClientRect().width).toBe(56)
      expect(view.thumb.getBoundingClientRect().width).toBe(68)
    })

    // React Aria's centring translate is physical, so the inset it backs out
    // of has to be: a logical one put the handle a whole width off the track
    // under right-to-left. The value then sits on the handle's inline-start
    // side, centred on it.
    it.each([
      ['left-to-right', 'en-US', 'ltr'],
      ['right-to-left', 'he-IL', 'rtl'],
    ] as const)(
      "centres a vertical slider's handle on the track, %s",
      (_, locale, dir) => {
        const view = setupFramed({ orientation: 'vertical' }, { dir, locale })
        const track = view.track.getBoundingClientRect()

        expect(
          Math.abs(
            middleOf(view.thumb.getBoundingClientRect()) - middleOf(track),
          ),
        ).toBeLessThan(1)

        fireEvent.keyDown(document.body, { key: 'Tab' })
        act(() => {
          view.input.focus()
        })
        const output = view.container.querySelector('output')
        if (output === null) {
          throw new Error('expected the handle to show its value')
        }
        const value = output.getBoundingClientRect()
        const thumb = view.thumb.getBoundingClientRect()

        // The 12dp the value keeps clear of the handle, measured on the side
        // the inline start falls on.
        const gap =
          dir === 'rtl' ? value.left - thumb.right : thumb.left - value.right
        expect(gap).toBeCloseTo(12, 0)
        expect(
          Math.abs(
            value.top + value.height / 2 - (thumb.top + thumb.height / 2),
          ),
        ).toBeLessThan(1)
      },
    )
  })

  // The page's stops configuration: a stop at every step, in the role of the
  // part it sits on, with the one under the handle hidden.
  describe('stops', () => {
    it('draws a stop at every step, but the one under the handle', () => {
      const view = setupFramed({ showStops: true, step: 10 })
      const [active, inactive] = view.segments

      // The ends sit 8 in, as the single stop does; the rest at each 42.
      expect(stopsIn(active, view.track).map(({ centre }) => centre)).toEqual([
        8, 42, 84, 126,
      ])
      expect(stopsIn(inactive, view.track).map(({ centre }) => centre)).toEqual(
        [210, 252, 294, 336, 378, 412],
      )
    })

    it('draws the stops on the active part in on primary', () => {
      const view = setupFramed({ showStops: true, step: 10 })
      const [active, inactive] = view.segments

      for (const { stop } of stopsIn(active, view.track)) {
        expect(hasClasses(stop, CLASSES.stopActive)).toBe(true)
      }
      for (const { stop } of stopsIn(inactive, view.track)) {
        expect(hasClasses(stop, CLASSES.stop)).toBe(true)
      }
    })

    // In steps of one a stop falls every 4.2, so one lands in the 6 between
    // the active part's end and the handle. The part clips it, which is what
    // leaves that space empty.
    it('leaves the space beside the handle empty', () => {
      const view = setupFramed({ showStops: true, step: 1 })
      const box = view.track.getBoundingClientRect()
      const middle = box.top + box.height / 2

      expect(document.elementFromPoint(box.left + 163, middle)).toBe(view.track)
      expect(document.elementFromPoint(box.left + 173, middle)).toBe(view.track)
    })

    it('draws the end stop alone without them', () => {
      const view = setupFramed({ step: 10 })

      expect(stopsIn(view.segments[0], view.track)).toEqual([])
      expect(
        stopsIn(view.segments[1], view.track).map(({ centre }) => centre),
      ).toEqual([412])
    })

    it('moves the stop it hides with the handle', () => {
      const view = setupFramed({ showStops: true, step: 10 })

      fireEvent.keyDown(view.input, { key: 'ArrowRight' })

      expect(
        stopsIn(view.segments[0], view.track).map(({ centre }) => centre),
      ).toEqual([8, 42, 84, 126, 168])
      expect(
        stopsIn(view.segments[1], view.track).map(({ centre }) => centre),
      ).toEqual([252, 294, 336, 378, 412])
    })

    it('puts the first stop on the inactive part before a range', () => {
      const view = setupFramed({
        defaultValue: RANGE,
        showStops: true,
        step: 10,
        thumbLabels: THUMB_LABELS,
      })
      const [before, active, after] = view.segments

      expect(stopsIn(before, view.track).map(({ centre }) => centre)).toEqual([
        8, 42,
      ])
      expect(stopsIn(active, view.track).map(({ centre }) => centre)).toEqual([
        126, 168, 210,
      ])
      expect(stopsIn(after, view.track).map(({ centre }) => centre)).toEqual([
        294, 336, 378, 412,
      ])
    })

    it('starts the stops from the right, right to left', () => {
      const view = setupFramed(
        { showStops: true, step: 10 },
        { dir: 'rtl', locale: 'he-IL' },
      )
      const right = view.track.getBoundingClientRect().right
      const centres = [...view.segments[0].children].map((stop) => {
        const box = stop.getBoundingClientRect()
        return Math.round(right - (box.left + box.width / 2))
      })

      expect(centres.slice(0, 4)).toEqual([8, 42, 84, 126])
    })

    it('runs the stops up a vertical slider from the bottom', () => {
      const view = setupFramed({
        orientation: 'vertical',
        showStops: true,
        step: 10,
      })
      const length = view.track.getBoundingClientRect().height

      expect(
        stopsIn(view.segments[0], view.track, true).map(({ centre }) => centre),
      ).toEqual([
        8,
        ...[0.1, 0.2, 0.3].map((share) => Math.round(share * length)),
      ])
    })

    it('dims the stops while disabled', () => {
      const view = setupFramed({ isDisabled: true, showStops: true, step: 10 })
      const [active] = view.segments
      const [first] = stopsIn(active, view.track)

      expect(hasClasses(first.stop, CLASSES.stopActiveDisabled)).toBe(true)
    })

    // The active part is `Highlight` under a forced palette, so its stops
    // take the text colour drawn on it.
    it('keeps the stops apart from their part under forced colours', () => {
      const view = setupFramed({ showStops: true, step: 10 })
      const [first] = stopsIn(view.segments[0], view.track)

      expect(
        declarationsHeld(first.stop, 'forced-colors: active').get(
          'background-color',
        ),
      ).toBe('highlighttext')
    })
  })

  // The page's inset icon, at the start of the active part from M up.
  describe('inset icon', () => {
    it.each([
      ['md', 24],
      ['lg', 24],
      ['xl', 32],
    ] as const)(
      'draws the icon %s at %i, 10 into the active part',
      (size, length) => {
        const view = setupFramed({ icon: ICON, size })
        const icon = view.getByTestId('icon').parentElement
        const part = view.segments[0].getBoundingClientRect()
        const box = icon?.getBoundingClientRect()

        expect(box?.width).toBe(length)
        expect(box?.height).toBe(length)
        expect((box?.left ?? 0) - part.left).toBe(10)
        expect((box?.top ?? 0) - part.top).toBe((part.height - length) / 2)
        expect(icon && hasClasses(icon, CLASSES.icon)).toBe(true)
      },
    )

    it.each(['xs', 'sm'] satisfies SliderSize[])(
      'leaves the icon out at %s',
      (size) => {
        const view = setupFramed({ icon: ICON, size })

        expect(view.queryByTestId('icon')).toBeNull()
      },
    )

    it('leaves the icon out of a range', () => {
      const view = setupFramed({
        defaultValue: RANGE,
        icon: ICON,
        size: 'md',
        thumbLabels: THUMB_LABELS,
      })

      expect(view.queryByTestId('icon')).toBeNull()
    })

    // The active part ends 8 short of the handle, so at 12 of 100 it is 42.4
    // long and at 13 it is 46.6: either side of the 44 an icon of 24 needs
    // with its 10 on each side. At XL the icon is 32, so the line is at 52,
    // between 14 and 15.
    it.each([
      ['md', 12],
      ['xl', 14],
    ] as const)(
      'hides the icon %s while the active part has no room for it',
      (size, value) => {
        const view = setupFramed({ defaultValue: value, icon: ICON, size })
        const icon = view.getByTestId('icon').parentElement

        expect(icon && getComputedStyle(icon).display).toBe('none')

        fireEvent.keyDown(view.input, { key: 'ArrowRight' })

        expect(icon && getComputedStyle(icon).display).toBe('flex')
      },
    )

    it('sits the icon at the foot of a vertical slider', () => {
      const view = setupFramed({
        icon: ICON,
        orientation: 'vertical',
        size: 'md',
      })
      const icon = view.getByTestId('icon').parentElement
      const part = view.segments[0].getBoundingClientRect()
      const box = icon?.getBoundingClientRect()

      expect(part.bottom - (box?.bottom ?? 0)).toBe(10)
      expect((box?.left ?? 0) - part.left).toBe((part.width - 24) / 2)
    })

    it('dims the icon while disabled', () => {
      const view = setupFramed({ icon: ICON, isDisabled: true, size: 'md' })
      const icon = view.getByTestId('icon').parentElement

      expect(icon && hasClasses(icon, CLASSES.iconDisabled)).toBe(true)
    })

    it('draws the icon in the text colour on the active part under forced colours', () => {
      const view = setupFramed({ icon: ICON, size: 'md' })
      const icon = view.getByTestId('icon').parentElement

      expect(
        icon && declarationsHeld(icon, 'forced-colors: active').get('color'),
      ).toBe('highlighttext')
    })
  })
})
