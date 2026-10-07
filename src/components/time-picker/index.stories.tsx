import type { Meta, StoryObj } from '@storybook/react-vite'

import { I18nProvider } from 'react-aria-components'

import TimePicker from '.'
import { Time } from '../../date'

// A fixed time, so every snapshot reads the same whenever it is taken.
const TIME = new Time(9, 30)

const meta = {
  args: {
    defaultValue: TIME,
    label: 'Label',
  },
  component: TimePicker,
  title: 'Components/TimePicker',
} satisfies Meta<typeof TimePicker>

type Story = StoryObj<typeof meta>

const Default: Story = {}

// The modal open on the dial, which is what the clock button shows first.
const Dial: Story = {
  args: {
    defaultOpen: true,
  },
  parameters: { docs: { story: { height: '760px', inline: false } } },
}

// The dial on a twenty-four hour clock, the afternoon's hours on the inner
// ring and no period selector beside the boxes.
const TwentyFourHours: Story = {
  args: {
    defaultOpen: true,
    defaultValue: new Time(15, 30),
  },
  parameters: { docs: { story: { height: '760px', inline: false } } },
  render: (args) => (
    <I18nProvider locale="en-GB">
      <TimePicker {...args} />
    </I18nProvider>
  ),
}

// The page's input variant: the boxes as text fields, named underneath, and
// the clock icon that goes back to the dial.
const Input: Story = {
  args: {
    defaultMode: 'input',
    defaultOpen: true,
  },
  parameters: { docs: { story: { height: '620px', inline: false } } },
}

export { Default, Dial, Input, TwentyFourHours }

export default meta
