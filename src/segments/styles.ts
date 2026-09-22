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
  // The segments on one line. `FieldValue` around it is what gives the line
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
    outlineColor: { default: null, [FORCED_COLORS]: 'Highlight' },
    outlineOffset: { default: null, [FORCED_COLORS]: '1px' },
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
})

export { segmentStyles }
