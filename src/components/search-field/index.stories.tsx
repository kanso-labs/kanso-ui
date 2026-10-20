import type { Meta, StoryObj } from '@storybook/react-vite'

import * as stylex from '@stylexjs/stylex'

import SearchField from '.'

const styles = stylex.create({
  // A bar fills its container up to the page's 720, so the samples need a
  // width to fill.
  sample: {
    maxInlineSize: '420px',
  },
})

const meta = {
  args: {
    label: 'Label',
    placeholder: 'Supporting text',
  },
  component: SearchField,
  title: 'Components/SearchField',
} satisfies Meta<typeof SearchField>

type Story = StoryObj<typeof meta>

const Default: Story = {
  render: (args) => (
    <div {...stylex.props(styles.sample)}>
      <SearchField {...args} />
    </div>
  ),
}

const WithValue: Story = {
  args: {
    defaultValue: 'Typed keyword',
  },
  render: (args) => (
    <div {...stylex.props(styles.sample)}>
      <SearchField {...args} />
    </div>
  ),
}

const WithError: Story = {
  args: {
    error: 'Enter a keyword.',
  },
  render: (args) => (
    <div {...stylex.props(styles.sample)}>
      <SearchField {...args} />
    </div>
  ),
}

// Supporting text wider than the input ends in an ellipsis rather than being
// cut off mid-letter, which a translated placeholder runs into first.
const LongPlaceholder: Story = {
  args: {
    placeholder:
      'Supporting text long enough to run well past the end of the bar it sits in',
  },
  render: (args) => (
    <div {...stylex.props(styles.sample)}>
      <SearchField {...args} />
    </div>
  ),
}

const Disabled: Story = {
  args: {
    defaultValue: 'Typed keyword',
    isDisabled: true,
  },
  render: (args) => (
    <div {...stylex.props(styles.sample)}>
      <SearchField {...args} />
    </div>
  ),
}

export { Default, Disabled, LongPlaceholder, WithError, WithValue }

export default meta
