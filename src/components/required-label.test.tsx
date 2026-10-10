import type { RenderResult } from '@testing-library/react'
import type { ReactElement } from 'react'

import * as stylex from '@stylexjs/stylex'
import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import {
  Checkbox,
  CheckboxGroup,
  ColorField,
  ComboBox,
  DateField,
  DatePicker,
  DateRangePicker,
  ListBox,
  NumberField,
  Radio,
  RadioGroup,
  Select,
  TextArea,
  TextField,
  TimeField,
} from '.'
import { colors } from '../tokens/design.tokens.stylex'

// A required field's label ends in an asterisk, which is how the text fields
// page marks one. `isRequired` set only `aria-required` before, so a sighted
// reader found out which fields had to be filled when the form refused to
// submit. The mark is hidden from assistive technology, which the control
// already tells, so the label is read once and without "star".

const OPTION = <ListBox.Item id="first">First item</ListBox.Item>

const FIELDS: Record<string, (isRequired: boolean) => ReactElement> = {
  // A checkbox on its own, as an "accept the terms" box is: its label is the
  // control's own rather than a field's, and was never marked.
  Checkbox: (isRequired) => <Checkbox isRequired={isRequired}>Label</Checkbox>,
  CheckboxGroup: (isRequired) => (
    <CheckboxGroup isRequired={isRequired} label="Label">
      <Checkbox value="first">First item</Checkbox>
    </CheckboxGroup>
  ),
  ColorField: (isRequired) => (
    <ColorField isRequired={isRequired} label="Label" />
  ),
  ComboBox: (isRequired) => (
    <ComboBox isRequired={isRequired} label="Label" options={OPTION} />
  ),
  DateField: (isRequired) => (
    <DateField isRequired={isRequired} label="Label" />
  ),
  DatePicker: (isRequired) => (
    <DatePicker isRequired={isRequired} label="Label" />
  ),
  DateRangePicker: (isRequired) => (
    <DateRangePicker isRequired={isRequired} label="Label" />
  ),
  NumberField: (isRequired) => (
    <NumberField isRequired={isRequired} label="Label" />
  ),
  RadioGroup: (isRequired) => (
    <RadioGroup isRequired={isRequired} label="Label">
      <Radio value="first">First item</Radio>
    </RadioGroup>
  ),
  Select: (isRequired) => (
    <Select isRequired={isRequired} label="Label" options={OPTION} />
  ),
  TextArea: (isRequired) => <TextArea isRequired={isRequired} label="Label" />,
  TextField: (isRequired) => (
    <TextField isRequired={isRequired} label="Label" />
  ),
  TimeField: (isRequired) => (
    <TimeField isRequired={isRequired} label="Label" />
  ),
}

/** The field's label: the element whose own text is the label. */
function labelOf(view: RenderResult) {
  return view.getAllByText('Label', { selector: 'label, span' })[0]
}

/** The asterisk at the end of a label, or `null` where it draws none. */
function markOf(label: Element) {
  const mark = label.lastElementChild
  return mark?.textContent === '*' ? mark : null
}

const probeStyles = stylex.create({
  error: { color: colors.error },
})

function errorColour() {
  const view = render(<span {...stylex.props(probeStyles.error)} />)
  const colour = getComputedStyle(view.container.firstElementChild!).color
  view.unmount()
  return colour
}

describe('a required field', () => {
  describe.each(Object.entries(FIELDS))('%s', (_, field) => {
    it('ends its label in an asterisk hidden from assistive technology', () => {
      const mark = markOf(labelOf(render(field(true))))

      expect(mark).not.toBeNull()
      expect(mark?.getAttribute('aria-hidden')).toBe('true')
    })

    it('draws no asterisk when it is not required', () => {
      expect(markOf(labelOf(render(field(false))))).toBeNull()
    })
  })

  // The mark is hidden, so the control's name is the label alone — read
  // once, with no "star" on the end.
  it.each([
    ['Checkbox', 'checkbox'],
    ['TextField', 'textbox'],
    ['ComboBox', 'combobox'],
    ['RadioGroup', 'radiogroup'],
    ['CheckboxGroup', 'group'],
  ] as const)('names a required %s by its label alone', (name, role) => {
    const view = render(FIELDS[name](true))

    expect(view.getByRole(role, { name: 'Label' })).not.toBeNull()
  })

  // The group is what must have a choice made in it, and its label carries
  // the mark; an item marked as well would say every option is required —
  // even one given `isRequired` of its own, which React Aria hands its state.
  it('leaves a checkbox in a required group unmarked', () => {
    const view = render(
      <CheckboxGroup isRequired label="Group">
        <Checkbox isRequired value="first">
          Label
        </Checkbox>
      </CheckboxGroup>,
    )

    expect(markOf(labelOf(view))).toBeNull()
  })

  // In the label rather than beside it, so it takes the label's colour —
  // the error role once the field is invalid.
  it('turns to the error colour with its label', () => {
    const view = render(
      <TextField error="Supporting line" isRequired label="Label" />,
    )
    const label = labelOf(view)

    expect(getComputedStyle(markOf(label)!).color).toBe(errorColour())
    expect(getComputedStyle(label).color).toBe(errorColour())
  })

  // The outlined box cuts its outline to the floated label's width with a
  // hidden copy of the label, so the copy has to carry the mark too or the
  // notch stops short of it.
  it('cuts the outlined notch to the label and its asterisk', () => {
    const view = render(
      <TextField
        defaultValue="Value"
        isRequired
        label="Label"
        variant="outlined"
      />,
    )
    const legend = view.container.querySelector('legend')

    expect(legend?.textContent).toBe('Label*')
  })
})
