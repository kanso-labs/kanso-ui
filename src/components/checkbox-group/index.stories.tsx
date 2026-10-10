import type { Meta, StoryObj } from '@storybook/react-vite'

import * as stylex from '@stylexjs/stylex'

import CheckboxGroup from '.'
import Checkbox from '../checkbox'
import Form from '../form'
import TextField from '../text-field'

const styles = stylex.create({
  // A group fills its container, so the samples need a width to fill.
  sample: {
    maxInlineSize: '420px',
  },
})

// Hoisted so each is one stable array per render rather than a fresh one,
// which is what react-perf's no-new-array-as-prop is after.
const FIRST = ['first']
const NONE: string[] = []

// Pulled out because every story lists the same three items and only the
// group around them differs.
function Items() {
  return (
    <>
      <Checkbox value="first">First item</Checkbox>
      <Checkbox value="second">Second item</Checkbox>
      <Checkbox value="third">Third item</Checkbox>
    </>
  )
}

const meta = {
  args: {
    defaultValue: FIRST,
    label: 'Label',
  },
  component: CheckboxGroup,
  title: 'Components/CheckboxGroup',
} satisfies Meta<typeof CheckboxGroup>

type Story = StoryObj<typeof meta>

const Default: Story = {
  render: (args) => (
    <div {...stylex.props(styles.sample)}>
      <CheckboxGroup {...args}>
        <Items />
      </CheckboxGroup>
    </div>
  ),
}

const WithError: Story = {
  args: {
    defaultValue: NONE,
    error: 'Choose at least one.',
  },
  render: (args) => (
    <div {...stylex.props(styles.sample)}>
      <CheckboxGroup {...args}>
        <Items />
      </CheckboxGroup>
    </div>
  ),
}

// Inside a form, where the group keeps one empty line for a message that may
// arrive on submit and its items keep none, so they sit at the same pitch as
// anywhere else. The field under it is there to show where the group ends.
const InAForm: Story = {
  render: (args) => (
    <div {...stylex.props(styles.sample)}>
      <Form>
        <CheckboxGroup {...args}>
          <Items />
        </CheckboxGroup>
        <TextField label="Label" />
      </Form>
    </div>
  ),
}

export { Default, InAForm, WithError }

export default meta
