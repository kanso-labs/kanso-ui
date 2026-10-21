'use client'

import type { ReactNode, RefAttributes } from 'react'
import type {
  MeterRenderProps,
  MeterProps as RACMeterProps,
} from 'react-aria-components'

import * as stylex from '@stylexjs/stylex'
import { Meter as RACMeter } from 'react-aria-components'

import type { IndicatorTone } from '../../indicator/styles'

import { CheckCircleGlyph, ErrorGlyph } from '../../glyphs'
import { IndicatorLabels, IndicatorLine } from '../../indicator'
import { indicatorStyles } from '../../indicator/styles'
import { mergeStatefulStyles } from '../../styles/merge'
import { colors } from '../../tokens/design.tokens.stylex'

// A meter is the progress indicators page's line, drawn for a measurement
// rather than for a task: the same three parts at the same 4dp, the same
// label row above them, and the same motion when the number changes. All of
// that is `src/indicator`, shared with ProgressIndicator, so what is here is
// the two things that make it a meter rather than a progress bar.
//
// The first is the role. React Aria's `Meter` reports `meter` rather than
// `progressbar`, and a screen reader says the two differently: one is how
// full something is, the other how far along something is. That difference
// is the whole reason both exist, and it is why a meter has no
// indeterminate state to offer — a measurement whose value is unknown is
// not a measurement.
//
// The second is `tone`. The page draws one colour pair, which is right for
// a task: progress does not become good or bad on its way to done. A
// measurement does — a disk at 96% and a signal at 96% mean opposite
// things — so `negative` and `positive` recolour the active indicator and
// the stop indicator while leaving the track alone. A column of meters then
// reads as one scale with bars of different colours, rather than as several
// gauges that happen to sit together. Which tone a value deserves is the
// call site's to decide: nothing here reads the number and picks one, since
// where the line falls between good and bad is the measurement's own
// business.
//
// Colour alone does not carry it. The two roles are drawn from the same
// tone of their palettes, as error is, so their bars are equally light —
// 1.00:1 in the light theme — and a reader who cannot tell red from green
// sees two bars of one colour, while forced colours paint both in
// `Highlight`. So each draws a glyph before the value as well: an
// exclamation mark in a filled circle for `negative` and a check in one for
// `positive`, at the chips page's 18dp beside label-large text, in the
// tone's own colour. The circles are one outline with a different mark
// inside, which is what tells them apart in grey and under a forced palette.
// No Material Design page draws a meter, so the glyph is this library's;
// it is hidden from a screen reader, which hears the label and the value
// instead, and the tone's JSDoc says to state the status there.
//
// The value is shown by default, where a progress indicator hides it. A
// meter is the number — a bar with no figure beside it says only "some" —
// and `formatOptions` is what makes that figure read as a percentage, bytes
// or a plain count, in the page's locale.

type MeterProps = Omit<RACMeterProps, 'children' | 'className' | 'style'> & {
  /** A function may compute the class from the meter's render state. */
  className?: RACMeterProps['className']
  /**
   * What is being measured, shown above the line. A screen reader reads it
   * as the meter's name; a meter whose surroundings name it takes
   * `aria-label` instead and leaves this out.
   */
  label?: ReactNode
  /**
   * Whether the value is shown beside the label.
   * @default true
   */
  showValue?: boolean
  /** A function may compute the style from the meter's render state. */
  style?: RACMeterProps['style']
  /**
   * Which colours the measurement is drawn in. `primary` states without
   * ranking; `negative` and `positive` say the value is bad or good, and
   * recolour the active indicator and the stop indicator, leaving the track
   * in its secondary container so a column of meters still shares one
   * track. Each also draws a glyph before the value, an exclamation mark
   * for `negative` and a check for `positive`, so the tone reads without
   * its colour. A screen reader hears neither, so say the status in `label`
   * or `valueLabel` as well.
   * @default 'primary'
   */
  tone?: MeterTone
}

const styles = stylex.create({
  // The glyph before the value, centred on the line rather than set on the
  // baseline the figure sits on, which an svg has none of.
  status: {
    alignSelf: 'center',
    blockSize: '18px',
    boxSizing: 'border-box',
    flexShrink: 0,
    inlineSize: '18px',
  },
  statusNegative: {
    color: colors.negative,
  },
  statusPositive: {
    color: colors.positive,
  },
})

// The three of the shared line's four tones a meter draws. The fourth,
// `inherit`, is for an indicator inside something that carries its own
// colour, which is a pending button rather than a measurement.
type MeterTone = Extract<IndicatorTone, 'negative' | 'positive' | 'primary'>

/**
 * How full something is, on a scale it names: disk used, storage left,
 * a rating out of five. Pass `value` between `minValue` and `maxValue`, and
 * `formatOptions` to say how the number reads. For how far along a task is,
 * reach for ProgressIndicator instead — a meter has no indeterminate state,
 * because a measurement always has a value.
 *
 * ```tsx
 * <Meter label="Label" maxValue={5} value={3} />
 * ```
 *
 * The call site's `className` and `style` land on the meter as a whole,
 * which is the element a layout positions.
 */
function Meter({
  label,
  maxValue = 100,
  minValue = 0,
  showValue = true,
  tone = 'primary',
  ...props
}: MeterProps & RefAttributes<HTMLDivElement>) {
  return (
    <RACMeter
      maxValue={maxValue}
      minValue={minValue}
      {...props}
      {...mergeStatefulStyles(stylex.props(indicatorStyles.root), props)}
    >
      {meterContent(label, showValue, tone)}
    </RACMeter>
  )
}

// What the meter draws, from React Aria's render state. Built by a call
// rather than written inline at the prop, which is what react-perf's
// no-new-function-as-prop is after; the React Compiler memoises the result
// on its inputs.
function meterContent(label: ReactNode, showValue: boolean, tone: MeterTone) {
  return (state: MeterRenderProps) => (
    <>
      <IndicatorLabels
        label={label}
        status={statusOf(tone)}
        value={showValue ? state.valueText : undefined}
      />
      <IndicatorLine percentage={state.percentage} tone={tone} />
    </>
  )
}

// The glyph a tone draws before the value — see the comment at the top.
function statusOf(tone: MeterTone) {
  if (tone === 'negative') {
    return (
      <ErrorGlyph {...stylex.props(styles.status, styles.statusNegative)} />
    )
  }
  if (tone === 'positive') {
    return (
      <CheckCircleGlyph
        {...stylex.props(styles.status, styles.statusPositive)}
      />
    )
  }
  return undefined
}

export type { MeterProps, MeterTone }

export default Meter
