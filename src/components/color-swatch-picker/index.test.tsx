import type { Color } from 'react-aria-components'

import * as stylex from '@stylexjs/stylex'
import { fireEvent, render } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import ColorSwatchPicker from '.'
import { colors } from '../../tokens/design.tokens.stylex'

const PALETTE = ['#6750A4', '#625B71', '#7D5260']

// Hoisted rather than written inline, which react-perf's
// `jsx-no-new-function-as-prop` refuses: a fresh function on every render.
const BY_SELECTION = (state: { isSelected: boolean }) =>
  state.isSelected ? 'chosen' : 'unchosen'

// The three roles a swatch's ring is drawn in, resolved the way the page
// resolves them, so a case compares computed colour with computed colour.
const probeStyles = stylex.create({
  outline: { color: colors.outline },
  outlineVariant: { color: colors.outlineVariant },
  primary: { color: colors.primary },
})

function colourOf(style: stylex.StyleXStyles) {
  const view = render(<span {...stylex.props(style)} />)
  const colour = getComputedStyle(view.container.firstElementChild!).color
  view.unmount()
  return colour
}

// A mouse arriving over the swatch, and a press starting on it. React Aria
// takes hover from `pointerover`, the bubbling event React derives
// `onPointerEnter` from, and press from a primary `pointerdown`.
function hover(element: Element) {
  fireEvent.pointerOver(element, { pointerType: 'mouse' })
}

function picker(props: { defaultValue?: string; disabled?: boolean } = {}) {
  return (
    <ColorSwatchPicker
      aria-label="Label"
      defaultValue={props.defaultValue ?? PALETTE[0]}
    >
      {PALETTE.map((color, i) => (
        <ColorSwatchPicker.Item
          color={color}
          isDisabled={props.disabled === true && i === 1}
          key={color}
        />
      ))}
    </ColorSwatchPicker>
  )
}

function press(element: Element, pointerType: 'mouse' | 'touch' = 'mouse') {
  fireEvent.pointerDown(element, {
    button: 0,
    buttons: 1,
    isPrimary: true,
    pointerId: 1,
    pointerType,
  })
}

