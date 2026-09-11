import * as stylex from '@stylexjs/stylex'
import { fireEvent, render } from '@testing-library/react'
import { I18nProvider } from 'react-aria-components'
import { describe, expect, it, vi } from 'vitest'

import DateField from '.'
import { CalendarDate, CalendarDateTime } from '../../date'
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

const DATE = new CalendarDate(2026, 9, 15)

// A granularity below a day needs a value that carries a time: React Aria
// rejects `minute` against a date-only value outright.
const DATE_TIME = new CalendarDateTime(2026, 9, 15, 9, 30)

// A segment is a spinbutton; the punctuation between them is not, which is
// what makes this the list of what a reader can actually type into.
function segmentsOf(view: ReturnType<typeof render>) {
  return view.getAllByRole('spinbutton')
}

describe('date field', () => {
  describe('segments', () => {
    it('renders one focus stop per part of the date', () => {
      const view = render(<DateField defaultValue={DATE} label="Label" />)

      expect(segmentsOf(view)).toHaveLength(3)
      for (const segment of segmentsOf(view)) {
        expect(segment.getAttribute('tabindex')).toBe('0')
      }
    })

    it('adds the time segments when the granularity asks for them', () => {
      const view = render(
        <DateField
          defaultValue={DATE_TIME}
          granularity="minute"
          label="Label"
        />,
      )

      // Day, month and year, plus an hour, a minute and the day period this
      // locale writes times with.
      expect(segmentsOf(view).length).toBeGreaterThan(3)
    })

    it('takes its order from the reader locale, not from here', () => {
      const us = render(
        <I18nProvider locale="en-US">
          <DateField defaultValue={DATE} label="Label" />
        </I18nProvider>,
      )
      const usTypes = segmentsOf(us).map((s) => s.getAttribute('data-type'))
      us.unmount()

      const gb = render(
        <I18nProvider locale="en-GB">
          <DateField defaultValue={DATE} label="Label" />
        </I18nProvider>,
      )
      const gbTypes = segmentsOf(gb).map((s) => s.getAttribute('data-type'))

      expect(usTypes).toEqual(['month', 'day', 'year'])
      expect(gbTypes).toEqual(['day', 'month', 'year'])
    })

    it('leaves the punctuation between them out of the tab order', () => {
      const view = render(<DateField defaultValue={DATE} label="Label" />)
      const literals = view.container.querySelectorAll('[data-type="literal"]')

      expect(literals.length).toBeGreaterThan(0)
      for (const literal of literals) {
        expect(literal.getAttribute('role')).toBeNull()
      }
    })

    it('draws the punctuation as punctuation, not as a segment', () => {
      const view = render(<DateField defaultValue={DATE} label="Label" />)
      const literal = view.container.querySelector('[data-type="literal"]')
      if (!(literal instanceof HTMLElement)) {
        throw new Error('expected punctuation between the segments')
      }

      const style = getComputedStyle(literal)
      const colour = style.color
      const padding = style.paddingInlineStart

      // Muted and tight against its neighbours: it is a separator rather than
      // something a reader lands on and types into.
      expect(colour).toBe(probe(probeStyles.onSurfaceVariant))
      expect(Number.parseFloat(padding)).toBe(0)
    })
  })

  describe('the empty field', () => {
    it('shows a placeholder per segment, in the muted role', () => {
      const view = render(<DateField label="Label" />)
      const [first] = segmentsOf(view)

      expect(first.getAttribute('data-placeholder')).toBe('true')
      expect(getComputedStyle(first).color).toBe(
        probe(probeStyles.onSurfaceVariant),
      )
    })

    it('draws a filled segment in the full content role once it holds a value', () => {
      const view = render(<DateField defaultValue={DATE} label="Label" />)
      const [first] = segmentsOf(view)

      expect(first.getAttribute('data-placeholder')).toBeNull()
      expect(getComputedStyle(first).color).toBe(probe(probeStyles.onSurface))
    })
  })

  describe('focus', () => {
    it('fills the segment being typed rather than ringing it', () => {
      const view = render(<DateField defaultValue={DATE} label="Label" />)
      const [first] = segmentsOf(view)

      // Both: `focus()` puts DOM focus on the segment and `fireEvent` is
      // what React notices, and React Aria's render state needs the pair.
      first.focus()
      fireEvent.focus(first)

      // Read before probing: `probe` mounts a tree of its own and unmounts
      // it, which blurs the segment — so comparing against a probe taken
      // afterwards reads the resting state and always fails.
      const focused = getComputedStyle(first)
      const background = focused.backgroundColor
      const label = focused.color

      // React Aria hides the caret, so a ring would be the only sign of
      // focus and a thin one at that.
      expect(background).toBe(probe(probeStyles.primary))
      expect(label).toBe(probe(probeStyles.onPrimary))
    })

    it('moves between segments with the arrow keys', () => {
      const view = render(<DateField defaultValue={DATE} label="Label" />)
      const [first, second] = segmentsOf(view)

      first.focus()
      fireEvent.keyDown(first, { key: 'ArrowRight' })
      fireEvent.keyUp(first, { key: 'ArrowRight' })

      expect(document.activeElement).toBe(second)
    })

    it('changes a segment value with the up and down arrows', () => {
      const onChange = vi.fn<(value: CalendarDate | null) => void>()
      const view = render(
        <DateField defaultValue={DATE} label="Label" onChange={onChange} />,
      )
      const [first] = segmentsOf(view)

      first.focus()
      fireEvent.keyDown(first, { key: 'ArrowUp' })
      fireEvent.keyUp(first, { key: 'ArrowUp' })

      expect(onChange).toHaveBeenCalled()
    })
  })

  describe('the field chrome', () => {
    it('floats the label clear of the segments, even with no value', () => {
      const view = render(<DateField label="Label" />)
      const label = view.getByText('Label').getBoundingClientRect()
      const [first] = segmentsOf(view)
      const segment = first.getBoundingClientRect()

      // The segments occupy the value's line from the first render — they
      // show `mm/dd/yyyy` with no value at all — so a label that stayed down
      // would print on top of them.
      expect(label.bottom).toBeLessThanOrEqual(segment.top)
    })

    it('is labelled, and the label names every segment', () => {
      const view = render(<DateField defaultValue={DATE} label="Label" />)

      expect(view.getByText('Label')).not.toBeNull()
      // React Aria composes the field's label into each segment's own name,
      // so a reader landing on one hears which field it belongs to.
      expect(
        view.getByRole('spinbutton', { name: /month, Label/ }),
      ).not.toBeNull()
    })

    it('shows supporting text under the box', () => {
      const view = render(
        <DateField
          defaultValue={DATE}
          description="Supporting line"
          label="Label"
        />,
      )

      expect(view.getByText('Supporting line')).not.toBeNull()
    })

    it('marks the field invalid when it is given an error', () => {
      const view = render(
        <DateField defaultValue={DATE} error="Supporting line" label="Label" />,
      )

      expect(view.getByText('Supporting line')).not.toBeNull()
      expect(view.container.querySelector('[data-invalid]')).not.toBeNull()
    })

    it('fades every segment while the field is disabled', () => {
      const view = render(
        <DateField defaultValue={DATE} isDisabled label="Label" />,
      )
      const [first] = segmentsOf(view)

      expect(getComputedStyle(first).color).not.toBe(
        probe(probeStyles.onSurface),
      )
    })

    it('opens the outlined notch over segments that already show', () => {
      const view = render(<DateField label="Label" variant="outlined" />)
      // The notch is the one thing the box cannot work out for itself here:
      // it reads React Aria's input context, which a date field does not
      // provide, and the label's own type comes off CSS instead. An empty
      // legend is a closed notch drawn straight through `mm/dd/yyyy`.
      const legend = view.container.querySelector('legend')

      expect(legend?.textContent).toBe('Label')
      expect(legend?.getBoundingClientRect().width).toBeGreaterThan(0)
    })
  })
})
