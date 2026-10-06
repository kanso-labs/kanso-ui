import * as stylex from '@stylexjs/stylex'
import { act, fireEvent, render, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import type { CarouselProps } from '.'

import Carousel from '.'
import {
  declarationsHeld,
  reducedMotionOf,
  rulesReaching,
  valueIn,
} from '../../styles/stylesheet.testing'

// A carousel 512 wide: a content box of 480 inside its 16dp padding, which
// at the default 240 holds one large item, a medium one of 168 and a small
// one of 56, one rest every 248.
const probeStyles = stylex.create({
  frame: { inlineSize: '512px' },
})

const LABELS = [
  'First item',
  'Second item',
  'Third item',
  'Fourth item',
  'Fifth item',
  'Sixth item',
]

const STEP = 248

// Where an item is drawn: its box with its mask taken off both sides.
function drawn(item: Element) {
  const box = item.getBoundingClientRect()
  const inset = Number(
    /inset\(0px ([\d.]+)px/u.exec(getComputedStyle(item).clipPath)?.[1] ?? 0,
  )
  return { left: box.left + inset, right: box.right - inset }
}

// Focus moving into an element, and the frames that carry what the browser
// and the carousel each scroll to on it, so a read sees where the carousel
// comes to rest rather than a scroll on its way there.
async function focusInto(element: HTMLElement) {
  act(() => {
    element.focus()
  })
  await frames()
}

// Two frames, inside `act` so React draws what they bring.
async function frames() {
  await act(async () => {
    await new Promise((resolve) => {
      requestAnimationFrame(() => {
        requestAnimationFrame(resolve)
      })
    })
  })
}

// A scroll lands at once, but what the carousel draws from it waits for the
// scroll event the browser sends on the next frame.
async function scrollCarousel(scroller: HTMLElement, left: number) {
  act(() => {
    scroller.scrollTo({ left })
  })
  await frames()
  expect(Math.abs(scroller.scrollLeft)).toBe(Math.abs(left))
}

function setup(props: Partial<CarouselProps> = {}, dir: 'ltr' | 'rtl' = 'ltr') {
  const view = render(
    <div dir={dir} {...stylex.props(probeStyles.frame)}>
      <Carousel label="Label" {...props}>
        {LABELS.map((label) => (
          <Carousel.Item key={label}>
            <button type="button">{label}</button>
          </Carousel.Item>
        ))}
      </Carousel>
    </div>,
  )
  const region = view.getByRole('region', { name: 'Label' })
  const scroller = region.firstElementChild
  if (!(scroller instanceof HTMLElement)) {
    throw new TypeError('expected the carousel to open with its scroller')
  }
  // Smooth scrolling is the browser's animation, which a test would wait
  // out in real time; turned off, a scroll lands at once. The rule itself is
  // pinned under "motion" below.
  scroller.style.scrollBehavior = 'auto'
  return { ...view, region, scroller }
}

// The width of every item that shows, in item order.
function shown(scroller: HTMLElement) {
  const bounds = scroller.getBoundingClientRect()
  const items = scroller.querySelectorAll('[role="group"]')
  return Array.from(items).flatMap((item) => {
    const { left, right } = drawn(item)
    return right > bounds.left && left < bounds.right
      ? [Math.round(right - left)]
      : []
  })
}

describe('carousel', () => {
  describe('structure', () => {
    it('is a region named by its label and described as a carousel', () => {
      const { region } = setup()

      expect(region.tagName).toBe('SECTION')
      expect(region.getAttribute('aria-roledescription')).toBe('carousel')
    })

    it('names each item by which of how many it is, as a slide', () => {
      const { getAllByRole } = setup()
      const slides = getAllByRole('group')

      expect(slides.map((slide) => slide.getAttribute('aria-label'))).toEqual([
        '1 of 6',
        '2 of 6',
        '3 of 6',
        '4 of 6',
        '5 of 6',
        '6 of 6',
      ])
      for (const slide of slides) {
        expect(slide.getAttribute('aria-roledescription')).toBe('slide')
      }
    })

    // A keyboard reaches the items' own controls, but a carousel of images
    // holds none, and then the scroller is the only way in.
    it('is a tab stop while there is anywhere to scroll, and only then', () => {
      const { scroller } = setup()

      expect(scroller.getAttribute('tabindex')).toBe('0')

      const single = render(
        <div {...stylex.props(probeStyles.frame)}>
          <Carousel label="Single">
            <Carousel.Item>First item</Carousel.Item>
          </Carousel>
        </div>,
      )
      const alone = single.getByRole('region', {
        name: 'Single',
      }).firstElementChild

      expect(alone?.hasAttribute('tabindex')).toBe(false)
    })

    // The ring is the scroller's only boundary of its own, and a forced
    // palette drops a box shadow outright where it keeps an outline.
    it('rings the scroller with an outline, which forced colours keep', () => {
      const { scroller } = setup()
      const focusVisible = rulesReaching(scroller, {
        holding: 'forced-colors: active',
      }).filter((rule) => rule.pseudo === 'focus-visible')

      expect(valueIn(focusVisible, 'outline-style')).toBe('solid')
      expect(
        declarationsHeld(scroller, 'forced-colors: active').has(
          'outline-style:focus-visible',
        ),
      ).toBe(false)
    })

    it('keeps a name an item is given', () => {
      const view = render(
        <Carousel label="Label">
          <Carousel.Item aria-label="First item">First item</Carousel.Item>
        </Carousel>,
      )

      expect(view.getByRole('group', { name: 'First item' })).toBeTruthy()
    })

    it('names its buttons in the reader’s locale, or as it is told', () => {
      const view = setup()

      expect(view.getByRole('button', { name: 'Previous slide' })).toBeTruthy()
      expect(view.getByRole('button', { name: 'Next slide' })).toBeTruthy()

      view.unmount()
      const named = setup({ nextLabel: 'Forward', previousLabel: 'Back' })

      expect(named.getByRole('button', { name: 'Back' })).toBeTruthy()
      expect(named.getByRole('button', { name: 'Forward' })).toBeTruthy()
    })
  })

  describe('multi-browse', () => {
    it('draws as many large items as fit, then a medium and a small one', () => {
      const { scroller } = setup()

      expect(shown(scroller)).toEqual([240, 168, 56])
    })

    it('takes more large items where the preferred width is narrower', () => {
      const { scroller } = setup({ itemSize: 160 })
      const widths = shown(scroller)

      expect(widths.filter((width) => width === 160)).toHaveLength(2)
      expect(widths.reduce((sum, width) => sum + width + 8, -8)).toBe(480)
    })

    it('masks an item down to its width at both sides, with the corner', () => {
      const { getAllByRole } = setup()
      const medium = getAllByRole('group')[1]

      // Laid out at 240 and drawn at 168: 36 off each side.
      expect(getComputedStyle(medium).clipPath).toBe(
        'inset(0px 36px round 28px)',
      )
    })

    it('moves one rest along with next, and back with previous', async () => {
      const { getByRole, scroller } = setup()

      fireEvent.click(getByRole('button', { name: 'Next slide' }))
      await waitFor(() => {
        expect(scroller.scrollLeft).toBe(STEP)
      })
      await waitFor(() => {
        expect(shown(scroller)).toEqual([240, 168, 56])
      })
      expect(
        drawn(getByRole('group', { name: '1 of 6' })).right,
      ).toBeLessThanOrEqual(scroller.getBoundingClientRect().left)

      await waitFor(() => {
        expect(
          getByRole('button', { name: 'Previous slide' }).hasAttribute(
            'disabled',
          ),
        ).toBe(false)
      })
      fireEvent.click(getByRole('button', { name: 'Previous slide' }))
      await waitFor(() => {
        expect(scroller.scrollLeft).toBe(0)
      })
    })

    it('disables previous at the first rest and next at the last', async () => {
      const { getByRole, scroller } = setup()
      const previous = getByRole('button', { name: 'Previous slide' })
      const next = getByRole('button', { name: 'Next slide' })

      expect(previous.hasAttribute('disabled')).toBe(true)
      expect(next.hasAttribute('disabled')).toBe(false)

      await scrollCarousel(scroller, 5 * STEP)
      await waitFor(() => {
        expect(next.hasAttribute('disabled')).toBe(true)
      })
      expect(previous.hasAttribute('disabled')).toBe(false)
    })

    // Six items with one large: rests 0 to 3 move along an item at a time,
    // and rests 4 and 5 turn the small and then the medium slot round.
    it('turns round at the last rests, so the last items are drawn large', async () => {
      const { scroller } = setup()

      await scrollCarousel(scroller, 4 * STEP)
      await waitFor(() => {
        expect(shown(scroller)).toEqual([56, 240, 168])
      })

      await scrollCarousel(scroller, 5 * STEP)
      await waitFor(() => {
        expect(shown(scroller)).toEqual([56, 168, 240])
      })
    })

    it('draws an item between two rests at a size between theirs', async () => {
      const { scroller } = setup()
      // Snapping would carry a scroll on to a rest at once, which is where
      // the carousel comes to rest but not what it draws on the way.
      scroller.style.scrollSnapType = 'none'

      await scrollCarousel(scroller, STEP / 2)
      await waitFor(() => {
        const [first, second] = shown(scroller)
        expect(first).toBeLessThan(240)
        expect(second).toBeGreaterThan(168)
      })
    })

    it('scrolls to the rest that draws an item large when focus moves into it', async () => {
      const { getByRole, scroller } = setup()

      await focusInto(getByRole('button', { name: 'Fifth item' }))

      // The fifth item is past the end at the first rest, and the nearest
      // rest drawing it large is the one it starts.
      expect(scroller.scrollLeft).toBe(4 * STEP)
    })

    // At 160 two items are large, a rest every 168: the fifth item is drawn
    // large soonest at the rest where it is the second of the two.
    it('scrolls only as far as an item after the large ones needs', async () => {
      const { getByRole, scroller } = setup({ itemSize: 160 })

      await focusInto(getByRole('button', { name: 'Fifth item' }))

      expect(scroller.scrollLeft).toBe(3 * 168)
    })

    it('scrolls back to an item before the large ones', async () => {
      const { getByRole, scroller } = setup()
      await scrollCarousel(scroller, 3 * STEP)

      await focusInto(getByRole('button', { name: 'Second item' }))

      expect(scroller.scrollLeft).toBe(STEP)
    })

    it('stays where it is when focus moves into a large item', async () => {
      const { getByRole, scroller } = setup()
      await scrollCarousel(scroller, 2 * STEP)

      await focusInto(getByRole('button', { name: 'Third item' }))

      expect(scroller.scrollLeft).toBe(2 * STEP)
    })
  })

  describe('hero', () => {
    it('draws one large item and one small, filling the width', () => {
      const { scroller } = setup({ layout: 'hero' })

      expect(shown(scroller)).toEqual([416, 56])
    })

    it('rests at every item, the last one drawn large', async () => {
      const { scroller } = setup({ layout: 'hero' })

      await scrollCarousel(scroller, 5 * 424)
      await waitFor(() => {
        expect(shown(scroller)).toEqual([56, 416])
      })
    })
  })

  describe('uncontained', () => {
    it('draws every item at the preferred width, unmasked', () => {
      const { getAllByRole, scroller } = setup({ layout: 'uncontained' })

      expect(shown(scroller)).toEqual([240, 240])
      for (const item of getAllByRole('group')) {
        expect(getComputedStyle(item).clipPath).toBe('none')
        expect(item.getBoundingClientRect().width).toBe(240)
      }
    })

    it('rests at each item’s start, inside the padding', () => {
      const { getAllByRole, scroller } = setup({ layout: 'uncontained' })

      expect(getComputedStyle(scroller).scrollPaddingInlineStart).toBe('16px')
      for (const item of getAllByRole('group')) {
        expect(getComputedStyle(item).scrollSnapAlign).toBe('start')
      }
    })

    it('moves an item’s width along with next', async () => {
      const { getByRole, scroller } = setup({ layout: 'uncontained' })

      fireEvent.click(getByRole('button', { name: 'Next slide' }))

      await waitFor(() => {
        expect(scroller.scrollLeft).toBe(STEP)
      })
    })
  })

  describe('direction', () => {
    it('starts at the right and moves left, right to left', async () => {
      const { getByRole, scroller } = setup({}, 'rtl')
      const bounds = scroller.getBoundingClientRect()
      const first = getByRole('group', { name: '1 of 6' })

      expect(Math.round(first.getBoundingClientRect().right)).toBe(
        Math.round(bounds.right) - 16,
      )

      fireEvent.click(getByRole('button', { name: 'Next slide' }))

      await waitFor(() => {
        expect(scroller.scrollLeft).toBe(-STEP)
      })
      await waitFor(() => {
        expect(drawn(first).left).toBeGreaterThanOrEqual(bounds.right)
      })
    })

    it('points previous at the start and next at the end, either way', () => {
      const ltr = setup()
      const glyphOf = (name: string) =>
        ltr.getByRole('button', { name }).querySelector('svg')

      const previous = glyphOf('Previous slide')
      const next = glyphOf('Next slide')
      expect(previous && getComputedStyle(previous).transform).not.toBe('none')
      expect(next && getComputedStyle(next).transform).toBe('none')
      ltr.unmount()

      const rtl = setup({}, 'rtl')
      const flipped = rtl
        .getByRole('button', { name: 'Previous slide' })
        .querySelector('svg')
      const forward = rtl
        .getByRole('button', { name: 'Next slide' })
        .querySelector('svg')
      expect(flipped && getComputedStyle(flipped).transform).toBe('none')
      expect(forward && getComputedStyle(forward).transform).not.toBe('none')
    })
  })

  describe('motion', () => {
    it('scrolls smoothly, and jumps under reduced motion', () => {
      const view = render(
        <Carousel label="Label">
          <Carousel.Item>First item</Carousel.Item>
        </Carousel>,
      )
      const scroller = view.getByRole('region').firstElementChild

      expect(scroller && reducedMotionOf(scroller, 'scroll-behavior')).toEqual({
        reduced: 'auto',
        resting: 'smooth',
      })
    })
  })
})
