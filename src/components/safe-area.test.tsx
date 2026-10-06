import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { Button, Dialog, Sheet, Snackbar } from '.'
import { rulesReaching } from '../styles/stylesheet.testing'

// The surfaces pinned to an edge of the viewport, and the device's safe area
// each keeps clear of: the status bar or notch above, the home indicator
// below, a landscape notch at either side. Each is portalled to the body, so
// a consumer's own safe-area padding never reaches it.
//
// `env(safe-area-inset-*)` reads 0 in this runner, as it does on any page
// without `viewport-fit=cover`, so what a test can prove is what the
// stylesheet says — read with the shared walker — and that nothing moves
// where the insets are 0.

const BELOW_MEDIUM = 'width < 600px'

function computedPaddingOf(element: Element) {
  const computed = getComputedStyle(element)
  return [
    computed.paddingTop,
    computed.paddingRight,
    computed.paddingBottom,
    computed.paddingLeft,
  ]
}

/**
 * The value the stylesheet gives the first of `properties` it sets on
 * `element` in a left-to-right document, either side of the medium
 * breakpoint, `''` where nothing sets any. Rules behind a pseudo-class are
 * left out, which is what drops the right-to-left branch.
 *
 * More than one name because the compiled stylesheet writes a block padding
 * as the physical side it lands on, `padding-bottom` for `paddingBlockEnd`,
 * and a pipeline that kept the logical name would be as right.
 */
function declared(
  element: Element,
  properties: readonly string[],
  belowMedium: boolean,
) {
  let value = ''

  for (const rule of rulesReaching(element, { holding: BELOW_MEDIUM })) {
    if (rule.pseudo !== '' || (rule.held && !belowMedium)) {
      continue
    }
    for (const property of properties) {
      const set = rule.style.getPropertyValue(property)
      if (set !== '') {
        value = set
      }
    }
  }

  return value
}

function paddingOf(element: Element, belowMedium: boolean) {
  return {
    bottom: declared(
      element,
      ['padding-block-end', 'padding-bottom'],
      belowMedium,
    ),
    left: declared(element, ['padding-left'], belowMedium),
    right: declared(element, ['padding-right'], belowMedium),
    top: declared(element, ['padding-block-start', 'padding-top'], belowMedium),
  }
}

const TOP = 'env(safe-area-inset-top, 0px)'
const BOTTOM = 'env(safe-area-inset-bottom, 0px)'
const LEFT = 'env(safe-area-inset-left, 0px)'
const RIGHT = 'env(safe-area-inset-right, 0px)'

function openDialog() {
  render(
    <Dialog defaultOpen>
      <Button>Open</Button>
      <Dialog.Content>
        <Dialog.Body>Supporting line</Dialog.Body>
      </Dialog.Content>
    </Dialog>,
  )
  const container = screen.getByRole('dialog').parentElement
  if (!container) {
    throw new Error('expected the dialog to sit inside its container')
  }
  return container
}

function openSheet() {
  render(
    <Sheet defaultOpen>
      <Button>Open</Button>
      <Sheet.Content>
        <Sheet.Body>Supporting line</Sheet.Body>
      </Sheet.Content>
    </Sheet>,
  )
  const panel = screen.getByRole('dialog').parentElement
  if (!panel) {
    throw new Error('expected the dialog to sit inside its panel')
  }
  return panel
}

function showSnackbar() {
  const queue = new Snackbar.Queue()
  queue.add('First item')
  render(<Snackbar queue={queue} />)
  return screen.getByRole('region')
}

describe('the safe area', () => {
  describe('Sheet', () => {
    // A side sheet is pinned to the top, the bottom and the edge it rests
    // against, which is the right in a left-to-right document.
    it('keeps a side sheet clear of the three edges it is pinned to', () => {
      expect(paddingOf(openSheet(), false)).toEqual({
        bottom: BOTTOM,
        left: '0px',
        right: RIGHT,
        top: TOP,
      })
    })

    // A bottom sheet's top edge sits below the page's 72 of margin rather
    // than against the screen, so only the other three are inset.
    it('keeps a bottom sheet clear of the bottom and both sides', () => {
      expect(paddingOf(openSheet(), true)).toEqual({
        bottom: BOTTOM,
        left: LEFT,
        right: RIGHT,
        top: '0px',
      })
    })

    it('moves nothing where the insets are 0', () => {
      expect(computedPaddingOf(openSheet())).toEqual([
        '0px',
        '0px',
        '0px',
        '0px',
      ])
    })
  })

  describe('Dialog', () => {
    // On the container rather than the header and footer, so a dialog that
    // leaves either out is kept clear too — this one has neither.
    it('keeps a full-screen dialog clear of every edge', () => {
      expect(paddingOf(openDialog(), true)).toEqual({
        bottom: BOTTOM,
        left: LEFT,
        right: RIGHT,
        top: TOP,
      })
    })

    it('leaves a dialog floating over the page alone', () => {
      expect(paddingOf(openDialog(), false)).toEqual({
        bottom: '',
        left: '',
        right: '',
        top: '',
      })
    })

    it('moves nothing where the insets are 0', () => {
      expect(computedPaddingOf(openDialog())).toEqual([
        '0px',
        '0px',
        '0px',
        '0px',
      ])
    })
  })

  describe('Snackbar', () => {
    // Its 8dp of margin is counted from the safe area on the three edges the
    // region is pinned to; its top edge is wherever its messages end.
    it('counts its margin from the safe area at the bottom and both sides', () => {
      const padding = paddingOf(showSnackbar(), false)

      expect(padding.bottom).toContain(BOTTOM)
      expect(padding.left).toContain(LEFT)
      expect(padding.right).toContain(RIGHT)
      expect(padding.top).not.toContain('env(')
    })

    it('moves nothing where the insets are 0', () => {
      expect(computedPaddingOf(showSnackbar())).toEqual([
        '8px',
        '8px',
        '8px',
        '8px',
      ])
    })
  })
})
