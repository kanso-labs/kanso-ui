import * as stylex from '@stylexjs/stylex'

import {
  colors,
  radii,
  spacing,
  stateLayerOpacity,
  typography,
} from '../tokens/design.tokens.stylex'

// The styles Calendar and RangeCalendar both draw. Apart from either
// component so the two cannot drift, and outside `src/components` because a
// directory there is a public component with stories, a barrel entry and a
// `styling.test.tsx` case — which shared styles are none of.
//
// The values are the date pickers page's docked calendar, named in
// `src/components/calendar/index.tsx` along with the departures from it. What
// is only a range's — the band between the two ends — takes its colours from
// the modal date picker's range-selection tokens instead, since the docked
// token set stops at the selected date; see `cellInRange`.
//
// Under forced colours a selected date and a range's band are fills, which
// that mode paints in a system colour, so a calendar showed no selection and
// no range there, only today's outline. Both take `Highlight` with
// `HighlightText` over it, the pair the mode gives whatever is chosen, which
// draws a range as one run from its first day to its last.
//
// They take the pair with `forced-color-adjust: none`. Left to adjust, the
// mode lays a `Canvas` backplate behind every run of text, and a date in
// `HighlightText` on that backplate is a blank box. With it off nothing is
// forced on those cells, so they name a system colour for everything they
// draw — the fill, the date, today's outline and the focus ring. A day ruled
// out or disabled names none, so it hands itself back to the mode.

// One row of the grid. The weekday row and every week of dates are the same
// 40dp, so `cell`, `headerCell` and the room `months` reserves are all this
// one number — a date resized without the reservation following it would put
// the calendar's height back on its month.
const ROW_BLOCK_SIZE = '40px'

// The weeks the grid holds room for, which is the most any month occupies: a
// 31-day month beginning on the last day of a week runs one day, then four
// whole weeks, then two days. February 2026 is the other end at four. Holding
// six draws every month in the box the longest one fills.
const WEEKS_HELD = 6

// Windows High Contrast and the rest of the forced-colours modes. Spelled
// here rather than imported, for the reason src/field/styles.ts records: the
// StyleX compiler resolves a constant across files only out of a `.stylex.ts`
// module, and the generated one holds design tokens rather than queries.
const FORCED_COLORS = '@media (forced-colors: active)'

