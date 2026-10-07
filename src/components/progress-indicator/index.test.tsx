import * as stylex from '@stylexjs/stylex'
import { render } from '@testing-library/react'
import { describe, expect, expectTypeOf, it } from 'vitest'

import type { ProgressIndicatorProps } from '.'

import ProgressIndicator from '.'
import {
  declarationsHeld,
  reducedMotionOf,
} from '../../styles/stylesheet.testing'
import { colors } from '../../tokens/design.tokens.stylex'

// StyleX hashes an atomic class from the property and value, so the same
// declaration written here produces the same class the component produces.
// Asserting on class membership pins which role each part reaches for without
// depending on the browser having applied a rule these tests are the first
// thing to use — see chip/index.test.tsx for the flake behind this.
const probeStyles = stylex.create({
  active: { backgroundColor: colors.primary },
  // The arcs are drawn with a stroke rather than filled, so their roles
  // hash to different classes from the linear parts'.
  activeArc: { stroke: colors.primary },
  // The colour of something an indicator can sit inside, such as a filled
  // button's label.
  ink: { color: colors.onPrimary },
  track: { backgroundColor: colors.secondaryContainer },
  trackArc: { stroke: colors.secondaryContainer },
  // Wider than the wave reaches, for the line that draws flat beyond it.
  wide: { inlineSize: '2100px' },
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
  activeArc: classesOf(stylex.props(probeStyles.activeArc)),
  track: classesOf(stylex.props(probeStyles.track)),
  trackArc: classesOf(stylex.props(probeStyles.trackArc)),
}

/** The two arcs of a circular indicator: the track, then the active one. */
function arcsOf(bar: HTMLElement) {
  const svg = bar.querySelector('svg')
  const [track, active] = [...(svg?.children ?? [])]
  if (
    !(svg instanceof SVGElement) ||
    !(track instanceof SVGElement) ||
    !(active instanceof SVGElement)
  ) {
    throw new Error('expected the indicator to draw two arcs')
  }
  return { active, svg, track }
}

function hasClasses(element: Element, classes: string[]) {
  return classes.every((name) => element.classList.contains(name))
}

/** The three parts of a linear indicator, in the order the page draws them. */
function linearPartsOf(bar: HTMLElement) {
  const row = bar.lastElementChild
  if (!(row instanceof HTMLElement)) {
    throw new Error('expected the indicator to draw a row')
  }
  const [active, track, stop] = [...row.children]
  if (
    !(active instanceof HTMLElement) ||
    !(track instanceof HTMLElement) ||
    !(stop instanceof HTMLElement)
  ) {
    throw new Error('expected the active indicator, the track and the stop')
  }
  return { active, row, stop, track }
}

const REDUCED_MOTION = 'prefers-reduced-motion: reduce'

function setup(props: Partial<Parameters<typeof ProgressIndicator>[0]> = {}) {
  const view = render(<ProgressIndicator label="Label" value={40} {...props} />)
  return { ...view, bar: view.getByRole('progressbar', { name: 'Label' }) }
}

/** The wavy line's row: the flat line, then the wave drawn over it. */
function wavyLineOf(bar: HTMLElement) {
  const row = bar.lastElementChild
  const [line, svg] = [...(row?.children ?? [])]
  if (
    !(row instanceof HTMLElement) ||
    !(line instanceof HTMLElement) ||
    !(svg instanceof SVGSVGElement) ||
    !(svg.firstElementChild instanceof SVGPathElement)
  ) {
    throw new Error('expected the flat line and the wave over it')
  }
  const [active] = [...line.children]
  if (!(active instanceof HTMLElement)) {
    throw new Error('expected the flat line to draw its active indicator')
  }
  return { active, line, path: svg.firstElementChild, row, svg }
}

describe('progress indicator', () => {
  describe('semantics', () => {
    // getByRole with a name resolves through the accessible name, so finding
    // the bar this way is the label association itself.
    it('renders a progress bar named by its label', () => {
      const { bar } = setup()
      expect(bar.getAttribute('aria-valuenow')).toBe('40')
      expect(bar.getAttribute('aria-valuemin')).toBe('0')
      expect(bar.getAttribute('aria-valuemax')).toBe('100')
    })

    it('takes a name from aria-label instead', () => {
      const view = render(<ProgressIndicator aria-label="Loading" value={40} />)
      expect(view.getByRole('progressbar', { name: 'Loading' })).not.toBeNull()
    })

    // An indeterminate bar has no value at all, which is what a screen
    // reader reads as work of unknown length.
    it('carries no value while indeterminate', () => {
      const view = render(<ProgressIndicator isIndeterminate label="Label" />)
      const bar = view.getByRole('progressbar', { name: 'Label' })
      expect(bar.getAttribute('aria-valuenow')).toBeNull()
    })

    it('shows the value beside the label when asked', () => {
      const view = setup({ showValue: true })
      expect(view.getByText('40%')).not.toBeNull()
    })

    it('shows no value while indeterminate, even when asked', () => {
      const view = render(
        <ProgressIndicator isIndeterminate label="Label" showValue />,
      )
      expect(view.queryByText('0%')).toBeNull()
    })

    // The value reads in the page's locale, which is the runner's en-US.
    it('reads the value in the format it is given', () => {
      const view = setup({
        formatOptions: { style: 'decimal' },
        showValue: true,
      })
      expect(view.getByText('40')).not.toBeNull()
    })
  })

  describe('linear', () => {
    // The page's anatomy: the active indicator, the track, and the stop
    // indicator at the end, in primary, secondary container and primary.
    it("draws the three parts in the page's roles", () => {
      const { bar } = setup()
      const { active, stop, track } = linearPartsOf(bar)

      expect(hasClasses(active, CLASSES.active)).toBe(true)
      expect(hasClasses(track, CLASSES.track)).toBe(true)
      expect(hasClasses(stop, CLASSES.active)).toBe(true)
    })

    // The page's measurements: 4dp thick, with 4dp between the parts and a
    // 4dp stop indicator.
    it("is 4 thick with the page's 4 between its parts", () => {
      const { bar } = setup()
      const { row, stop } = linearPartsOf(bar)

      expect(row.getBoundingClientRect().height).toBe(4)
      expect(getComputedStyle(row).columnGap).toBe('4px')
      expect(stop.getBoundingClientRect().width).toBe(4)
      expect(stop.getBoundingClientRect().height).toBe(4)
    })

    // The share is of the row less the two gaps and the stop indicator,
    // which the line draws at every value.
    it("gives the active indicator the value's share of the row", () => {
      const { bar } = setup({ value: 25 })
      const { active, row } = linearPartsOf(bar)
      const room = row.getBoundingClientRect().width - 4 - 8

      expect(active.getBoundingClientRect().width).toBeCloseTo(room * 0.25, 0)
    })

    it.each([99, 100])(
      'keeps the stop at the end of the row at %i',
      (value) => {
        const { bar } = setup({ value })
        const { row, stop } = linearPartsOf(bar)

        expect(stop.getBoundingClientRect().right).toBeCloseTo(
          row.getBoundingClientRect().right,
          0,
        )
      },
    )

    it('leaves the track what the value has not taken', () => {
      const full = setup({ value: 100 })
      expect(
        linearPartsOf(full.bar).track.getBoundingClientRect().width,
      ).toBeCloseTo(0, 0)
      full.unmount()

      const empty = setup({ value: 0 })
      const { active, row, track } = linearPartsOf(empty.bar)
      expect(active.getBoundingClientRect().width).toBe(0)
      // The row's width, less the stop indicator and the two gaps.
      expect(track.getBoundingClientRect().width).toBeCloseTo(
        row.getBoundingClientRect().width - 4 - 8,
        0,
      )
    })
  })

  describe('circular', () => {
    it("draws a 40 ring with two arcs in the page's roles", () => {
      const { bar } = setup({ variant: 'circular' })
      const { active, svg, track } = arcsOf(bar)

      expect(svg.getBoundingClientRect().width).toBe(40)
      expect(svg.getBoundingClientRect().height).toBe(40)
      expect(active.getAttribute('stroke-width')).toBe('4')
      expect(hasClasses(active, CLASSES.activeArc)).toBe(true)
      expect(hasClasses(track, CLASSES.trackArc)).toBe(true)
    })

    // A length rather than a step of the size scale, since a ring sized to
    // the type around it is what the prop is for.
    it('draws the ring at the diameter it is given', () => {
      const { bar } = setup({ diameter: '24px', variant: 'circular' })
      const { svg } = arcsOf(bar)

      expect(svg.getBoundingClientRect().width).toBe(24)
      expect(svg.getBoundingClientRect().height).toBe(24)
    })

    it('takes the diameter as a CSS length', () => {
      expectTypeOf<ProgressIndicatorProps['diameter']>().toEqualTypeOf<
        string | undefined
      >()
      expectTypeOf<ProgressIndicatorProps>().not.toHaveProperty('size')
    })

    // The arcs are cut from one circle: the active one runs from the top for
    // the value's share, and the track picks up 4 past it.
    it("cuts the arcs to the value, with the page's gap between them", () => {
      const { bar } = setup({ value: 50, variant: 'circular' })
      const { active, track } = arcsOf(bar)
      const circumference = 2 * Math.PI * 18
      const half = circumference / 2

      expect(
        Number.parseFloat(active.getAttribute('stroke-dasharray') ?? ''),
      ).toBeCloseTo(half, 1)
      expect(
        Number.parseFloat(track.getAttribute('stroke-dasharray') ?? ''),
      ).toBeCloseTo(circumference - half - 8, 1)
      expect(
        Number.parseFloat(track.getAttribute('stroke-dashoffset') ?? ''),
      ).toBeCloseTo(-(half + 4), 1)
    })

    // Indeterminate, the ring is one arc that grows and shrinks while its
    // start travels the circle, with the whole thing turning — Material's
    // three composed effects, on the same circle the determinate ring uses.
    it('composes the three effects while indeterminate', () => {
      const view = render(
        <ProgressIndicator isIndeterminate label="Label" variant="circular" />,
      )
      const bar = view.getByRole('progressbar', { name: 'Label' })
      const svg = bar.querySelector('svg')
      const arc = svg?.firstElementChild
      if (!(svg instanceof SVGElement) || !(arc instanceof SVGElement)) {
        throw new Error('expected the ring to draw one arc')
      }

      // One arc, not the determinate pair.
      expect(svg.children).toHaveLength(1)
      // The dash lengths are percentages of a path normalised to 100.
      expect(arc.getAttribute('pathLength')).toBe('100')
      // Material's own timings: the arc, four of them to a cycle, and the
      // rotation scaled by 360/306.
      expect(getComputedStyle(arc).animationDuration).toBe('1.333s, 5.332s')
      expect(getComputedStyle(svg).animationDuration).toBe('1.568s')
    })

    // Material turns the arc's start in eight increments rather than at a
    // constant rate, each eased with the same curve the growth uses, so it
    // settles at each position and springs to the next.
    it('steps the arc around the circle rather than drifting it', () => {
      const view = render(
        <ProgressIndicator isIndeterminate label="Label" variant="circular" />,
      )
      const arc = view
        .getByRole('progressbar', { name: 'Label' })
        .querySelector('circle')
      if (!(arc instanceof SVGElement)) {
        throw new Error('expected the ring to draw one arc')
      }

      // Two animations run on the arc — its growth and its travel — so the
      // computed value is one curve per animation. `linear` on the second is
      // the drift this replaced. Read whole rather than split on the comma,
      // since a cubic-bezier holds three of its own.
      const easing = 'cubic-bezier(0.4, 0, 0.2, 1)'
      expect(getComputedStyle(arc).animationTimingFunction).toBe(
        `${easing}, ${easing}`,
      )
    })

    // The page's rounded ends add half the stroke at each end of the dash,
    // so an arc shorter than about two stroke widths draws as a dot. The
    // floor is what keeps the shortest state reading as an arc.
    it('keeps the arc long enough to read as an arc', async () => {
      const view = render(
        <ProgressIndicator isIndeterminate label="Label" variant="circular" />,
      )
      const arc = view
        .getByRole('progressbar', { name: 'Label' })
        .querySelector('circle')
      if (!(arc instanceof SVGElement)) {
        throw new Error('expected the ring to draw one arc')
      }

      // The growth runs on the document timeline, so the shortest state is
      // read by holding both animations at their own start rather than
      // waiting for the arc to come round to it.
      const running = arc.getAnimations()
      expect(running).not.toHaveLength(0)
      for (const animation of running) {
        animation.pause()
        animation.currentTime = 0
      }
      await Promise.all(
        running.map(async (animation) => {
          await animation.ready
        }),
      )

      const [dash] = getComputedStyle(arc).strokeDasharray.split(',')
      expect(Number.parseFloat(dash)).toBeGreaterThanOrEqual(8)
    })
  })

  describe('the determinate ring', () => {
    // Both arcs move with the value — `arcsFor` cuts the track's dash and
    // its offset from the same percentage — so easing one and not the other
    // shut the 4dp gap between them for a frame on every change.
    it('eases the track arc as it eases the active one', () => {
      const view = render(
        <ProgressIndicator label="Label" value={40} variant="circular" />,
      )
      const [track, active] = [
        ...(view
          .getByRole('progressbar', { name: 'Label' })
          .querySelector('svg')?.children ?? []),
      ]
      if (!(track instanceof SVGElement) || !(active instanceof SVGElement)) {
        throw new Error('expected the ring to draw two arcs')
      }

      for (const arc of [track, active]) {
        const style = getComputedStyle(arc)
        expect(style.transitionDuration).toBe('0.5s')
        expect(style.transitionProperty).toBe(
          'stroke-dasharray, stroke-dashoffset',
        )
      }
    })
  })

  describe('buffer', () => {
    // Material Web's buffer: the track is solid up to it and dotted beyond,
    // and the dots scroll by one pitch of their pattern.
    it('splits the track at the buffer and dots the rest', () => {
      const { bar } = setup({ buffer: 70, value: 20 })
      const { track } = linearPartsOf(bar)
      const [solid, dots] = [...track.children]
      if (!(solid instanceof HTMLElement) || !(dots instanceof HTMLElement)) {
        throw new Error('expected the track to hold the buffer and the dots')
      }

      // 70 of the way along, with 20 already taken, is five eighths of the
      // track that is left.
      const width = track.getBoundingClientRect().width
      expect(solid.getBoundingClientRect().width).toBeCloseTo(width * 0.625, 0)
      expect(dots.getBoundingClientRect().width).toBeCloseTo(width * 0.375, 0)
      expect(getComputedStyle(dots).animationName).not.toBe('none')
    })

    // Under `inherit` the track is a quarter of the colour around it, and the
    // buffer is part of the track: the solid stretch and the dots take that
    // same quarter rather than the page's secondary container.
    it('draws the buffer in the inherited track colour', () => {
      const view = render(
        <div {...stylex.props(probeStyles.ink)}>
          <ProgressIndicator label="Page" value={20} />
          <ProgressIndicator label="Plain" tone="inherit" value={20} />
          <ProgressIndicator
            buffer={70}
            label="Buffered"
            tone="inherit"
            value={20}
          />
        </div>,
      )
      const trackOf = (name: string) =>
        linearPartsOf(view.getByRole('progressbar', { name })).track
      const inherited = getComputedStyle(trackOf('Plain')).backgroundColor
      // Guards the comparison: the page's own track must not already be this
      // colour, or the assertions would hold however the buffer was drawn.
      expect(inherited).not.toBe(
        getComputedStyle(trackOf('Page')).backgroundColor,
      )

      const [solid, dots] = [...trackOf('Buffered').children]
      if (!(solid instanceof HTMLElement) || !(dots instanceof HTMLElement)) {
        throw new Error('expected the track to hold the buffer and the dots')
      }
      expect(getComputedStyle(solid).backgroundColor).toBe(inherited)
      expect(getComputedStyle(dots).backgroundImage).toContain(inherited)
    })

    it('leaves the track solid without one', () => {
      const { bar } = setup()
      const { track } = linearPartsOf(bar)
      expect(track.children).toHaveLength(0)
      expect(hasClasses(track, CLASSES.track)).toBe(true)
    })

    it('ignores a buffer while indeterminate', () => {
      const view = render(
        <ProgressIndicator buffer={70} isIndeterminate label="Label" />,
      )
      const bar = view.getByRole('progressbar', { name: 'Label' })
      expect(bar.querySelectorAll('[class]')).not.toHaveLength(0)
      expect(bar.textContent).toBe('Label')
    })
  })

  describe('motion', () => {
    // Material Web's indeterminate line is two bars, each translated and
    // scaled at once over 2s; a determinate one only moves when its value
    // does.
    it('animates only while indeterminate', () => {
      const still = setup()
      expect(
        getComputedStyle(linearPartsOf(still.bar).active).animationName,
      ).toBe('none')
      still.unmount()

      const moving = render(<ProgressIndicator isIndeterminate label="Label" />)
      const row = moving.getByRole('progressbar', {
        name: 'Label',
      }).lastElementChild
      const [, primary, secondary] = [...(row?.children ?? [])]
      if (
        !(primary instanceof HTMLElement) ||
        !(secondary instanceof HTMLElement)
      ) {
        throw new Error('expected the two bars')
      }

      for (const bar of [primary, secondary]) {
        expect(getComputedStyle(bar).animationName).not.toBe('none')
        expect(getComputedStyle(bar).animationDuration).toBe('2s')
        const inner = bar.firstElementChild
        if (!(inner instanceof HTMLElement)) {
          throw new Error('expected each bar to hold its inner bar')
        }
        expect(getComputedStyle(inner).animationName).not.toBe('none')
        // The page draws every part of the line as a pill, and the bars of
        // the indeterminate one are no exception.
        expect(getComputedStyle(inner).borderTopLeftRadius).not.toBe('0px')
      }
    })

    // The sweep has to travel the way the text does. Material's keyframes
    // translate one way only, so the bars are placed and moved in physical
    // terms and the row is mirrored instead — which means the bars start at
    // the same offset in both directions, and the row alone knows about the
    // writing mode. `:dir()` is an ordinary pseudo-class, so a wrapper with
    // `dir` is all it takes to read both.
    it('sweeps in the writing direction', () => {
      // One indicator in each direction, since the row's mirror is the thing
      // the two differ in.
      const view = render(
        <>
          <ProgressIndicator isIndeterminate label="Left to right" />
          <div dir="rtl">
            <ProgressIndicator isIndeterminate label="Right to left" />
          </div>
        </>,
      )
      const rowOf = (name: string) => {
        const row = view.getByRole('progressbar', { name }).lastElementChild
        if (!(row instanceof HTMLElement)) {
          throw new Error('expected the indicator to draw its row')
        }
        return row
      }
      const row = rowOf('Right to left')
      const bar = row.children[1]
      if (!(bar instanceof HTMLElement)) {
        throw new Error('expected the row to hold its primary bar')
      }

      // The row carries the mirror, so the sweep turns over as a whole.
      expect(getComputedStyle(rowOf('Left to right')).transform).toBe('none')
      expect(getComputedStyle(row).transform).toBe('matrix(-1, 0, 0, 1, 0, 0)')

      // And the bar's start is physical, so it does not flip underneath that
      // mirror and cancel it out. A logical inset would resolve to the right
      // edge here, leaving `left` as `auto`, while Material's keyframes kept
      // translating the one way they know — away from the row to be crossed.
      expect(getComputedStyle(bar).left.startsWith('-')).toBe(true)
    })
  })

  describe('wavy', () => {
    it('draws no wave in the flat shape', () => {
      const { bar } = setup()
      expect(bar.querySelector('path')).toBeNull()
    })

    // The page's wavy line is 10 tall, the wave's 3 either side of the
    // middle plus its stroke, with the flat track through the middle.
    it('draws a wave over the line in a 10 tall row', () => {
      const { bar } = setup({ shape: 'wavy' })
      const { line, path, row, svg } = wavyLineOf(bar)

      expect(row.getBoundingClientRect().height).toBe(10)
      expect(line.getBoundingClientRect().height).toBe(4)
      expect(svg.getAttribute('aria-hidden')).toBe('true')
      expect(path.getAttribute('stroke-width')).toBe('4')
      expect(path.getBBox().height).toBeCloseTo(6, 0)
      expect(hasClasses(path, CLASSES.activeArc)).toBe(true)
    })

    // A crest every 40, and long enough to cross any row it draws in.
    it("runs the wave far enough at the page's wavelength", () => {
      const { bar } = setup({ shape: 'wavy' })
      const { path } = wavyLineOf(bar)
      const box = path.getBBox()

      expect(box.width).toBeGreaterThanOrEqual(2048)
      expect(path.getPointAtLength(0).y).toBeCloseTo(5, 1)
      // Every half wavelength along, the wave is back at the middle.
      const crossings = [20, 40, 60].map((x) => {
        const length = path.getTotalLength() * (x / box.width)
        return path.getPointAtLength(length).y
      })
      for (const y of crossings) {
        expect(y).toBeCloseTo(5, 0)
      }
    })

    // The wave stands in for the flat active indicator, so it is cut to
    // the same length, less the half stroke each round cap adds.
    it("cuts the wave to the active indicator's length", () => {
      const { bar } = setup({ shape: 'wavy', value: 50 })
      const { active, path } = wavyLineOf(bar)
      const dash = Number.parseFloat(getComputedStyle(path).strokeDasharray)

      expect(dash).toBeCloseTo(active.getBoundingClientRect().width - 4, 0)
    })

    // Material's rule: the wave stands between a tenth of the way and 95%,
    // and the flat active indicator is drawn either side of that.
    it.each([
      [5, false],
      [10, false],
      [11, true],
      [50, true],
      [94, true],
      [95, false],
      [100, false],
    ])('at %i, the wave stands: %s', (value, standing) => {
      const { bar } = setup({ shape: 'wavy', value })
      const { active, path } = wavyLineOf(bar)

      expect(getComputedStyle(path).opacity).toBe(standing ? '1' : '0')
      expect(getComputedStyle(active).opacity).toBe(standing ? '0' : '1')
    })

    // A reader who has asked for reduced motion sees the flat shape: the
    // wave goes, and the flat active indicator beneath it comes back.
    it('draws the line flat under reduced motion', () => {
      const { bar } = setup({ shape: 'wavy', value: 50 })
      const { active, svg } = wavyLineOf(bar)

      // Read off the page at rest, since the walk would count the rule for
      // a row wider than the wave as holding too.
      expect(getComputedStyle(svg).display).toBe('block')
      expect(getComputedStyle(active).opacity).toBe('0')
      expect(declarationsHeld(svg, REDUCED_MOTION).get('display')).toBe('none')
      expect(declarationsHeld(active, REDUCED_MOTION).get('opacity')).toBe('1')
    })

    it('draws a line wider than the wave flat', () => {
      const view = render(
        <div {...stylex.props(probeStyles.wide)}>
          <ProgressIndicator label="Label" shape="wavy" value={50} />
        </div>,
      )
      const bar = view.getByRole('progressbar', { name: 'Label' })
      const { active, svg } = wavyLineOf(bar)

      expect(getComputedStyle(svg).display).toBe('none')
      expect(getComputedStyle(active).opacity).toBe('1')
    })

    // The indeterminate line's two bars become two dashes along a wave of
    // half the wavelength, moved by the bars' own keyframes.
    it('sweeps two dashes along a wave while indeterminate', () => {
      const view = render(
        <ProgressIndicator isIndeterminate label="Label" shape="wavy" />,
      )
      const row = view.getByRole('progressbar', {
        name: 'Label',
      }).lastElementChild
      const [bars, svg] = [...(row?.children ?? [])]
      if (!(bars instanceof HTMLElement) || !(svg instanceof SVGElement)) {
        throw new Error('expected the flat bars and the waves over them')
      }
      const waves = [...svg.children].filter(
        (wave) => wave instanceof SVGPathElement,
      )

      expect(waves).toHaveLength(2)
      for (const wave of waves) {
        const style = getComputedStyle(wave)
        expect(style.animationName.split(',')).toHaveLength(2)
        expect(style.animationDuration).toBe('2s, 2s')
      }
      // Two crests where the determinate wave has one: half its wavelength
      // along, the wave is back at the middle.
      const first = waves.at(0)
      if (first === undefined) {
        throw new Error('expected the primary wave')
      }
      const midway = first.getPointAtLength(
        first.getTotalLength() * (10 / first.getBBox().width),
      )
      expect(midway.y).toBeCloseTo(5, 0)

      // The flat bars are what reduced motion draws instead.
      const [, primary, secondary] = [...bars.children]
      for (const bar of [primary, secondary]) {
        if (!(bar instanceof HTMLElement)) {
          throw new Error('expected the two flat bars')
        }
        expect(getComputedStyle(bar).opacity).toBe('0')
        expect(declarationsHeld(bar, REDUCED_MOTION).get('opacity')).toBe('1')
      }
      expect(declarationsHeld(svg, REDUCED_MOTION).get('display')).toBe('none')
    })

    it('mirrors the wave under a right-to-left writing mode', () => {
      const view = render(
        <div dir="rtl">
          <ProgressIndicator label="Label" shape="wavy" value={50} />
        </div>,
      )
      const { svg } = wavyLineOf(
        view.getByRole('progressbar', { name: 'Label' }),
      )

      expect(getComputedStyle(svg).transform).toBe('matrix(-1, 0, 0, 1, 0, 0)')
    })

    // The page's wavy ring is 48 across, with the wave's 1.6 either side of
    // a circle pulled in by that much so the crests stay inside the box.
    it('draws a 48 ring with a wave over the active arc', () => {
      const { bar } = setup({ shape: 'wavy', value: 50, variant: 'circular' })
      const svg = bar.querySelector('svg')
      const [track, active, wave] = [...(svg?.children ?? [])]
      if (
        !(svg instanceof SVGSVGElement) ||
        !(track instanceof SVGCircleElement) ||
        !(active instanceof SVGCircleElement) ||
        !(wave instanceof SVGPathElement)
      ) {
        throw new Error('expected the track, the active arc and the wave')
      }

      expect(svg.getBoundingClientRect().width).toBe(48)
      expect(svg.getAttribute('viewBox')).toBe('0 0 48 48')
      expect(track.getAttribute('r')).toBe('20.4')
      // Measured as the circle it runs round, and cut by the same dash.
      const circumference = 2 * Math.PI * 20.4
      expect(Number(wave.getAttribute('pathLength'))).toBeCloseTo(
        circumference,
        3,
      )
      expect(wave.getAttribute('stroke-dasharray')).toBe(
        active.getAttribute('stroke-dasharray'),
      )
      // Nine crests, each 1.6 out from the circle, and nine troughs 1.6 in.
      const total = wave.getTotalLength()
      const radii = Array.from({ length: 720 }, (_, index) => {
        const point = wave.getPointAtLength((total * index) / 720)
        return Math.hypot(point.x - 24, point.y - 24)
      })
      expect(Math.max(...radii)).toBeCloseTo(22, 1)
      expect(Math.min(...radii)).toBeCloseTo(18.8, 1)
      const crests = radii.filter(
        (radius, index) =>
          radius > 21.9 &&
          radius >= (radii.at(index - 1) ?? 0) &&
          radius > (radii[(index + 1) % radii.length] ?? 0),
      )
      expect(crests).toHaveLength(9)
      expect(getComputedStyle(wave).opacity).toBe('1')
      expect(declarationsHeld(wave, REDUCED_MOTION).get('display')).toBe('none')
      expect(reducedMotionOf(active, 'opacity')).toEqual({
        reduced: '1',
        resting: '0',
      })
    })

    it('keeps the ring at the diameter it is given', () => {
      const { bar } = setup({
        diameter: '24px',
        shape: 'wavy',
        variant: 'circular',
      })
      expect(bar.querySelector('svg')?.getBoundingClientRect().width).toBe(24)
    })

    it('turns the wave round the ring while indeterminate', () => {
      const view = render(
        <ProgressIndicator
          isIndeterminate
          label="Label"
          shape="wavy"
          variant="circular"
        />,
      )
      const svg = view
        .getByRole('progressbar', { name: 'Label' })
        .querySelector('svg')
      const [arc, wave] = [...(svg?.children ?? [])]
      if (!(arc instanceof SVGElement) || !(wave instanceof SVGElement)) {
        throw new Error('expected the flat arc and the wave')
      }

      expect(wave.getAttribute('pathLength')).toBe('100')
      expect(getComputedStyle(wave).animationName).toBe(
        getComputedStyle(arc).animationName,
      )
      expect(declarationsHeld(arc, REDUCED_MOTION).get('opacity')).toBe('1')
      expect(getComputedStyle(arc).opacity).toBe('0')
    })
  })
})
