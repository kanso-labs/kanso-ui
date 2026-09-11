import type { ReactElement } from 'react'

import * as stylex from '@stylexjs/stylex'
import {
  DateInput as RACDateInput,
  DateSegment as RACDateSegment,
} from 'react-aria-components'

import { segmentStyles } from './styles'

// How a date or a time is drawn once React Aria has decided what its parts
// are. Shared by DateField and TimeField, which differ only in the value they
// hold: the segments, their order and their number all come from React Aria,
// so what is here is the same for both.

// What React Aria hands the input for each part of the date. Taken off the
// component rather than imported, since the segment type is not on the
// package's public surface.
type Segment = Parameters<
  NonNullable<Parameters<typeof RACDateInput>[0]['children']>
>[0]

// What each segment draws. A literal — the slash or colon between two
// segments — takes a style of its own, since it is punctuation rather than
// something a reader types into.
function renderSegment(segment: Segment): ReactElement {
  if (segment.type === 'literal') {
    return (
      <RACDateSegment
        {...stylex.props(segmentStyles.segment, segmentStyles.segmentLiteral)}
        segment={segment}
      />
    )
  }
  return <RACDateSegment className={segmentClassName} segment={segment} />
}

// A segment's classes, from React Aria's render state. StyleX cannot target
// `[data-placeholder]` on the element it is styling, so the state comes from
// what React Aria hands the className.
//
// The order matters: `disabled` is last, and StyleX replaces a property
// whole, so it wins over both the placeholder and the focused branches.
function segmentClassName(state: {
  isDisabled: boolean
  isFocused: boolean
  isPlaceholder: boolean
}) {
  return (
    stylex.props(
      segmentStyles.segment,
      state.isPlaceholder && segmentStyles.segmentPlaceholder,
      state.isFocused && segmentStyles.segmentFocused,
      state.isDisabled && segmentStyles.segmentDisabled,
    ).className ?? ''
  )
}

export { renderSegment }
