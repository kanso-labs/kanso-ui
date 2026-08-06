import { describe, expect, it } from 'vitest'

import tokens from './design.tokens.json'
import { motionDurationMs, motionEasing, spacingPx } from './values'

const { duration, easing } = tokens.motion
const spacingSource = tokens.spacing.primitive

// Named rather than derived from Object.keys, so the source side is reached by
// real property access and a renamed token fails to compile here. The count
// check below is what keeps the tables complete.
const DURATIONS: [step: string, generated: number, source: string][] = [
  ['short1', motionDurationMs.short1, duration.short1.$value],
  ['short2', motionDurationMs.short2, duration.short2.$value],
  ['short3', motionDurationMs.short3, duration.short3.$value],
  ['medium1', motionDurationMs.medium1, duration.medium1.$value],
  ['medium2', motionDurationMs.medium2, duration.medium2.$value],
  ['medium3', motionDurationMs.medium3, duration.medium3.$value],
  ['long1', motionDurationMs.long1, duration.long1.$value],
  ['long2', motionDurationMs.long2, duration.long2.$value],
  ['long3', motionDurationMs.long3, duration.long3.$value],
]

const EASINGS: [curve: string, generated: string, source: number[]][] = [
  ['emphasized', motionEasing.emphasized, easing.emphasized.$value],
  [
    'emphasizedDecelerate',
    motionEasing.emphasizedDecelerate,
    easing.emphasizedDecelerate.$value,
  ],
  [
    'emphasizedAccelerate',
    motionEasing.emphasizedAccelerate,
    easing.emphasizedAccelerate.$value,
  ],
  ['standard', motionEasing.standard, easing.standard.$value],
  ['springFast', motionEasing.springFast, easing.springFast.$value],
  ['springSlow', motionEasing.springSlow, easing.springSlow.$value],
]

// values.ts is generated, so its values cannot drift from
// design.tokens.json the way a hand-copied constant would. What can still go
// wrong is the conversion: durations are authored as CSS strings ('450ms') and
// have to reach element.animate() and setTimeout as numbers, and a parse that
// is wrong but well-formed — 45 for '450ms', say — would pass the build and
// quietly retime every component that uses it.
//
// A malformed duration is already caught at build time, where durationToMs
// throws rather than emitting NaN. These cover the other half.
describe('generated motion values', () => {
  it.each(DURATIONS)(
    'states duration.%s as the same number of milliseconds',
    (_step, generated, source) => {
      expect(`${generated}ms`).toBe(source)
    },
  )

  // Assembled the way the CSS side assembles it from the token's four control
  // points, so both generated forms of one token are held to the same source.
  it.each(EASINGS)(
    'renders easing.%s as the same cubic-bezier',
    (_curve, generated, source) => {
      expect(generated).toBe(`cubic-bezier(${source.join(', ')})`)
    },
  )

  // Guards the failure mode the numbers exist to avoid: setTimeout treats a
  // NaN delay as zero, so a bad value would collapse the ripple's touch delay
  // silently rather than throwing anywhere a test would notice.
  it('exposes every duration as a usable finite number', () => {
    for (const ms of Object.values(motionDurationMs)) {
      expect(Number.isFinite(ms)).toBe(true)
    }
  })

  // A token added to the set but not to the tables above would otherwise be
  // generated and never checked.
  it('covers every generated duration and easing', () => {
    expect(DURATIONS).toHaveLength(Object.keys(motionDurationMs).length)
    expect(EASINGS).toHaveLength(Object.keys(motionEasing).length)
  })

  // Spacing goes through the same conversion for the same reason: useRipple
  // adds it to a radius, so it has to arrive as a number. The component scale
  // is an alias layer over the primitives, so each step is checked against the
  // primitive it points at.
  it.each([
    ['xxs', spacingPx.xxs, spacingSource[2].$value],
    ['xs', spacingPx.xs, spacingSource[4].$value],
    ['sm', spacingPx.sm, spacingSource[8].$value],
    ['md', spacingPx.md, spacingSource[12].$value],
    ['lg', spacingPx.lg, spacingSource[16].$value],
    ['xl', spacingPx.xl, spacingSource[24].$value],
    ['xxl', spacingPx.xxl, spacingSource[32].$value],
    ['xxxl', spacingPx.xxxl, spacingSource[40].$value],
  ] as [step: string, generated: number, source: string][])(
    'states spacing.%s as the same number of pixels',
    (_step, generated, source) => {
      expect(`${generated}px`).toBe(source)
    },
  )

  it('exposes every spacing step as a usable finite number', () => {
    expect(Object.keys(spacingPx)).toHaveLength(8)
    for (const px of Object.values(spacingPx)) {
      expect(Number.isFinite(px)).toBe(true)
    }
  })
})
