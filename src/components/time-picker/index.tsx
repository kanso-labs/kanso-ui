'use client'

import type { CalendarDateTime, ZonedDateTime } from '@internationalized/date'
import type {
  FocusEvent,
  PointerEvent,
  ReactElement,
  ReactNode,
  RefAttributes,
} from 'react'
import type {
  TimeFieldProps as RACTimeFieldProps,
  Selection,
  TimeFieldState,
  TimeValue,
} from 'react-aria-components'

import {
  getLocalTimeZone,
  Time,
  toCalendarDateTime,
  today,
} from '@internationalized/date'
import * as stylex from '@stylexjs/stylex'
import { useCallback, useContext, useId, useRef, useState } from 'react'
import {
  Heading,
  LabelContext,
  Modal,
  ModalOverlay,
  Button as RACButton,
  DateInput as RACDateInput,
  DateSegment as RACDateSegment,
  Dialog as RACDialog,
  TimeField as RACTimeField,
  TimeFieldStateContext,
  ToggleButton,
  ToggleButtonGroup,
  useLocale,
  useSlottedContext,
} from 'react-aria-components'

import type { FieldVariant } from '../../field'

import { FieldBox, FieldMessage, FieldSegments } from '../../field'
import {
  fieldStyles,
  invalidFrom,
  useFieldValidationBehavior,
} from '../../field/root'
import { ClockGlyph, KeyboardGlyph } from '../../glyphs'
import { useMessages } from '../../i18n'
import { renderSegment } from '../../segments'
import { segmentStyles } from '../../segments/styles'
import { mergeStatefulStyles } from '../../styles/merge'
import { overlay } from '../../styles/overlay'
import { picker, triggerClassName } from '../../styles/picker'
import {
  colors,
  motion,
  radii,
  shadows,
  sizing,
  spacing,
  stateLayerOpacity,
  typography,
} from '../../tokens/design.tokens.stylex'
import Button from '../button'
import IconButton from '../icon-button'

// The time pickers page's picker: TimeField's segments, with a clock button
// in the field's trailing slot that opens the page's modal over a scrim. A
// time is typed into the field or picked in the modal, and the modal's OK is
// what writes a picked time back.
//
// **Modal at every width.** The page has no docked time picker, so unlike
// DatePicker nothing here changes at a breakpoint: the container is centred
// over the scrim on a phone and on a desktop alike.
//
// **The modal is the page's vertical layout, in both of its variants.** The
// dial: a label-medium headline on surface variant, then the time selector —
// an hour and a minute box, 96 by 80dp at the small corner in display-large,
// on surface container highest and on primary container once selected, with
// 24dp for the colon between — and beside them the period selector, 52 by
// 80dp, outlined, its chosen half on tertiary container. Under them, 36dp
// down, the 256dp dial on surface container highest: labels in body-large,
// the 48dp handle and 2dp hand in primary, an 8dp centre, and the label under
// the handle in on primary. The input variant drops the dial and draws the
// boxes as text fields, 96 by 72dp in display-medium, the focused one on
// primary container with a 2dp primary outline, each named underneath in
// body-small, and the period selector at the same 72dp. Both put the
// keyboard or clock toggle at the actions' start and the text buttons at
// their end, inside a container on surface container high at the
// extra-large corner, level 3, with 24dp of padding.
//
// **The boxes are a TimeField of their own**, React Aria's, inside the
// modal: its hour and minute segments drawn as the page's boxes. That makes
// them spinbuttons with React Aria's arrow keys, typing, digits and names in
// the reader's locale, and it is the same accessible model in both variants,
// which differ in how the boxes are drawn rather than in what they are. The
// day period stays a segment for React Aria's sake but is hidden, and the
// period selector beside the boxes takes its place, as a radio group of the
// locale's two words for it. The dial is a pointer affordance over the
// spinbuttons and is hidden from assistive technology: everything it sets,
// the boxes set too.
//
// **The dial does not mirror.** A clock face is the same in either writing
// direction, so it is drawn and read in screen coordinates, three o'clock on
// the right. The row above it follows the field's own order, as TimeField's
// segments do, so in a right-to-left locale the period selector sits on the
// left.
//
// Twenty-four hours put the day's second half on an inner ring, 12 at its top
// and 00 at the outer ring's, with no period selector, and whether there is
// one at all is the reader's locale or `hourCycle`, as it is in TimeField.

const FORCED_COLORS = '@media (forced-colors: active)'

// The dial's geometry, in the units of its viewBox, which it draws at the
// page's 256dp: the radius of the outer and inner rings of labels and of the
// handle that sits on them. The inner ring sits far enough in that a handle on
// it clears the outer ring's labels.
const DIAL = 256
const CENTRE = DIAL / 2
const OUTER_RING = 101
const INNER_RING = 64
const HANDLE = 24

// The period selector's selection, hoisted so each is one stable array
// rather than a fresh one per render.
const MORNING = ['am']
const AFTERNOON = ['pm']

// React Aria's literal segments carry the locale's bidirectional marks beside
// the punctuation, so a literal is drawn only when something else is left.
const INVISIBLE = /[\s؜‎‏‪-‮⁦-⁩]/gu

