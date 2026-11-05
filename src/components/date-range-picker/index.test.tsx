import type { ReactElement } from 'react'

import * as stylex from '@stylexjs/stylex'
import { fireEvent, render, waitFor } from '@testing-library/react'
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

// A phone's 360dp less the page's 16dp margins either side.
const PHONE = { inlineSize: '328px' }

// The page's 56dp box, and the segments' body-large line.
const BOX_HEIGHT = 56
const LINE_HEIGHT = 24

// Wide enough for both dates and the dash on one line, in any variant.
const WIDE = { inlineSize: '1000px' }

// Whether the end date has a line of its own, below the start date's.
function endWrapped(view: ReturnType<typeof render>) {
  const start = segmentsOf(view, 'Start')[0].getBoundingClientRect()
  const end = segmentsOf(view, 'End')[0].getBoundingClientRect()
  return end.top >= start.bottom
}

// The group holding the two dates and the dash, which is the segments' own
// closest group.
function groupOf(view: ReturnType<typeof render>) {
  const group = view.getAllByRole('spinbutton')[0].closest('[role="group"]')
  if (!(group instanceof HTMLElement)) {
    throw new Error('expected the segments to sit in a group')
  }
  return group
}

// The line the segments sit on, which clips whatever does not fit on it.
function lineOf(view: ReturnType<typeof render>) {
  const line = groupOf(view).parentElement
  if (
    !(line instanceof HTMLElement) ||
    getComputedStyle(line).overflow !== 'hidden'
  ) {
    throw new Error('expected the segments to sit on a line that clips')
  }
  return line.getBoundingClientRect()
}

// How wide the two dates and the dash are on one line, gaps included.
function oneLineWidthOf(view: ReturnType<typeof render>) {
  const group = groupOf(view)
  const laidOut = [...group.children].filter(
    (child) => child.getBoundingClientRect().height > 0,
  )
  const gap = Number.parseFloat(getComputedStyle(group).columnGap)
  return laidOut.reduce(
    (sum, child) => sum + child.getBoundingClientRect().width,
    gap * (laidOut.length - 1),
  )
}

// Renders the picker as the only thing in a block this many pixels wide. React
// Testing Library removes the block from the body again when it cleans up.
function renderIn(width: number, element: ReactElement) {
  const host = document.createElement('div')
  host.style.inlineSize = `${width}px`
  document.body.append(host)
  return render(element, { container: host })
}

// React Aria names every segment for the end it belongs to — "month, Start
// Date," and "month, End Date," — which is what separates the two groups
// without either carrying a test id.
function segmentsOf(view: ReturnType<typeof render>, end: 'End' | 'Start') {
  return view.getAllByRole('spinbutton', { name: new RegExp(`${end} Date`) })
}

