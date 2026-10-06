import type { StyleXStyles } from '@stylexjs/stylex'

import * as stylex from '@stylexjs/stylex'
import { describe, expect, it } from 'vitest'

import { overlay, placementOf, popupOrigin } from './overlay'

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

  // The library's side and alignment, in React Aria's placement. Centred,
  // a surface needs only its side. Above or below the anchor it aligns along
  // the inline axis, which React Aria spells `start` and `end` as the library
  // does; beside it, it aligns along the block axis, which React Aria spells
  // `top` and `bottom`, so `start` is the top and `end` the bottom. Every
  // anchored overlay positions through this, so a flipped branch would
  // misplace all of them at once.
  describe('placementOf', () => {
    it.each([
      ['bottom', 'start', 'bottom start'],
      ['bottom', 'center', 'bottom'],
      ['bottom', 'end', 'bottom end'],
      ['top', 'start', 'top start'],
      ['top', 'center', 'top'],
      ['top', 'end', 'top end'],
      ['left', 'start', 'left top'],
      ['left', 'center', 'left'],
      ['left', 'end', 'left bottom'],
      ['right', 'start', 'right top'],
      ['right', 'center', 'right'],
      ['right', 'end', 'right bottom'],
    ] as const)(
      'places a surface on the %s side, aligned %s, as %s',
      (side, align, expected) => {
        expect(placementOf(side, align)).toBe(expected)
      },
    )
  })

  // A surface scrolled to its end used to hand the next swipe to the page,
  // and React Aria closes a non-modal surface when its anchor scrolls, so
  // one flick too many closed it. ComboBox's and Select's lists are this
  // element too, so this is theirs as well.
  it('keeps a scroll that reaches the end of an anchored surface inside it', () => {
    const element = document.createElement('div')
    element.className = classOf(overlay.popup)
    document.body.append(element)

    try {
      const computed = getComputedStyle(element)
      expect(computed.overscrollBehaviorX).toBe('contain')
      expect(computed.overscrollBehaviorY).toBe('contain')
    } finally {
      element.remove()
    }
  })

  it('compiles every shared style to at least one class', () => {
    for (const style of [
      overlay.modalBodyRing,
      overlay.modalDialog,
      overlay.popup,
      overlay.popupDialog,
      overlay.scrim,
    ]) {
      expect(classOf(style)).not.toBe('')
    }
  })
})
