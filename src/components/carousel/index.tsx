'use client'

import type {
  FocusEvent,
  HTMLAttributes,
  ReactNode,
  RefAttributes,
} from 'react'

import * as stylex from '@stylexjs/stylex'
import {
  Children,
  createContext,
  isValidElement,
  useCallback,
  useContext,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'

import type { CarouselLayout, Placement } from '../../carousel/arrangement'

import { arrange, GAP, placements } from '../../carousel/arrangement'
import { ChevronEndGlyph } from '../../glyphs'
import { useMessages } from '../../i18n'
import { focus } from '../../styles/focus'
import { mergeStyles } from '../../styles/merge'
import { radii, spacing } from '../../tokens/design.tokens.stylex'
import IconButton from '../icon-button'

// The carousel page's carousel: a row of items that scrolls on and off the
// screen, drawn in three of the page's layouts. Each has the page's 16dp of
// padding at its ends and 8dp at its top and bottom, 8dp between items and a
// 28dp corner on every item.
//
// - **Multi-browse**, the default, shows as many large items as fit at
//   `itemSize`, then a medium one and a small one, and fills its width
//   exactly; the large width gives way where the preferred one does not fit.
// - **Hero** shows one large item and one small.
// - **Uncontained** shows every item at `itemSize`, scrolling past the edge.
//
// **Items change size as they move**, as the page draws them. The first two
// layouts come to rest one item apart, and between two rests every item's
// place and width are interpolated, so an item shrinks as it leaves and
// grows as it arrives; the last rests turn the arrangement round a slot at a
// time, so every item is drawn large at one of them. The arithmetic is
// `src/carousel/arrangement.ts`.
// An item is laid out at the large width and masked down to the width it is
// drawn at, centred, with the page's corner on the mask: what it holds is
// cut at both sides rather than squeezed, as the page's masked items are.
//
// **The scrolling is the browser's.** A scroller holds the items' track,
// which stays put while it scrolls, and a run of empty markers one item
// apart after it, which is what gives the scroller its length and its rests:
// each marker's end is a scroll-snap point, and a mark at the scroller's
// start is the first. The position the scroller reports is what the items
// are drawn from. Uncontained has no rests and no masks, so its items scroll
// in the track themselves, snapping to their own starts.
//
// **It is the ARIA carousel pattern**, since React Aria has no carousel: a
// region named by `label` and described as a carousel, each item a group
// described as a slide and named by which of how many it is, and a previous
// and a next button under it, at the end. Focus moving into an item that is
// not drawn large scrolls the carousel to the nearest rest that draws it
// large, and the scroller is a tab stop while it scrolls, so the arrow keys
// move it too. Under reduced motion the scroller jumps rather than scrolling
// smoothly.
//
// The page's large width is "dynamic, or user-set", and neither MDC-Android
// nor Compose has a default for it; `itemSize`'s 240 is this component's own.
// Uncontained keeps the 16dp at its end as well as its start, where the page
// gives it a leading padding alone, so its last item does not end flush
// against the edge.

/** The page's 16dp at a carousel's ends. */
const PADDING = 16

const DEFAULT_ITEM_SIZE = 240

type CarouselItemProps = Omit<HTMLAttributes<HTMLDivElement>, 'children'> & {
  /** What the item shows: usually an image, which the item masks. */
  children?: ReactNode
}

type CarouselProps = Omit<HTMLAttributes<HTMLElement>, 'children'> & {
  /** The items: `Carousel.Item` for each. */
  children?: ReactNode
  /**
   * The large item's preferred width, in pixels. Multi-browse lays out as
   * many as fit and narrows them where they do not; uncontained draws every
   * item at it; hero takes its large item's width from the carousel's.
   * @default 240
   */
  itemSize?: number
  /**
   * What the carousel shows, for a screen reader. Required rather than
   * optional: a carousel is a region, and a region with no name is one a
   * screen reader cannot introduce.
   */
  label: string
  /**
   * Which of the page's layouts the carousel draws.
   * @default 'multi-browse'
   */
  layout?: CarouselLayout
  /**
   * What the next button is called. Left out, the library names it in the
   * reader's locale — "Next slide" in English.
   */
  nextLabel?: string
  /**
   * What the previous button is called. Left out, the library names it in
   * the reader's locale — "Previous slide" in English.
   */
  previousLabel?: string
}

const styles = stylex.create({
  controls: {
    boxSizing: 'border-box',
    display: 'flex',
    gap: spacing.sm,
    justifyContent: 'flex-end',
    paddingInline: spacing.lg,
  },
  // Previous points at the start, and next at the end; both turn over with
  // the text.
  glyphNext: {
    blockSize: '1em',
    display: 'block',
    inlineSize: '1em',
    transform: { ':dir(rtl)': 'scaleX(-1)', default: 'none' },
  },
  glyphPrevious: {
    blockSize: '1em',
    display: 'block',
    inlineSize: '1em',
    transform: { ':dir(rtl)': 'none', default: 'scaleX(-1)' },
  },
  item: {
    borderRadius: radii.xl,
    boxSizing: 'border-box',
    flexGrow: 0,
    flexShrink: 0,
    minBlockSize: 0,
    overflow: 'hidden',
    position: 'relative',
  },
  // An uncontained item, which scrolls in the track and rests at its start.
  itemUncontained: {
    scrollSnapAlign: 'start',
  },
  // A run of nothing, one item long, whose end is a place to rest.
  marker: {
    flexShrink: 0,
    scrollSnapAlign: 'end',
  },
  // The first rest. The track starts there too but cannot be it: the track
  // is held wherever the scroller has scrolled to, so a snap to its start is
  // a snap to wherever the carousel already is, and previous could never
  // reach the first rest from the second.
  origin: {
    blockSize: '1px',
    inlineSize: '1px',
    insetBlockStart: 0,
    insetInlineStart: 0,
    pointerEvents: 'none',
    position: 'absolute',
    scrollSnapAlign: 'start',
  },
  root: {
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.sm,
    minInlineSize: 0,
  },
  // No scrollbar, as a carousel draws none: what is cut off at the edge is
  // what says there is more.
  scroller: {
    '::-webkit-scrollbar': {
      display: 'none',
    },
    boxSizing: 'border-box',
    display: 'flex',
    overflowX: 'auto',
    overflowY: 'hidden',
    overscrollBehaviorX: 'contain',
    position: 'relative',
    scrollbarWidth: 'none',
    scrollBehavior: {
      '@media (prefers-reduced-motion: reduce)': 'auto',
      default: 'smooth',
    },
    scrollSnapType: 'x mandatory',
  },
  // An uncontained item rests against the track's padding rather than the
  // scroller's edge. A masking layout takes none: its rests are the
  // markers' ends, which a padding would move.
  scrollerUncontained: {
    scrollPaddingInline: spacing.lg,
  },
  track: {
    boxSizing: 'border-box',
    display: 'flex',
    flexShrink: 0,
    gap: spacing.sm,
    paddingBlock: spacing.sm,
    paddingInline: spacing.lg,
  },
  // The track of a layout that masks: as wide as the scroller and held at
  // its start while it scrolls, so the items are drawn against what shows.
  // It clips, which is what keeps the items it places past either edge from
  // lengthening the scroller.
  trackMasked: {
    inlineSize: '100%',
    insetInlineStart: 0,
    overflow: 'clip',
    position: 'sticky',
  },
})

const placed = stylex.create({
  // Where a masking layout draws an item: moved along from where the track
  // lays it out, and cut to its width at both sides with the page's corner.
  item: (inlineSize: string, shift: string, clip: string) => ({
    clipPath: clip,
    inlineSize,
    insetInlineStart: shift,
  }),
  marker: (inlineSize: string) => ({
    inlineSize,
  }),
  uncontained: (inlineSize: string) => ({
    inlineSize,
  }),
})

type Slot = {
  count: number
  index: number
  /** The width the item is laid out at. */
  large: number
  layout: CarouselLayout
  /** Where it is drawn, for a layout that masks. */
  placement: Placement | undefined
}

const SlotContext = createContext<null | Slot>(null)

/** What the controls and focus scroll by, as numbers read off one render. */
type Geometry = {
  /** The offset of the last rest, or for uncontained how far it scrolls. */
  end: number
  /** How many items past the first large one the last large one is. */
  lastLarge: number
  masked: boolean
  scrolled: number
  /** The distance between two rests, or for uncontained between two items. */
  step: number
}

// Where a press of previous or next scrolls to from `scrolled`: the rest
// either side of the nearest one, or for uncontained an item's width along,
// kept between the two ends.
function along(
  direction: -1 | 1,
  { end, masked, scrolled, step }: Geometry,
): number {
  if (step <= 0) {
    return 0
  }
  const offset = masked
    ? (Math.round(scrolled / step) + direction) * step
    : scrolled + direction * step
  return Math.min(Math.max(offset, 0), end)
}

/**
 * A row of items that scrolls on and off the screen, in the carousel page's
 * multi-browse, hero or uncontained layout. Name it with `label`, and give it
 * a `Carousel.Item` for each item.
 *
 * ```tsx
 * <Carousel label="Label">
 *   <Carousel.Item><img alt="First item" src="…" /></Carousel.Item>
 *   <Carousel.Item><img alt="Second item" src="…" /></Carousel.Item>
 * </Carousel>
 * ```
 *
 * The call site's `className` and `style` land on the carousel as a whole,
 * which is the element a layout positions.
 */
function Carousel({
  children,
  itemSize = DEFAULT_ITEM_SIZE,
  label,
  layout = 'multi-browse',
  nextLabel,
  previousLabel,
  ref,
  ...props
}: CarouselProps & RefAttributes<HTMLElement>) {
  const messages = useMessages()
  const scrollerRef = useRef<HTMLDivElement>(null)
  // The scroller's width and how far it has scrolled along the text:
  // everything drawn is drawn from these two.
  const [width, setWidth] = useState(0)
  const [scrolled, setScrolled] = useState(0)

  const items = Children.toArray(children).filter(isValidElement)
  const count = items.length
  const room = Math.max(width - 2 * PADDING, 0)
  const arrangement = arrange(layout, room, itemSize, count)
  const masked = layout !== 'uncontained'
  // Read off the arrangement as arithmetic, so each is a number of its own
  // rather than a field of an object the calls below are handed.
  const step = arrangement.large + GAP
  // The last rest, or how far the uncontained track runs past the scroller.
  const end = masked
    ? arrangement.steps * step
    : Math.max(count * step - GAP + 2 * PADDING - width, 0)
  const lastLarge = arrangement.largeCount - 1
  const position = masked && step > 0 ? scrolled / step : 0
  const drawn = masked
    ? placements(layout, arrangement, room, PADDING, count, position)
    : []

  // Measured before the first paint, again on every scroll, and whenever
  // the scroller's width changes. A right-to-left scroller counts its offset
  // down from zero.
  const measure = useCallback(() => {
    const scroller = scrollerRef.current
    if (scroller === null) {
      return
    }
    setWidth(scroller.clientWidth)
    setScrolled(Math.abs(scroller.scrollLeft))
  }, [])

  useLayoutEffect(() => {
    const scroller = scrollerRef.current
    if (scroller === null) {
      return undefined
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(scroller)
    return () => {
      observer.disconnect()
    }
  }, [measure])

  const previous = useCallback(() => {
    const geometry = { end, lastLarge, masked, scrolled, step }
    scrollAlong(scrollerRef.current, along(-1, geometry))
  }, [end, lastLarge, masked, scrolled, step])
  const next = useCallback(() => {
    const geometry = { end, lastLarge, masked, scrolled, step }
    scrollAlong(scrollerRef.current, along(1, geometry))
  }, [end, lastLarge, masked, scrolled, step])

  // Focus arriving in an item a masking layout is not drawing large.
  // Uncontained items are where they are drawn, so the browser's own
  // scrolling of focus into view is already right for them.
  const reveal = useCallback(
    (event: FocusEvent<HTMLDivElement>) => {
      const { target } = event
      if (!masked || step <= 0 || !(target instanceof Node)) {
        return
      }
      const index = Array.from(event.currentTarget.children).findIndex(
        (child) => child.contains(target),
      )
      if (index < 0) {
        return
      }
      const geometry = { end, lastLarge, masked, scrolled, step }
      const offset = Math.min(restRevealing(index, geometry) * step, end)
      scrollAlong(scrollerRef.current, offset)
    },
    [end, lastLarge, masked, scrolled, step],
  )

  const slots = items.map((_, index): Slot => ({
    count,
    index,
    large: arrangement.large,
    layout,
    placement: drawn[index],
  }))

  return (
    <section
      aria-label={label}
      aria-roledescription={messages.carousel}
      ref={ref}
      {...props}
      {...mergeStyles(stylex.props(styles.root), props)}
    >
      <div
        onScroll={measure}
        ref={scrollerRef}
        // A tab stop while there is anywhere to scroll, so the arrow keys
        // move it from rest to rest whatever its items hold. A scroll
        // container with nothing focusable inside is otherwise out of a
        // keyboard's reach, which axe's scrollable-region-focusable reports.
        // oxlint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- see above
        tabIndex={end > 0 ? 0 : undefined}
        {...stylex.props(
          styles.scroller,
          focus.ring,
          !masked && styles.scrollerUncontained,
        )}
      >
        {masked ? (
          <div aria-hidden="true" {...stylex.props(styles.origin)} />
        ) : null}
        <div
          onFocus={reveal}
          {...stylex.props(styles.track, masked && styles.trackMasked)}
        >
          {items.map((item, index) => (
            <SlotContext key={item.key ?? index} value={slots[index] ?? null}>
              {item}
            </SlotContext>
          ))}
        </div>
        {masked
          ? Array.from({ length: arrangement.steps }, (_, rest) => (
              <div
                aria-hidden="true"
                key={rest}
                {...stylex.props(styles.marker, placed.marker(`${step}px`))}
              />
            ))
          : null}
      </div>
      <div {...stylex.props(styles.controls)}>
        <IconButton
          aria-label={previousLabel ?? messages.previousSlide}
          isDisabled={scrolled <= 0.5}
          onPress={previous}
        >
          <ChevronEndGlyph {...stylex.props(styles.glyphPrevious)} />
        </IconButton>
        <IconButton
          aria-label={nextLabel ?? messages.nextSlide}
          isDisabled={scrolled >= end - 0.5}
          onPress={next}
        >
          <ChevronEndGlyph {...stylex.props(styles.glyphNext)} />
        </IconButton>
      </div>
    </section>
  )
}

/**
 * One item. It is named by which of how many it is — "2 of 6" — unless it is
 * given an `aria-label` of its own.
 *
 * The call site's `className` and `style` land on the item.
 */
function CarouselItem({
  children,
  ref,
  ...props
}: CarouselItemProps & RefAttributes<HTMLDivElement>) {
  const messages = useMessages()
  const slot = useContext(SlotContext)
  const count = slot?.count ?? 1
  const index = slot?.index ?? 0
  const large = slot?.large ?? 0
  const placement = slot?.placement
  const inset = placement === undefined ? 0 : (large - placement.width) / 2

  return (
    <div
      aria-label={messages.slideLabel(index + 1, count)}
      aria-roledescription={messages.slide}
      ref={ref}
      // The pattern's own role for a slide. Its suggested `fieldset` is a
      // form's grouping, with a legend and a border of its own.
      // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role -- see above
      role="group"
      {...props}
      {...mergeStyles(
        stylex.props(
          styles.item,
          slot?.layout === 'uncontained' && styles.itemUncontained,
          slot?.layout === 'uncontained' && placed.uncontained(`${large}px`),
          placement !== undefined &&
            placed.item(
              `${large}px`,
              `${placement.left - inset - index * (large + GAP)}px`,
              `inset(0 ${inset}px round ${radii.xl})`,
            ),
        ),
        props,
      )}
    >
      {children}
    </div>
  )
}

// The nearest rest that draws the item at `index` large, from the rest
// nearest `scrolled`: the one it starts, for an item before the large ones,
// or the one it ends, for an item after them. At rest `s` the large items
// are `s` to `s + lastLarge`.
function restRevealing(
  index: number,
  { lastLarge, scrolled, step }: Geometry,
): number {
  const at = Math.round(scrolled / step)
  if (index < at) {
    return index
  }
  if (index > at + lastLarge) {
    return index - lastLarge
  }
  return at
}

// Scrolls to an offset along the text, whichever way it runs: a
// right-to-left scroller counts its offset down from zero.
function scrollAlong(scroller: HTMLElement | null, offset: number) {
  if (scroller === null) {
    return
  }
  const sign = getComputedStyle(scroller).direction === 'rtl' ? -1 : 1
  scroller.scrollTo({ left: sign * offset })
}

Carousel.Item = CarouselItem

export type { CarouselItemProps, CarouselLayout, CarouselProps }

export { CarouselItem }

export default Carousel
