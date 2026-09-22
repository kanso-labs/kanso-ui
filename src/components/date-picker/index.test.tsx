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

// Matched on a pattern rather than the whole name: React Aria composes the
// field's own label into the trigger's accessible name, so an exact string
// finds nothing.
// The box the field draws, and the trigger the chrome puts in its trailing
// slot. The box is the outer of the two groups, which is the one a
// `querySelector` reaches first.
function parts(container: HTMLElement) {
  const box = container.querySelector('[role="group"]')
  const trigger = container.querySelector('button')
  if (!(box instanceof HTMLElement) || !(trigger instanceof HTMLElement)) {
    throw new Error('expected the field to draw a box and a trigger')
  }
  return {
    box: box.getBoundingClientRect(),
    trigger: trigger.getBoundingClientRect(),
  }
}

function segmentsOf(view: ReturnType<typeof render>) {
  return view.getAllByRole('spinbutton')
}

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
      // Two groups: React Aria's, around the segments, and the field box
      // around that. The trigger is the box's trailing icon, so the box is
      // the one holding both — found by what it contains rather than by its
      // place in the pair, since which group that is belongs to the layout.
      const [segment] = segmentsOf(view)
      const trigger = triggerOf(view)
      const group = view
        .getAllByRole('group')
        .find(
          (candidate) =>
            candidate.contains(segment) && candidate.contains(trigger),
        )
      if (!(group instanceof HTMLElement)) {
        throw new Error('expected one group to hold the segments and trigger')
      }

      // One field rather than a field beside a button: the group draws once
      // around both, under the field's own label, and a reader reaches the
      // trigger after the segments rather than as a separate control.
      expect(group.getAttribute('aria-labelledby')).toBe(
        view.getByText('Label').id,
      )
      expect(
        segment.compareDocumentPosition(trigger) &
          Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeGreaterThan(0)
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
    // The dialog the calendar opens in is named by React Aria rather than by
    // this component: its picker hook hands the dialog `aria-labelledby`
    // through context, pointing at the trigger's own label and the field's.
    // Nothing here passes a name, which is why it looked unnamed from the
    // source — the name is only visible once rendered. The first half is
    // React Aria's localized string and moves with it; the second is the
    // label the call site gave, which is what a reader chose the field by.
    it('names the dialog it opens in after the trigger and the label', () => {
      const view = render(<DatePicker defaultOpen label="Label" />)

      expect(
        view.getByRole('dialog', { name: 'Choose a date Label' }),
      ).not.toBeNull()
    })

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
  // The trigger is the chrome's trailing icon rather than something on the
  // segments' line. On that line it was taller than the row holding it, so
  // it hung past the underline and pulled the segments down with it.
  describe('the calendar trigger', () => {
    it('keeps the trigger inside the box', () => {
      const view = render(<DatePicker label="Label" />)
      const { box, trigger } = parts(view.container)

      expect(trigger.top).toBeGreaterThanOrEqual(box.top)
      expect(trigger.bottom).toBeLessThanOrEqual(box.bottom)
    })

    // The slot stretches to the box's full height, so whatever it holds
    // centres there rather than sitting under the floated label.
    it('centres the trigger in the box', () => {
      const view = render(<DatePicker label="Label" />)
      const { box, trigger } = parts(view.container)

      expect(trigger.top - box.top).toBe(box.bottom - trigger.bottom)
    })
  })
})
