import * as stylex from '@stylexjs/stylex'
import { act, fireEvent, render, within } from '@testing-library/react'
import { I18nProvider } from 'react-aria-components'
import { afterEach, describe, expect, it, vi } from 'vitest'

import TimePicker from '.'
import { Time } from '../../date'
import { declarationsHeld } from '../../styles/stylesheet.testing'
import { colors } from '../../tokens/design.tokens.stylex'

const FORCED_COLORS = 'forced-colors: active'

// Each fill compared by what it resolves to, so a test pins the role rather
// than the colour it happens to be today.
const probeStyles = stylex.create({
  primaryContainer: { backgroundColor: colors.primaryContainer },
  surfaceContainerHighest: { backgroundColor: colors.surfaceContainerHighest },
  tertiaryContainer: { backgroundColor: colors.tertiaryContainer },
})

function probe(style: stylex.StyleXStyles) {
  const view = render(<span data-testid="probe" {...stylex.props(style)} />)
  const read = getComputedStyle(view.getByTestId('probe')).backgroundColor
  view.unmount()
  return read
}

const TIME = new Time(9, 30)

// The dial's viewBox and the radii of its two rings, in its own units.
const DIAL = 256
const OUTER_RING = 101
const INNER_RING = 64

type Picked = (value: null | Time) => void

function boxOf(dialog: HTMLElement, type: 'hour' | 'minute') {
  const box = dialog.querySelector(`[data-type="${type}"]`)
  if (!(box instanceof HTMLElement)) {
    throw new Error(`expected the modal to draw a ${type} box`)
  }
  return box
}

function dialOf(dialog: HTMLElement) {
  const dial = dialog.querySelector('svg[data-dial]')
  if (!(dial instanceof SVGSVGElement)) {
    throw new Error('expected the modal to draw a dial')
  }
  return dial
}

// Focus moved the way a Tab or a press moves it, with what it sets flushed.
function focus(element: HTMLElement) {
  act(() => {
    element.focus()
  })
}

function labelsOf(dialog: HTMLElement) {
  return [...dialOf(dialog).querySelectorAll('text')].map(
    (label) => label.textContent,
  )
}

function open(view: ReturnType<typeof render>, name = 'Select time') {
  fireEvent.click(triggerOf(view, name))
  return view.getByRole('dialog')
}

// A modal in a right-to-left locale, with the document turned over as an
// app in one would be.
function openArabic() {
  document.documentElement.setAttribute('dir', 'rtl')
  const view = render(
    <I18nProvider locale="ar-EG">
      <TimePicker defaultValue={TIME} label="Label" />
    </I18nProvider>,
  )
  // The clock button's words are the locale's, "اختر الوقت".
  return { dialog: open(view, 'اختر الوقت'), view }
}

// A press on the dial at a fraction of a turn clockwise from twelve, on a
// ring of the given radius in the dial's own units.
function pressDial(dialog: HTMLElement, turn: number, radius = OUTER_RING) {
  const dial = dialOf(dialog)
  const box = dial.getBoundingClientRect()
  const scale = box.width / DIAL
  const angle = turn * 2 * Math.PI
  const point = {
    button: 0,
    clientX: box.left + box.width / 2 + Math.sin(angle) * radius * scale,
    clientY: box.top + box.height / 2 - Math.cos(angle) * radius * scale,
    pointerId: 1,
    pointerType: 'mouse',
  }
  fireEvent.pointerDown(dial, point)
  fireEvent.pointerUp(dial, point)
}

// The clock button, named by its own words and then the field's label.
function triggerOf(view: ReturnType<typeof render>, name = 'Select time') {
  return view.getByRole('button', { name: `${name} Label` })
}