const scaleIn = stylex.keyframes({
  from: { opacity: 0, transform: 'scale(0.9)' },
  to: { opacity: 1, transform: 'scale(1)' },
})

const styles = stylex.create({
  actions: {
    alignItems: 'center',
    boxSizing: 'border-box',
    display: 'flex',
    gap: spacing.sm,
    justifyContent: 'space-between',
    marginBlockStart: spacing.xl,
  },
  buttons: {
    display: 'flex',
    gap: spacing.sm,
  },
  caption: {
    boxSizing: 'border-box',
    inlineSize: sizing.controlXl,
  },
  captions: {
    boxSizing: 'border-box',
    color: colors.onSurfaceVariant,
    display: 'flex',
    fontFamily: typography.bodySmallFont,
    fontSize: typography.bodySmallSize,
    fontWeight: typography.bodySmallWeight,
    gap: '24px',
    letterSpacing: typography.bodySmallTracking,
    lineHeight: typography.bodySmallLineHeight,
    marginBlockStart: spacing.sm,
  },
  // The scrim centres the container, with a little room at every edge so a
  // narrow window still shows the scrim around it.
  centre: {
    alignItems: 'center',
    display: 'flex',
    justifyContent: 'center',
    padding: spacing.sm,
  },
  // The page's width for the vertical layout, which is its 280dp time
  // selector and 24dp either side. A window narrower than that scrolls the
  // container rather than squeezing the boxes, and so does one too short for
  // the dial.
  container: {
    animationDuration: {
      '@media (prefers-reduced-motion: reduce)': '0s',
      default: motion.durationMedium1,
    },
    animationName: scaleIn,
    animationTimingFunction: motion.easingEmphasizedDecelerate,
    backgroundColor: colors.surfaceContainerHigh,
    // What the container's edge becomes under forced colours, where the
    // shadow is gone and the fill is the page's own — the same border
    // Dialog's container draws for the same reason.
    borderColor: { default: null, [FORCED_COLORS]: 'CanvasText' },
    borderRadius: radii.xl,
    borderStyle: { default: null, [FORCED_COLORS]: 'solid' },
    borderWidth: { default: null, [FORCED_COLORS]: '1px' },
    boxShadow: shadows.elevation3,
    boxSizing: 'border-box',
    color: colors.onSurface,
    inlineSize: '328px',
    maxBlockSize: '100%',
    maxInlineSize: '100%',
    overflow: 'auto',
  },
  dial: {
    blockSize: '256px',
    boxSizing: 'border-box',
    cursor: 'pointer',
    display: 'block',
    flexShrink: 0,
    inlineSize: '256px',
    marginBlockStart: '36px',
    marginInline: 'auto',
    // A drag across the dial moves the hand rather than the page.
    touchAction: 'none',
    userSelect: 'none',
  },
  dialog: {
    padding: spacing.xl,
  },
  // The dial's own disc. Under forced colours it is the page's colour with a
  // ring round it, and the hand, the handle and the label under it take the
  // palette's highlight pair, so the time it shows still reads.
  face: {
    fill: {
      default: colors.surfaceContainerHighest,
      [FORCED_COLORS]: 'Canvas',
    },
    stroke: { default: 'none', [FORCED_COLORS]: 'CanvasText' },
  },
  // The mode toggle's glyph, at the icon size IconButton sets as its font
  // size.
  glyph: {
    blockSize: '1em',
    display: 'block',
    inlineSize: '1em',
  },
  hand: {
    fill: { default: colors.primary, [FORCED_COLORS]: 'Highlight' },
    stroke: { default: colors.primary, [FORCED_COLORS]: 'Highlight' },
    strokeWidth: '2px',
  },
  headline: {
    boxSizing: 'border-box',
    color: colors.onSurfaceVariant,
    fontFamily: typography.labelMediumFont,
    fontSize: typography.labelMediumSize,
    fontWeight: typography.labelMediumWeight,
    letterSpacing: typography.labelMediumTracking,
    lineHeight: typography.labelMediumLineHeight,
    margin: 0,
    marginBlockEnd: '20px',
  },
  input: {
    alignItems: 'center',
    boxSizing: 'border-box',
    display: 'flex',
    outlineStyle: 'none',
  },
  label: {
    fill: { default: colors.onSurface, [FORCED_COLORS]: 'CanvasText' },
    fontFamily: typography.bodyLargeFont,
    fontSize: typography.bodyLargeSize,
    fontWeight: typography.bodyLargeWeight,
    letterSpacing: typography.bodyLargeTracking,
  },
  labelSelected: {
    fill: { default: colors.onPrimary, [FORCED_COLORS]: 'HighlightText' },
  },
  // The period selector: two halves stacked in one outlined box, the
  // locale's morning word above its afternoon one. The outline is a border,
  // which forced colours keep, so it is the boundary in that mode too.
  period: {
    blockSize: '80px',
    borderColor: colors.outline,
    borderRadius: radii.sm,
    borderStyle: 'solid',
    borderWidth: '1px',
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    flexShrink: 0,
    inlineSize: '52px',
    overflow: 'hidden',
  },
  periodButton: {
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderWidth: 0,
    boxSizing: 'border-box',
    color: colors.onSurfaceVariant,
    cursor: 'pointer',
    display: 'flex',
    flexBasis: 0,
    flexGrow: 1,
    fontFamily: typography.titleMediumFont,
    fontSize: typography.titleMediumSize,
    fontWeight: typography.titleMediumWeight,
    justifyContent: 'center',
    letterSpacing: typography.titleMediumTracking,
    lineHeight: typography.titleMediumLineHeight,
    margin: 0,
    // Inside the box, which clips anything drawn past its corners.
    outlineColor: colors.primary,
    outlineOffset: '-2px',
    outlineStyle: 'none',
    outlineWidth: '2px',
    padding: 0,
  },
  periodDivider: {
    borderBlockStartColor: colors.outline,
    borderBlockStartStyle: 'solid',
    borderBlockStartWidth: '1px',
  },
  periodHovered: {
    backgroundColor: `color-mix(in srgb, ${colors.onSurfaceVariant} calc(${stateLayerOpacity.hover} * 100%), transparent)`,
  },
  periodInput: {
    blockSize: sizing.rowMd,
  },
  periodSelected: {
    backgroundColor: {
      default: colors.tertiaryContainer,
      [FORCED_COLORS]: 'Highlight',
    },
    color: {
      default: colors.onTertiaryContainer,
      [FORCED_COLORS]: 'HighlightText',
    },
  },
  periodSelectedHovered: {
    backgroundColor: {
      default: `color-mix(in srgb, ${colors.onTertiaryContainer} calc(${stateLayerOpacity.hover} * 100%), ${colors.tertiaryContainer})`,
      [FORCED_COLORS]: 'Highlight',
    },
  },
  ring: {
    outlineStyle: 'solid',
  },
  row: {
    alignItems: 'flex-start',
    boxSizing: 'border-box',
    display: 'flex',
    gap: spacing.md,
    justifyContent: 'center',
  },
  // An hour or a minute box. Its own focus stop, and a boundary drawn as a
  // border under forced colours, where its fill is gone.
  selector: {
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerHighest,
    blockSize: '80px',
    borderColor: { default: null, [FORCED_COLORS]: 'ButtonText' },
    borderRadius: radii.sm,
    borderStyle: { default: null, [FORCED_COLORS]: 'solid' },
    borderWidth: { default: 0, [FORCED_COLORS]: '1px' },
    boxSizing: 'border-box',
    caretColor: 'transparent',
    color: colors.onSurface,
    cursor: 'pointer',
    display: 'inline-flex',
    fontFamily: typography.displayLargeFont,
    fontSize: typography.displayLargeSize,
    fontVariantNumeric: 'tabular-nums',
    fontWeight: typography.displayLargeWeight,
    inlineSize: sizing.controlXl,
    justifyContent: 'center',
    letterSpacing: typography.displayLargeTracking,
    lineHeight: typography.displayLargeLineHeight,
    outlineColor: colors.primary,
    outlineOffset: '2px',
    outlineStyle: 'none',
    outlineWidth: '2px',
  },
  selectorHovered: {
    backgroundColor: `color-mix(in srgb, ${colors.onSurface} calc(${stateLayerOpacity.hover} * 100%), ${colors.surfaceContainerHighest})`,
  },
  // The input variant's box: the text field the page draws there, which is
  // shorter and set a size down.
  selectorInput: {
    blockSize: sizing.rowMd,
    cursor: 'text',
    fontFamily: typography.displayMediumFont,
    fontSize: typography.displayMediumSize,
    fontWeight: typography.displayMediumWeight,
    letterSpacing: typography.displayMediumTracking,
    lineHeight: typography.displayMediumLineHeight,
  },
  // The focused text field's outline, drawn inside the box.
  selectorInputFocused: {
    outlineOffset: '-2px',
    outlineStyle: 'solid',
  },
  selectorSelected: {
    backgroundColor: {
      default: colors.primaryContainer,
      [FORCED_COLORS]: 'Highlight',
    },
    color: {
      default: colors.onPrimaryContainer,
      [FORCED_COLORS]: 'HighlightText',
    },
  },
  selectorSelectedHovered: {
    backgroundColor: {
      default: `color-mix(in srgb, ${colors.onPrimaryContainer} calc(${stateLayerOpacity.hover} * 100%), ${colors.primaryContainer})`,
      [FORCED_COLORS]: 'Highlight',
    },
  },
  // The colon between the boxes, on the boxes' line and in their type.
  separator: {
    alignItems: 'center',
    blockSize: '80px',
    boxSizing: 'border-box',
    color: colors.onSurface,
    display: 'inline-flex',
    fontFamily: typography.displayLargeFont,
    fontSize: typography.displayLargeSize,
    fontWeight: typography.displayLargeWeight,
    inlineSize: '24px',
    justifyContent: 'center',
    lineHeight: typography.displayLargeLineHeight,
  },
  separatorInput: {
    blockSize: sizing.rowMd,
    fontFamily: typography.displayMediumFont,
    fontSize: typography.displayMediumSize,
    fontWeight: typography.displayMediumWeight,
    lineHeight: typography.displayMediumLineHeight,
  },
})

