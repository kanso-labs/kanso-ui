import * as stylex from '@stylexjs/stylex'
import { fireEvent, render } from '@testing-library/react'
import { I18nProvider } from 'react-aria-components'
import { describe, expect, it, vi } from 'vitest'

import DateField from '.'
import { CalendarDate, CalendarDateTime } from '../../date'
import { crowdedSegments } from '../../segments/spacing.testing'
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
const SINGLE_DIGITS = new CalendarDate(2026, 9, 5)
// A day and an hour of one digit each, which in Japanese stand either side of
// the space joining the date to the time.
const SINGLE_DIGITS_TIME = new CalendarDateTime(2026, 9, 5, 9, 30)

// The literals between the segments, by their text with the invisible
// direction marks some locales add taken out, each with the padding on its
// two sides.
function literalsOf(view: ReturnType<typeof render>) {
  return [...view.container.querySelectorAll('[data-type="literal"]')]
    .map((literal) => {
      const style = getComputedStyle(literal)
      return {
        end: style.paddingInlineEnd,
        start: style.paddingInlineStart,
        text: literal.textContent.replaceAll(
          /[\u061c\u200e\u200f\u202a-\u202e\u2066-\u2069]/gu,
          '',
        ),
      }
    })
    .filter((literal) => literal.text !== '')
}

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

    // A single-digit month and day are the narrowest a date gets, and German
    // writes its punctuation as a full stop, narrower than a slash.
    it.each(['en-US', 'de-DE'])(
      'keeps every segment clear of the next as a target, in %s',
      (locale) => {
        const view = render(
          <I18nProvider locale={locale}>
            <DateField defaultValue={SINGLE_DIGITS} label="Label" />
          </I18nProvider>,
        )
        const segments = segmentsOf(view)

        expect(segments).toHaveLength(3)
        expect(crowdedSegments(segments)).toEqual([])
      },
    )

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

      // Muted, since it is a separator rather than something a reader lands
      // on and types into, and with room either side that keeps the segments
      // apart as targets.
      expect(colour).toBe(probe(probeStyles.onSurfaceVariant))
      expect(Number.parseFloat(padding)).toBe(4)
    })
  })

  // A date with a time joins the two with a comma and a space in most of the
  // Storybook's locales, and with a space alone in Japanese, and the time
  // with its AM or PM with a space.
  describe('with a time', () => {
    it.each(
      ['en-US', 'de-DE', 'ar-EG', 'ja-JP'].flatMap((locale) => [
        { day: 'a two-digit day', locale, value: DATE_TIME },
        { day: 'a one-digit day', locale, value: SINGLE_DIGITS_TIME },
      ]),
    )(
      'keeps every segment clear of the next as a target, in $locale with $day',
      ({ locale, value }) => {
        const view = render(
          <I18nProvider locale={locale}>
            <DateField
              defaultValue={value}
              granularity="minute"
              label="Label"
            />
          </I18nProvider>,
        )

        expect(crowdedSegments(segmentsOf(view))).toEqual([])
      },
    )

    // The comma hangs off the year as it does in prose, so it takes no room
    // on that side: the year is wide enough to clear the hour after it as a
    // target, and the room was a space before the comma.
    it.each(['en-US', 'de-DE', 'ar-EG'])(
      'draws the comma against the date, in %s',
      (locale) => {
        const view = render(
          <I18nProvider locale={locale}>
            <DateField
              defaultValue={DATE_TIME}
              granularity="minute"
              label="Label"
            />
          </I18nProvider>,
        )
        const comma = literalsOf(view).find((literal) =>
          /^[,،] $/u.test(literal.text),
        )

        expect(comma).toMatchObject({ end: '4px', start: '0px' })
      },
    )

    // Japanese joins the date to the time with a space alone, between a day
    // and an hour either of which can be one digit, so that space takes
    // twice the room. The space before AM or PM stands inside the time, and
    // keeps the room a slash has.
    it('widens the space joining a date to its time, and no other', () => {
      const japanese = render(
        <I18nProvider locale="ja-JP">
          <DateField
            defaultValue={SINGLE_DIGITS_TIME}
            granularity="minute"
            label="Label"
          />
        </I18nProvider>,
      )
      expect(
        literalsOf(japanese).filter((literal) => literal.text === ' '),
      ).toEqual([{ end: '8px', start: '8px', text: ' ' }])
      japanese.unmount()

      const english = render(
        <DateField
          defaultValue={SINGLE_DIGITS_TIME}
          granularity="minute"
          label="Label"
        />,
      )
      expect(
        literalsOf(english).filter((literal) => literal.text === ' '),
      ).toEqual([{ end: '4px', start: '4px', text: ' ' }])
    })

    it('keeps the room either side of the punctuation inside the date and the time', () => {
      const view = render(
        <DateField
          defaultValue={DATE_TIME}
          granularity="minute"
          label="Label"
        />,
      )
      const marks = literalsOf(view).filter((literal) =>
        ['/', ':'].includes(literal.text),
      )

      expect(marks).toHaveLength(3)
      for (const mark of marks) {
        expect(mark).toMatchObject({ end: '4px', start: '4px' })
      }
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
