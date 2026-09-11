import type { Color } from 'react-aria-components'

import { fireEvent, render } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import ColorSwatchPicker from '.'

const PALETTE = ['#6750A4', '#625B71', '#7D5260']

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
})
