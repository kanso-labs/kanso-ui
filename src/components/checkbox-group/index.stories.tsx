import type { Meta, StoryObj } from '@storybook/react-vite'

import * as stylex from '@stylexjs/stylex'

import CheckboxGroup from '.'
import Checkbox from '../checkbox'

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

export { Default, WithError }

export default meta
