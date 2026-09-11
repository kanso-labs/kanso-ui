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
// is only a range's — the band between the two ends — is marked as the
// library's own where it is defined, since the page tokenises no such thing.

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
    blockSize: '40px',
    borderRadius: radii.full,
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
    outlineColor: colors.primary,
    outlineOffset: '2px',
    outlineStyle: { ':focus-visible': 'solid', default: 'none' },
    outlineWidth: '2px',
  },
  // A date the calendar will not take: outside the range, or ruled out by
  // `isDateUnavailable`. The page's own 38% on the content role, which is the
  // same fade every disabled control here takes.
  cellDisabled: {
    backgroundColor: 'transparent',
    color: `color-mix(in srgb, ${colors.onSurface} calc(${stateLayerOpacity.disabledContent} * 100%), ${colors.surfaceContainerHigh})`,
    cursor: 'not-allowed',
  },
  // The days between the two ends of a range. The date pickers page
  // tokenises the docked calendar's selected date but carries nothing for a
  // range's span, so this is the library's own: the secondary container, one
  // step down from the primary the two ends take, which is the same pair the
  // navigation drawer uses for its own active indicator.
  //
  // Square rather than round, so consecutive days join into one band. The two
  // ends round their outer edge back, which is what makes the band start and
  // stop at a circle.
  cellInRange: {
    backgroundColor: {
      ':active': colors.secondaryContainer,
      ':hover': colors.secondaryContainer,
      default: colors.secondaryContainer,
    },
    borderRadius: 0,
    color: colors.onSecondaryContainer,
    // The band fills the whole 48dp its date occupies, rather than the 40dp
    // circle inside it — which is what lets one day's band meet the next
    // one's. A negative margin cannot do this: a margin moves a box without
    // widening it, so an earlier version had one and still drew the band as a
    // dashed run of separate blocks.
    inlineSize: '100%',
    marginInline: 0,
  },
  // The last day, rounded on the side the band ends at.
  cellRangeEnd: {
    borderEndEndRadius: radii.full,
    borderStartEndRadius: radii.full,
  },
  // The first day of a range: a circle on its leading side, square on the
  // side the band continues from.
  cellRangeStart: {
    borderEndStartRadius: radii.full,
    borderStartStartRadius: radii.full,
  },
  // The date the calendar holds. A filled circle in the primary role, which
  // is what the page gives it.
  cellSelected: {
    backgroundColor: {
      ':active': colors.primary,
      ':hover': colors.primary,
      default: colors.primary,
    },
    color: colors.onPrimary,
  },
  // Today, when it is not the date held: the page's 1dp outline in the
  // primary role, with the label to match.
  cellToday: {
    borderColor: colors.primary,
    borderStyle: 'solid',
    borderWidth: '1px',
    color: colors.primary,
  },
  // The chevrons that move the month. The icon buttons page's 40dp square
  // and its state layer, drawn here rather than through IconButton, since
  // React Aria's own Button is what carries the slot.
  chevron: {
    alignItems: 'center',
    backgroundColor: {
      ':active': `color-mix(in srgb, ${colors.onSurfaceVariant} calc(${stateLayerOpacity.pressed} * 100%), transparent)`,
      ':hover': `color-mix(in srgb, ${colors.onSurfaceVariant} calc(${stateLayerOpacity.hover} * 100%), transparent)`,
      default: 'transparent',
    },
    blockSize: '40px',
    borderRadius: radii.full,
    borderWidth: 0,
    boxSizing: 'border-box',
    color: colors.onSurfaceVariant,
    cursor: 'pointer',
    display: 'flex',
    flexShrink: 0,
    inlineSize: '40px',
    justifyContent: 'center',
    // The page's 48dp date container: this 40dp layer with 4dp either side.
    marginInline: spacing.xs,
    outlineColor: colors.primary,
    outlineOffset: '2px',
    outlineStyle: { ':focus-visible': 'solid', default: 'none' },
    outlineWidth: '2px',
    padding: 0,
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
    blockSize: '40px',
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
  // Two months side by side, for a `visibleDuration` of more than one.
  months: {
    display: 'flex',
    gap: spacing.xl,
  },
  // The page's docked container: 360dp on the high surface container. Its
  // height is the grid's own, for the reason in the comment above.
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
