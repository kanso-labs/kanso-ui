import { act, fireEvent, render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import TextArea from '.'

// The box the control sits in: the label's column is in it.
function boxOf(label: HTMLElement) {
  const box = label.parentElement?.parentElement
  if (!(box instanceof HTMLElement)) {
    throw new Error('expected the label to sit in a column in the box')
  }
  return box
}

// Finishes the label's transition before reading it — see field/index.test.tsx.
function settled(element: HTMLElement) {
  for (const animation of element.getAnimations()) {
    animation.finish()
  }
  return getComputedStyle(element)
}

const THREE_LINES = 'First line.\nSecond line.\nThird line.'
const FIVE_LINES = `${THREE_LINES}\nFourth line.\nFifth line.`

// The box's height for a number of lines: 8 of padding above the small
// label's line of 16, 24 per line of text, and 8 below.
function boxHeight(lines: number) {
  return 8 + 16 + 24 * lines + 8
}

function setup(props: Partial<Parameters<typeof TextArea>[0]> = {}) {
  const view = render(<TextArea label="Label" {...props} />)
  const label = view.getByText('Label')
  return {
    ...view,
    box: boxOf(label),
    control: view.getByLabelText('Label'),
    label,
  }
}

describe('text area', () => {
  describe('labelling', () => {
    // getByLabelText resolves through the accessible name, so finding the
    // control this way is the association itself rather than a proxy for it.
    it('names a text area with its label', () => {
      const view = setup()
      expect(view.control.tagName).toBe('TEXTAREA')
      expect(view.getByRole('textbox')).toBe(view.control)
    })

    it('associates the description with the control', () => {
      const view = setup({ description: 'Supporting line' })
      expect(
        view.control.getAttribute('aria-describedby')?.split(' '),
      ).toContain(view.getByText('Supporting line').id)
    })

    it('marks the control invalid and associates the error', () => {
      const view = setup({ error: 'Enter a value.' })
      expect(view.control.getAttribute('aria-invalid')).toBe('true')
      expect(
        view.control.getAttribute('aria-describedby')?.split(' '),
      ).toContain(view.getByText('Enter a value.').id)
    })

    // The floating label reads whether the control holds text off the
    // control itself, and a text area is the second kind of control it has
    // to read — see the box's `boxFloating` in field/index.tsx.
    it('floats the label once the control holds text', () => {
      const empty = setup({ defaultValue: '' })
      expect(settled(empty.label).fontSize).toBe('16px')
      empty.unmount()

      const populated = setup({ defaultValue: THREE_LINES })
      expect(settled(populated.label).fontSize).toBe('12px')
    })
  })

  describe('size', () => {
    it('shows three rows by default, and the rows it is asked for', () => {
      const { box, control } = setup()
      expect(control).toHaveProperty('rows', 3)
      expect(box.getBoundingClientRect().height).toBe(boxHeight(3))

      const five = render(<TextArea label="Five" rows={5} />)
      expect(five.getByLabelText('Five')).toHaveProperty('rows', 5)
      expect(boxOf(five.getByText('Five')).getBoundingClientRect().height).toBe(
        boxHeight(5),
      )
    })

    it('grows with the text it holds, and with typing', () => {
      const { box, control } = setup({ defaultValue: FIVE_LINES })
      expect(box.getBoundingClientRect().height).toBe(boxHeight(5))

      act(() => {
        fireEvent.change(control, { target: { value: THREE_LINES } })
      })
      expect(box.getBoundingClientRect().height).toBe(boxHeight(3))

      act(() => {
        fireEvent.change(control, { target: { value: `${FIVE_LINES}\n` } })
      })
      expect(box.getBoundingClientRect().height).toBe(boxHeight(6))
    })

    it('keeps its rows and scrolls when not growing', () => {
      const { box, control } = setup({
        autosize: false,
        defaultValue: FIVE_LINES,
      })
      expect(box.getBoundingClientRect().height).toBe(boxHeight(3))
      expect(control.scrollHeight).toBeGreaterThan(control.clientHeight)
      expect(getComputedStyle(control).overflowY).toBe('auto')
    })

    it("is at least the page's 56 with a single row", () => {
      const { box } = setup({ rows: 1 })
      expect(box.getBoundingClientRect().height).toBe(56)
    })

    it('draws no resize handle', () => {
      const { control } = setup()
      expect(getComputedStyle(control).resize).toBe('none')
    })
  })

  describe('value', () => {
    it('counts the characters against the limit', () => {
      const view = setup({
        characterCount: true,
        defaultValue: THREE_LINES,
        maxLength: 200,
      })
      expect(view.control.getAttribute('maxlength')).toBe('200')
      expect(view.getByText(`${THREE_LINES.length}/200`)).not.toBeNull()
    })

    it('accepts typing and reports the value', () => {
      const { control } = setup({ defaultValue: '' })
      fireEvent.change(control, { target: { value: THREE_LINES } })
      expect(control).toHaveProperty('value', THREE_LINES)
    })

    it('does not accept input when disabled', () => {
      const { control } = setup({ isDisabled: true })
      expect(control).toHaveProperty('disabled', true)
    })
  })
})
