import * as stylex from '@stylexjs/stylex'
import { act, fireEvent, render } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import SegmentedButton from '.'
import { colors, stateLayerOpacity } from '../../tokens/design.tokens.stylex'

// StyleX hashes an atomic class from the property and value, so the same
// declaration written here produces the same class the component produces.
// Asserting on class membership pins which role each part reaches for without
// depending on the browser having applied a rule these tests are the first
// thing to use — see chip/index.test.tsx for the flake behind this.
const probeStyles = stylex.create({
  disabledContainer: {
    backgroundColor: `color-mix(in srgb, ${colors.onSurface} calc(${stateLayerOpacity.disabledContainer} * 100%), ${colors.surface})`,
  },
  disabledContent: {
    color: `color-mix(in srgb, ${colors.onSurface} calc(${stateLayerOpacity.disabledContent} * 100%), ${colors.surface})`,
  },
  selected: { color: colors.onSecondaryContainer },
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
  disabledContainer: classesOf(stylex.props(probeStyles.disabledContainer)),
  disabledContent: classesOf(stylex.props(probeStyles.disabledContent)),
  selected: classesOf(stylex.props(probeStyles.selected)),
  unselected: classesOf(stylex.props(probeStyles.unselected)),
}

const FIRST = ['first']
const SECOND = ['second']
const FIRST_AND_THIRD = ['first', 'third']

const ICON = <svg aria-hidden="true" data-testid="icon" viewBox="0 0 24 24" />

function hasClasses(element: Element, classes: string[]) {
  return classes.every((name) => element.classList.contains(name))
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

      expect(hasClasses(first as Element, CLASSES.disabledContent)).toBe(true)
      expect(hasClasses(first as Element, CLASSES.disabledContainer)).toBe(true)
      expect(hasClasses(second as Element, CLASSES.disabledContainer)).toBe(
        false,
      )
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
})
