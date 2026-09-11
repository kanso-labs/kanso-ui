import type { Color } from 'react-aria-components'

import { fireEvent, render } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import ColorPicker from '.'

const PURPLE = '#6750A4'

function fieldOf(view: ReturnType<typeof render>) {
  const input = view.getByRole('textbox')
  if (!(input instanceof HTMLInputElement)) {
    throw new Error('expected the picker to hold a colour field')
  }
  return input
}

function triggerOf(view: ReturnType<typeof render>) {
  return view.getByRole('button', { name: /Label/ })
}

describe('color picker', () => {
  describe('the trigger', () => {
    it('is a swatch beside a name, not a swatch alone', () => {
      const view = render(<ColorPicker defaultValue={PURPLE} label="Label" />)

      // A swatch on its own is a coloured square with no affordance, and a
      // reader would be told a colour rather than an action.
      const trigger = triggerOf(view)
      expect(trigger.textContent).toContain('Label')
      expect(trigger.querySelector('[role="img"]')).not.toBeNull()
    })

    it('shows the colour the picker holds', () => {
      const view = render(<ColorPicker defaultValue={PURPLE} label="Label" />)

      // The swatch takes the value off React Aria's context rather than a
      // prop, which is what keeps it in step with what is chosen inside.
      expect(view.getByRole('img').getAttribute('aria-label')).toBe(
        'dark purple',
      )
    })

    it('keeps the surface closed until it is pressed', () => {
      const view = render(<ColorPicker defaultValue={PURPLE} label="Label" />)

      expect(view.queryByRole('dialog')).toBeNull()

      fireEvent.click(triggerOf(view))

      expect(view.getByRole('dialog')).not.toBeNull()
    })

    it('opens nothing while disabled', () => {
      const view = render(
        <ColorPicker defaultValue={PURPLE} isDisabled label="Label" />,
      )

      fireEvent.click(triggerOf(view))

      expect(view.queryByRole('dialog')).toBeNull()
    })
  })

  describe('what it opens', () => {
    it('composes the plane, the hue strip and the field', () => {
      const view = render(<ColorPicker defaultValue={PURPLE} label="Label" />)

      fireEvent.click(triggerOf(view))

      // The plane exposes one slider and the hue strip another; the field
      // is the third control on the surface.
      expect(view.getAllByRole('slider')).toHaveLength(2)
      expect(fieldOf(view)).not.toBeNull()
    })

    it('adds the alpha strip only when asked', () => {
      const view = render(
        <ColorPicker alpha defaultValue={PURPLE} label="Label" />,
      )

      fireEvent.click(triggerOf(view))

      expect(view.getAllByRole('slider')).toHaveLength(3)
    })

    it('takes the arrangement a call site gives it instead', () => {
      const view = render(
        <ColorPicker defaultValue={PURPLE} label="Label">
          <p>Supporting line</p>
        </ColorPicker>,
      )

      fireEvent.click(triggerOf(view))

      expect(view.getByText('Supporting line')).not.toBeNull()
      expect(view.queryAllByRole('slider')).toHaveLength(0)
    })
  })

  describe('opening it from outside', () => {
    it('starts open when asked, since the picker keeps no open state', () => {
      const view = render(
        <ColorPicker defaultOpen defaultValue={PURPLE} label="Label" />,
      )

      // React Aria keeps the open state on the dialog trigger this renders
      // inside, so without passing these through there is no way to open
      // the surface from a call site at all.
      expect(view.getByRole('dialog')).not.toBeNull()
    })

    it('reports the surface opening and closing', () => {
      const onOpenChange = vi.fn<(isOpen: boolean) => void>()
      const view = render(
        <ColorPicker
          defaultValue={PURPLE}
          label="Label"
          onOpenChange={onOpenChange}
        />,
      )

      fireEvent.click(triggerOf(view))

      expect(onOpenChange).toHaveBeenCalledWith(true)
    })
  })

  describe('the value', () => {
    it('takes a hex, which its own parts would refuse', () => {
      // A hex parses as RGB, which has no saturation — so the plane inside
      // is pinned to HSL. Without that, the call anyone writes first throws
      // outright rather than rendering.
      const view = render(<ColorPicker defaultValue={PURPLE} label="Label" />)

      fireEvent.click(triggerOf(view))

      expect(view.getAllByRole('slider')).toHaveLength(2)
    })

    it('hands the value back in the notation it was given', () => {
      const view = render(<ColorPicker defaultValue={PURPLE} label="Label" />)

      fireEvent.click(triggerOf(view))

      // Converting to HSL inside costs the caller nothing: the field still
      // shows the hex that went in.
      expect(fieldOf(view).value).toBe(PURPLE)
    })

    it('reports a colour changed on the surface', () => {
      const onChange = vi.fn<(value: Color) => void>()
      const view = render(
        <ColorPicker defaultValue={PURPLE} label="Label" onChange={onChange} />,
      )

      fireEvent.click(triggerOf(view))
      const hue = view.getAllByRole('slider')[1]
      fireEvent.keyDown(hue, { key: 'ArrowRight' })
      fireEvent.keyUp(hue, { key: 'ArrowRight' })

      expect(onChange).toHaveBeenCalled()
      expect(onChange.mock.calls.at(-1)?.[0]?.getChannelValue('hue')).toBe(257)
    })
  })
})
