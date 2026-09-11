import type { Color } from 'react-aria-components'

import { fireEvent, render } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import ColorSlider from '.'

const BLUE = 'hsl(200, 100%, 50%)'

// The strip's shape and the chequer live on the element around the track:
// React Aria paints the channel on the track's own inline `background`, and
// anything drawn on the track itself would cover it.
function groundOf(view: ReturnType<typeof render>) {
  const ground = trackOf(view).parentElement
  if (!(ground instanceof HTMLElement)) {
    throw new Error('expected the track to sit in a strip')
  }
  return ground
}

function thumbOf(view: ReturnType<typeof render>) {
  const thumb = trackOf(view).querySelector('div[style*="left"]')
  if (!(thumb instanceof HTMLElement)) {
    throw new Error('expected React Aria to place a handle')
  }
  return thumb
}

function trackOf(view: ReturnType<typeof render>) {
  return view.getByRole('group')
}

describe('color slider', () => {
  describe('the label and the readout', () => {
    it('takes the name it was given', () => {
      const view = render(
        <ColorSlider channel="hue" defaultValue={BLUE} label="Label" />,
      )

      expect(view.getByText('Label')).not.toBeNull()
    })

    it('shows the value React Aria announces', () => {
      const view = render(
        <ColorSlider channel="hue" defaultValue={BLUE} label="Label" />,
      )

      // The output rather than a number formatted here, so what is read and
      // what is shown cannot disagree.
      expect(view.container.querySelector('output')?.textContent).toBe('200°')
    })

    it('drops the readout when asked, and keeps the label', () => {
      const view = render(
        <ColorSlider
          channel="hue"
          defaultValue={BLUE}
          label="Label"
          showValue={false}
        />,
      )

      expect(view.container.querySelector('output')).toBeNull()
      expect(view.getByText('Label')).not.toBeNull()
    })
  })

  describe('the track', () => {
    it('carries the channel React Aria paints across it', () => {
      const view = render(
        <ColorSlider channel="hue" defaultValue={BLUE} label="Label" />,
      )

      // React Aria's own gradient, on the track's inline style — which is
      // why nothing here chooses what runs along the strip.
      expect(getComputedStyle(trackOf(view)).backgroundImage).toContain(
        'linear-gradient',
      )
    })

    it('draws the strip at the size the sliders page gives it', () => {
      const view = render(
        <ColorSlider channel="hue" defaultValue={BLUE} label="Label" />,
      )
      const ground = getComputedStyle(groundOf(view))

      expect(ground.blockSize).toBe('16px')
      expect(ground.borderRadius).toBe('8px')
    })

    it('keeps a 44dp press target though the strip is 16dp', () => {
      const view = render(
        <ColorSlider channel="hue" defaultValue={BLUE} label="Label" />,
      )
      const track = trackOf(view)
      const box = track.getBoundingClientRect()

      // The strip is 16dp, so without the transparent box reaching 14dp
      // above and below it a press this far off the strip would miss the
      // slider entirely.
      const above = document.elementFromPoint(
        box.left + 40,
        box.top + box.height / 2 - 18,
      )

      expect(above).toBe(track)
    })

    it('lays a chequer behind, so an alpha channel reads as fading out', () => {
      const view = render(
        <ColorSlider channel="alpha" defaultValue={BLUE} label="Label" />,
      )
      const ground = getComputedStyle(groundOf(view))

      // A track fading to transparent over a light surface and one fading
      // to white are the same pixels without it.
      expect(ground.backgroundImage.split('linear-gradient').length - 1).toBe(4)
      expect(ground.backgroundPosition).toBe(
        '0px 0px, 0px 8px, 8px -8px, -8px 0px',
      )
    })
  })

  describe('the handle', () => {
    it('carries the colour at the point it sits on', () => {
      const view = render(
        <ColorSlider channel="hue" defaultValue={BLUE} label="Label" />,
      )

      // React Aria's, so the handle cannot show a colour the slider is not
      // on.
      expect(getComputedStyle(thumbOf(view)).backgroundColor).toBe(
        'rgb(0, 170, 255)',
      )
    })

    it('is ringed rather than filled, since its fill is the value', () => {
      const view = render(
        <ColorSlider channel="hue" defaultValue={BLUE} label="Label" />,
      )
      const thumb = getComputedStyle(thumbOf(view))

      // Two rings: a surface-coloured one and a hairline outside it, which
      // is what reads against a track running through every hue.
      expect(thumb.boxShadow.split(',').length).toBeGreaterThanOrEqual(2)
      expect(thumb.borderRadius).toBe('9999px')
    })

    it('sits centred on the strip it runs along', () => {
      const view = render(
        <ColorSlider channel="hue" defaultValue={BLUE} label="Label" />,
      )
      const track = trackOf(view).getBoundingClientRect()
      const thumb = thumbOf(view).getBoundingClientRect()

      expect(thumb.height).toBe(20)
      expect(
        Math.abs(thumb.top + thumb.height / 2 - (track.top + track.height / 2)),
      ).toBeLessThan(1)
    })
  })

  describe('its state', () => {
    it('reports the channel moved with the arrow keys', () => {
      const onChange = vi.fn<(value: Color) => void>()
      const view = render(
        <ColorSlider
          channel="hue"
          defaultValue={BLUE}
          label="Label"
          onChange={onChange}
        />,
      )
      const input = view.getByRole('slider')

      fireEvent.keyDown(input, { key: 'ArrowRight' })
      fireEvent.keyUp(input, { key: 'ArrowRight' })

      expect(onChange).toHaveBeenCalled()
      expect(onChange.mock.calls.at(-1)?.[0]?.getChannelValue('hue')).toBe(201)
    })

    it('converts the value into the space its channel belongs to', () => {
      // A hex value parses as RGB, which has no hue at all — React Aria
      // throws rather than converting, so `colorSpace` is what makes a hue
      // slider over one work. A consumer reaches for the hex first.
      expect(() =>
        render(<ColorSlider channel="hue" defaultValue="#6750A4" label="L" />),
      ).toThrow(/Unknown color channel/)

      const view = render(
        <ColorSlider
          channel="hue"
          colorSpace="hsl"
          defaultValue="#6750A4"
          label="Label"
        />,
      )

      expect(view.container.querySelector('output')?.textContent).toBe(
        '256.43°',
      )
    })

    it('fades the strip while disabled, and leaves the label readable', () => {
      const onChange = vi.fn<(value: Color) => void>()
      const view = render(
        <ColorSlider
          channel="hue"
          defaultValue={BLUE}
          isDisabled
          label="Label"
          onChange={onChange}
        />,
      )
      fireEvent.keyDown(view.getByRole('slider'), { key: 'ArrowRight' })

      // The strip fades; the label does not. Dropping a whole slider's
      // opacity takes the text with it, and a disabled control still has to
      // be readable — axe fails the contrast that leaves.
      expect(
        Number.parseFloat(getComputedStyle(groundOf(view)).opacity),
      ).toBeLessThan(1)
      expect(
        Number.parseFloat(getComputedStyle(view.getByText('Label')).opacity),
      ).toBe(1)
      expect(onChange).not.toHaveBeenCalled()
    })
  })
})