describe('time picker', () => {
  describe('the field', () => {
    it('draws the segments a time field does, and the clock button', () => {
      const view = render(<TimePicker defaultValue={TIME} label="Label" />)

      expect(view.getAllByRole('spinbutton')).toHaveLength(3)
      expect(triggerOf(view).getAttribute('aria-haspopup')).toBe('dialog')
    })

    it('names the clock button after its words and the field label', () => {
      const view = render(
        <TimePicker
          defaultValue={TIME}
          label="Label"
          selectTimeLabel="Pick a time"
        />,
      )

      expect(triggerOf(view, 'Pick a time')).not.toBeNull()
    })

    it('stops the clock button while the field is disabled or read-only', () => {
      const disabled = render(
        <TimePicker defaultValue={TIME} isDisabled label="Label" />,
      )
      expect(triggerOf(disabled).getAttribute('disabled')).not.toBeNull()
      disabled.unmount()

      const readOnly = render(
        <TimePicker defaultValue={TIME} isReadOnly label="Label" />,
      )
      expect(triggerOf(readOnly).getAttribute('disabled')).not.toBeNull()
    })

    it('shows an error in place of the description, and marks the field', () => {
      const view = render(
        <TimePicker
          defaultValue={TIME}
          description="Description"
          error="Supporting line"
          label="Label"
        />,
      )

      expect(view.getByText('Supporting line')).not.toBeNull()
      expect(view.queryByText('Description')).toBeNull()
      expect(view.container.querySelector('[data-invalid]')).not.toBeNull()
    })
  })

  describe('the modal', () => {
    it('stays closed until the clock button is pressed', () => {
      const view = render(<TimePicker defaultValue={TIME} label="Label" />)

      expect(view.queryByRole('dialog')).toBeNull()
      expect(triggerOf(view).getAttribute('aria-expanded')).toBe('false')

      open(view)

      expect(triggerOf(view).getAttribute('aria-expanded')).toBe('true')
    })

    it('names the dialog after its headline and the field label', () => {
      const view = render(<TimePicker defaultValue={TIME} label="Label" />)
      open(view)

      expect(
        view.getByRole('dialog', { name: 'Select time Label' }),
      ).not.toBeNull()
      expect(view.getByRole('heading', { level: 2 }).textContent).toBe(
        'Select time',
      )
    })

    it('opens on the time the field holds, in two boxes', () => {
      const view = render(<TimePicker defaultValue={TIME} label="Label" />)
      const dialog = open(view)

      // The period segment is the selector's job, so the boxes are the only
      // spinbuttons a reader reaches in the modal.
      expect(within(dialog).getAllByRole('spinbutton')).toHaveLength(2)
      expect(boxOf(dialog, 'hour').textContent).toBe('09')
      expect(boxOf(dialog, 'minute').textContent).toBe('30')
    })

    it('opens on midnight when the field is empty', () => {
      const view = render(<TimePicker label="Label" />)
      const dialog = open(view)

      expect(boxOf(dialog, 'hour').textContent).toBe('12')
      expect(boxOf(dialog, 'minute').textContent).toBe('00')
    })

    it('opens on the placeholder when the field is empty and has one', () => {
      const view = render(
        <TimePicker label="Label" placeholderValue={new Time(14, 45)} />,
      )
      const dialog = open(view)

      expect(boxOf(dialog, 'hour').textContent).toBe('02')
      expect(boxOf(dialog, 'minute').textContent).toBe('45')
    })

    it('takes its action words from the props it is given', () => {
      const view = render(
        <TimePicker
          cancelLabel="Back"
          confirmLabel="Done"
          defaultOpen
          label="Label"
        />,
      )

      expect(view.getByRole('button', { name: 'Back' })).not.toBeNull()
      expect(view.getByRole('button', { name: 'Done' })).not.toBeNull()
    })
  })

  describe('the dial', () => {
    it('draws twelve hours, and follows the hour box first', () => {
      const view = render(<TimePicker defaultValue={TIME} label="Label" />)
      const dialog = open(view)

      expect(dialOf(dialog).getAttribute('aria-hidden')).toBe('true')
      expect(dialOf(dialog).dataset.dial).toBe('hour')
      expect(labelsOf(dialog)).toEqual([
        '12',
        '1',
        '2',
        '3',
        '4',
        '5',
        '6',
        '7',
        '8',
        '9',
        '10',
        '11',
      ])
    })

    it('sets the hour where it is pressed, then moves on to the minutes', () => {
      const view = render(<TimePicker defaultValue={TIME} label="Label" />)
      const dialog = open(view)

      pressDial(dialog, 3 / 12)

      expect(boxOf(dialog, 'hour').textContent).toBe('03')
      expect(dialOf(dialog).dataset.dial).toBe('minute')
      expect(document.activeElement).toBe(boxOf(dialog, 'minute'))
      expect(labelsOf(dialog).slice(0, 4)).toEqual(['00', '05', '10', '15'])
    })

    it('sets the minute to the nearest one, between the labels too', () => {
      const view = render(<TimePicker defaultValue={TIME} label="Label" />)
      const dialog = open(view)

      pressDial(dialog, 3 / 12)
      pressDial(dialog, 17 / 60)

      expect(boxOf(dialog, 'minute').textContent).toBe('17')
      expect(dialOf(dialog).dataset.dial).toBe('minute')
    })

    it('keeps the period an hour is pressed in', () => {
      const view = render(
        <TimePicker defaultValue={new Time(21, 30)} label="Label" />,
      )
      const dialog = open(view)

      pressDial(dialog, 3 / 12)

      expect(boxOf(dialog, 'hour').textContent).toBe('03')
      expect(
        view.getByRole('radio', { name: 'PM' }).getAttribute('aria-checked'),
      ).toBe('true')
    })

    it('ignores a press with a mouse button other than the main one', () => {
      const view = render(<TimePicker defaultValue={TIME} label="Label" />)
      const dialog = open(view)
      const dial = dialOf(dialog)
      const box = dial.getBoundingClientRect()

      fireEvent.pointerDown(dial, {
        button: 2,
        clientX: box.right - 10,
        clientY: box.top + box.height / 2,
        pointerId: 1,
        pointerType: 'mouse',
      })

      expect(boxOf(dialog, 'hour').textContent).toBe('09')
    })

    it('follows the box that takes focus', () => {
      const view = render(<TimePicker defaultValue={TIME} label="Label" />)
      const dialog = open(view)

      focus(boxOf(dialog, 'minute'))

      expect(dialOf(dialog).dataset.dial).toBe('minute')
    })

    it('moves its hand as a box is stepped from the keyboard', () => {
      const view = render(<TimePicker defaultValue={TIME} label="Label" />)
      const dialog = open(view)
      const hour = boxOf(dialog, 'hour')

      focus(hour)
      fireEvent.keyDown(hour, { key: 'ArrowUp' })

      expect(hour.textContent).toBe('10')
      const handle = dialOf(dialog).querySelector('[data-handle]')
      // Ten o'clock, two twelfths of a turn before twelve.
      expect(Number(handle?.getAttribute('cx'))).toBeCloseTo(
        DIAL / 2 - OUTER_RING * Math.sin(Math.PI / 3),
      )
      expect(Number(handle?.getAttribute('cy'))).toBeCloseTo(
        DIAL / 2 - OUTER_RING * Math.cos(Math.PI / 3),
      )
    })

    it('stays on the hours when the field has no minutes', () => {
      const view = render(
        <TimePicker defaultValue={TIME} granularity="hour" label="Label" />,
      )
      const dialog = open(view)

      pressDial(dialog, 3 / 12)

      expect(within(dialog).getAllByRole('spinbutton')).toHaveLength(1)
      expect(dialOf(dialog).dataset.dial).toBe('hour')
    })
  })

  describe('the period selector', () => {
    it('is a radio group named after the period, morning first', () => {
      const view = render(<TimePicker defaultValue={TIME} label="Label" />)
      open(view)

      const group = view.getByRole('radiogroup', { name: 'AM/PM' })
      const [morning, afternoon] = within(group).getAllByRole('radio')

      expect(morning.textContent).toBe('AM')
      expect(afternoon.textContent).toBe('PM')
      expect(morning.getAttribute('aria-checked')).toBe('true')
    })

    it('moves the hour between the halves of the day', () => {
      const onChange = vi.fn<Picked>()
      const view = render(
        <TimePicker defaultValue={TIME} label="Label" onChange={onChange} />,
      )
      const dialog = open(view)

      fireEvent.click(view.getByRole('radio', { name: 'PM' }))

      expect(boxOf(dialog, 'hour').textContent).toBe('09')
      fireEvent.click(view.getByRole('button', { name: 'OK' }))
      expect(onChange.mock.calls.at(-1)?.[0]?.toString()).toBe('21:30:00')
    })
  })

  describe('the input variant', () => {
    it('switches from the dial, and back', () => {
      const view = render(<TimePicker defaultValue={TIME} label="Label" />)
      const dialog = open(view)

      fireEvent.click(view.getByRole('button', { name: 'Enter time' }))

      expect(view.getByRole('heading', { level: 2 }).textContent).toBe(
        'Enter time',
      )
      expect(dialog.querySelector('svg[data-dial]')).toBeNull()
      expect(within(dialog).getByText('Hour')).not.toBeNull()
      expect(within(dialog).getByText('Minute')).not.toBeNull()

      fireEvent.click(view.getByRole('button', { name: 'Select time' }))

      expect(dialog.querySelector('svg[data-dial]')).not.toBeNull()
    })

    it('opens on it when asked to', () => {
      const view = render(
        <TimePicker
          defaultMode="input"
          defaultValue={TIME}
          enterTimeLabel="Type a time"
          label="Label"
        />,
      )
      const dialog = open(view)

      expect(view.getByRole('dialog', { name: 'Type a time Label' })).toBe(
        dialog,
      )
      expect(dialog.querySelector('svg[data-dial]')).toBeNull()
    })

    it('takes a typed time', () => {
      const onChange = vi.fn<Picked>()
      const view = render(
        <TimePicker
          defaultMode="input"
          defaultValue={TIME}
          label="Label"
          onChange={onChange}
        />,
      )
      const dialog = open(view)
      const minute = boxOf(dialog, 'minute')

      focus(minute)
      fireEvent.keyDown(minute, { key: 'ArrowDown' })
      fireEvent.click(view.getByRole('button', { name: 'OK' }))

      expect(onChange.mock.calls.at(-1)?.[0]?.toString()).toBe('09:29:00')
    })
  })

  describe('confirming', () => {
    it('writes the picked time back on OK, and closes', () => {
      const onChange = vi.fn<Picked>()
      const onOpenChange = vi.fn<(isOpen: boolean) => void>()
      const view = render(
        <TimePicker
          defaultValue={TIME}
          label="Label"
          onChange={onChange}
          onOpenChange={onOpenChange}
        />,
      )
      const dialog = open(view)

      pressDial(dialog, 3 / 12)
      pressDial(dialog, 0.5)
      fireEvent.click(view.getByRole('button', { name: 'OK' }))

      expect(onChange.mock.calls.at(-1)?.[0]?.toString()).toBe('03:30:00')
      expect(onOpenChange.mock.calls.at(-1)?.[0]).toBe(false)
      expect(triggerOf(view).getAttribute('aria-expanded')).toBe('false')
      const [hour] = view.getAllByRole('spinbutton')
      expect(hour.textContent).toBe('3')
    })

    it('discards the draft on Cancel', () => {
      const onChange = vi.fn<Picked>()
      const view = render(
        <TimePicker defaultValue={TIME} label="Label" onChange={onChange} />,
      )
      const dialog = open(view)

      pressDial(dialog, 3 / 12)
      fireEvent.click(view.getByRole('button', { name: 'Cancel' }))

      expect(onChange).not.toHaveBeenCalled()
      expect(triggerOf(view).getAttribute('aria-expanded')).toBe('false')
      const [hour] = view.getAllByRole('spinbutton')
      expect(hour.textContent).toBe('9')
    })

    it('reports to a controlled field without changing it', () => {
      const onChange = vi.fn<Picked>()
      const view = render(
        <TimePicker label="Label" onChange={onChange} value={TIME} />,
      )
      const dialog = open(view)

      pressDial(dialog, 3 / 12)
      fireEvent.click(view.getByRole('button', { name: 'OK' }))

      expect(onChange.mock.calls.at(-1)?.[0]?.toString()).toBe('03:30:00')
      const [hour] = view.getAllByRole('spinbutton')
      expect(hour.textContent).toBe('9')
    })

    it('leaves a controlled modal to the call site', () => {
      const onOpenChange = vi.fn<(isOpen: boolean) => void>()
      const view = render(
        <TimePicker
          defaultValue={TIME}
          isOpen={false}
          label="Label"
          onOpenChange={onOpenChange}
        />,
      )

      fireEvent.click(triggerOf(view))

      expect(onOpenChange).toHaveBeenCalledWith(true)
      expect(view.queryByRole('dialog')).toBeNull()
    })
  })

  describe('twelve or twenty-four hours', () => {
    it('follows a twenty-four hour locale', () => {
      const view = render(
        <I18nProvider locale="en-GB">
          <TimePicker defaultValue={new Time(15, 30)} label="Label" />
        </I18nProvider>,
      )
      const dialog = open(view)

      expect(view.queryByRole('radiogroup')).toBeNull()
      expect(boxOf(dialog, 'hour').textContent).toBe('15')
      // Midnight to eleven on the outer ring, noon to eleven at night on
      // the inner one.
      const labels = labelsOf(dialog)
      expect(labels).toHaveLength(24)
      expect(labels.slice(0, 2)).toEqual(['00', '01'])
      expect(labels.slice(12, 14)).toEqual(['12', '13'])
    })

    it('tells the rings apart by how far from the centre a press lands', () => {
      const view = render(
        <I18nProvider locale="en-GB">
          <TimePicker defaultValue={TIME} label="Label" />
        </I18nProvider>,
      )
      const dialog = open(view)

      pressDial(dialog, 3 / 12, INNER_RING)
      expect(boxOf(dialog, 'hour').textContent).toBe('15')

      focus(boxOf(dialog, 'hour'))
      pressDial(dialog, 3 / 12, OUTER_RING)
      expect(boxOf(dialog, 'hour').textContent).toBe('03')
    })

    it('takes the hour cycle from the prop over the locale', () => {
      const view = render(
        <TimePicker defaultValue={TIME} hourCycle={24} label="Label" />,
      )
      const dialog = open(view)

      expect(view.queryByRole('radiogroup')).toBeNull()
      expect(labelsOf(dialog)).toHaveLength(24)
    })
  })

  describe('right to left', () => {
    afterEach(() => {
      document.documentElement.removeAttribute('dir')
    })

    it('puts the period selector at the row’s end, on the left', () => {
      const { dialog, view } = openArabic()
      const selector = view.getByRole('radiogroup').getBoundingClientRect()
      const hour = boxOf(dialog, 'hour').getBoundingClientRect()
      const minute = boxOf(dialog, 'minute').getBoundingClientRect()

      expect(selector.right).toBeLessThanOrEqual(
        Math.min(hour.left, minute.left),
      )
    })

    // A clock reads clockwise in every script, so three stays on the right.
    it('does not mirror the dial', () => {
      const { dialog } = openArabic()
      const dial = dialOf(dialog).getBoundingClientRect()
      const three = [...dialOf(dialog).querySelectorAll('text')].find(
        (label) => label.textContent === '٣',
      )

      expect(three).toBeDefined()
      const box = three?.getBoundingClientRect()
      expect((box?.left ?? 0) + (box?.width ?? 0) / 2).toBeGreaterThan(
        dial.left + dial.width / 2,
      )
    })
  })

  describe('state', () => {
    it('fills the box the dial follows, and only that one', () => {
      const view = render(<TimePicker defaultValue={TIME} label="Label" />)
      const dialog = open(view)
      const hour = boxOf(dialog, 'hour')
      const minute = boxOf(dialog, 'minute')

      expect(getComputedStyle(hour).backgroundColor).toBe(
        probe(probeStyles.primaryContainer),
      )
      expect(getComputedStyle(minute).backgroundColor).toBe(
        probe(probeStyles.surfaceContainerHighest),
      )

      pressDial(dialog, 3 / 12)

      expect(getComputedStyle(hour).backgroundColor).toBe(
        probe(probeStyles.surfaceContainerHighest),
      )
      expect(getComputedStyle(minute).backgroundColor).toBe(
        probe(probeStyles.primaryContainer),
      )
    })

    it('fills the chosen half of the period selector', () => {
      const view = render(<TimePicker defaultValue={TIME} label="Label" />)
      open(view)

      expect(
        getComputedStyle(view.getByRole('radio', { name: 'AM' }))
          .backgroundColor,
      ).toBe(probe(probeStyles.tertiaryContainer))
      expect(
        getComputedStyle(view.getByRole('radio', { name: 'PM' }))
          .backgroundColor,
      ).toBe('rgba(0, 0, 0, 0)')
    })

    // Read off the computed style rather than the box, which the modal's
    // entrance scales while it runs.
    it('sizes the boxes to the page’s time selector', () => {
      const view = render(<TimePicker defaultValue={TIME} label="Label" />)
      const dialog = open(view)
      const dial = getComputedStyle(boxOf(dialog, 'hour'))
      const onDial = { height: dial.height, width: dial.width }

      fireEvent.click(view.getByRole('button', { name: 'Enter time' }))
      const input = getComputedStyle(boxOf(dialog, 'hour'))

      expect(onDial).toEqual({ height: '80px', width: '96px' })
      expect({ height: input.height, width: input.width }).toEqual({
        height: '72px',
        width: '96px',
      })
    })
  })

  describe('forced colours', () => {
    it('draws each box as a ButtonText rule, and the followed one in Highlight', () => {
      const view = render(<TimePicker defaultValue={TIME} label="Label" />)
      const dialog = open(view)
      const hour = declarationsHeld(boxOf(dialog, 'hour'), FORCED_COLORS)
      const minute = declarationsHeld(boxOf(dialog, 'minute'), FORCED_COLORS)

      expect(minute.get('border-top-color')).toBe('buttontext')
      expect(minute.get('border-top-width')).toBe('1px')
      expect(hour.get('background-color')).toBe('highlight')
      expect(hour.get('color')).toBe('highlighttext')
    })

    it('draws the chosen period in Highlight', () => {
      const view = render(<TimePicker defaultValue={TIME} label="Label" />)
      open(view)
      const morning = declarationsHeld(
        view.getByRole('radio', { name: 'AM' }),
        FORCED_COLORS,
      )

      expect(morning.get('background-color')).toBe('highlight')
    })

    it('draws the container’s edge as a CanvasText border', () => {
      const view = render(<TimePicker defaultValue={TIME} label="Label" />)
      const container = open(view).parentElement
      if (container === null) {
        throw new Error('expected the dialog to sit in a container')
      }
      const edge = declarationsHeld(container, FORCED_COLORS)

      expect(edge.get('border-top-color')).toBe('canvastext')
      expect(edge.get('border-top-style')).toBe('solid')
    })
  })
})
