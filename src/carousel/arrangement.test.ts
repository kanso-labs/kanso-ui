import { describe, expect, it } from 'vitest'

import { arrange, GAP, placements } from './arrangement'

// A content box 480 wide, which is a 512 carousel less its 16dp padding on
// each side, and a preferred large width of 240.
const ROOM = 480
const PADDING = 16

// What shows inside the content box, as widths in item order.
function visible(position: number, count = 6) {
  return widths(position, count)
    .filter(({ left, width }) => left + width > 0 && left < ROOM)
    .map(({ width }) => Math.round(width))
}

function widths(position: number, count = 6) {
  const arrangement = arrange('multi-browse', ROOM, 240, count)
  return placements('multi-browse', arrangement, ROOM, PADDING, count, position)
}

describe('carousel arrangement', () => {
  describe('multi-browse', () => {
    it('fills the room with large items, one medium and one small', () => {
      const arrangement = arrange('multi-browse', ROOM, 240, 6)

      expect(arrangement).toMatchObject({
        large: 240,
        largeCount: 1,
        medium: 168,
        small: 56,
      })
      expect(
        arrangement.large + arrangement.medium + arrangement.small + 2 * GAP,
      ).toBe(ROOM)
    })

    it('takes as many large items as fit beside a medium and a small one', () => {
      const arrangement = arrange('multi-browse', 1200, 240, 10)

      expect(arrangement.largeCount).toBe(4)
      expect(
        4 * arrangement.large +
          arrangement.medium +
          arrangement.small +
          5 * GAP,
      ).toBe(1200)
    })

    // A phone's room is too narrow for 240 beside a medium item at least as
    // wide as the small one, so the large width gives way.
    it('narrows the large items where the preferred width does not fit', () => {
      const arrangement = arrange('multi-browse', 328, 240, 6)

      expect(arrangement.large).toBeLessThan(240)
      expect(arrangement.medium).toBeGreaterThanOrEqual(arrangement.small)
      expect(arrangement.medium).toBeLessThanOrEqual(arrangement.large)
      expect(
        arrangement.large + arrangement.medium + arrangement.small + 2 * GAP,
      ).toBeCloseTo(328)
    })

    it('rests at each item while a medium and a small one follow, then turns round', () => {
      expect(arrange('multi-browse', ROOM, 240, 6).steps).toBe(5)
      expect(visible(0)).toEqual([240, 168, 56])
      expect(visible(3)).toEqual([240, 168, 56])
      // The small slot turns round first, so the medium item before it is
      // drawn large, and then the medium one, leaving the last item large.
      expect(visible(4)).toEqual([56, 240, 168])
      expect(visible(5)).toEqual([56, 168, 240])
    })

    // The rests are what make an item reachable at full size, so the rule is
    // checked at every rest of every shape: one large item, two, four, three
    // items in a room for more, and two, which leave a slot empty.
    it.each([
      ['one large item', ROOM, 6],
      ['two large items', 760, 7],
      ['four large items', 1200, 10],
      ['three items', 760, 3],
      ['two items', ROOM, 2],
    ])(
      'draws items s to s + largeCount - 1 large at rest s, with %s',
      (_shape, room, count) => {
        const arrangement = arrange('multi-browse', room, 240, count)
        const largeAt = new Set<number>()

        for (let step = 0; step <= arrangement.steps; step++) {
          const placed = placements(
            'multi-browse',
            arrangement,
            room,
            PADDING,
            count,
            step,
          )
          const large = placed.flatMap(({ width }, index) =>
            width === arrangement.large ? [index] : [],
          )
          const expected = Array.from(
            { length: Math.min(arrangement.largeCount, count - step) },
            (_, offset) => step + offset,
          )

          expect(large).toEqual(expected)
          for (const index of large) {
            largeAt.add(index)
          }
        }

        expect(largeAt.size).toBe(count)
      },
    )

    it('fills the room at every rest when every slot has an item', () => {
      const arrangement = arrange('multi-browse', ROOM, 240, 6)

      for (let step = 0; step <= arrangement.steps; step++) {
        const shown = placements(
          'multi-browse',
          arrangement,
          ROOM,
          PADDING,
          6,
          step,
        ).filter(({ left, width }) => left + width > 0 && left < ROOM)
        expect(Math.min(...shown.map(({ left }) => left))).toBe(0)
        expect(Math.max(...shown.map(({ left, width }) => left + width))).toBe(
          ROOM,
        )
      }
    })

    it('draws the items between two rests at sizes between theirs', () => {
      const [first, second] = widths(0.5)

      // The first item shrinks as it leaves; the second grows into its place.
      expect(first.width).toBeLessThan(240)
      expect(first.width).toBeGreaterThan(56)
      expect(second.width).toBeGreaterThan(168)
      expect(second.width).toBeLessThan(240)
    })

    it('keeps the items past either edge out of the padding', () => {
      const placed = widths(2)
      const outside = placed.filter(
        ({ left, width }) => left + width <= 0 || left >= ROOM,
      )

      // Rest 2 shows the third to fifth items, leaving two past the start
      // edge and one past the end.
      expect(outside).toHaveLength(3)
      for (const { left, width } of outside) {
        expect(left + width <= -PADDING || left >= ROOM + PADDING).toBe(true)
      }
    })
  })

  describe('hero', () => {
    it('draws one large item and one small', () => {
      const arrangement = arrange('hero', ROOM, 240, 4)
      const placed = placements('hero', arrangement, ROOM, PADDING, 4, 0)

      expect(arrangement.large + arrangement.small + GAP).toBe(ROOM)
      expect(placed.slice(0, 2).map(({ width }) => width)).toEqual([
        arrangement.large,
        arrangement.small,
      ])
    })

    it('turns round at the last rest, so the last item is the large one', () => {
      const arrangement = arrange('hero', ROOM, 240, 4)
      const placed = placements('hero', arrangement, ROOM, PADDING, 4, 3)

      expect(placed[3]?.width).toBe(arrangement.large)
      expect(placed[2]?.width).toBe(arrangement.small)
    })
  })

  describe('uncontained', () => {
    it('lays every item out at the preferred width, and never rests', () => {
      const arrangement = arrange('uncontained', ROOM, 240, 4)
      const placed = placements('uncontained', arrangement, ROOM, PADDING, 4, 0)

      expect(arrangement.steps).toBe(0)
      expect(placed.map(({ width }) => width)).toEqual([240, 240, 240, 240])
      expect(placed.map(({ left }) => left)).toEqual([0, 248, 496, 744])
    })
  })

  // A lone item is drawn large where it is, and there is nowhere to move.
  it('has no rest to move to with one item or none', () => {
    expect(arrange('multi-browse', ROOM, 240, 1).steps).toBe(0)
    expect(arrange('hero', ROOM, 240, 1).steps).toBe(0)
    expect(arrange('multi-browse', ROOM, 240, 0).steps).toBe(0)
  })

  // A room for four large items holding five: three large ones, a medium and
  // a small one fill it, the large width growing to do so, where four large
  // ones would leave the small slot empty at the end.
  it('takes fewer large items rather than leave slots empty', () => {
    const arrangement = arrange('multi-browse', 1200, 240, 5)

    expect(arrangement.largeCount).toBe(3)
    expect(arrangement.large).toBeGreaterThan(240)
    expect(
      3 * arrangement.large + arrangement.medium + arrangement.small + 4 * GAP,
    ).toBeCloseTo(1200)
  })

  // Two items in a room for three slots: the first is large and the second
  // medium, with the small slot empty, and one rest along turns them round
  // against the end edge so the second can be seen large too.
  it('turns round against the end edge with fewer items than its slots', () => {
    const arrangement = arrange('multi-browse', ROOM, 240, 2)
    const turned = placements('multi-browse', arrangement, ROOM, PADDING, 2, 1)

    expect(arrangement.steps).toBe(1)
    expect(turned.map(({ width }) => width)).toEqual([168, 240])
    expect(turned.map(({ left }) => left)).toEqual([64, 240])
  })
})
