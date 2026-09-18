import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import IconButton from './components/icon-button'
import ListItem from './components/list-item'
import SegmentedButton from './components/segmented-button'
import TextField from './components/text-field'

// The size a slot draws an icon the library never touched at. Every component
// here takes an icon as a node, so the size comes from the slot around it
// rather than from anything the icon or this file sets — which is the contract
// a consumer writes against, and the only place it is pinned.

// An inline `style` rather than StyleX, since that is what a consumer of the
// package has. Hoisted so it is one object rather than a new one per render.
const EM_SQUARE = { blockSize: '1em', inlineSize: '1em' }

// The drawn width of that icon, which is square, as a whole number of pixels.
function drawnSize(view: ReturnType<typeof render>) {
  const icon = view.container.querySelector('[data-icon]')
  if (!(icon instanceof SVGElement)) {
    throw new Error('expected the slot to draw the icon it was given')
  }
  return Math.round(icon.getBoundingClientRect().width)
}

// An icon written the way the README's Icons section tells a consumer to write
// one: `aria-hidden`, `currentColor`, and a size of `1em` so it follows
// whatever font size the slot sets.
function Icon() {
  return (
    <svg
      aria-hidden="true"
      data-icon="true"
      fill="currentColor"
      style={EM_SQUARE}
      viewBox="0 0 24 24"
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  )
}

// Hoisted so it is one stable element rather than a new one per render, which
// is what react-perf's no-jsx-as-prop is after. A slot takes a node, so the
// same node serves every case.
const ICON = <Icon />

// Each of IconButton's five steps, with the size it draws an icon at. Two of
// them draw the same size, which is why the pairs are spelled out rather than
// derived from the step.
const BUTTON_SIZES = [
  ['xs', 20],
  ['md', 24],
  ['lg', 24],
  ['xl', 32],
  ['xxl', 40],
] as const

describe('the icon sizing contract', () => {
  // These slots set a font size of their own, so an `em` icon takes the size
  // the component chose rather than the size of the text around it.
  describe('a slot that owns the icon size', () => {
    it.each(BUTTON_SIZES)('draws an icon button at %s in %ipx', (size, px) => {
      const view = render(
        <IconButton aria-label="Label" size={size}>
          <Icon />
        </IconButton>,
      )

      expect(drawnSize(view)).toBe(px)
    })

    it("draws a field's icon at 24px", () => {
      const view = render(<TextField label="Label" leadingIcon={ICON} />)

      expect(drawnSize(view)).toBe(24)
    })

    it("draws a segment's icon at 18px", () => {
      const view = render(
        <SegmentedButton aria-label="Label">
          <SegmentedButton.Segment icon={ICON} id="first">
            First item
          </SegmentedButton.Segment>
        </SegmentedButton>,
      )

      expect(drawnSize(view)).toBe(18)
    })
  })

  // A row sets no icon size, so an `em` icon there follows the text beside it.
  // A consumer who believed otherwise would draw a list icon at the headline's
  // size, which is why this is pinned rather than left to follow whatever the
  // row happens to do.
  describe('a slot that does not', () => {
    it("leaves a row's icon at the size of the text beside it", () => {
      const view = render(<ListItem leading={ICON}>Headline</ListItem>)
      const row = view.getByText('Headline')

      expect(drawnSize(view)).toBe(
        Math.round(Number.parseFloat(getComputedStyle(row).fontSize)),
      )
    })
  })
})