// One label on the dial, placed on its ring.
type DialLabel = {
  isSelected: boolean
  key: string
  text: string
  x: number
  y: number
}

// The state React Aria hands a half of the period selector's className.
type PeriodState = {
  isFocusVisible: boolean
  isHovered: boolean
  isSelected: boolean
}

// What React Aria hands the input for each part of the time. Taken off the
// component, for the reason src/segments gives.
type Segment = Parameters<
  NonNullable<Parameters<typeof RACDateInput>[0]['children']>
>[0]

// The state React Aria hands a segment's className.
type SegmentState = {
  isFocused: boolean
  isFocusVisible: boolean
  isHovered: boolean
}

// The parts of a time the dial and the boxes set.
type TimePart = 'hour' | 'minute'

/** Which of the time pickers page's two variants the modal shows. */
type TimePickerMode = 'dial' | 'input'

type TimePickerProps<T extends TimeValue = TimeValue> = Omit<
  RACTimeFieldProps<T>,
  'children' | 'className' | 'style'
> & {
  /**
   * What the modal's dismissing action says. Left out, it is the word for
   * it in the I18nProvider's locale — "Cancel" in English.
   */
  cancelLabel?: string
  /** A function may compute the class from the field's render state. */
  className?: RACTimeFieldProps<T>['className']
  /**
   * What the modal's confirming action says. Left out, it is the word for
   * it in the I18nProvider's locale — "OK" in English.
   */
  confirmLabel?: string
  /**
   * Where to portal the modal and its scrim. Defaults to the end of
   * `<body>`, which is right for an app that sets its StyleX theme on
   * `:root`. An app that scopes the theme to a subtree has to point this at
   * an element inside it, or the modal renders outside the theme and falls
   * back to the tokens' `prefers-color-scheme` default.
   */
  container?: Element
  /**
   * Which variant the modal opens on: the dial, or the boxes as text fields
   * to type into. The button at the modal's start switches between them.
   * @default 'dial'
   */
  defaultMode?: TimePickerMode
  /** Whether the modal starts open, when it keeps its own state. */
  defaultOpen?: boolean
  /** Supporting text under the field. */
  description?: string
  /**
   * The input variant's headline, which also names the button that switches
   * the dial to it. Left out, it is the I18nProvider's locale's — "Enter
   * time" in English.
   */
  enterTimeLabel?: string
  /**
   * The message shown instead of the description, which also marks the
   * field invalid.
   *
   * Outside a `Form` the message line arrives with the message, so the
   * field grows when this does and moves what is under it. A `Form` holds
   * that space from the start; so does a permanent `description`.
   */
  error?: string
  /**
   * Whether the label floats into the box's top once the field holds a
   * value, rather than sitting above it.
   * @default true
   */
  floatingLabel?: boolean
  /** Whether the modal is open, when the call site holds the state. */
  isOpen?: boolean
  /** What the field is for. Always rendered; never a placeholder. */
  label: string
  /**
   * An icon at the box's leading end, in the page's 24dp size. An icon drawn
   * in `em` takes that size from the slot.
   */
  leadingIcon?: ReactNode
  /** Called with the modal's new state when it opens or closes. */
  onOpenChange?: (isOpen: boolean) => void
  /**
   * The dial's headline, which also names the clock button that opens the
   * modal, followed by the field's label, and the button that switches the
   * input variant back. Left out, it is the I18nProvider's locale's —
   * "Select time" in English.
   */
  selectTimeLabel?: string
  /** A function may compute the style from the field's render state. */
  style?: RACTimeFieldProps<T>['style']
  /**
   * Which of the text fields page's two boxes to draw.
   * @default 'filled'
   */
  variant?: FieldVariant
}

