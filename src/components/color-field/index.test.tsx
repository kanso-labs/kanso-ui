import type { Color } from 'react-aria-components'

import { fireEvent, render } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import ColorField from '.'
import ColorSwatch from '../color-swatch'

const PURPLE = '#6750A4'
// Hoisted, which is what react-perf's no-jsx-as-prop is after.
const PURPLE_SWATCH = <ColorSwatch color={PURPLE} />

function inputOf(view: ReturnType<typeof render>) {
  const input = view.getByRole('textbox')
  if (!(input instanceof HTMLInputElement)) {
    throw new Error('expected the field to render an input')
  }
  return input
}

describe('color field', () => {
  describe('what it holds', () => {
    it('holds the colour in the notation it was given', () => {
      const view = render(<ColorField defaultValue={PURPLE} label="Label" />)

      expect(inputOf(view).value).toBe(PURPLE)
    })

    it('parses a colour typed into it', () => {
      const onChange = vi.fn<(value: Color | null) => void>()
      const view = render(
        <ColorField defaultValue={PURPLE} label="Label" onChange={onChange} />,
      )
      const input = inputOf(view)

      fireEvent.change(input, { target: { value: '#386A20' } })
      fireEvent.blur(input)

      expect(onChange).toHaveBeenCalled()
      expect(onChange.mock.calls.at(-1)?.[0]?.toString('hex')).toBe('#386A20')
    })

    it('holds one channel as a number when given one', () => {
      const view = render(
        <ColorField
          channel="hue"
          colorSpace="hsl"
          defaultValue={PURPLE}
          label="Label"
        />,
      )

      // A channel turns the field from a colour into a number a reader can
      // step, which is what a picker's boxes beside a plane are.
      expect(inputOf(view).value).toBe('256°')
    })

    it('refuses what will not parse, and keeps the value it had', () => {
      const onChange = vi.fn<(value: Color | null) => void>()
      const view = render(
        <ColorField defaultValue={PURPLE} label="Label" onChange={onChange} />,
      )
      const input = inputOf(view)

      fireEvent.change(input, { target: { value: 'not a colour' } })
      fireEvent.blur(input)

      expect(input.value).toBe(PURPLE)
      expect(onChange).not.toHaveBeenCalled()
    })
  })

  describe('the field chrome', () => {
    it('is the box every other field draws', () => {
      const view = render(<ColorField defaultValue={PURPLE} label="Label" />)

      // The label and the input are the shared chrome's, so a colour field
      // on a form is the same shape as the text field beside it.
      expect(view.getByText('Label')).not.toBeNull()
      expect(inputOf(view).getAttribute('type')).toBe('text')
    })

    it('takes a swatch at the leading end of the box', () => {
      const view = render(
        <ColorField
          defaultValue={PURPLE}
          label="Label"
          leadingIcon={PURPLE_SWATCH}
        />,
      )

      // Left to the call site rather than drawn here: a field inside a
      // picker already sits beside one.
      expect(view.getByRole('img').getAttribute('aria-label')).toBe(
        'dark purple',
      )
    })

    it('shows an error in place of the description, and marks the field', () => {
      const view = render(
        <ColorField
          defaultValue={PURPLE}
          error="Supporting line"
          label="Label"
        />,
      )

      expect(view.getByText('Supporting line')).not.toBeNull()
      expect(view.container.querySelector('[data-invalid]')).not.toBeNull()
    })

    it('stops the input while disabled', () => {
      const view = render(
        <ColorField defaultValue={PURPLE} isDisabled label="Label" />,
      )

      expect(inputOf(view).disabled).toBe(true)
    })
  })
})
