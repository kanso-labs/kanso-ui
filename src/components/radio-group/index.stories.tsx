import type { Meta, StoryObj } from '@storybook/react-vite'

import * as stylex from '@stylexjs/stylex'

import RadioGroup, { Radio } from '.'

const styles = stylex.create({
  // A group fills its container, so the samples need a width to fill.
  sample: {
    maxInlineSize: '420px',
  },
})

// Pulled out because every story lists the same three options and only the
// group around them differs.
function Options() {
  return (
    <>
      <Radio value="first">First item</Radio>
      <Radio value="second">Second item</Radio>
      <Radio value="third">Third item</Radio>
    </>
  )
}

const meta = {
  args: {
    defaultValue: 'first',
    label: 'Label',
  },
  component: RadioGroup,
  title: 'Components/RadioGroup',
} satisfies Meta<typeof RadioGroup>

type Story = StoryObj<typeof meta>

const Default: Story = {
  render: (args) => (
    <div {...stylex.props(styles.sample)}>
      <RadioGroup {...args}>
        <Options />
      </RadioGroup>
    </div>
  ),
}

const Horizontal: Story = {
  args: {
    orientation: 'horizontal',
  },
  render: (args) => (
    <RadioGroup {...args}>
      <Options />
    </RadioGroup>
  ),
}

// Its own story because an option's description is a prop of the option rather
// than of the group, so the Controls panel cannot reach it: it is read with the
// option, and the one under the group is read with the group.
const WithDescriptions: Story = {
  args: {
    defaultValue: 'second',
    description: 'Supporting line',
  },
  render: (args) => (
    <div {...stylex.props(styles.sample)}>
      <RadioGroup {...args}>
        <Radio description="Supporting line" value="first">
          First item
        </Radio>
        <Radio description="Supporting line" value="second">
          Second item
        </Radio>
        <Radio value="third">Third item</Radio>
      </RadioGroup>
    </div>
  ),
}

const WithError: Story = {
  args: {
    defaultValue: undefined,
    error: 'Choose one.',
  },
  render: (args) => (
    <div {...stylex.props(styles.sample)}>
      <RadioGroup {...args}>
        <Options />
      </RadioGroup>
    </div>
  ),
}

export { Default, Horizontal, WithDescriptions, WithError }

export default meta
