import * as stylex from '@stylexjs/stylex'
import { act, fireEvent, render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import TextArea from '.'
import { typography } from '../../tokens/design.tokens.stylex'

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

// A label line taller than the default 16, which is what tells the two
// boxes' least heights apart: the filled box counts the label's line inside
// it and the outlined one does not, and under the default tokens both come
// to 56.
const tallLabelType = stylex.createTheme(typography, {
  bodySmallLineHeight: '20px',
})

// An icon a story or a call site would pass: sized in `em`, so it takes the
// slot's 24.
const ICON = <svg data-testid="icon" style={{ height: '1em', width: '1em' }} />
const OTHER_ICON = (
  <svg data-testid="other-icon" style={{ height: '1em', width: '1em' }} />
)

const THREE_LINES = 'First line.\nSecond line.\nThird line.'
const FIVE_LINES = `${THREE_LINES}\nFourth line.\nFifth line.`

// The box's height for a number of lines: 8 of padding above the small
// label's line of 16, 24 per line of text, and 8 below.
function boxHeight(lines: number) {
  return 8 + 16 + 24 * lines + 8
}

function setup(props: Partial<Parameters<typeof TextArea>[0]> = {}) {
  const view = render(<TextArea label="Label" {...props} />)
  // The outlined box's notch holds a hidden copy of the label's text, so the
  // element is found by its role rather than by the text alone.
  const label = view.getByText('Label', { selector: 'label' })
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

    // Outlined, the page puts 16 above and below the text in place of the
    // filled box's 8 around the label's line and the text, which comes to the
    // same height for the same lines. The box grows the same way, with the
    // text inside it rather than running out through the outline.
    it('grows the outlined box with its text', () => {
      const { box, control } = setup({
        defaultValue: FIVE_LINES,
        variant: 'outlined',
      })
      const room = () => {
        const outer = box.getBoundingClientRect()
        const inner = control.getBoundingClientRect()
        return {
          above: inner.top - outer.top,
          below: outer.bottom - inner.bottom,
          height: outer.height,
        }
      }
      expect(room()).toEqual({ above: 16, below: 16, height: boxHeight(5) })

      act(() => {
        fireEvent.change(control, { target: { value: THREE_LINES } })
      })
      expect(room()).toEqual({ above: 16, below: 16, height: boxHeight(3) })

      act(() => {
        fireEvent.change(control, { target: { value: `${FIVE_LINES}\n` } })
      })
      expect(room()).toEqual({ above: 16, below: 16, height: boxHeight(6) })
    })

    it("is at least the page's 56 outlined with a single row", () => {
      const { box } = setup({ rows: 1, variant: 'outlined' })
      expect(box.getBoundingClientRect().height).toBe(56)
    })

    // One row outlined is an outlined text field's height, 16 above and
    // below a line of text, however tall the filled box's label line is.
    it("keeps the outlined box's own least height under a taller label line", () => {
      const view = render(
        <div {...stylex.props(tallLabelType)}>
          <TextArea label="Filled" rows={1} />
          <TextArea label="Outlined" rows={1} variant="outlined" />
        </div>,
      )
      const heightOf = (label: string) =>
        boxOf(
          view.getByText(label, { selector: 'label' }),
        ).getBoundingClientRect().height
      expect({
        filled: heightOf('Filled'),
        outlined: heightOf('Outlined'),
      }).toEqual({ filled: 8 + 20 + 24 + 8, outlined: 16 + 24 + 16 })
    })

    it('draws no resize handle', () => {
      const { control } = setup()
      expect(getComputedStyle(control).resize).toBe('none')
    })
  })

  describe('icons', () => {
    // TextField's measurements, from the same chrome: 24 icons 12 from the
    // box's edges, and the label and the text 16 past the leading one.
    it('draws the icons 12 from the edges and moves the text past the leading one', () => {
      const view = setup({ leadingIcon: ICON, trailingIcon: OTHER_ICON })
      const box = view.box.getBoundingClientRect()
      const leading = view.getByTestId('icon').getBoundingClientRect()
      const trailing = view.getByTestId('other-icon').getBoundingClientRect()
      expect(leading.width).toBe(24)
      expect(leading.left - box.left).toBe(12)
      expect(view.label.getBoundingClientRect().left - box.left).toBe(52)
      expect(view.control.getBoundingClientRect().left - box.left).toBe(52)
      expect(box.right - trailing.right).toBe(12)
    })

    it('keeps the text 16 in without icons', () => {
      const view = setup()
      const box = view.box.getBoundingClientRect()
      expect(view.label.getBoundingClientRect().left - box.left).toBe(16)
      expect(view.control.getBoundingClientRect().left - box.left).toBe(16)
    })

    // Material's own text field keeps its icons centred in the box's height
    // on a text area too, and this box grows: the 24 icon sits halfway down
    // whatever the box holds, rather than at the 56's centre or the first
    // line's.
    it('centres the icons in the box as it grows', () => {
      const view = setup({
        defaultValue: THREE_LINES,
        leadingIcon: ICON,
        trailingIcon: OTHER_ICON,
      })
      const offsets = () => {
        const box = view.box.getBoundingClientRect()
        return {
          box: box.height,
          leading:
            view.getByTestId('icon').getBoundingClientRect().top - box.top,
          trailing:
            view.getByTestId('other-icon').getBoundingClientRect().top -
            box.top,
        }
      }
      expect(offsets()).toEqual({
        box: boxHeight(3),
        leading: (boxHeight(3) - 24) / 2,
        trailing: (boxHeight(3) - 24) / 2,
      })

      act(() => {
        fireEvent.change(view.control, { target: { value: FIVE_LINES } })
      })
      expect(offsets()).toEqual({
        box: boxHeight(5),
        leading: (boxHeight(5) - 24) / 2,
        trailing: (boxHeight(5) - 24) / 2,
      })
    })

    it('centres the icons in the outlined box too', () => {
      const view = setup({
        defaultValue: FIVE_LINES,
        leadingIcon: ICON,
        trailingIcon: OTHER_ICON,
        variant: 'outlined',
      })
      const box = view.box.getBoundingClientRect()
      expect(box.height).toBe(boxHeight(5))
      expect({
        leading: view.getByTestId('icon').getBoundingClientRect().top - box.top,
        trailing:
          view.getByTestId('other-icon').getBoundingClientRect().top - box.top,
      }).toEqual({
        leading: (boxHeight(5) - 24) / 2,
        trailing: (boxHeight(5) - 24) / 2,
      })
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
