import * as stylex from '@stylexjs/stylex'
import { fireEvent, render } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import DatePicker from '.'
import { CalendarDate } from '../../date'
import { colors } from '../../tokens/design.tokens.stylex'

const probeStyles = stylex.create({
  onSurface: { color: colors.onSurface },
  onSurfaceVariant: { color: colors.onSurfaceVariant },
})

function probe(style: stylex.StyleXStyles) {
  const view = render(<span data-testid="probe" {...stylex.props(style)} />)
  const read = getComputedStyle(view.getByTestId('probe')).color
  view.unmount()
  return read
}

const DATE = new CalendarDate(2026, 9, 15)

function segmentsOf(view: ReturnType<typeof render>) {
  return view.getAllByRole('spinbutton')
}

// Matched on a pattern rather than the whole name: React Aria composes the
// field's own label into the trigger's accessible name, so an exact string
// finds nothing.
function triggerOf(view: ReturnType<typeof render>, label = 'Choose a date') {
  return view.getByRole('button', { name: new RegExp(label) })
}

describe('date picker', () => {
  describe('the field half', () => {
    it('draws the same segments a date field does', () => {
      const view = render(<DatePicker defaultValue={DATE} label="Label" />)

      expect(segmentsOf(view)).toHaveLength(3)
    })

    it('holds the segments and the trigger in one group', () => {
      const view = render(<DatePicker defaultValue={DATE} label="Label" />)
      // Two groups, and the inner one is the picker's: React Aria's Group
      // holds the segments and the trigger, and the field box around it is
      // the outer one.
      const group = view.getAllByRole('group').at(-1)
      if (!(group instanceof HTMLElement)) {
        throw new Error('expected the picker to render a group')
      }

      // One field rather than a field beside a button: the box draws once
      // around both, and a reader reaches the trigger at the end of the
      // segments rather than as a separate control.
      expect(group.contains(segmentsOf(view)[0])).toBe(true)
      expect(group.contains(triggerOf(view))).toBe(true)
    })

    it('floats the label clear of the segments, even with no value', () => {
      const view = render(<DatePicker label="Label" />)
      const label = view.getByText('Label').getBoundingClientRect()
      const [first] = segmentsOf(view)

      expect(label.bottom).toBeLessThanOrEqual(
        first.getBoundingClientRect().top,
      )
    })

    it('mutes a segment not yet filled, as the shared module does', () => {
      const view = render(<DatePicker label="Label" />)
      const [first] = segmentsOf(view)
      const colour = getComputedStyle(first).color

      expect(first.getAttribute('data-placeholder')).toBe('true')
      expect(colour).toBe(probe(probeStyles.onSurfaceVariant))
    })
  })

  describe('the calendar half', () => {
    it('keeps the calendar closed until the trigger is pressed', () => {
      const view = render(<DatePicker defaultValue={DATE} label="Label" />)

      expect(view.queryByRole('application')).toBeNull()

      fireEvent.click(triggerOf(view))

      expect(view.getByRole('application')).not.toBeNull()
    })

    it('opens on the month the field holds', () => {
      const view = render(<DatePicker defaultValue={DATE} label="Label" />)

      fireEvent.click(triggerOf(view))

      expect(view.getByRole('grid', { name: /September 2026/ })).not.toBeNull()
    })

    it('reports the date picked from it', () => {
      const onChange = vi.fn<(value: CalendarDate | null) => void>()
      const view = render(
        <DatePicker defaultValue={DATE} label="Label" onChange={onChange} />,
      )

      fireEvent.click(triggerOf(view))
      fireEvent.click(view.getByRole('button', { name: /September 16, 2026/ }))

      expect(onChange).toHaveBeenCalled()
      expect(onChange.mock.calls.at(-1)?.[0]?.toString()).toBe('2026-09-16')
    })

    it('names the trigger, and takes the name it was given', () => {
      const view = render(
        <DatePicker
          defaultValue={DATE}
          label="Label"
          triggerLabel="Open the calendar"
        />,
      )

      expect(triggerOf(view, 'Open the calendar')).not.toBeNull()
    })

    it('passes the bounds through to the calendar', () => {
      const view = render(
        <DatePicker
          defaultValue={DATE}
          label="Label"
          minValue={new CalendarDate(2026, 9, 10)}
        />,
      )

      fireEvent.click(triggerOf(view))

      expect(
        view
          .getByRole('button', { name: /September 1, 2026/ })
          .getAttribute('aria-disabled'),
      ).toBe('true')
    })
  })

  describe('the field chrome', () => {
    it('shows an error in place of the description, and marks the field', () => {
      const view = render(
        <DatePicker
          defaultValue={DATE}
          error="Supporting line"
          label="Label"
        />,
      )

      expect(view.getByText('Supporting line')).not.toBeNull()
      expect(view.container.querySelector('[data-invalid]')).not.toBeNull()
    })

    it('fades the field and stops the trigger while disabled', () => {
      const view = render(
        <DatePicker defaultValue={DATE} isDisabled label="Label" />,
      )
      const [first] = segmentsOf(view)
      const colour = getComputedStyle(first).color

      expect(colour).not.toBe(probe(probeStyles.onSurface))
      expect(triggerOf(view).getAttribute('disabled')).not.toBeNull()
    })

    it('opens the outlined notch over segments that already show', () => {
      const view = render(<DatePicker label="Label" variant="outlined" />)
      // The notch is the one thing the box cannot work out for itself here:
      // it reads React Aria's input context, which a picker does not
      // provide, and the label's own type comes off CSS instead. An empty
      // legend is a closed notch drawn straight through `mm/dd/yyyy`.
      const legend = view.container.querySelector('legend')

      expect(legend?.textContent).toBe('Label')
      expect(legend?.getBoundingClientRect().width).toBeGreaterThan(0)
    })
  })
})
