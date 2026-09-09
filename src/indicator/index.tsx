import type { ReactNode } from 'react'

import * as stylex from '@stylexjs/stylex'
import { Label } from 'react-aria-components'

import type { IndicatorTone } from './styles'

import { indicatorStyles } from './styles'

// The two pieces a linear indicator is drawn from, shared by
// ProgressIndicator and Meter. The styles they use are in ./styles.ts.

// What each tone draws the active indicator and the stop indicator in.
// `primary` is the style they already carry, so it adds nothing.
const ACTIVE_TONES = {
  inherit: indicatorStyles.inheritActive,
  negative: indicatorStyles.negativeActive,
  positive: indicatorStyles.positiveActive,
  primary: null,
} as const

/**
 * The label and, optionally, the value, on a line above the indicator.
 * React Aria's `Label` reads the surrounding context, so the same element
 * names a progress bar and a meter alike. Renders nothing when there is
 * neither to show.
 */
export function IndicatorLabels({
  label,
  value,
}: {
  label: ReactNode
  value: ReactNode
}) {
  if (label === undefined && value === undefined) {
    return null
  }

  return (
    <div {...stylex.props(indicatorStyles.labels)}>
      {label === undefined ? null : (
        <Label {...stylex.props(indicatorStyles.label)}>{label}</Label>
      )}
      {value === undefined ? null : (
        <span {...stylex.props(indicatorStyles.label)}>{value}</span>
      )}
    </div>
  )
}

/**
 * The page's line: the active indicator at its share of the width, the track
 * taking what is left, and the stop indicator at the end. Anything passed as
 * `children` is drawn inside the track, which is what the progress
 * indicator's buffer fills it with; with none the track is solid.
 */
export function IndicatorLine({
  children,
  percentage,
  tone,
}: {
  children?: ReactNode
  percentage: number
  tone: IndicatorTone
}) {
  const active = ACTIVE_TONES[tone]
  const solid = children === undefined

  return (
    <div {...stylex.props(indicatorStyles.line)}>
      <span
        {...stylex.props(
          indicatorStyles.active,
          indicatorStyles.activeAt(percentage),
          active,
        )}
      />
      <span
        {...stylex.props(
          indicatorStyles.track,
          solid && indicatorStyles.trackSolid,
          solid && tone === 'inherit' && indicatorStyles.inheritTrack,
        )}
      >
        {children}
      </span>
      <span {...stylex.props(indicatorStyles.stop, active)} />
    </div>
  )
}
