import * as stylex from '@stylexjs/stylex'
import { useContext } from 'react'
import {
  DateFieldStateContext,
  DateInput as RACDateInput,
  DateSegment as RACDateSegment,
} from 'react-aria-components'

import { segmentStyles } from './styles'

// What React Aria hands the input for each part of the date. Taken off the
// component rather than imported, since the segment type is not on the
// package's public surface.
type Segment = Parameters<
  NonNullable<Parameters<typeof RACDateInput>[0]['children']>
>[0]

// The invisible marks that keep a value's direction, which a locale can put
// at either end of it as a literal of their own.
const UNSEEN = /^[\u061c\u200e\u200f\u202a-\u202e\u2066-\u2069]*$/u

// Punctuation followed by a space, as the comma between a date and its time
// is written, in any script, once the direction marks are set aside.
const HANGING = /^[\u061c\u200e\u200f\u202a-\u202e\u2066-\u2069]*\p{P}+\s+$/u

// The parts of a value that belong to its date rather than its time.
const DATE_PARTS: ReadonlySet<string> = new Set(['day', 'era', 'month', 'year'])

// Whether `segment` is a literal standing between the last part of a date
// and the first part of its time, read off the segments around it.
function joinsDateToTime(segments: readonly Segment[], segment: Segment) {
  const index = segments.indexOf(segment)
  if (index === -1) {
    return false
  }
  // Walked back by hand: `findLast` is ES2023, and the library compiles to
  // ES2022.
  let before: Segment | undefined
  for (let at = index - 1; at >= 0 && before === undefined; at -= 1) {
    if (segments[at].type !== 'literal') {
      before = segments[at]
    }
  }
  const after = segments
    .slice(index + 1)
    .find((candidate) => candidate.type !== 'literal')
  return (
    before !== undefined &&
    after !== undefined &&
    DATE_PARTS.has(before.type) &&
    !DATE_PARTS.has(after.type)
  )
}

// A literal between two segments, with the room either side of it only where
// it takes up room: a direction mark at the start of a time is a literal too,
// and spaced, it moved the value off the label's edge. A space is spaced like
// a slash, since it is what stands between a time and its AM or PM, two
// segments narrow enough to need that room as targets. A comma and its space
// hang off the segment before them instead — see `segmentSeparatorHanging`.
//
// A space standing alone between a date and its time, as Japanese writes
// one, takes the wider room of `segmentSeparatorJoining`. Which literal that
// is depends on the segments either side, so it is read off the field's
// state, which holds the same segment objects React Aria hands this. A
// TimeField has no date, and leaves that state empty.
function SegmentLiteral({ segment }: { segment: Segment }) {
  const state = useContext(DateFieldStateContext)
  const seen = !UNSEEN.test(segment.text)
  const hanging = HANGING.test(segment.text)
  const joining =
    seen &&
    !hanging &&
    state !== null &&
    joinsDateToTime(state.segments, segment)
  return (
    <RACDateSegment
      {...stylex.props(
        segmentStyles.segment,
        segmentStyles.segmentLiteral,
        seen && segmentStyles.segmentSeparator,
        hanging && segmentStyles.segmentSeparatorHanging,
        joining && segmentStyles.segmentSeparatorJoining,
      )}
      segment={segment}
    />
  )
}

export { SegmentLiteral }
