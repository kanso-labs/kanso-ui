import type { Color } from 'react-aria-components'

import { fireEvent, render } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import ColorArea from '.'
import ColorSlider from '../color-slider'

const BLUE = 'hsl(200, 100%, 50%)'
const SIZED = { inlineSize: '200px' }
const NARROW = { inlineSize: '120px' }

function areaOf(view: ReturnType<typeof render>) {
  return view.getByRole('group')
}

// The square's shape and the chequer live on the element around the plane:
// React Aria paints both gradients on the plane's own inline `background`,
// and anything drawn on the plane itself would cover them.
function groundOf(view: ReturnType<typeof render>) {
  const ground = areaOf(view).parentElement
  if (!(ground instanceof HTMLElement)) {
    throw new Error('expected the plane to sit in a square')
  }
  return ground
}

function plane(props: { isDisabled?: boolean; style?: object } = {}) {
  return (
    <ColorArea
      defaultValue={BLUE}
      isDisabled={props.isDisabled}
      style={props.style ?? SIZED}
      xChannel="saturation"
      yChannel="lightness"
    />
  )
}

// The thumb's shape, as one value, so a comparison across two renders is a
// single assertion rather than three.
function read(thumb: HTMLElement) {
  const style = getComputedStyle(thumb)
  return {
    borderRadius: style.borderRadius,
    boxShadow: style.boxShadow,
    inlineSize: style.inlineSize,
  }
}

function thumbOf(view: ReturnType<typeof render>) {
  const thumb = areaOf(view).querySelector('div[role="presentation"]')
  if (!(thumb instanceof HTMLElement)) {
    throw new Error('expected React Aria to place a handle')
  }
  return thumb
}