/**
 * A picked time as the field's state takes it, which is always a date and
 * time: React Aria puts a bare time on today and takes the date off again on
 * the way out.
 */
function asDateTime(time: TimeValue): CalendarDateTime | ZonedDateTime {
  return 'day' in time
    ? time
    : toCalendarDateTime(today(getLocalTimeZone()), time)
}

// An hour or a minute box's classes, from React Aria's render state. On the
// dial the selected box is the one the dial follows; typed into, it is the
// one with focus, which is what the page's input variant draws as focused.
function boxClassName(isDial: boolean, isFollowed: boolean) {
  return (state: SegmentState) => {
    const isSelected = isDial ? isFollowed : state.isFocused
    return (
      stylex.props(
        styles.selector,
        !isDial && styles.selectorInput,
        state.isHovered && styles.selectorHovered,
        isSelected && styles.selectorSelected,
        isSelected && state.isHovered && styles.selectorSelectedHovered,
        isDial && state.isFocusVisible && styles.ring,
        !isDial && state.isFocused && styles.selectorInputFocused,
      ).className ?? ''
    )
  }
}

// Built by a call rather than written inline at the prop, which is what
// react-perf's no-jsx-as-prop is after — the same reason DatePicker builds
// its trigger this way.
function clockTrigger(
  isDisabled: boolean,
  isOpen: boolean,
  label: string,
  onPress: () => void,
) {
  return (
    <ClockTrigger
      isDisabled={isDisabled}
      isOpen={isOpen}
      label={label}
      onPress={onPress}
    />
  )
}

