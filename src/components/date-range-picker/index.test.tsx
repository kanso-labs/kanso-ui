import * as stylex from '@stylexjs/stylex'
import { fireEvent, render } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import DateRangePicker from '.'
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

const RANGE = {
  end: new CalendarDate(2026, 9, 20),
  start: new CalendarDate(2026, 9, 15),
}

// React Aria names every segment for the end it belongs to — "month, Start
// Date," and "month, End Date," — which is what separates the two groups
// without either carrying a test id.
function segmentsOf(view: ReturnType<typeof render>, end: 'End' | 'Start') {
  return view.getAllByRole('spinbutton', { name: new RegExp(`${end} Date`) })
}

// Matched on a pattern rather than the whole name: React Aria composes the
// field's own label into the trigger's accessible name, so an exact string
// finds nothing.
function triggerOf(
  view: ReturnType<typeof render>,
  label = 'Choose a date range',
) {
  return view.getByRole('button', { name: new RegExp(label) })
}

describe('date range picker', () => {
  describe('the field half', () => {
    it('draws a segment group per end of the range', () => {
      const view = render(
        <DateRangePicker defaultValue={RANGE} label="Label" />,
      )

      expect(segmentsOf(view, 'Start')).toHaveLength(3)
      expect(segmentsOf(view, 'End')).toHaveLength(3)
    })

    it('holds both ends and the trigger in one group', () => {
      const view = render(
        <DateRangePicker defaultValue={RANGE} label="Label" />,
      )
      // Two groups, and the inner one is the picker's: React Aria's Group
      // holds the segments and the trigger, and the field box around it is
      // the outer one.
      const group = view.getAllByRole('group').at(-1)
      if (!(group instanceof HTMLElement)) {
        throw new Error('expected the picker to render a group')
      }

      // One field rather than two fields beside a button: the box draws once
      // around all three, and a reader reaches the trigger at the end of the
      // segments rather than as a separate control.
      expect(group.contains(segmentsOf(view, 'Start')[0])).toBe(true)
      expect(group.contains(segmentsOf(view, 'End')[0])).toBe(true)
      expect(group.contains(triggerOf(view))).toBe(true)
    })

    it('orders the start segments ahead of the end segments', () => {
      const view = render(
        <DateRangePicker defaultValue={RANGE} label="Label" />,
      )
      const [lastStart] = segmentsOf(view, 'Start').slice(-1)
      const [firstEnd] = segmentsOf(view, 'End')

      // A range is typed left to right, so tabbing has to reach the whole
      // start date before the first segment of the end one.
      expect(
        lastStart.compareDocumentPosition(firstEnd) &
          Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy()
    })

    it('separates the two ends without saying so twice', () => {
      const view = render(
        <DateRangePicker defaultValue={RANGE} label="Label" separator="to" />,
      )
      const dash = view.getByText('to')

      // Decoration: React Aria has already named each segment for its end,
      // so a reader told "to" as well would hear the range three times.
      expect(dash.getAttribute('aria-hidden')).toBe('true')
      expect(getComputedStyle(dash).color).toBe(
        probe(probeStyles.onSurfaceVariant),
      )
    })

    it('mutes a segment not yet filled, as the shared module does', () => {
      const view = render(<DateRangePicker label="Label" />)
      const [first] = segmentsOf(view, 'Start')

      expect(first.getAttribute('data-placeholder')).toBe('true')
      expect(getComputedStyle(first).color).toBe(
        probe(probeStyles.onSurfaceVariant),
      )
    })
  })

  describe('the calendar half', () => {
    it('keeps the calendar closed until the trigger is pressed', () => {
      const view = render(
        <DateRangePicker defaultValue={RANGE} label="Label" />,
      )

      expect(view.queryByRole('application')).toBeNull()

      fireEvent.click(triggerOf(view))

      expect(view.getByRole('application')).not.toBeNull()
    })

    it('opens on the month the range starts in', () => {
      const view = render(
        <DateRangePicker defaultValue={RANGE} label="Label" />,
      )

      fireEvent.click(triggerOf(view))

      expect(view.getByRole('grid', { name: /September 2026/ })).not.toBeNull()
    })

    it('marks the days between the two ends as in range', () => {
      const view = render(
        <DateRangePicker defaultValue={RANGE} label="Label" />,
      )

      fireEvent.click(triggerOf(view))

      // Queried on the state rather than the name: React Aria composes the
      // whole range into both endpoints' accessible names, so the two ends
      // and the days between them read alike.
      const selected = view
        .getAllByRole('button')
        .filter((b) => b.getAttribute('data-selected') !== null)

      // The 15th to the 20th inclusive.
      expect(selected).toHaveLength(6)
    })

    it('reports the range picked from it', () => {
      const onChange =
        vi.fn<
          (value: null | { end: CalendarDate; start: CalendarDate }) => void
        >()
      const view = render(
        <DateRangePicker
          defaultValue={RANGE}
          label="Label"
          onChange={onChange}
        />,
      )

      fireEvent.click(triggerOf(view))
      fireEvent.click(view.getByRole('button', { name: /September 10, 2026/ }))
      fireEvent.click(view.getByRole('button', { name: /September 12, 2026/ }))

      expect(onChange).toHaveBeenCalled()
      expect(onChange.mock.calls.at(-1)?.[0]?.start.toString()).toBe(
        '2026-09-10',
      )
      expect(onChange.mock.calls.at(-1)?.[0]?.end.toString()).toBe('2026-09-12')
    })

    it('names the trigger, and takes the name it was given', () => {
      const view = render(
        <DateRangePicker
          defaultValue={RANGE}
          label="Label"
          triggerLabel="Open the calendar"
        />,
      )

      expect(triggerOf(view, 'Open the calendar')).not.toBeNull()
    })

    it('passes the bounds through to the calendar', () => {
      const view = render(
        <DateRangePicker
          defaultValue={RANGE}
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
        <DateRangePicker
          defaultValue={RANGE}
          error="Supporting line"
          label="Label"
        />,
      )

      expect(view.getByText('Supporting line')).not.toBeNull()
      expect(view.container.querySelector('[data-invalid]')).not.toBeNull()
    })

    it('fades the whole field, trigger included, while disabled', () => {
      const view = render(
        <DateRangePicker defaultValue={RANGE} isDisabled label="Label" />,
      )
      const [first] = segmentsOf(view, 'Start')
      const trigger = triggerOf(view)
      const segmentColour = getComputedStyle(first).color
      const triggerColour = getComputedStyle(trigger).color

      expect(trigger.getAttribute('disabled')).not.toBeNull()
      // The glyph fades with the dates beside it — a field greyed out except
      // for its icon reads as though the icon were still live.
      expect(segmentColour).not.toBe(probe(probeStyles.onSurface))
      expect(triggerColour).not.toBe(probe(probeStyles.onSurfaceVariant))
    })

    it('opens the outlined notch over segments that already show', () => {
      const view = render(<DateRangePicker label="Label" variant="outlined" />)
      // The notch is the one thing the box cannot work out for itself here:
      // it reads React Aria's input context, which a picker does not
      // provide, and the label's own type comes off CSS instead.
      const legend = view.container.querySelector('legend')

      expect(legend?.textContent).toBe('Label')
      expect(legend?.getBoundingClientRect().width).toBeGreaterThan(0)
    })
  })
})