describe('color area', () => {
  describe('the plane', () => {
    it('carries both channels React Aria paints across it', () => {
      const view = render(plane())

      // Two stacked gradients, one per axis, and React Aria's own — which
      // is why nothing here chooses what the plane shows.
      expect(
        getComputedStyle(areaOf(view)).backgroundImage.split('linear-gradient')
          .length - 1,
      ).toBe(2)
    })

    it('stays square whatever width it is given', () => {
      // Two channels sharing a box want equal travel: in an oblong the same
      // drag moves one further than the other, which a reader cannot see
      // and would feel as the control being wrong.
      //
      // One at a time, since Testing Library binds its queries to the
      // document rather than to the container it rendered into — a second
      // tree left standing is a second plane every query can see.
      const wide = render(plane())
      const wideBox = groundOf(wide).getBoundingClientRect()
      wide.unmount()

      const narrow = render(plane({ style: NARROW }))
      const narrowBox = groundOf(narrow).getBoundingClientRect()

      expect(Math.abs(wideBox.width - wideBox.height)).toBeLessThan(1)
      expect(Math.abs(narrowBox.width - narrowBox.height)).toBeLessThan(1)
      expect(narrowBox.width).toBe(120)
    })

    it('carries an alpha stop in RGB, where a plane has one at all', () => {
      const view = render(
        <ColorArea
          defaultValue="rgba(0, 170, 255, 0.6)"
          style={SIZED}
          xChannel="red"
          yChannel="alpha"
        />,
      )
      const ground = getComputedStyle(groundOf(view))

      // Matched on the stop the axis *begins* at: `transparent` computes to
      // `rgba(0, 0, 0, 0)`, so a plane merely containing one says nothing —
      // every HSL plane has one in the middle of its lightness axis.
      expect(getComputedStyle(areaOf(view)).backgroundImage).toContain(
        'to top, rgba(0, 0, 0, 0)',
      )
      // And no chequer behind it, unlike a swatch: the topmost gradient
      // covers the box, so anything laid behind the plane is never seen.
      expect(ground.backgroundImage).not.toContain('linear-gradient')
    })

    it('is drawn saturation by lightness when asked for alpha in HSL', () => {
      // React Aria does not throw here the way an unknown channel does: it
      // quietly draws the pair it would have drawn anyway, so a plane that
      // will not fade is the only sign. Pinned because the component
      // documents it, and because a consumer reaching for alpha in HSL sees
      // no error at all.
      const asked = render(
        <ColorArea
          defaultValue="hsla(200, 100%, 50%, 0.6)"
          style={SIZED}
          xChannel="saturation"
          yChannel="alpha"
        />,
      )
      const askedFor = getComputedStyle(areaOf(asked)).backgroundImage
      asked.unmount()

      const plain = render(plane())
      const drawnAnyway = getComputedStyle(areaOf(plain)).backgroundImage

      expect(askedFor).toBe(drawnAnyway)
      expect(askedFor).not.toContain('to top, rgba(0, 0, 0, 0)')
    })

    it('is sized by the square around it, which is what the call site reaches', () => {
      const view = render(plane())

      expect(groundOf(view).getBoundingClientRect().width).toBe(200)
      expect(areaOf(view).getBoundingClientRect().width).toBe(200)
    })
  })

  describe('the handle', () => {
    it('sits where the two channels meet', () => {
      const view = render(plane())
      const area = areaOf(view).getBoundingClientRect()
      const thumb = thumbOf(view).getBoundingClientRect()

      // Saturation 100% is the far edge, lightness 50% the middle.
      expect(Math.round(thumb.left + thumb.width / 2 - area.left)).toBe(200)
      expect(Math.round(thumb.top + thumb.height / 2 - area.top)).toBe(100)
    })

    it('is the one a colour slider draws', () => {
      // One at a time, for the reason the square test gives.
      const area = render(plane())
      const mine = read(thumbOf(area))
      area.unmount()

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
      // Matching alone would still hold if both were wrong, so the rings
      // are asserted here as well as compared.
      expect(mine.boxShadow).toContain('rgb')
      expect(mine.borderRadius).toBe('9999px')
      expect(mine).toEqual(read(sliderThumb))
    })

    it('carries the colour at the point it sits on', () => {
      const view = render(plane())

      expect(getComputedStyle(thumbOf(view)).backgroundColor).toBe(
        'rgb(0, 170, 255)',
      )
    })
  })

  describe('its state', () => {
    it('announces both channels through one control, not two', () => {
      const view = render(plane())

      // React Aria renders an input per axis but hides the second from the
      // accessibility tree, so a reader is told about one control at a
      // position rather than two separate sliders. Its value text carries
      // both channels.
      const exposed = view.getAllByRole('slider')
      expect(exposed).toHaveLength(1)
      expect(exposed[0].getAttribute('aria-valuetext')).toContain('Saturation')
      expect(exposed[0].getAttribute('aria-valuetext')).toContain('Lightness')

      const both = view.getAllByRole('slider', { hidden: true })
      expect(both).toHaveLength(2)
      expect(both[1].getAttribute('aria-hidden')).toBe('true')
    })

    it('reports the colour moved with the arrow keys', () => {
      const onChange = vi.fn<(value: Color) => void>()
      const view = render(
        <ColorArea
          defaultValue={BLUE}
          onChange={onChange}
          style={SIZED}
          xChannel="saturation"
          yChannel="lightness"
        />,
      )

      fireEvent.keyDown(view.getAllByRole('slider')[0], { key: 'ArrowUp' })
      fireEvent.keyUp(view.getAllByRole('slider')[0], { key: 'ArrowUp' })

      expect(onChange).toHaveBeenCalled()
      expect(
        onChange.mock.calls.at(-1)?.[0]?.getChannelValue('lightness'),
      ).toBe(51)
    })

    it('throws when a channel is not in the value its space has', () => {
      // A hex parses as RGB, which has no saturation — React Aria throws
      // rather than converting, and `colorSpace` is what makes it work. The
      // same trap ColorSlider documents; a consumer reaches for the hex.
      expect(() =>
        render(
          <ColorArea
            defaultValue="#6750A4"
            xChannel="saturation"
            yChannel="lightness"
          />,
        ),
      ).toThrow(/Unknown color channel/)
    })

    it('fades the plane while disabled, and refuses the keys', () => {
      const onChange = vi.fn<(value: Color) => void>()
      const view = render(
        <ColorArea
          defaultValue={BLUE}
          isDisabled
          onChange={onChange}
          style={SIZED}
          xChannel="saturation"
          yChannel="lightness"
        />,
      )

      fireEvent.keyDown(view.getAllByRole('slider')[0], { key: 'ArrowUp' })

      expect(
        Number.parseFloat(getComputedStyle(groundOf(view)).opacity),
      ).toBeLessThan(1)
      expect(onChange).not.toHaveBeenCalled()
    })
  })
})