// The clock button in the field's trailing slot. It is named by its own
// words followed by the field's label, which is how React Aria names
// DatePicker's calendar button, so two pickers on a form are told apart.
function ClockTrigger({
  isDisabled,
  isOpen,
  label,
  onPress,
}: {
  isDisabled: boolean
  isOpen: boolean
  label: string
  onPress: () => void
}) {
  const id = useId()
  const fieldLabel = useSlottedContext(LabelContext)

  return (
    <RACButton
      aria-expanded={isOpen}
      aria-haspopup="dialog"
      aria-label={label}
      aria-labelledby={
        fieldLabel?.id === undefined ? undefined : `${id} ${fieldLabel.id}`
      }
      className={triggerClassName}
      id={id}
      isDisabled={isDisabled}
      onPress={onPress}
    >
      <ClockGlyph {...stylex.props(picker.triggerGlyph)} />
    </RACButton>
  )
}

/** One label, placed a fraction of a turn round a ring. */
function dialLabel(
  key: string,
  text: string,
  isSelected: boolean,
  turn: number,
  radius: number,
): DialLabel {
  const { x, y } = polar(turn, radius)
  return { isSelected, key, text, x, y }
}

/** A field's name as the locale writes it, opening with a capital. */
function fieldName(names: Intl.DisplayNames, field: string, locale: string) {
  const name = names.of(field) ?? field
  return name.charAt(0).toLocaleUpperCase(locale) + name.slice(1)
}

/**
 * The time the modal opens on: the field's own, else its placeholder, else
 * midnight. A date and time keeps its date, so the field gets back what it
 * holds.
 */
function initialTime(
  field: null | TimeFieldState,
  placeholderValue: TimeValue | undefined,
): TimeValue {
  const held = field?.value
  if (held !== null && held !== undefined && 'hour' in held) {
    return held
  }
  return placeholderValue ?? new Time()
}

/** The labels the dial draws for one part, in the reader's digits. */
function labelsFor(
  part: TimePart,
  time: TimeValue,
  locale: string,
  twelveHour: boolean,
): DialLabel[] {
  const steps = Array.from({ length: 12 }, (_, step) => step)

  if (part === 'minute') {
    const digits = new Intl.NumberFormat(locale, { minimumIntegerDigits: 2 })
    return steps.map((step) =>
      dialLabel(
        `m${step}`,
        digits.format(step * 5),
        time.minute === step * 5,
        step / 12,
        OUTER_RING,
      ),
    )
  }

  const hours = new Intl.DateTimeFormat(locale, {
    hour: 'numeric',
    hour12: twelveHour,
  })
  if (twelveHour) {
    const offset = time.hour >= 12 ? 12 : 0
    return steps.map((step) =>
      dialLabel(
        `h${step}`,
        partOf(hours, step + offset, 'hour'),
        time.hour % 12 === step,
        step / 12,
        OUTER_RING,
      ),
    )
  }
  return [
    ...steps.map((step) =>
      dialLabel(
        `h${step}`,
        partOf(hours, step, 'hour'),
        time.hour === step,
        step / 12,
        OUTER_RING,
      ),
    ),
    ...steps.map((step) =>
      dialLabel(
        `h${step + 12}`,
        partOf(hours, step + 12, 'hour'),
        time.hour === step + 12,
        step / 12,
        INNER_RING,
      ),
    ),
  ]
}

/** The part of a formatted time a formatter writes for one hour of the day. */
function partOf(
  format: Intl.DateTimeFormat,
  hour: number,
  type: 'dayPeriod' | 'hour',
) {
  return (
    format
      .formatToParts(new Date(2000, 0, 1, hour))
      .find((part) => part.type === type)?.value ?? String(hour)
  )
}

// The period selector's morning half, with no rule above it.
function periodAmClassName(state: PeriodState) {
  return periodClassName(state, false)
}

// A half of the period selector, from React Aria's render state. The second
// half draws the rule between the two.
function periodClassName(state: PeriodState, divider: boolean) {
  return (
    stylex.props(
      styles.periodButton,
      divider && styles.periodDivider,
      state.isHovered && styles.periodHovered,
      state.isSelected && styles.periodSelected,
      state.isSelected && state.isHovered && styles.periodSelectedHovered,
      state.isFocusVisible && styles.ring,
    ).className ?? ''
  )
}

// Its afternoon half, under the rule between the two.
function periodPmClassName(state: PeriodState) {
  return periodClassName(state, true)
}

/** Where a fraction of a turn clockwise from twelve lands on a ring. */
function polar(turn: number, radius: number) {
  const angle = turn * 2 * Math.PI
  return {
    x: CENTRE + radius * Math.sin(angle),
    y: CENTRE - radius * Math.cos(angle),
  }
}

