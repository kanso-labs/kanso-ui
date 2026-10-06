// The carousel page's layouts as numbers: which items are large, medium and
// small at each place a carousel comes to rest, and where each is drawn as
// it moves between two of them. Apart from the component so the arithmetic
// can be tested without a browser laying anything out, and so the
// component's file holds what it renders.
//
// The model is MDC-Android's keylines, simplified to what the page draws.
// At rest a multi-browse carousel shows `largeCount` large items, one medium
// and one small, filling the room exactly; a hero carousel one large and one
// small. Each rest is one item further along than the last, and once the
// last item has come into view the rests that remain turn the arrangement
// round a slot at a time — small, the large ones, medium; then small,
// medium, the large ones — so every item is drawn large at one rest at
// least. At rest `s` the large items are always `s` to `s + largeCount - 1`.
// Between two rests every item's place and width are interpolated, which is
// what makes an item grow or shrink as it moves rather than jump. Items past
// either edge are drawn small and out of sight, so they arrive at the size
// of the slot they enter.
//
// Everything is in pixels along the inline axis of the carousel's content
// box: 0 is its start edge, inside the leading padding.

type CarouselLayout = 'hero' | 'multi-browse' | 'uncontained'

/** The page's 8dp between items. */
const GAP = 8

/** The page's small item: 40dp at the least and 56dp at the most. */
const SMALL_MAX = 56
const SMALL_MIN = 40

type Arrangement = {
  /** The large item's width, which every item is laid out at. */
  large: number
  /** How many items are large at rest. */
  largeCount: number
  /** The medium item's width, or 0 for a layout without one. */
  medium: number
  /** The small item's width, or 0 for a layout without one. */
  small: number
  /** The last place the carousel comes to rest, counting from 0. */
  steps: number
}

/** Where an item is drawn: the start of what shows of it, and its width. */
type Placement = { left: number; width: number }

/**
 * The sizes a layout draws its items at in a content box `room` wide, for
 * `count` items and a preferred large width of `itemSize`.
 */
function arrange(
  layout: CarouselLayout,
  room: number,
  itemSize: number,
  count: number,
): Arrangement {
  if (layout === 'uncontained') {
    const large = Math.min(itemSize, room)
    return { large, largeCount: 0, medium: 0, small: 0, steps: 0 }
  }

  // The small item at its largest unless the room is too narrow for it.
  const small = room >= 3 * SMALL_MAX + 2 * GAP ? SMALL_MAX : SMALL_MIN

  if (layout === 'hero') {
    const large = Math.max(room - GAP - small, small)
    return withSteps({ large, largeCount: 1, medium: 0, small }, count)
  }

  // As many items at the preferred width as fit beside a medium and a small
  // one, and no more than leave a medium and a small item to fill those two
  // slots, so a short run of items still fills the room rather than leaving
  // its last slots empty. Where what is left for the medium item is not
  // between the small and the large width, the large width gives way, to
  // whatever leaves the medium item halfway between the two.
  const fit = Math.floor((room - small - GAP) / (itemSize + GAP))
  const most = Math.max(1, Math.min(fit, count - 2))
  for (let largeCount = most; largeCount >= 1; largeCount--) {
    const gaps = (largeCount + 1) * GAP
    const medium = room - largeCount * itemSize - gaps - small
    if (medium >= small && medium <= itemSize) {
      return withSteps({ large: itemSize, largeCount, medium, small }, count)
    }
    const large = (room - gaps - 1.5 * small) / (largeCount + 0.5)
    if (large >= small) {
      const sizes = { large, largeCount, medium: (large + small) / 2, small }
      return withSteps(sizes, count)
    }
  }
  // Too narrow for three: one large item and one small, as a hero draws.
  return arrange('hero', room, itemSize, count)
}

// How many of the slots are filled: all of them, unless there are fewer
// items, which leaves the last slots empty.
function filledOf(sizes: Omit<Arrangement, 'steps'>, count: number) {
  return Math.min(count, sizes.largeCount + trailingOf(sizes).length)
}

/**
 * Where every item is drawn with the carousel `position` rests along: a
 * whole number at a rest, and the fraction between two while it moves.
 * `room` is the content box's width and `padding` the space on each side of
 * it, which an item past the edge is drawn beyond.
 */
function placements(
  layout: CarouselLayout,
  arrangement: Arrangement,
  room: number,
  padding: number,
  count: number,
  position: number,
): Placement[] {
  if (layout === 'uncontained') {
    return Array.from({ length: count }, (_, index) => ({
      left: index * (arrangement.large + GAP),
      width: arrangement.large,
    }))
  }

  const clamped = Math.min(Math.max(position, 0), arrangement.steps)
  const from = Math.floor(clamped)
  const to = Math.min(from + 1, arrangement.steps)
  const fraction = clamped - from
  const start = rest(arrangement, room, padding, count, from)
  const end = rest(arrangement, room, padding, count, to)

  return start.map((placement, index) => {
    const next = end[index] ?? placement
    return {
      left: placement.left + (next.left - placement.left) * fraction,
      width: placement.width + (next.width - placement.width) * fraction,
    }
  })
}

// Where every item is drawn at one rest.
function rest(
  arrangement: Arrangement,
  room: number,
  padding: number,
  count: number,
  step: number,
) {
  const { large, largeCount, small } = arrangement
  const filled = filledOf(arrangement, count)
  const trailing = trailingOf(arrangement).slice(0, filled - largeCount)
  // The last rest drawn from the start; past it, how many trailing slots
  // have turned round to the front, the last of them first.
  const last = count - filled
  const turned = Math.max(0, step - last)
  const kept = trailing.length - turned
  const sizes = [
    ...Array.from(
      { length: turned },
      (_, slot) => trailing[trailing.length - 1 - slot] ?? small,
    ),
    ...Array.from({ length: Math.min(largeCount, filled) }, () => large),
    ...trailing.slice(0, kept),
  ]
  // The item in the first slot. Once the arrangement turns, the slots hold
  // the last items, whichever way round they are drawn.
  const first = Math.min(step, last)

  // The slots, laid out from the start edge.
  const lefts: number[] = []
  let cursor = 0
  for (const size of sizes) {
    lefts.push(cursor)
    cursor += size + GAP
  }
  // A turned arrangement that does not fill the room is set against the end
  // edge instead, which is where its large items belong.
  const shift = turned > 0 ? room - (cursor - GAP) : 0
  const away = small > 0 ? small : large

  return Array.from({ length: count }, (_, index): Placement => {
    const slot = index - first
    if (slot < 0) {
      // Past the start edge, beyond the padding, a small item per place.
      return { left: -padding + slot * (away + GAP), width: away }
    }
    if (slot >= sizes.length) {
      // Past the end edge, likewise.
      return {
        left: room + padding + GAP + (slot - sizes.length) * (away + GAP),
        width: away,
      }
    }
    return { left: (lefts[slot] ?? 0) + shift, width: sizes[slot] ?? away }
  })
}

// The widths that follow the large ones at rest: medium then small, or the
// small alone for a hero.
function trailingOf({ medium, small }: Omit<Arrangement, 'steps'>) {
  return [medium, small].filter((size) => size > 0)
}

// A rest starts at each item while every slot after it is filled, and each
// trailing slot turning round to the front is one rest more.
function withSteps(
  sizes: Omit<Arrangement, 'steps'>,
  count: number,
): Arrangement {
  const filled = filledOf(sizes, count)
  const turning = Math.max(0, filled - sizes.largeCount)
  return { ...sizes, steps: count - filled + turning }
}

export type { Arrangement, CarouselLayout, Placement }

export { arrange, GAP, placements }
