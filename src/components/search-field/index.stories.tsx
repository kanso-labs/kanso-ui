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

export { Default, Disabled, WithError, WithValue }

export default meta