/**
 * A time typed into a field, or picked in a modal behind the clock button
 * at the field's end — on a dial, or typed into the modal's larger boxes.
 * The value is React Aria's — pass `value` with `onChange` to control it,
 * or `defaultValue` — as a `Time` from this package's `./date` subpath.
 *
 * ```tsx
 * import { Time } from '@kanso-labs/kanso-ui/date'
 *
 * <TimePicker defaultValue={new Time(9, 30)} label="Label" />
 * ```
 *
 * The field is `TimeField`'s, so `granularity`, `hourCycle`, `minValue` and
 * `maxValue` behave as they do there. The modal sets hours and minutes and
 * keeps the seconds a value already has; a time it writes back is checked
 * against the bounds as a typed one is. Whether it shows a twelve or
 * twenty-four hour clock is the reader's locale, through React Aria's
 * `I18nProvider`, unless `hourCycle` says otherwise.
 *
 * The call site's `className` and `style` land on the field as a whole,
 * which is the element a layout positions.
 */
function TimePicker<T extends TimeValue>({
  cancelLabel,
  confirmLabel,
  container,
  defaultMode = 'dial',
  defaultOpen = false,
  description,
  enterTimeLabel,
  error,
  floatingLabel = true,
  isDisabled = false,
  isOpen,
  isReadOnly = false,
  label,
  leadingIcon,
  onOpenChange,
  selectTimeLabel,
  variant = 'filled',
  ...props
}: RefAttributes<HTMLDivElement> & TimePickerProps<T>) {
  const validationBehavior = useFieldValidationBehavior()
  const messages = useMessages()
  const [ownOpen, setOwnOpen] = useState(defaultOpen)
  const open = isOpen ?? ownOpen

  const changeOpen = useCallback(
    (next: boolean) => {
      if (isOpen === undefined) {
        setOwnOpen(next)
      }
      onOpenChange?.(next)
    },
    [isOpen, onOpenChange],
  )

  const openModal = useCallback(() => {
    changeOpen(true)
  }, [changeOpen])

  return (
    <RACTimeField<T>
      isDisabled={isDisabled}
      isInvalid={invalidFrom(error)}
      isReadOnly={isReadOnly}
      validationBehavior={validationBehavior}
      {...props}
      {...mergeStatefulStyles(stylex.props(fieldStyles.root), props)}
    >
      <FieldBox
        floatingLabel={floatingLabel}
        // Always populated, for the reason TimeField's own comment gives.
        isPopulated
        isRequired={props.isRequired}
        label={label}
        leading={leadingIcon}
        // In the chrome's trailing slot, where DatePicker puts its calendar
        // button and for the same reasons.
        trailing={clockTrigger(
          isDisabled || isReadOnly,
          open,
          selectTimeLabel ?? messages.selectTime,
          openModal,
        )}
        variant={variant}
      >
        <FieldSegments>
          <RACDateInput {...stylex.props(segmentStyles.input)}>
            {renderSegment}
          </RACDateInput>
        </FieldSegments>
      </FieldBox>
      <FieldMessage description={description} error={error} />
      <ModalOverlay
        isDismissable
        isOpen={open}
        onOpenChange={changeOpen}
        // oxlint-disable-next-line typescript/no-deprecated -- its replacement, UNSAFE_PortalProvider, is not exported by react-aria-components
        UNSTABLE_portalContainer={container}
        {...stylex.props(overlay.scrim, styles.centre)}
      >
        <Modal {...stylex.props(styles.container)}>
          <TimePickerDialog
            cancelLabel={cancelLabel ?? messages.cancel}
            confirmLabel={confirmLabel ?? messages.confirm}
            defaultMode={defaultMode}
            enterTimeLabel={enterTimeLabel ?? messages.enterTime}
            fieldLabel={label}
            granularity={props.granularity === 'hour' ? 'hour' : 'minute'}
            hourCycle={props.hourCycle}
            placeholderValue={props.placeholderValue}
            selectTimeLabel={selectTimeLabel ?? messages.selectTime}
          />
        </Modal>
      </ModalOverlay>
    </RACTimeField>
  )
}

/**
 * The modal's content, mounted each time it opens: the time it was opened
 * with is its draft until OK writes the draft into the field, or the modal
 * closes without it.
 */
