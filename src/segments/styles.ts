import * as stylex from '@stylexjs/stylex'

import {
  colors,
  radii,
  spacing,
  stateLayerOpacity,
} from '../tokens/design.tokens.stylex'

// The segments a date or a time is typed into, shared by DateField and
// TimeField. Apart from either component so the two cannot drift, and outside
// `src/components` because a directory there is a public component with
// stories, a barrel entry and a `styling.test.tsx` case — which shared styles
// are none of.

// Windows High Contrast and the rest of the forced-colours modes. Spelled
// here rather than imported, for the reason src/field/styles.ts records: the
// StyleX compiler resolves a constant across files only out of a `.stylex.ts`
// module, and the generated one holds design tokens rather than queries.
const FORCED_COLORS = '@media (forced-colors: active)'

const segmentStyles = stylex.create({
  // The segments on one line. `FieldSegments` around it is what gives the line
  // its place in the box — including the room a floated label needs — so
  // what is left here is only how the segments sit next to each other.
  input: {
    alignItems: 'center',
    boxSizing: 'border-box',
    display: 'flex',
    outlineStyle: 'none',
  },
  // One segment. Its own focus stop, so it carries the focus treatment
  // rather than the box around it.
  segment: {
    borderRadius: radii.xs,
    boxSizing: 'border-box',
    caretColor: 'transparent',
    color: colors.onSurface,
    // What focus becomes under forced colours, where the fill below is gone.
    // That mode paints backgrounds in a system colour, so `segmentFocused`'s
    // filled shape — the only sign of focus this has, since the caret is
    // hidden and the browser's own ring is suppressed on the line above —
    // stops telling one segment from another. An outline is a property the
    // mode keeps, and `Highlight` is the keyword a forced palette gives the
    // thing it marks as active.
    //
    // Drawn inside the segment's own box rather than around it. The line the
    // segments sit on clips them, as an input clips its text, so an outline
    // outside the box was cut away on three sides and left only its corners
    // showing. The inline padding is what it covers, so it meets the digits
    // without crossing them.
    outlineColor: { default: null, [FORCED_COLORS]: 'Highlight' },
    outlineOffset: { default: null, [FORCED_COLORS]: '-2px' },
    outlineStyle: {
      default: 'none',
      [FORCED_COLORS]: { ':focus': 'solid', default: 'none' },
    },
    outlineWidth: { default: null, [FORCED_COLORS]: '2px' },
    paddingInline: spacing.xxs,
    textAlign: 'end',
  },
  // Faded with the rest of the field, and the same 38% every disabled
  // control here takes.
  segmentDisabled: {
    color: `color-mix(in srgb, ${colors.onSurface} calc(${stateLayerOpacity.disabledContent} * 100%), ${colors.surface})`,
  },
  // The one being typed. React Aria hides the caret, so a ring around a
  // segment would be the only sign of focus and a thin one at that — the
  // filled shape is what a selected row uses, and it reads at a glance.
  segmentFocused: {
    backgroundColor: colors.primary,
    color: colors.onPrimary,
  },
  // A literal between two segments — the slash or the colon the locale puts
  // there. Not a focus stop, and not something a reader tabs through.
  segmentLiteral: {
    color: colors.onSurfaceVariant,
    paddingInline: 0,
  },
  // A segment with nothing in it yet, showing its own placeholder.
  segmentPlaceholder: {
    color: colors.onSurfaceVariant,
  },
  // The room either side of a literal that takes up room, which is what
  // keeps the segments apart as targets. A single digit is narrower than the
  // 24 by 24 WCAG 2.5.8 asks of a target, and the criterion lets one that
  // size pass only where a 24px circle centred on it reaches neither the
  // next segment nor that segment's own circle. With the slash drawn tight,
  // the 9 and the 5 of 9/5/2026 sat 19px apart, centre to centre. Spaced
  // here rather than by widening the segments: a segment held at 24 leaves a
  // short value floating in it, which drew the value off the label's edge
  // and the literals at uneven distances, where this spaces every one alike.
  segmentSeparator: {
    paddingInline: spacing.xs,
  },
  // A literal that ends in its own space — the comma between a date and its
  // time — hangs off the segment before it, as the same comma does in prose,
  // so it takes no room on that side. The room was a space before the
  // comma, and it was never needed there: the segment before it is a year,
  // wide enough to clear the hour after it as a target with the room on the
  // comma's far side alone. Its own space adds nothing, since a space at the
  // end of a flex item collapses.
  segmentSeparatorHanging: {
    paddingInlineStart: 0,
  },
  // A space standing alone between a date and its time, as Japanese writes
  // 2026/9/5 9:30. The segments either side of it are a day and an hour,
  // either of which can be a single digit, and with the room a slash takes
  // the 5 and the 9 sat 21px apart, centre to centre, short of the 24 their
  // circles need. Twice that room clears them with some to spare for a face
  // with narrower figures, and sets the time apart from the date as the
  // space between them does. A comma between the two hangs instead, after a
  // year wide enough to need none of this.
  segmentSeparatorJoining: {
    paddingInline: spacing.sm,
  },
})

export { segmentStyles }