describe('color swatch picker', () => {
  it('is a listbox of colours, one option each', () => {
    const view = render(picker())

    expect(view.getByRole('listbox', { name: 'Label' })).not.toBeNull()
    expect(view.getAllByRole('option')).toHaveLength(3)
  })

  it('draws a swatch inside each option without being told to', () => {
    const view = render(picker())

    // The item supplies a ColorSwatch of its own colour, so a call site
    // writes the palette rather than the swatch.
    expect(view.getAllByRole('img')).toHaveLength(3)
  })

  it('rings the chosen colour and only that one', () => {
    const view = render(picker())
    const [first, second] = view.getAllByRole('option')

    expect(first.getAttribute('aria-selected')).toBe('true')
    expect(getComputedStyle(first).outlineStyle).toBe('solid')
    expect(getComputedStyle(second).outlineStyle).toBe('none')
  })

  it('reports the colour chosen from it', () => {
    const onChange = vi.fn<(value: Color) => void>()
    const view = render(
      <ColorSwatchPicker
        aria-label="Label"
        defaultValue={PALETTE[0]}
        onChange={onChange}
      >
        {PALETTE.map((color) => (
          <ColorSwatchPicker.Item color={color} key={color} />
        ))}
      </ColorSwatchPicker>,
    )

    fireEvent.click(view.getAllByRole('option')[2])

    expect(onChange).toHaveBeenCalled()
    expect(onChange.mock.calls.at(-1)?.[0]?.toString('hex')).toBe('#7D5260')
  })

  it('moves between colours with the arrow keys', () => {
    const view = render(picker())
    const list = view.getByRole('listbox')

    list.focus()
    fireEvent.keyDown(list, { key: 'ArrowRight' })
    fireEvent.keyUp(list, { key: 'ArrowRight' })

    // A listbox rather than a group of buttons, which is what makes one
    // arrow key reach the next colour instead of one tab stop per swatch.
    expect(view.getAllByRole('option')[1].getAttribute('tabindex')).toBe('0')
  })

  it('keeps the focus ring clear of the selection ring', () => {
    const view = render(picker())
    const [first] = view.getAllByRole('option')
    const selectedOffset = getComputedStyle(first).outlineOffset

    fireEvent.focus(view.getByRole('listbox'))
    fireEvent.keyDown(view.getByRole('listbox'), { key: 'ArrowRight' })
    fireEvent.keyUp(view.getByRole('listbox'), { key: 'ArrowRight' })
    fireEvent.keyDown(view.getByRole('listbox'), { key: 'ArrowLeft' })
    fireEvent.keyUp(view.getByRole('listbox'), { key: 'ArrowLeft' })

    // Both rings land on a swatch that is chosen and focused, so the focus
    // one sits further out — at the same offset they would paint over each
    // other and whichever came second would be the only one seen.
    const focusedOffset = getComputedStyle(
      view.getAllByRole('option')[0],
    ).outlineOffset

    expect(first.getAttribute('data-focus-visible')).toBe('true')
    expect(Number.parseInt(focusedOffset, 10)).toBeGreaterThan(
      Number.parseInt(selectedOffset, 10),
    )
  })

  // src/components/styling.test.tsx pins the plain-string form of both props
  // on an item. This is the other form the prop's type admits, and the one
  // that only a swatch inside a listbox can exercise: React Aria hands the
  // function the item's own render state, which is where `isSelected` comes
  // from.
  it('computes an item class from the render state it is handed', () => {
    const view = render(
      <ColorSwatchPicker aria-label="Label" defaultValue={PALETTE[0]}>
        {PALETTE.map((color) => (
          <ColorSwatchPicker.Item
            className={BY_SELECTION}
            color={color}
            key={color}
          />
        ))}
      </ColorSwatchPicker>,
    )
    const [first, second] = view.getAllByRole('option')

    expect(first.classList).toContain('chosen')
    expect(second.classList).toContain('unchosen')
    // The item's own rings are compiled classes, so a merge that kept only
    // the call site's function would pass the two assertions above and leave
    // every swatch unstyled.
    expect(getComputedStyle(first).outlineStyle).toBe('solid')
  })

  it('fades a colour that cannot be chosen, and refuses it', () => {
    const onChange = vi.fn<(value: Color) => void>()
    const view = render(
      <ColorSwatchPicker
        aria-label="Label"
        defaultValue={PALETTE[0]}
        onChange={onChange}
      >
        {PALETTE.map((color, i) => (
          <ColorSwatchPicker.Item
            color={color}
            isDisabled={i === 1}
            key={color}
          />
        ))}
      </ColorSwatchPicker>,
    )
    const disabled = view.getAllByRole('option')[1]

    fireEvent.click(disabled)

    expect(Number.parseFloat(getComputedStyle(disabled).opacity)).toBeLessThan(
      1,
    )
    expect(onChange).not.toHaveBeenCalled()
  })

  // A state layer is a fill, and a swatch's fill is the colour being chosen,
  // so the feedback is a ring in the slot selection would take — drawn in the
  // outline roles rather than primary, so it cannot be read as chosen.
  describe('an unselected swatch under the pointer', () => {
    it('takes a ring in the outline variant role while hovered', () => {
      const view = render(picker())
      const second = view.getAllByRole('option')[1]

      hover(second)

      const style = getComputedStyle(second)
      expect(style.outlineStyle).toBe('solid')
      expect(style.outlineOffset).toBe('2px')
      expect(style.outlineColor).toBe(colourOf(probeStyles.outlineVariant))
    })

    // A mouse selects the moment it presses, so the held press a reader
    // waits through is a touch's: React Aria chooses the swatch on release.
    // Until then it is pressed and not yet chosen, which is the state this
    // ring answers.
    it('holds a stronger ring in the outline role under a touch', () => {
      const view = render(picker())
      const second = view.getAllByRole('option')[1]

      press(second, 'touch')

      const style = getComputedStyle(second)
      expect(second.getAttribute('aria-selected')).toBe('false')
      expect(style.outlineStyle).toBe('solid')
      expect(style.outlineColor).toBe(colourOf(probeStyles.outline))
    })

    // Hover is applied before selection, so a chosen swatch keeps the ring
    // that says so rather than trading it for the hover one.
    it('leaves a chosen swatch its own ring', () => {
      const view = render(picker())
      const first = view.getAllByRole('option')[0]

      hover(first)
      press(first)

      const style = getComputedStyle(first)
      expect(style.outlineColor).toBe(colourOf(probeStyles.primary))
      expect(style.outlineOffset).toBe('2px')
    })

    // A guard on React Aria rather than on this component: `itemStyles` draws
    // the rings from React Aria's hover and press state, and leans on it
    // reporting neither for a swatch that cannot be chosen. If that changes,
    // this is what says so.
    it('puts nothing on a swatch that cannot be chosen', () => {
      const view = render(picker({ disabled: true }))
      const second = view.getAllByRole('option')[1]

      hover(second)
      press(second)

      expect(getComputedStyle(second).outlineStyle).toBe('none')
    })
  })
})