function TimePickerDialog({
  cancelLabel,
  confirmLabel,
  defaultMode,
  enterTimeLabel,
  fieldLabel,
  granularity,
  hourCycle,
  placeholderValue,
  selectTimeLabel,
}: {
  cancelLabel: string
  confirmLabel: string
  defaultMode: TimePickerMode
  enterTimeLabel: string
  fieldLabel: string
  granularity: 'hour' | 'minute'
  hourCycle: 12 | 24 | undefined
  placeholderValue: TimeValue | undefined
  selectTimeLabel: string
}) {
  const { locale } = useLocale()
  // The outer field's state: the modal reads the time from it and writes the
  // picked one back through it, so the field stays the one owner of its
  // value, controlled or not, and its onChange is React Aria's own.
  const field = useContext(TimeFieldStateContext)
  const [draft, setDraft] = useState(() => initialTime(field, placeholderValue))
  const [mode, setMode] = useState(defaultMode)
  const [part, setPart] = useState<TimePart>('hour')
  const headingId = useId()
  const labelContext = useSlottedContext(LabelContext)
  const boxes = useRef<HTMLDivElement>(null)
  const dragging = useRef(false)

  const twelveHour = usesTwelveHours(locale, hourCycle)
  const names = new Intl.DisplayNames(locale, { type: 'dateTimeField' })
  const periods = new Intl.DateTimeFormat(locale, {
    hour: 'numeric',
    hour12: true,
  })
  const isAfternoon = draft.hour >= 12
  const isDial = mode === 'dial'
  const showsMinutes = granularity === 'minute'
  const shown: TimePart = showsMinutes ? part : 'hour'
  const handle =
    shown === 'minute'
      ? polar(draft.minute / 60, OUTER_RING)
      : polar(
          (draft.hour % 12) / 12,
          !twelveHour && draft.hour >= 12 ? INNER_RING : OUTER_RING,
        )

  const focusBox = useCallback((type: TimePart) => {
    const box = boxes.current?.querySelector(`[data-type="${type}"]`)
    if (box instanceof HTMLElement) {
      box.focus()
    }
  }, [])

  // Which box the dial follows, taken from the box that has focus — a press
  // on a box, a Tab into it, or React Aria moving on once an hour is typed.
  const followFocus = useCallback((event: FocusEvent<HTMLDivElement>) => {
    const type = event.target.getAttribute('data-type')
    if (type === 'hour' || type === 'minute') {
      setPart(type)
    }
  }, [])

  const changeDraft = useCallback((next: null | TimeValue) => {
    if (next !== null) {
      setDraft(next)
    }
  }, [])

  const pick = useCallback(
    (event: PointerEvent<SVGSVGElement>) => {
      const box = event.currentTarget.getBoundingClientRect()
      const x = event.clientX - box.left - box.width / 2
      const y = event.clientY - box.top - box.height / 2
      const turn = (Math.atan2(x, -y) / (2 * Math.PI) + 1) % 1
      const distance = (Math.hypot(x, y) * DIAL) / box.width

      if (shown === 'minute') {
        setDraft(draft.set({ minute: Math.round(turn * 60) % 60 }))
        return
      }
      const step = Math.round(turn * 12) % 12
      if (twelveHour) {
        setDraft(draft.set({ hour: step + (isAfternoon ? 12 : 0) }))
        return
      }
      const inner = distance < (OUTER_RING + INNER_RING) / 2
      setDraft(draft.set({ hour: inner ? step + 12 : step }))
    },
    [draft, isAfternoon, shown, twelveHour],
  )

  const startPicking = useCallback(
    (event: PointerEvent<SVGSVGElement>) => {
      if (event.pointerType === 'mouse' && event.button !== 0) {
        return
      }
      // Keeps focus where it is: the dial is not a focus stop, and a press on
      // it would otherwise blur the box it is setting.
      event.preventDefault()
      try {
        event.currentTarget.setPointerCapture(event.pointerId)
      } catch {
        // A pointer the browser is not tracking has no capture to take — a
        // synthetic event in a test, where the moves land on the dial anyway.
      }
      dragging.current = true
      pick(event)
    },
    [pick],
  )

  const continuePicking = useCallback(
    (event: PointerEvent<SVGSVGElement>) => {
      if (dragging.current) {
        pick(event)
      }
    },
    [pick],
  )

  // An hour picked on the dial moves on to the minutes, as the page does.
  const stopPicking = useCallback(() => {
    if (!dragging.current) {
      return
    }
    dragging.current = false
    if (shown === 'hour' && showsMinutes) {
      setPart('minute')
      focusBox('minute')
    }
  }, [focusBox, shown, showsMinutes])

  const switchMode = useCallback(() => {
    setMode(isDial ? 'input' : 'dial')
    focusBox(part)
  }, [focusBox, isDial, part])

  const choosePeriod = useCallback(
    (keys: Selection) => {
      const afternoon = keys !== 'all' && keys.has('pm')
      if (afternoon !== isAfternoon) {
        setDraft(draft.set({ hour: (draft.hour % 12) + (afternoon ? 12 : 0) }))
      }
    },
    [draft, isAfternoon],
  )

  // OK writes the draft through the field's state, and its `slot` closes the
  // modal after.
  const confirm = useCallback(() => {
    field?.setValue(asDateTime(draft))
  }, [draft, field])

  const renderBox = useCallback(
    (segment: Segment): ReactElement => {
      if (segment.type === 'hour' || segment.type === 'minute') {
        return (
          <RACDateSegment
            className={boxClassName(isDial, shown === segment.type)}
            segment={segment}
          />
        )
      }
      if (
        segment.type === 'literal' &&
        segment.text.replaceAll(INVISIBLE, '') !== ''
      ) {
        return (
          <RACDateSegment
            {...stylex.props(
              styles.separator,
              !isDial && styles.separatorInput,
            )}
            segment={segment}
          />
        )
      }
      return <RACDateSegment hidden segment={segment} />
    },
    [isDial, shown],
  )

  const labels = labelsFor(shown, draft, locale, twelveHour)
  const between = shown === 'minute' && draft.minute % 5 !== 0

  return (
    <RACDialog
      aria-labelledby={
        labelContext?.id === undefined
          ? headingId
          : `${headingId} ${labelContext.id}`
      }
      {...stylex.props(overlay.modalDialog, styles.dialog)}
    >
      <Heading id={headingId} level={2} {...stylex.props(styles.headline)}>
        {isDial ? selectTimeLabel : enterTimeLabel}
      </Heading>
      <div {...stylex.props(styles.row)}>
        <div onFocus={followFocus} ref={boxes}>
          <RACTimeField
            aria-label={fieldLabel}
            granularity={granularity}
            hideTimeZone
            hourCycle={hourCycle}
            onChange={changeDraft}
            shouldForceLeadingZeros
            validationBehavior="aria"
            value={draft}
          >
            <RACDateInput {...stylex.props(styles.input)}>
              {renderBox}
            </RACDateInput>
          </RACTimeField>
          {isDial ? null : (
            <div aria-hidden="true" {...stylex.props(styles.captions)}>
              <span {...stylex.props(styles.caption)}>
                {fieldName(names, 'hour', locale)}
              </span>
              {showsMinutes ? (
                <span {...stylex.props(styles.caption)}>
                  {fieldName(names, 'minute', locale)}
                </span>
              ) : null}
            </div>
          )}
        </div>
        {twelveHour ? (
          <ToggleButtonGroup
            aria-label={names.of('dayPeriod')}
            disallowEmptySelection
            onSelectionChange={choosePeriod}
            orientation="vertical"
            selectedKeys={isAfternoon ? AFTERNOON : MORNING}
            selectionMode="single"
            {...stylex.props(styles.period, !isDial && styles.periodInput)}
          >
            <ToggleButton className={periodAmClassName} id="am">
              {partOf(periods, 9, 'dayPeriod')}
            </ToggleButton>
            <ToggleButton className={periodPmClassName} id="pm">
              {partOf(periods, 21, 'dayPeriod')}
            </ToggleButton>
          </ToggleButtonGroup>
        ) : null}
      </div>
      {isDial ? (
        <svg
          aria-hidden="true"
          data-dial={shown}
          onPointerCancel={stopPicking}
          onPointerDown={startPicking}
          onPointerMove={continuePicking}
          onPointerUp={stopPicking}
          viewBox={`0 0 ${DIAL} ${DIAL}`}
          {...stylex.props(styles.dial)}
        >
          <circle
            cx={CENTRE}
            cy={CENTRE}
            r={CENTRE - 1}
            {...stylex.props(styles.face)}
          />
          <line
            x1={CENTRE}
            x2={handle.x}
            y1={CENTRE}
            y2={handle.y}
            {...stylex.props(styles.hand)}
          />
          <circle
            cx={CENTRE}
            cy={CENTRE}
            r={4}
            {...stylex.props(styles.hand)}
          />
          <circle
            cx={handle.x}
            cy={handle.y}
            data-handle=""
            r={HANDLE}
            {...stylex.props(styles.hand)}
          />
          {between ? (
            <circle
              cx={handle.x}
              cy={handle.y}
              r={2}
              {...stylex.props(styles.labelSelected)}
            />
          ) : null}
          {labels.map((label) => (
            <text
              dominantBaseline="central"
              key={label.key}
              textAnchor="middle"
              x={label.x}
              y={label.y}
              {...stylex.props(
                styles.label,
                label.isSelected && styles.labelSelected,
              )}
            >
              {label.text}
            </text>
          ))}
        </svg>
      ) : null}
      <div {...stylex.props(styles.actions)}>
        <IconButton
          aria-label={isDial ? enterTimeLabel : selectTimeLabel}
          onPress={switchMode}
        >
          {isDial ? (
            <KeyboardGlyph {...stylex.props(styles.glyph)} />
          ) : (
            <ClockGlyph {...stylex.props(styles.glyph)} />
          )}
        </IconButton>
        <div {...stylex.props(styles.buttons)}>
          <Button slot="close" variant="text">
            {cancelLabel}
          </Button>
          <Button onPress={confirm} slot="close" variant="text">
            {confirmLabel}
          </Button>
        </div>
      </div>
    </RACDialog>
  )
}

/**
 * Whether the reader's clock has twelve hours. `hourCycle` decides when it
 * is given, as it does for React Aria's segments; otherwise the locale does.
 */
function usesTwelveHours(locale: string, hourCycle: 12 | 24 | undefined) {
  if (hourCycle !== undefined) {
    return hourCycle === 12
  }
  return (
    new Intl.DateTimeFormat(locale, { hour: 'numeric' }).resolvedOptions()
      .hour12 ?? false
  )
}

export type { TimePickerMode, TimePickerProps }

export default TimePicker
