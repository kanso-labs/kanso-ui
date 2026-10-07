import type { Meta, StoryObj } from '@storybook/react-vite'

import * as stylex from '@stylexjs/stylex'

import Snackbar from '.'
import { spacing } from '../../tokens/design.tokens.stylex'
import Button from '../button'

// One queue for the page. A real app makes one where it can be reached from
// anywhere and mounts the region once, near the root; a story page is the
// same shape at a smaller scale. Seeded below so the page opens with a
// snackbar on it rather than with three buttons and nothing to look at.
const messages = new Snackbar.Queue()

// Two sample actions. Their handlers do nothing, since what a story shows is
// the snackbar rather than what pressing it would do.
const noop = () => {}
const UNDO = { label: 'Undo', onPress: noop }
const RETRY = { label: 'Retry', onPress: noop }

function clear() {
  messages.clear()
}

// A region is empty until something is added, so a story showing what a
// snackbar looks like carries a queue with a message already in it. Seeded
// here rather than from the story, since the queue lives outside React, and
// with the page's indefinite length so the message is still there whenever
// the snapshot is taken.
function seeded(options: Parameters<typeof messages.add>[1]) {
  const queue = new Snackbar.Queue()
  queue.add('First item saved', { ...options, timeout: 0 })
  return queue
}

messages.add('First item saved', { action: UNDO, timeout: 0 })

// The handlers the story's buttons take, built by a call rather than written
// inline at the prop, which is what react-perf's no-new-function-as-prop is
// after. Each message takes the component's own duration, which is what the
// story is there to show.
function show(message: string, options: Parameters<typeof messages.add>[1]) {
  return () => {
    messages.add(message, options)
  }
}

const styles = stylex.create({
  row: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
})

const meta = {
  args: {
    queue: messages,
  },
  component: Snackbar,
  title: 'Components/Snackbar',
} satisfies Meta<typeof Snackbar>

type Story = StoryObj<typeof meta>

const Default: Story = {
  args: { queue: seeded({}) },
  parameters: { docs: { story: { height: '240px', inline: false } } },
}

const WithAction: Story = {
  args: { queue: seeded({ action: UNDO }) },
  parameters: { docs: { story: { height: '240px', inline: false } } },
}

const WithCloseButton: Story = {
  args: { queue: seeded({ action: RETRY, showCloseButton: true }) },
  parameters: { docs: { story: { height: '240px', inline: false } } },
}

// Its own story because the others are seeded to stay up. Here a press adds
// the message at the component's own duration: five seconds for a bare one,
// until closed for one with an action, and held while hovered or focused.
const OnDemand: Story = {
  parameters: { docs: { story: { height: '240px', inline: false } } },
  render: (args) => (
    <>
      <div {...stylex.props(styles.row)}>
        <Button onPress={show('First item saved', {})} variant="tonal">
          Show a message
        </Button>
        <Button
          onPress={show('First item removed', { action: UNDO })}
          variant="tonal"
        >
          Show an action
        </Button>
        <Button
          onPress={show('Second item could not be saved', {
            action: RETRY,
            showCloseButton: true,
          })}
          variant="tonal"
        >
          Show both
        </Button>
        <Button onPress={clear} variant="text">
          Clear
        </Button>
      </div>
      <Snackbar {...args} />
    </>
  ),
}

export { Default, OnDemand, WithAction, WithCloseButton }

export default meta
