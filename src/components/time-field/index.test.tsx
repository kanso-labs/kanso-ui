import * as stylex from '@stylexjs/stylex'
import { fireEvent, render } from '@testing-library/react'
import { I18nProvider } from 'react-aria-components'
import { describe, expect, it, vi } from 'vitest'

import TimeField from '.'
import { Time } from '../../date'
import { colors } from '../../tokens/design.tokens.stylex'

const probeStyles = stylex.create({
  onPrimary: { color: colors.onPrimary },
  onSurface: { color: colors.onSurface },
  onSurfaceVariant: { color: colors.onSurfaceVariant },
  primary: { color: colors.primary },
})

function probe(style: stylex.StyleXStyles) {
  const view = render(<span data-testid="probe" {...stylex.props(style)} />)
  const read = getComputedStyle(view.getByTestId('probe')).color
  view.unmount()
  return read
}

const TIME = new Time(9, 30)

function segmentsOf(view: ReturnType<typeof render>) {
  return view.getAllByRole('spinbutton')
}

describe('time field', () => {
  describe('segments', () => {
    it('renders one focus stop per part of the time', () => {
      const view = render(
        <I18nProvider locale="en-GB">
          <TimeField defaultValue={TIME} label="Label" />
        </I18nProvider>,
      )

      // Hour and minute on a 24-hour clock; nothing else at this granularity.
      expect(segmentsOf(view)).toHaveLength(2)
    })

    it('adds a day period on a twelve-hour locale, and not on a twenty-four', () => {
      const us = render(
        <I18nProvider locale="en-US">
          <TimeField defaultValue={TIME} label="Label" />
        </I18nProvider>,
      )
      const usTypes = segmentsOf(us).map((s) => s.getAttribute('data-type'))
      us.unmount()

      const gb = render(
        <I18nProvider locale="en-GB">
          <TimeField defaultValue={TIME} label="Label" />
        </I18nProvider>,
      )
      const gbTypes = segmentsOf(gb).map((s) => s.getAttribute('data-type'))

      // Which clock a reader sees is their locale rather than a prop here.
      expect(usTypes).toContain('dayPeriod')
      expect(gbTypes).not.toContain('dayPeriod')
    })

    it('goes down to seconds when the granularity asks', () => {
      const view = render(
        <I18nProvider locale="en-GB">
          <TimeField defaultValue={TIME} granularity="second" label="Label" />
        </I18nProvider>,
      )

      expect(
        segmentsOf(view).map((s) => s.getAttribute('data-type')),
      ).toContain('second')
    })
  })

  describe('shared with DateField', () => {
    it('mutes a segment not yet filled', () => {
      const view = render(<TimeField label="Label" />)
      const [first] = segmentsOf(view)

      expect(first.getAttribute('data-placeholder')).toBe('true')
      expect(getComputedStyle(first).color).toBe(
        probe(probeStyles.onSurfaceVariant),
      )
    })

    it('fills the segment being typed rather than ringing it', () => {
      const view = render(<TimeField defaultValue={TIME} label="Label" />)
      const [first] = segmentsOf(view)

      first.focus()
      fireEvent.focus(first)

      // Read before probing: `probe` mounts a tree of its own and unmounts
      // it, which blurs the segment.
      const focused = getComputedStyle(first)
      const background = focused.backgroundColor
      const label = focused.color

      expect(background).toBe(probe(probeStyles.primary))
      expect(label).toBe(probe(probeStyles.onPrimary))
    })

    it('draws the punctuation as punctuation', () => {
      const view = render(<TimeField defaultValue={TIME} label="Label" />)
      const literal = view.container.querySelector('[data-type="literal"]')
      if (!(literal instanceof HTMLElement)) {
        throw new Error('expected punctuation between the segments')
      }

      const style = getComputedStyle(literal)
      const colour = style.color

      expect(literal.getAttribute('role')).toBeNull()
      expect(colour).toBe(probe(probeStyles.onSurfaceVariant))
    })

    it('floats the label clear of the segments, even with no value', () => {
      const view = render(<TimeField label="Label" />)
      const label = view.getByText('Label').getBoundingClientRect()
      const [first] = segmentsOf(view)

      expect(label.bottom).toBeLessThanOrEqual(
        first.getBoundingClientRect().top,
      )
    })

    it('fades every segment while the field is disabled', () => {
      const view = render(
        <TimeField defaultValue={TIME} isDisabled label="Label" />,
      )
      const [first] = segmentsOf(view)
      const colour = getComputedStyle(first).color

      expect(colour).not.toBe(probe(probeStyles.onSurface))
    })
  })

  describe('the field chrome', () => {
    it('reports a change made with the arrow keys', () => {
      const onChange = vi.fn<(value: null | Time) => void>()
      const view = render(
        <TimeField defaultValue={TIME} label="Label" onChange={onChange} />,
      )
      const [first] = segmentsOf(view)

      first.focus()
      fireEvent.keyDown(first, { key: 'ArrowUp' })
      fireEvent.keyUp(first, { key: 'ArrowUp' })

      expect(onChange).toHaveBeenCalled()
    })

    it('shows an error in place of the description, and marks the field', () => {
      const view = render(
        <TimeField defaultValue={TIME} error="Supporting line" label="Label" />,
      )

      expect(view.getByText('Supporting line')).not.toBeNull()
      expect(view.container.querySelector('[data-invalid]')).not.toBeNull()
    })
  })
})
