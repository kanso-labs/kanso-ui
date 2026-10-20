import type { ReactNode } from 'react'

import * as stylex from '@stylexjs/stylex'
import { Label } from 'react-aria-components'

import type { IndicatorTone } from './styles'

import { hasContent } from '../render/content'
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
 * names a progress bar and a meter alike. `status` is drawn just before the
 * value, at the end of the line, which is where a meter puts the glyph that
 * says its tone. Renders nothing when there is none of the three to show.
 */
export function IndicatorLabels({
  label,
  status,
  value,
}: {
  label: ReactNode
  status?: ReactNode
  value: ReactNode
}) {
  if (!hasContent(label) && !hasContent(status) && !hasContent(value)) {
    return null
  }

  return (
    <div {...stylex.props(indicatorStyles.labels)}>
      {!hasContent(label) ? null : (
        <Label
          {...stylex.props(indicatorStyles.label, indicatorStyles.labelText)}
        >
          {label}
        </Label>
      )}
      {!hasContent(status) && !hasContent(value) ? null : (
        <span {...stylex.props(indicatorStyles.label, indicatorStyles.value)}>
          {status}
          {value}
        </span>
      )}
    </div>
  )
}

/**
 * The page's line: the active indicator at its share of the width, the track
 * taking what is left, and the stop indicator at the end. Anything passed as
 * `children` is drawn inside the track, which is what the progress
 * indicator's buffer fills it with; with none the track is solid.
 * `activeStyle` is applied to the active indicator last, which is how the
 * progress indicator fades it under a wave.
 */
export function IndicatorLine({
  activeStyle,
  children,
  percentage,
  tone,
}: {
  activeStyle?: stylex.StyleXStyles
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
          activeStyle,
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