const calendarStyles = stylex.create({
  // The date itself: the page's 40dp state layer, which is the circle a
  // selected date fills and the shape a hover tints.
  cell: {
    alignItems: 'center',
    backgroundColor: {
      ':active': `color-mix(in srgb, ${colors.onSurface} calc(${stateLayerOpacity.pressed} * 100%), transparent)`,
      ':hover': `color-mix(in srgb, ${colors.onSurface} calc(${stateLayerOpacity.hover} * 100%), transparent)`,
      default: 'transparent',
    },
    blockSize: ROW_BLOCK_SIZE,
    borderRadius: radii.circle,
    boxSizing: 'border-box',
    color: colors.onSurface,
    cursor: 'pointer',
    display: 'flex',
    fontFamily: typography.bodyLargeFont,
    fontSize: typography.bodyLargeSize,
    fontWeight: typography.bodyLargeWeight,
    inlineSize: '40px',
    justifyContent: 'center',
    letterSpacing: typography.bodyLargeTracking,
    lineHeight: typography.bodyLargeLineHeight,
    // The page's 48dp date container: this 40dp layer with 4dp either side.
    marginInline: spacing.xs,
  },
  // A date outside `minValue` and `maxValue`, or in a month either side of
  // the one shown. The page's own 38% on the content role, which is the same
  // fade every disabled control here takes. A date ruled out one at a time is
  // `cellUnavailable` instead, for the reason recorded there.
  cellDisabled: {
    backgroundColor: 'transparent',
    color: `color-mix(in srgb, ${colors.onSurface} calc(${stateLayerOpacity.disabledContent} * 100%), ${colors.surfaceContainerHigh})`,
    cursor: 'not-allowed',
    // Back to the mode's own colours — see the header.
    forcedColorAdjust: { default: null, [FORCED_COLORS]: 'auto' },
  },
  // The days between the two ends of a range, in the modal date picker's
  // range-selection tokens: the secondary container, one step down from the
  // primary the two ends take, with the label in on secondary container and
  // the hover and pressed state layers in on primary container. The docked
  // token set this calendar otherwise follows stops at the selected date, so
  // the band borrows from the modal one, which is where Material draws a
  // range.
  //
  // Square rather than round, so consecutive days join into one band — the
  // library's own shape, where the modal picker draws a 40dp pill. The two
  // ends round their outer edge back, which is what makes the band start and
  // stop at a circle.
  cellInRange: {
    backgroundColor: {
      ':active': `color-mix(in srgb, ${colors.onPrimaryContainer} calc(${stateLayerOpacity.pressed} * 100%), ${colors.secondaryContainer})`,
      ':hover': `color-mix(in srgb, ${colors.onPrimaryContainer} calc(${stateLayerOpacity.hover} * 100%), ${colors.secondaryContainer})`,
      default: colors.secondaryContainer,
      [FORCED_COLORS]: 'Highlight',
    },
    borderColor: { default: colors.primary, [FORCED_COLORS]: 'Highlight' },
    borderRadius: 0,
    color: {
      default: colors.onSecondaryContainer,
      [FORCED_COLORS]: 'HighlightText',
    },
    // The mode's own chosen pair, named rather than forced — see the header.
    // The border is today's outline, drawn into the fill, and the outline is
    // the focus ring, drawn on the page around the cell.
    forcedColorAdjust: { default: null, [FORCED_COLORS]: 'none' },
    // The band fills the whole 48dp its date occupies, rather than the 40dp
    // circle inside it — which is what lets one day's band meet the next
    // one's. A negative margin cannot do this: a margin moves a box without
    // widening it, so an earlier version had one and still drew the band as a
    // dashed run of separate blocks.
    inlineSize: '100%',
    marginInline: 0,
    outlineColor: { default: colors.primary, [FORCED_COLORS]: 'CanvasText' },
  },
  // The last day, rounded on the side the band ends at.
  cellRangeEnd: {
    borderEndEndRadius: radii.circle,
    borderStartEndRadius: radii.circle,
  },
  // The first day of a range: a circle on its leading side, square on the
  // side the band continues from.
  cellRangeStart: {
    borderEndStartRadius: radii.circle,
    borderStartStartRadius: radii.circle,
  },
  // The date the calendar holds. A filled circle in the primary role, with
  // the on-primary state layer over it while hovered or pressed, which is
  // what the page gives it. Each branch is written here because StyleX
  // replaces a property whole: left out, the unselected cell's on-surface
  // layer over nothing would stand in for the fill on hover.
  cellSelected: {
    backgroundColor: {
      ':active': `color-mix(in srgb, ${colors.onPrimary} calc(${stateLayerOpacity.pressed} * 100%), ${colors.primary})`,
      ':hover': `color-mix(in srgb, ${colors.onPrimary} calc(${stateLayerOpacity.hover} * 100%), ${colors.primary})`,
      default: colors.primary,
      [FORCED_COLORS]: 'Highlight',
    },
    borderColor: { default: colors.primary, [FORCED_COLORS]: 'Highlight' },
    color: { default: colors.onPrimary, [FORCED_COLORS]: 'HighlightText' },
    // Named rather than forced, as the band's are — see the header.
    forcedColorAdjust: { default: null, [FORCED_COLORS]: 'none' },
    outlineColor: { default: colors.primary, [FORCED_COLORS]: 'CanvasText' },
  },
  // Today, when it is not the date held: the page's 1dp outline in the
  // primary role, with the label to match.
  cellToday: {
    borderColor: colors.primary,
    borderStyle: 'solid',
    borderWidth: '1px',
    color: colors.primary,
  },
  // A date ruled out one at a time by `isDateUnavailable`. React Aria keeps
  // it focusable, unlike a date outside the bounds, so a reader can land on
  // it and be told it is unavailable — which is why it cannot take
  // `cellDisabled`'s fade: at 38% it would leave a reader on a cell they
  // cannot read, against the 4.5:1 that staying focusable obliges.
  //
  // The strikethrough is the affordance React Aria names for this state, and
  // it is the library's own: the date pickers page carries no treatment for
  // a date that is shown but cannot be taken. It keeps the full content
  // role, so the date stays legible and is still told apart from a date that
  // can be picked.
  cellUnavailable: {
    backgroundColor: 'transparent',
    cursor: 'not-allowed',
    // Back to the mode's own colours — see the header.
    forcedColorAdjust: { default: null, [FORCED_COLORS]: 'auto' },
    textDecorationLine: 'line-through',
  },
  // What the chevrons that move the month add to the shared icon-button
  // chrome in src/styles/icon-button.ts, which is where the reason for
  // drawing that square by hand is recorded.
  chevron: {
    // The page's 48dp column: the shared 40dp square with 4dp either side.
    marginInline: spacing.xs,
  },
  // The one that goes back, which is the forward chevron turned around. It
  // says "back" rather than "to the left", so it mirrors with the writing
  // mode like every other chevron here.
  chevronGlyph: {
    blockSize: '24px',
    inlineSize: '24px',
    transform: { ':dir(rtl)': 'scaleX(-1)', default: 'none' },
  },
  chevronGlyphPrevious: {
    transform: { ':dir(rtl)': 'scaleX(1)', default: 'scaleX(-1)' },
  },
  // The grid. `border-spacing` is what puts the page's 48dp pitch between
  // 40dp circles, rather than a 48dp box drawn around each one.
  grid: {
    borderCollapse: 'separate',
    // Zero, with the room put on each date instead. The page's 48dp comes
    // from a 40dp state layer with 4dp either side, and a range's band has to
    // be able to fill that 48dp — which it cannot do while the gap belongs to
    // the table rather than to the cell.
    borderSpacing: 0,
    inlineSize: '100%',
  },
  // The row the chevrons and the month sit in, at the page's 40dp button
  // height. A `<div>` rather than a `<header>`: a header is a banner
  // landmark, landmarks may not nest, and React Aria puts the calendar in
  // `role="application"` — axe fails the page on it, and the stories run axe
  // as an error.
  header: {
    alignItems: 'center',
    display: 'flex',
    gap: spacing.sm,
    justifyContent: 'space-between',
    minBlockSize: '40px',
  },
  // The weekday row. The page gives it the same body-large the dates take,
  // in the full content role rather than a muted one.
  headerCell: {
    blockSize: ROW_BLOCK_SIZE,
    color: colors.onSurface,
    fontFamily: typography.bodyLargeFont,
    fontSize: typography.bodyLargeSize,
    fontWeight: typography.bodyLargeWeight,
    letterSpacing: typography.bodyLargeTracking,
    lineHeight: typography.bodyLargeLineHeight,
  },
  // The month and year, between the two chevrons.
  heading: {
    color: colors.onSurfaceVariant,
    fontFamily: typography.labelLargeFont,
    fontSize: typography.labelLargeSize,
    fontWeight: typography.labelLargeWeight,
    letterSpacing: typography.labelLargeTracking,
    lineHeight: typography.labelLargeLineHeight,
    margin: 0,
    textAlign: 'center',
  },
  // Two months side by side, for a `visibleDuration` of more than one, and
  // the room the grid is held at.
  //
  // The grids sit at their natural height at the top of that room rather than
  // stretching into it. A stretched table spreads the height it is given
  // across the rows it has, which holds the calendar still while moving every
  // date inside it — February's four weeks drew at a 60px pitch against a
  // six-week month's 40. Two months of different lengths top-align for the
  // same reason.
  months: {
    alignItems: 'start',
    display: 'flex',
    gap: spacing.xl,
    // The weekday row plus six weeks of dates. Left to the month the grid is
    // as tall as its weeks, so the calendar grew by 80px between February
    // 2026 and May, taking whatever sat under it down the page — and inside a
    // picker's popover moving the panel's own edge while it was open.
    minBlockSize: `calc(${ROW_BLOCK_SIZE} * ${WEEKS_HELD} + ${ROW_BLOCK_SIZE})`,
  },
  // The page's docked container: 360dp on the high surface container. Its
  // height follows the room `months` holds, which is what keeps it from month
  // to month.
  root: {
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: radii.lg,
    boxSizing: 'border-box',
    color: colors.onSurface,
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.md,
    inlineSize: 'fit-content',
    minInlineSize: '360px',
    padding: spacing.md,
  },
})

export { calendarStyles }
