import type { StyleXStyles } from '@stylexjs/stylex'

import * as stylex from '@stylexjs/stylex'
import { describe, expect, it } from 'vitest'

import { overlay, popupOrigin } from './overlay'

// The same declarations the module writes, so they hash to the same atomic
// classes — see chip/index.test.tsx for the pattern.
const probeStyles = stylex.create({
  fromBottom: { transformOrigin: 'bottom center' },
  fromLeft: { transformOrigin: 'left center' },
  fromRight: { transformOrigin: 'right center' },
  fromTop: { transformOrigin: 'top center' },
})

function classOf(style: StyleXStyles) {
  const { className } = stylex.props(style)
  // An empty class would make every comparison below trivially true.
  if (!className) {
    throw new Error('expected the style to generate a class')
  }
  return className
}

describe('overlay', () => {
  // A surface grows from the edge it is anchored by, so a placement below
  // the trigger grows down from its top edge, and so on round. `center` is
  // what React Aria reports for an anchor it could not place beside, and
  // `null` is before it has placed the surface at all; both grow as the
  // default placement does.
  describe('popupOrigin', () => {
    it.each([
      ['bottom', probeStyles.fromTop],
      ['top', probeStyles.fromBottom],
      ['left', probeStyles.fromRight],
      ['right', probeStyles.fromLeft],
      ['center', probeStyles.fromTop],
    ] as const)(
      'grows a surface placed %s from the facing edge',
      (placement, expected) => {
        expect(classOf(popupOrigin(placement))).toBe(classOf(expected))
      },
    )

    it('grows an unplaced surface as one placed below does', () => {
      expect(classOf(popupOrigin(null))).toBe(classOf(probeStyles.fromTop))
    })
  })

  it('compiles every shared style to at least one class', () => {
    for (const style of [
      overlay.modalDialog,
      overlay.popup,
      overlay.popupDialog,
      overlay.scrim,
    ]) {
      expect(classOf(style)).not.toBe('')
    }
  })
})
