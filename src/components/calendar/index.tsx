import type { CalendarDate } from '@internationalized/date'
import type { ReactElement, ReactNode } from 'react'
import type {
  DateValue,
  CalendarProps as RACCalendarProps,
} from 'react-aria-components'

import * as stylex from '@stylexjs/stylex'
import {
  Button as RACButton,
  Calendar as RACCalendar,
  CalendarCell as RACCalendarCell,
  CalendarGrid as RACCalendarGrid,
  CalendarGridBody as RACCalendarGridBody,
  CalendarGridHeader as RACCalendarGridHeader,
  CalendarHeaderCell as RACCalendarHeaderCell,
  Heading as RACHeading,
} from 'react-aria-components'

import { ChevronEndGlyph } from '../../glyphs'
import { mergeStatefulStyles } from '../../styles/merge'
import {
  colors,
  radii,
  spacing,
  stateLayerOpacity,
  typography,
} from '../../tokens/design.tokens.stylex'

// The date pickers page's docked calendar: a month grid with a circle on the
// selected date and an outline on today. Its values are that page's — a
// 360dp container on the high surface container, 48dp date cells with a 40dp
// state layer inside them, body-large for both the weekday row and the dates,
// primary for the selected circle and for today's outline.
//
// The page's container is 456dp tall, which this does not fix: that height is
// a picker's, counting a headline and an action row the calendar itself does
// not draw. A month grid is as tall as its weeks, and six-week months are
// taller than five-week ones — pinning 456 would crop one or pad the other.
//
// Three things are this component's own.
//
// **The cell is a circle in a square.** The page gives the date a 48dp
// container and a 40dp state layer, which is a 40dp circle with 4dp of room
// around it. The grid's `border-spacing` is what supplies that room, so the
// circle is the element and the square is the space between circles — rather
// than a 48dp box with a 40dp box inside it.
//
// **A date from the month either side is faded because it is disabled, not
// because it is outside.** React Aria marks those cells `data-outside-month`
// and disables them in the same breath, so a treatment keyed on the first
// would never draw anything the second had not already drawn. The disabled
// fade is the page's 38% either way.
//
// **Today reads as today whether or not it is selected.** The page gives it
// an outline and the primary label; selected gives it a filled circle and the
// on-primary label. A selected today takes the fill, since a circle already
// says where you are and two rings would say it twice.
//
// **The month is moved by IconButton's shape rather than by IconButton.**
// React Aria wires `slot="previous"` and `slot="next"` on its own `Button`,
// and IconButton renders React Aria's `Button` too — so nesting one inside
// the slot would put two buttons where the page draws one. The chevrons take
// the standard icon button's 40dp square and its state layer instead.

const styles = stylex.create({
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
    borderSpacing: spacing.xs,
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

type CalendarProps<T extends DateValue> = Omit<
  RACCalendarProps<T>,
  'children' | 'className' | 'style'
> & {
  /** A function may compute the class from the calendar's render state. */
  className?: RACCalendarProps<T>['className']
  /** A function may compute the style from the calendar's render state. */
  style?: RACCalendarProps<T>['style']
}

/**
 * A month calendar for picking a date. The value is React Aria's: pass
 * `value` with `onChange` to control it, or `defaultValue` to let it keep its
 * own, both as an `@internationalized/date` value from this package's
 * `./date` subpath.
 *
 * ```tsx
 * import { today, getLocalTimeZone } from '@kanso-labs/kanso-ui/date'
 *
 * <Calendar aria-label="Label" defaultValue={today(getLocalTimeZone())} />
 * ```
 *
 * `minValue` and `maxValue` bound it, `isDateUnavailable` rules individual
 * dates out, and `visibleDuration` of `{ months: 2 }` draws two months side
 * by side. Name it with `aria-label` or `aria-labelledby`; React Aria
 * composes the visible month into that name itself.
 *
 * The call site's `className` and `style` land on the container, which is the
 * element a layout positions.
 */
function Calendar<T extends DateValue>(props: CalendarProps<T>) {
  return (
    <RACCalendar<T>
      {...props}
      {...mergeStatefulStyles(stylex.props(styles.root), props)}
    >
      {header()}
      <div {...stylex.props(styles.months)}>
        {monthOffsets(props.visibleDuration?.months ?? 1).map((offset) => (
          <RACCalendarGrid
            key={offset.months}
            offset={offset}
            {...stylex.props(styles.grid)}
          >
            <RACCalendarGridHeader>{headerCell}</RACCalendarGridHeader>
            <RACCalendarGridBody>{gridCell}</RACCalendarGridBody>
          </RACCalendarGrid>
        ))}
      </div>
    </RACCalendar>
  )
}

// A date's classes, from React Aria's render state. StyleX cannot target
// `[data-selected]` on the element it is styling, so the state comes from
// what React Aria hands the className.
//
// The order matters. `selected` is applied after `today`, so a selected today
// takes the fill rather than the outline — a circle already says where you
// are, and two rings would say it twice. `disabled` is last of all, and
// StyleX replaces a property whole, so it takes the hover branches with it.
function cellClassName(state: {
  isDisabled: boolean
  isSelected: boolean
  isToday: boolean
}) {
  return (
    stylex.props(
      styles.cell,
      state.isToday && styles.cellToday,
      state.isSelected && styles.cellSelected,
      state.isDisabled && styles.cellDisabled,
    ).className ?? ''
  )
}

function chevronClassName() {
  return stylex.props(styles.chevron).className ?? ''
}

function gridCell(date: CalendarDate): ReactElement {
  return <RACCalendarCell className={cellClassName} date={date} />
}

// The chevrons and the month between them. Written as a call rather than
// inline at the prop, which is what react-perf's jsx-no-jsx-as-prop is after;
// the React Compiler memoises the result on its inputs.
function header(): ReactNode {
  return (
    <div {...stylex.props(styles.header)}>
      <RACButton className={chevronClassName} slot="previous">
        <ChevronEndGlyph
          {...stylex.props(styles.chevronGlyph, styles.chevronGlyphPrevious)}
        />
      </RACButton>
      <RACHeading {...stylex.props(styles.heading)} />
      <RACButton className={chevronClassName} slot="next">
        <ChevronEndGlyph {...stylex.props(styles.chevronGlyph)} />
      </RACButton>
    </div>
  )
}

function headerCell(day: string): ReactElement {
  return (
    <RACCalendarHeaderCell {...stylex.props(styles.headerCell)}>
      {day}
    </RACCalendarHeaderCell>
  )
}

// One offset per visible month, so `visibleDuration` of more than one draws
// the months side by side rather than one grid that scrolls between them.
// React Aria positions each grid from its own offset; the heading names the
// first, which is what its own `Heading` renders.
function monthOffsets(months: number) {
  return Array.from({ length: Math.max(1, months) }, (_unused, index) => ({
    months: index,
  }))
}

export type { CalendarProps }

export default Calendar
