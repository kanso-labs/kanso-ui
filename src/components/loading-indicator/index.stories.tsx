import type { Meta, StoryObj } from '@storybook/react-vite'

import LoadingIndicator from '.'

const meta = {
  args: {
    'aria-label': 'Label',
  },
  component: LoadingIndicator,
  title: 'Components/LoadingIndicator',
} satisfies Meta<typeof LoadingIndicator>

type Story = StoryObj<typeof meta>

const Default: Story = {}

const Contained: Story = {
  args: {
    contained: true,
  },
}

export { Contained, Default }

export default meta