// React Aria's own name for the button, "Calendar", composed with the field's
// label.
function triggerOf(view: ReturnType<typeof render>, label = 'Calendar') {
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
      // Two groups: React Aria's, around the segments, and the field box
      // around that. The trigger is the box's trailing icon, so the box is
      // the one holding all three — found by what it contains rather than by
      // its place in the pair, since which group that is belongs to the
      // layout.
      const [start] = segmentsOf(view, 'Start')
      const [end] = segmentsOf(view, 'End')
      const trigger = triggerOf(view)
      const group = view
        .getAllByRole('group')
        .find(
          (candidate) =>
            candidate.contains(start) &&
            candidate.contains(end) &&
            candidate.contains(trigger),
        )
      if (!(group instanceof HTMLElement)) {
        throw new Error('expected one group to hold both ends and the trigger')
      }

      // One field rather than two fields beside a button: the group draws
      // once around all three, under the field's own label, and a reader
      // reaches the trigger after the segments rather than as a separate
      // control.
      expect(group.getAttribute('aria-labelledby')).toBe(
        view.getByText('Label').id,
      )
      expect(
        end.compareDocumentPosition(trigger) & Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeGreaterThan(0)
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
    it('hands its calendar the month and year menus', () => {
      const view = render(
        <DateRangePicker
          defaultOpen
          defaultValue={RANGE}
          label="Label"
          showMonthYearMenus
        />,
      )

      expect(view.getByRole('button', { name: 'Sep month' })).not.toBeNull()
      expect(view.getByRole('button', { name: '2026 year' })).not.toBeNull()
    })

    // The dialog the calendar opens in is named by React Aria rather than by
    // this component: its picker hook hands the dialog `aria-labelledby`
    // through context, pointing at the trigger's own label and the field's.
    // Nothing here passes a name, which is why it looked unnamed from the
    // source — the name is only visible once rendered. The first half is
    // React Aria's localized string and moves with it; the second is the
    // label the call site gave, which is what a reader chose the field by.
    it('names the dialog it opens in after the trigger and the label', () => {
      const view = render(<DateRangePicker defaultOpen label="Label" />)

      expect(
        view.getByRole('dialog', { name: 'Calendar Label' }),
      ).not.toBeNull()
    })

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
  // Two dates and the dash are wider than a phone's field, and the line the
  // segments sit on clips them, so at 328px the empty field hid most of the
  // end date. The end date takes a line of its own there, and the box grows
  // by a line to hold it.
  describe('a field too narrow for both dates', () => {
    it.each(['filled', 'outlined'] as const)(
      'keeps every segment of the %s field in sight',
      (variant) => {
        const view = render(
          <div style={PHONE}>
            <DateRangePicker label="Label" variant={variant} />
          </div>,
        )
        const line = lineOf(view)

        for (const segment of view.getAllByRole('spinbutton')) {
          const box = segment.getBoundingClientRect()
          expect(box.left).toBeGreaterThanOrEqual(line.left)
          expect(box.right).toBeLessThanOrEqual(line.right)
          expect(box.top).toBeGreaterThanOrEqual(line.top)
          expect(box.bottom).toBeLessThanOrEqual(line.bottom)
        }
      },
    )

    // The dash stays after the start date, so the first line reads as the
    // start of a range and the second as its end.
    it('puts the end date on a line of its own, after the dash', () => {
      const view = render(
        <div style={PHONE}>
          <DateRangePicker label="Label" />
        </div>,
      )
      const start = segmentsOf(view, 'Start')[0].getBoundingClientRect()
      const end = segmentsOf(view, 'End')[0].getBoundingClientRect()
      const dash = view.getByText('–').getBoundingClientRect()

      expect(end.top).toBeGreaterThanOrEqual(start.bottom)
      expect(end.left).toBeCloseTo(start.left, 0)
      expect(dash.top).toBeLessThan(start.bottom)
      expect(dash.left).toBeGreaterThan(start.right)
    })

    it.each(['filled', 'outlined'] as const)(
      'grows the %s box by a line and keeps the trigger centred',
      (variant) => {
        const view = render(
          <div style={PHONE}>
            <DateRangePicker label="Label" variant={variant} />
          </div>,
        )
        const { box, trigger } = parts(view.container)

        expect(box.height).toBe(BOX_HEIGHT + LINE_HEIGHT)
        expect(trigger.top - box.top).toBeCloseTo(
          box.bottom - trigger.bottom,
          0,
        )
      },
    )

    // A date is narrower filled than empty, so between the two widths the
    // end date would lift back up beside the start while the start date was
    // being typed, and the box would shrink under it. It stays on its own
    // line until the field's width changes.
    it('keeps the end date on its own line as the dates fill in', () => {
      const wide = render(
        <div style={WIDE}>
          <DateRangePicker label="Label" />
        </div>,
      )
      const empty = oneLineWidthOf(wide)
      const chrome =
        parts(wide.container).box.width -
        groupOf(wide).getBoundingClientRect().width
      wide.unmount()
      const filledView = render(
        <div style={WIDE}>
          <DateRangePicker defaultValue={RANGE} label="Label" />
        </div>,
      )
      const filled = oneLineWidthOf(filledView)
      filledView.unmount()
      expect(empty - filled).toBeGreaterThan(8)
      const between = chrome + (empty + filled) / 2

      const fresh = renderIn(
        between,
        <DateRangePicker defaultValue={RANGE} label="Label" />,
      )
      expect(endWrapped(fresh)).toBe(false)
      fresh.unmount()

      const view = renderIn(
        between,
        <DateRangePicker label="Label" value={null} />,
      )
      expect(endWrapped(view)).toBe(true)
      view.rerender(<DateRangePicker label="Label" value={RANGE} />)
      expect(endWrapped(view)).toBe(true)
      expect(parts(view.container).box.height).toBe(BOX_HEIGHT + LINE_HEIGHT)
    })

    it('brings the end date back up once the field is wide enough', async () => {
      const view = render(
        <div style={PHONE}>
          <DateRangePicker label="Label" />
        </div>,
      )
      expect(endWrapped(view)).toBe(true)

      const wrapper = view.container.firstElementChild
      if (!(wrapper instanceof HTMLElement)) {
        throw new Error('expected the picker in a wrapper')
      }
      Object.assign(wrapper.style, WIDE)

      await waitFor(() => {
        expect(endWrapped(view)).toBe(false)
      })
      expect(parts(view.container).box.height).toBe(BOX_HEIGHT)
    })

    // Where both fit, nothing moves: one line, and the page's 56dp box.
    it.each(['filled', 'outlined'] as const)(
      'keeps both dates on one line in a %s field that fits them',
      (variant) => {
        const view = render(
          <DateRangePicker
            defaultValue={RANGE}
            label="Label"
            variant={variant}
          />,
        )
        const tops = view
          .getAllByRole('spinbutton')
          .map((segment) => segment.getBoundingClientRect().top)

        expect(new Set(tops).size).toBe(1)
        expect(parts(view.container).box.height).toBe(BOX_HEIGHT)
      },
    )
  })

  // The trigger is the chrome's trailing icon rather than something on the
  // segments' line. On that line it was taller than the row holding it, so
  // it hung past the underline and pulled the segments down with it.
  describe('the calendar trigger', () => {
    it('keeps the trigger inside the box', () => {
      const view = render(<DateRangePicker label="Label" />)
      const { box, trigger } = parts(view.container)

      expect(trigger.top).toBeGreaterThanOrEqual(box.top)
      expect(trigger.bottom).toBeLessThanOrEqual(box.bottom)
    })

    // The slot stretches to the box's full height, so whatever it holds
    // centres there rather than sitting under the floated label.
    it('centres the trigger in the box', () => {
      const view = render(<DateRangePicker label="Label" />)
      const { box, trigger } = parts(view.container)

      expect(trigger.top - box.top).toBe(box.bottom - trigger.bottom)
    })
  })
})
