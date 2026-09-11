import * as stylex from '@stylexjs/stylex'
import { act, fireEvent, render, waitFor } from '@testing-library/react'
import { cdp } from '@vitest/browser/context'
import { afterEach, describe, expect, it, vi } from 'vitest'

import SegmentedButton from '.'
import { colors, stateLayerOpacity } from '../../tokens/design.tokens.stylex'

// StyleX hashes an atomic class from the property and value, so the same
// declaration written here produces the same class the component produces.
// Asserting on class membership pins which role each part reaches for without
// depending on the browser having applied a rule these tests are the first
// thing to use — see chip/index.test.tsx for the flake behind this.
const probeStyles = stylex.create({
  chosenContainer: { backgroundColor: colors.secondaryContainer },
  disabledContainer: {
    backgroundColor: `color-mix(in srgb, ${colors.onSurface} calc(${stateLayerOpacity.disabledContainer} * 100%), ${colors.surface})`,
  },
  disabledContent: {
    color: `color-mix(in srgb, ${colors.onSurface} calc(${stateLayerOpacity.disabledContent} * 100%), ${colors.surface})`,
  },
  focusLayer: { opacity: stateLayerOpacity.focus },
  hidden: { opacity: 0 },
  hoverLayer: { opacity: stateLayerOpacity.hover },
  pressedLayer: { opacity: stateLayerOpacity.pressed },
  selected: { color: colors.onSecondaryContainer },
  stateLayer: { backgroundColor: 'currentColor' },
  unselected: { color: colors.onSurface },
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
  chosenContainer: classesOf(stylex.props(probeStyles.chosenContainer)),
  disabledContainer: classesOf(stylex.props(probeStyles.disabledContainer)),
  disabledContent: classesOf(stylex.props(probeStyles.disabledContent)),
  focusLayer: classesOf(stylex.props(probeStyles.focusLayer)),
  hidden: classesOf(stylex.props(probeStyles.hidden)),
  hoverLayer: classesOf(stylex.props(probeStyles.hoverLayer)),
  pressedLayer: classesOf(stylex.props(probeStyles.pressedLayer)),
  selected: classesOf(stylex.props(probeStyles.selected)),
  stateLayer: classesOf(stylex.props(probeStyles.stateLayer)),
  unselected: classesOf(stylex.props(probeStyles.unselected)),
}

const FIRST = ['first']
const SECOND = ['second']
const THIRD = ['third']
const FIRST_AND_THIRD = ['first', 'third']

const ICON = <svg aria-hidden="true" data-testid="icon" viewBox="0 0 24 24" />

// The chosen container is an element React Aria renders inside the chosen
// segment alone, so an unchosen segment has none at all. It is the segment's
// only child element that is a div — the state layer, the glyph, the label
// and the ripple are all spans.
//
// Throws rather than returning null, so its callers read straight through;
// `hasContainer` is the one for asking whether a segment has one.
function containerOf(segment: Element) {
  const found = segment.querySelector(':scope > div')
  if (!(found instanceof HTMLElement)) {
    throw new Error('expected the segment to carry a chosen container')
  }
  return found
}

// Every container the track is drawing, which is two while one is sliding.
function containersIn(view: ReturnType<typeof setup>) {
  return [...view.container.querySelectorAll('button > div')]
}

function hasClasses(element: Element, classes: string[]) {
  return classes.every((name) => element.classList.contains(name))
}

function hasContainer(segment: Element) {
  return segment.querySelector(':scope > div') !== null
}

// The state layer, above the container and below the label. `currentColor`
// is what nothing else in the segment is painted with.
function layerOf(segment: Element) {
  const found = [...segment.children].find((child) =>
    hasClasses(child, CLASSES.stateLayer),
  )
  if (!(found instanceof HTMLElement)) {
    throw new Error('expected the segment to carry a state layer')
  }
  return found
}

// Chromium's own media emulation, which is the only way to put the page in
// the state a reduced-motion reader is in — nothing in the suite sets it,
// and `matchMedia` cannot be written to. See tabs/index.test.tsx, where the
// same helper first appeared.
async function reducedMotion(value: 'no-preference' | 'reduce') {
  // Vitest declares `CDPSession` as an empty interface, so the method it
  // does have at runtime is not on the type. Narrowed to the one call this
  // needs rather than left as `any`.
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- CDPSession is an empty upstream stub
  const session = cdp() as unknown as {
    send: (
      method: string,
      params: { features: { name: string; value: string }[] },
    ) => Promise<unknown>
  }
  await session.send('Emulation.setEmulatedMedia', {
    features: [{ name: 'prefers-reduced-motion', value }],
  })
}

function setup(
  props: Partial<Parameters<typeof SegmentedButton>[0]> = {},
  children?: Parameters<typeof SegmentedButton>[0]['children'],
) {
  return render(
    <SegmentedButton aria-label="Label" {...props}>
      {children ?? (
        <>
          <SegmentedButton.Segment id="first">
            First item
          </SegmentedButton.Segment>
          <SegmentedButton.Segment id="second">
            Second item
          </SegmentedButton.Segment>
          <SegmentedButton.Segment id="third">
            Third item
          </SegmentedButton.Segment>
        </>
      )}
    </SegmentedButton>,
  )
}

describe('segmented button', () => {
  // The emulation is the page's, not the render's, so it outlives the test
  // that set it unless this puts it back.
  afterEach(async () => {
    await reducedMotion('no-preference')
  })

  // React Aria maps the selection mode onto two different sets of roles, and
  // both are the right ones: one of several is a radio group, any of several
  // is a toolbar of two-state buttons. Pinned here because the mapping is
  // what a screen reader announces, and it is not visible in the styles.
  describe('semantics', () => {
    it('is a radio group of radios while one is chosen', () => {
      const view = setup({ defaultSelectedKeys: SECOND })
      expect(view.getByRole('radiogroup', { name: 'Label' })).not.toBeNull()

      const radios = view.getAllByRole('radio')
      expect(radios).toHaveLength(3)
      expect(radios[1].getAttribute('aria-checked')).toBe('true')
      expect(radios[0].getAttribute('aria-checked')).toBe('false')
    })

    it('is a toolbar of two-state buttons while several may be', () => {
      const view = setup({
        defaultSelectedKeys: FIRST_AND_THIRD,
        selectionMode: 'multiple',
      })
      expect(view.getByRole('toolbar', { name: 'Label' })).not.toBeNull()

      const buttons = view.getAllByRole('button')
      expect(buttons).toHaveLength(3)
      expect(buttons[0].getAttribute('aria-pressed')).toBe('true')
      expect(buttons[1].getAttribute('aria-pressed')).toBe('false')
    })

    it('names each segment by its label', () => {
      const view = setup()
      expect(view.getByRole('radio', { name: 'First item' })).not.toBeNull()
    })

    it('reports a disabled segment as one', () => {
      const view = setup(
        {},
        <>
          <SegmentedButton.Segment id="first">
            First item
          </SegmentedButton.Segment>
          <SegmentedButton.Segment id="second" isDisabled>
            Second item
          </SegmentedButton.Segment>
        </>,
      )
      expect(view.getAllByRole('radio')[1].hasAttribute('disabled')).toBe(true)
    })
  })

  describe('selection', () => {
    it('keeps its own from defaultSelectedKeys', () => {
      const view = setup({ defaultSelectedKeys: SECOND })
      expect(view.getAllByRole('radio')[1].getAttribute('aria-checked')).toBe(
        'true',
      )
    })

    it('chooses the segment that is pressed', () => {
      const view = setup({ defaultSelectedKeys: FIRST })
      const [first, second] = view.getAllByRole('radio')

      fireEvent.click(second)

      expect(second.getAttribute('aria-checked')).toBe('true')
      expect(first.getAttribute('aria-checked')).toBe('false')
    })

    it('replaces rather than adds while one is chosen', () => {
      const view = setup({ defaultSelectedKeys: FIRST })
      const radios = view.getAllByRole('radio')

      fireEvent.click(radios[1])
      fireEvent.click(radios[2])

      expect(
        radios.map((radio) => radio.getAttribute('aria-checked')),
      ).toStrictEqual(['false', 'false', 'true'])
    })

    it('adds rather than replaces while several may be', () => {
      const view = setup({
        defaultSelectedKeys: FIRST,
        selectionMode: 'multiple',
      })
      const buttons = view.getAllByRole('button')

      fireEvent.click(buttons[1])

      expect(
        buttons.map((button) => button.getAttribute('aria-pressed')),
      ).toStrictEqual(['true', 'true', 'false'])
    })

    it('does not choose on its own when controlled', () => {
      const onSelectionChange = vi.fn<(keys: unknown) => void>()
      const view = setup({ onSelectionChange, selectedKeys: FIRST })
      const [first, second] = view.getAllByRole('radio')

      fireEvent.click(second)

      expect(onSelectionChange).toHaveBeenCalledTimes(1)
      expect(first.getAttribute('aria-checked')).toBe('true')
      expect(second.getAttribute('aria-checked')).toBe('false')
    })
  })

  describe('keyboard', () => {
    it('moves between segments with the arrow keys', () => {
      const view = setup({ defaultSelectedKeys: FIRST })
      const [first, second] = view.getAllByRole('radio')

      act(() => {
        first.focus()
      })
      fireEvent.keyDown(first, { key: 'ArrowRight' })
      fireEvent.keyUp(first, { key: 'ArrowRight' })

      expect(document.activeElement).toBe(second)
    })
  })

  describe('the check', () => {
    // The page draws it in the icon slot, so a segment with an icon of its
    // own shows the icon until it is chosen and the check after.
    it('is drawn on the chosen segment alone', () => {
      const view = setup({ defaultSelectedKeys: SECOND })
      const svgs = view.container.querySelectorAll('button > span > svg')
      expect(svgs).toHaveLength(1)
      expect(
        view.getAllByRole('radio')[1].querySelector('span > svg'),
      ).not.toBeNull()
    })

    it('is left out when the set turns it off', () => {
      const view = setup({
        defaultSelectedKeys: SECOND,
        showSelectedIcon: false,
      })
      expect(
        view.container.querySelectorAll('button > span > svg'),
      ).toHaveLength(0)
    })

    it('replaces the segment icon while chosen, and not before', () => {
      const view = setup(
        { defaultSelectedKeys: FIRST },
        <>
          <SegmentedButton.Segment icon={ICON} id="first">
            First item
          </SegmentedButton.Segment>
          <SegmentedButton.Segment icon={ICON} id="second">
            Second item
          </SegmentedButton.Segment>
        </>,
      )
      const [first, second] = view.getAllByRole('radio')

      expect(first.querySelector('[data-testid="icon"]')).toBeNull()
      expect(second.querySelector('[data-testid="icon"]')).not.toBeNull()
    })

    it('leaves a segment icon alone when the set turns it off', () => {
      const view = setup(
        { defaultSelectedKeys: FIRST, showSelectedIcon: false },
        <SegmentedButton.Segment icon={ICON} id="first">
          First item
        </SegmentedButton.Segment>,
      )
      expect(
        view.getByRole('radio').querySelector('[data-testid="icon"]'),
      ).not.toBeNull()
    })
  })

  describe('the ripple', () => {
    it('renders a surface to grow in', () => {
      const view = setup()
      expect(
        view.container.querySelector('span[aria-hidden="true"]'),
      ).not.toBeNull()
    })

    it('renders none when the segment turns it off', () => {
      const view = setup(
        {},
        <SegmentedButton.Segment disableRipple id="first">
          First item
        </SegmentedButton.Segment>,
      )
      expect(
        view.container.querySelector('span[aria-hidden="true"]'),
      ).toBeNull()
    })

    it('renders none while the segment is disabled', () => {
      const view = setup(
        {},
        <SegmentedButton.Segment id="first" isDisabled>
          First item
        </SegmentedButton.Segment>,
      )
      expect(
        view.container.querySelector('span[aria-hidden="true"]'),
      ).toBeNull()
    })
  })

  describe('appearance', () => {
    it('draws the chosen segment in the selected roles', () => {
      const view = setup({ defaultSelectedKeys: SECOND })
      const [first, second] = view.getAllByRole('radio')

      expect(hasClasses(second as Element, CLASSES.selected)).toBe(true)
      expect(hasClasses(first as Element, CLASSES.unselected)).toBe(true)
    })

    it('fades a disabled segment and keeps its chosen container', () => {
      const view = setup({ defaultSelectedKeys: FIRST, isDisabled: true })
      const [first, second] = view.getAllByRole('radio')
      const container = containerOf(first)

      expect(hasClasses(first as Element, CLASSES.disabledContent)).toBe(true)
      expect(hasClasses(container, CLASSES.disabledContainer)).toBe(true)
      // The chosen role would read as enabled, so it has to be gone rather
      // than merely covered.
      expect(hasClasses(container, CLASSES.chosenContainer)).toBe(false)
      expect(hasContainer(second)).toBe(false)
    })

    // The page's track: 40dp tall, a 1dp outline, and the outer ends fully
    // rounded with the inner joins square.
    it('draws the page container height', () => {
      const view = setup()
      expect(getComputedStyle(view.getAllByRole('radio')[0]).blockSize).toBe(
        '40px',
      )
    })

    it('rounds the outer ends and squares the joins', () => {
      const view = setup()
      const [first, second, third] = view
        .getAllByRole('radio')
        .map((segment) => getComputedStyle(segment))

      expect(first.borderStartStartRadius).toBe('9999px')
      expect(first.borderStartEndRadius).toBe('0px')
      expect(second.borderStartStartRadius).toBe('0px')
      expect(second.borderStartEndRadius).toBe('0px')
      expect(third.borderStartStartRadius).toBe('0px')
      expect(third.borderStartEndRadius).toBe('9999px')
    })

    // Two neighbours share one rule rather than drawing two against each
    // other, which is what makes the track read as one outline.
    it('drops the leading edge on every segment after the first', () => {
      const view = setup()
      const widths = view
        .getAllByRole('radio')
        .map((segment) => getComputedStyle(segment).borderInlineStartWidth)

      expect(widths).toStrictEqual(['1px', '0px', '0px'])
    })

    // The page gives the segment width as the container's over their number,
    // so a long label widens every segment rather than only its own.
    it('draws every segment the same width', () => {
      const view = setup(
        {},
        <>
          <SegmentedButton.Segment id="first">A</SegmentedButton.Segment>
          <SegmentedButton.Segment id="second">
            A much longer label
          </SegmentedButton.Segment>
          <SegmentedButton.Segment id="third">B</SegmentedButton.Segment>
        </>,
      )
      const widths = view
        .getAllByRole('radio')
        .map((segment) => segment.getBoundingClientRect().width)

      expect(widths[0]).toBeGreaterThan(0)
      expect(widths[1]).toBeCloseTo(widths[0], 1)
      expect(widths[2]).toBeCloseTo(widths[0], 1)
    })
  })

  // The chosen container is drawn as an element of its own rather than as
  // the segment's background, which is what lets it move between segments.
  // The component's comment says why the two selection modes move it
  // differently.
  describe('the chosen container', () => {
    it('draws it in the chosen segment alone, filling it inside the outline', () => {
      const view = setup({ defaultSelectedKeys: FIRST })
      const [first, second] = view.getAllByRole('radio')
      const container = containerOf(first)

      expect(hasContainer(second)).toBe(false)
      expect(hasClasses(container, CLASSES.chosenContainer)).toBe(true)

      // Inside the 1dp outline rather than under it, so the track's rule
      // stays where it is and only the fill travels.
      const box = container.getBoundingClientRect()
      const segment = first.getBoundingClientRect()
      expect(box.height).toBeCloseTo(segment.height - 2, 0)
      expect(box.width).toBeCloseTo(segment.width - 2, 0)
    })

    // Nothing in the segment carries a `zIndex`, so the order the children
    // are written in is the order they are drawn.
    it('draws it under the state layer, and the ripple over both', () => {
      const view = setup({ defaultSelectedKeys: FIRST })
      const first = view.getAllByRole('radio')[0]
      const children = [...first.children]

      expect(children.indexOf(containerOf(first))).toBe(0)
      expect(children.indexOf(layerOf(first))).toBe(1)
      expect(children.at(-1)?.getAttribute('aria-hidden')).toBe('true')
    })

    // The ends of the track are round and the joins square, so a container
    // carries the shape of whichever segment it is in. The value is the
    // token taken down to what the browser draws it at, since the token's
    // own 9999px is clamped and a clamped value cannot be interpolated.
    it('takes the corners of the segment it is in', () => {
      const cornersFor = (keys: string[], index: number) => {
        const view = setup({ defaultSelectedKeys: keys })
        const style = getComputedStyle(
          containerOf(view.getAllByRole('radio')[index]),
        )
        const corners = [
          style.borderStartStartRadius,
          style.borderStartEndRadius,
        ]
        view.unmount()
        return corners
      }

      expect(cornersFor(FIRST, 0)).toStrictEqual(['20px', '0px'])
      expect(cornersFor(SECOND, 1)).toStrictEqual(['0px', '0px'])
      expect(cornersFor(THIRD, 2)).toStrictEqual(['0px', '20px'])
    })

    // What makes it a slide rather than a switch: React Aria puts the
    // arriving container where the departing one was — an inline translate
    // of the gap between them, and the departing one's corners with it — and
    // takes both off a frame later so the transition carries it home. For as
    // long as it is moving, two containers exist.
    it('slides from one segment to the next while one is chosen', async () => {
      const view = setup({ defaultSelectedKeys: FIRST })
      const [first, second] = view.getAllByRole('radio')

      expect(containersIn(view)).toHaveLength(1)

      fireEvent.click(second)

      const arriving = containerOf(second)
      const offset = Number.parseFloat(arriving.style.translate)
      // Finite first: an unset `translate` parses to NaN, and NaN is not 0,
      // so the plain inequality passes on a container that never moved.
      expect(Number.isFinite(offset)).toBe(true)
      expect(offset).not.toBe(0)
      // The first segment's rounded end, replayed on a container whose own
      // corners are square: the shape is animated as well as the place.
      expect(arriving.style.borderRadius).toContain('20px')
      expect(containersIn(view)).toHaveLength(2)

      await waitFor(() => {
        expect(containersIn(view)).toHaveLength(1)
      })
      expect(hasContainer(second)).toBe(true)
      expect(hasContainer(first)).toBe(false)
    })

    // The line that makes it slide, and the one most easily lost: React
    // Aria's shared element snapshots only the properties a transition
    // names, and reads `none` as an element that does not animate. Without
    // it the container still draws in the right place and never moves.
    it('names the properties it slides on, which is what animates it', () => {
      const view = setup({ defaultSelectedKeys: FIRST })
      const style = getComputedStyle(containerOf(view.getAllByRole('radio')[0]))

      expect(style.transitionProperty).toContain('translate')
      expect(style.transitionProperty).toContain('border-radius')
      expect(style.transitionDuration).not.toBe('0s')
    })

    // A shared element is one element, and with several chosen there is no
    // single segment for it to be at. Naming `opacity` alone is what keeps
    // each container where it is: with nothing positional snapshotted there
    // is no position for the next one to arrive from.
    it('stays where it is while several may be chosen', () => {
      const view = setup({
        defaultSelectedKeys: FIRST,
        selectionMode: 'multiple',
      })
      const [first, second] = view.getAllByRole('button')
      const style = getComputedStyle(containerOf(first))

      expect(style.transitionProperty).toBe('opacity')
      expect(style.transitionDuration).not.toBe('0s')

      fireEvent.click(second)

      const arriving = containerOf(second)
      expect(arriving.style.translate).toBe('')
      expect(arriving.style.borderRadius).toBe('')
      // The container already chosen is left alone, which is the difference
      // from the sliding mode — there the two segments are one change.
      expect(hasContainer(first)).toBe(true)
      expect(containersIn(view)).toHaveLength(2)
    })

    it('fades a newly chosen container in where it is', async () => {
      const view = setup({
        defaultSelectedKeys: FIRST,
        selectionMode: 'multiple',
      })
      const second = view.getAllByRole('button')[1]
      // React Aria marks the entering state in a microtask and clears it on
      // the next frame, so the frame is held to look at the state at all.
      const frames = vi
        .spyOn(window, 'requestAnimationFrame')
        .mockReturnValue(0)

      try {
        fireEvent.click(second)
        await act(async () => {
          await Promise.resolve()
        })

        const arriving = containerOf(second)
        expect(arriving.hasAttribute('data-entering')).toBe(true)
        expect(hasClasses(arriving, CLASSES.hidden)).toBe(true)
      } finally {
        frames.mockRestore()
      }
    })

    // Dropping the transition would take the snapshot with it, and the
    // container would stop being positioned correctly — a worse outcome than
    // the motion it was meant to avoid.
    it('stops sliding for a reader who asked for less motion', async () => {
      await reducedMotion('reduce')
      const view = setup({ defaultSelectedKeys: FIRST })
      const style = getComputedStyle(containerOf(view.getAllByRole('radio')[0]))

      expect(style.transitionDuration).toBe('0s')
      expect(style.transitionProperty).toContain('translate')
    })
  })

  // The state layers sit on a layer of their own above the container, since
  // one mixed into a container that slides away would take the hover off the
  // segment under the pointer. The layer is `currentColor` at the state's
  // opacity, and the segment's own label colour is already the right role in
  // every state.
  describe('the state layers', () => {
    // React derives `onPointerEnter` from the bubbling `pointerover`, which
    // is what React Aria's hover tracking listens for.
    it('lays the chosen segment over while hovered', () => {
      const view = setup({ defaultSelectedKeys: FIRST })
      const first = view.getAllByRole('radio')[0]
      const layer = layerOf(first)

      expect(hasClasses(layer, CLASSES.hoverLayer)).toBe(false)

      act(() => {
        fireEvent.pointerOver(first, { pointerType: 'mouse' })
      })
      expect(hasClasses(layer, CLASSES.hoverLayer)).toBe(true)
      expect(hasClasses(first, CLASSES.selected)).toBe(true)

      act(() => {
        fireEvent.pointerOut(first, { pointerType: 'mouse' })
      })
      expect(hasClasses(layer, CLASSES.hoverLayer)).toBe(false)
    })

    it('lays an unchosen segment over the same way', () => {
      const view = setup({ defaultSelectedKeys: FIRST })
      const second = view.getAllByRole('radio')[1]

      act(() => {
        fireEvent.pointerOver(second, { pointerType: 'mouse' })
      })
      expect(hasClasses(layerOf(second), CLASSES.hoverLayer)).toBe(true)
      expect(hasClasses(second, CLASSES.unselected)).toBe(true)
    })

    // The press layer is drawn over the hover one, which is the order the
    // three are applied in.
    it('takes the press opacity over the hover one', () => {
      const view = setup({ defaultSelectedKeys: FIRST })
      const first = view.getAllByRole('radio')[0]
      const layer = layerOf(first)

      act(() => {
        fireEvent.pointerOver(first, { pointerType: 'mouse' })
        fireEvent.pointerDown(first, { button: 0, pointerId: 1 })
      })
      expect(hasClasses(layer, CLASSES.pressedLayer)).toBe(true)
      expect(hasClasses(layer, CLASSES.hoverLayer)).toBe(false)
    })

    it('lays the segment over while focused from the keyboard', () => {
      const view = setup({ defaultSelectedKeys: FIRST })
      const [first, second] = view.getAllByRole('radio')

      expect(hasClasses(layerOf(second), CLASSES.focusLayer)).toBe(false)

      // Focus becomes visible off a keyboard interaction, which is what the
      // arrow key is here for as much as the move it makes.
      act(() => {
        first.focus()
      })
      fireEvent.keyDown(first, { key: 'ArrowRight' })
      fireEvent.keyUp(first, { key: 'ArrowRight' })

      expect(second.getAttribute('data-focus-visible')).toBe('true')
      expect(hasClasses(layerOf(second), CLASSES.focusLayer)).toBe(true)
      expect(hasClasses(layerOf(first), CLASSES.focusLayer)).toBe(false)
    })

    // React Aria reports none of the three for a control that cannot be
    // pressed, which is what leaves the layer inert without a rule of its
    // own — where a `:hover` would have matched a disabled segment.
    it('shows none while the segment is disabled', () => {
      const view = setup({ defaultSelectedKeys: FIRST, isDisabled: true })
      const first = view.getAllByRole('radio')[0]

      act(() => {
        fireEvent.pointerOver(first, { pointerType: 'mouse' })
      })
      expect(hasClasses(layerOf(first), CLASSES.hoverLayer)).toBe(false)
    })
  })
})
