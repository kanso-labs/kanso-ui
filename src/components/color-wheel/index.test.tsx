import type { Color } from 'react-aria-components'

import { fireEvent, render } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import ColorWheel from '.'
import ColorSlider from '../color-slider'

const BLUE = 'hsl(200, 100%, 50%)'

// The radius the mask's hole is cut at, read back off the computed value.
function holeRadius(view: ReturnType<typeof render>) {
  const mask = getComputedStyle(trackOf(view)).maskImage
  const match = /(-?[\d.]+)px/.exec(mask)
  if (match === null) {
    throw new Error(`expected a mask with a radius, got ${mask}`)
  }
  return Number.parseFloat(match[1])
}

// How far the handle sits from the wheel's centre, which is what says it is
// on the ring rather than anywhere else on the disc.
function radiusOfThumb(view: ReturnType<typeof render>) {
  const track = trackOf(view).getBoundingClientRect()
  const thumb = thumbOf(view).getBoundingClientRect()
  return Math.hypot(
    thumb.left + thumb.width / 2 - (track.left + track.width / 2),
    thumb.top + thumb.height / 2 - (track.top + track.height / 2),
  )
}

function thumbOf(view: ReturnType<typeof render>) {
  const thumb = view.getByRole('slider').parentElement
  if (!(thumb instanceof HTMLElement)) {
    throw new Error('expected React Aria to place a handle')
  }
  return thumb
}

function trackOf(view: ReturnType<typeof render>) {
  const track = view.container.firstElementChild?.firstElementChild
  if (!(track instanceof HTMLElement)) {
    throw new Error('expected the wheel to draw a track')
  }
  return track
}

describe('color wheel', () => {
  describe('the ring', () => {
    it('carries hue as the conic gradient React Aria paints', () => {
      const view = render(<ColorWheel defaultValue={BLUE} />)

      expect(getComputedStyle(trackOf(view)).backgroundImage).toContain(
        'conic-gradient',
      )
    })

    it('cuts the middle out rather than covering it', () => {
      const view = render(<ColorWheel defaultValue={BLUE} />)

      // A disc in the wheel's own surface colour would hide whatever the
      // wheel sits over, and would stop anything being placed inside one.
      // The mask leaves the middle genuinely empty.
      expect(getComputedStyle(trackOf(view)).maskImage).toContain(
        'radial-gradient',
      )
      // Half a pixel inside the 84px the defaults put the hole at, which is
      // the feather that keeps the edge from stepping.
      expect(holeRadius(view)).toBe(83.5)
    })

    it('derives the hole from the thickness, so the two cannot disagree', () => {
      const thin = render(<ColorWheel defaultValue={BLUE} thickness={8} />)
      const thinHole = holeRadius(thin)
      thin.unmount()

      const thick = render(<ColorWheel defaultValue={BLUE} thickness={40} />)

      // React Aria takes both radii and would accept an inner one larger
      // than the outer, which draws nothing at all.
      expect(thinHole).toBe(91.5)
      expect(holeRadius(thick)).toBe(59.5)
    })

    it('leaves no hole at all when the band is wider than the wheel', () => {
      const view = render(
        <ColorWheel defaultValue={BLUE} outerRadius={50} thickness={200} />,
      )

      // Clamped at zero rather than going negative. A negative length in a
      // gradient is invalid CSS, so the browser would drop the whole mask
      // and the hole would come back — the opposite of what a band this
      // wide asks for.
      expect(holeRadius(view)).toBe(0)
      expect(getComputedStyle(trackOf(view)).maskImage).toContain(
        'radial-gradient',
      )
      expect(trackOf(view).getBoundingClientRect().width).toBe(100)
      // And the handle stays on the band. React Aria places it halfway
      // between the two radii, so an unclamped negative inner one would
      // put it out on the wheel's edge instead of in the middle.
      expect(Math.round(radiusOfThumb(view))).toBe(25)
    })

    it('is sized by how far the ring reaches', () => {
      const view = render(<ColorWheel defaultValue={BLUE} outerRadius={60} />)

      expect(trackOf(view).getBoundingClientRect().width).toBe(120)
    })
  })

  describe('the handle', () => {
    it('sits on the middle of the band, not on the disc', () => {
      const view = render(<ColorWheel defaultValue={BLUE} />)

      // Halfway between the 84px hole and the 100px edge.
      expect(Math.round(radiusOfThumb(view))).toBe(92)
    })

    it('follows the band when the band moves', () => {
      const view = render(<ColorWheel defaultValue={BLUE} thickness={40} />)

      // Halfway between a 60px hole and the 100px edge.
      expect(Math.round(radiusOfThumb(view))).toBe(80)
    })

    it('is the one a colour slider draws', () => {
      const wheel = render(<ColorWheel defaultValue={BLUE} />)
      const mine = getComputedStyle(thumbOf(wheel)).boxShadow
      wheel.unmount()

      const slider = render(
        <ColorSlider channel="hue" defaultValue={BLUE} label="Label" />,
      )
      const sliderThumb = slider
        .getByRole('group')
        .querySelector('div[style*="left"]')
      if (!(sliderThumb instanceof HTMLElement)) {
        throw new Error('expected the slider to place a handle')
      }

      // Shared from `src/styles/color.ts`, so the two cannot come apart.
      expect(mine).toBe(getComputedStyle(sliderThumb).boxShadow)
    })

    it('carries the hue it sits on', () => {
      const view = render(<ColorWheel defaultValue={BLUE} />)

      expect(getComputedStyle(thumbOf(view)).backgroundColor).toBe(
        'rgb(0, 170, 255)',
      )
    })
  })

  describe('its state', () => {
    it('takes a hex value, since a wheel names no channel', () => {
      // Unlike ColorSlider and ColorArea, there is no channel here to be
      // missing from the value's space — a wheel slides hue and nothing
      // else, so the hex a consumer reaches for first just works.
      const view = render(<ColorWheel defaultValue="#6750A4" />)

      expect(view.getByRole('slider').getAttribute('aria-valuetext')).toContain(
        '256',
      )
    })

    it('reports the hue moved with the arrow keys', () => {
      const onChange = vi.fn<(value: Color) => void>()
      const view = render(
        <ColorWheel defaultValue={BLUE} onChange={onChange} />,
      )
      const input = view.getByRole('slider')

      fireEvent.keyDown(input, { key: 'ArrowRight' })
      fireEvent.keyUp(input, { key: 'ArrowRight' })

      expect(onChange).toHaveBeenCalled()
      expect(onChange.mock.calls.at(-1)?.[0]?.getChannelValue('hue')).toBe(201)
    })

    it('fades the wheel while disabled, and refuses the keys', () => {
      const onChange = vi.fn<(value: Color) => void>()
      const view = render(
        <ColorWheel defaultValue={BLUE} isDisabled onChange={onChange} />,
      )
      const root = view.container.firstElementChild
      if (!(root instanceof HTMLElement)) {
        throw new Error('expected the wheel to render')
      }

      fireEvent.keyDown(view.getByRole('slider'), { key: 'ArrowRight' })

      expect(Number.parseFloat(getComputedStyle(root).opacity)).toBeLessThan(1)
      expect(onChange).not.toHaveBeenCalled()
    })
  })
})
