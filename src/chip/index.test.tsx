import * as stylex from '@stylexjs/stylex'
import { render } from '@testing-library/react'
import { TokenFieldValue } from 'react-aria-components'
import { describe, expect, it } from 'vitest'

import Chip from '../components/chip'
import ChipGroup from '../components/chip-group'
import TokenField from '../components/token-field'

const LONG_LABEL =
  'A label long enough that it has nowhere left to go on one line'

const probeStyles = stylex.create({
  // Narrower than the label on one line, which is where wrapping it and
  // cutting it short part ways.
  room: { inlineSize: '160px' },
})

const LONG_TOKEN = new TokenFieldValue([{ text: LONG_LABEL, type: 'token' }])

// Where a pill ends up in a room too narrow for its label. The label is the
// element holding the text, which is the pill itself for as long as the pill
// holds its text directly.
//
// An ellipsis is paint, which nothing here can read, so `cutShort` is every
// condition CSS sets for drawing one: text wider than its box, a box that
// clips, and `text-overflow` asking for the ellipsis. Without the clip the
// declaration draws nothing and the text runs on past the pill's end.
function fitOf(pill: Element, label: HTMLElement, room: HTMLElement) {
  if (!(pill instanceof HTMLElement)) {
    throw new TypeError('expected the pill to be an element')
  }
  const style = getComputedStyle(label)
  return {
    cutShort:
      style.textOverflow === 'ellipsis' &&
      style.overflowX !== 'visible' &&
      label.scrollWidth > label.clientWidth,
    inRoom:
      pill.getBoundingClientRect().width <= room.getBoundingClientRect().width,
    oneLine: pill.scrollHeight <= pill.clientHeight,
  }
}

const FITS = { cutShort: true, inRoom: true, oneLine: true }

// The pill is a fixed 32dp, so a label with no room on one line is cut short
// with an ellipsis where it meets the pill's end, as Material's own chips do,
// rather than wrapped onto lines the pill has no height for. Each of the three
// components that draw the pill is read, since each puts its own label in it.
describe('chip', () => {
  describe('a label with no room on one line', () => {
    it('is cut short in a chip', () => {
      const view = render(
        <div data-testid="room" {...stylex.props(probeStyles.room)}>
          <Chip>{LONG_LABEL}</Chip>
        </div>,
      )
      // Found by its whole label, since the cut is drawn rather than written.
      const chip = view.getByRole('button', { name: LONG_LABEL })

      expect(
        fitOf(chip, view.getByText(LONG_LABEL), view.getByTestId('room')),
      ).toEqual(FITS)
    })

    it("is cut short in a group's chip", () => {
      const view = render(
        <div data-testid="room" {...stylex.props(probeStyles.room)}>
          <ChipGroup label="Label">
            <ChipGroup.Chip id="long">{LONG_LABEL}</ChipGroup.Chip>
          </ChipGroup>
        </div>,
      )
      const chip = view.getByRole('row', { name: LONG_LABEL })

      expect(
        fitOf(chip, view.getByText(LONG_LABEL), view.getByTestId('room')),
      ).toEqual(FITS)
    })

    it('is cut short in a token', () => {
      const view = render(
        <div data-testid="room" {...stylex.props(probeStyles.room)}>
          <TokenField defaultValue={LONG_TOKEN} label="Label" />
        </div>,
      )
      const label = view.getByText(LONG_LABEL)
      // React Aria's token: the span inside the field it stops the caret
      // entering.
      const token = label.closest('[contenteditable="false"]')
      if (token === null) {
        throw new Error('expected the label to sit in a token')
      }

      expect(fitOf(token, label, view.getByTestId('room'))).toEqual(FITS)
    })
  })
})
