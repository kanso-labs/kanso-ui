import type { Meta, StoryObj } from '@storybook/react-vite'

import * as stylex from '@stylexjs/stylex'

import Snackbar from '.'
import { spacing } from '../../tokens/design.tokens.stylex'
import Button from '../button'
import Dialog from '../dialog'
import Text from '../text'

// The queue OnDemand's buttons add to. A real app makes one where it can be
// reached from anywhere and mounts the region once, near the root; a story
// page is the same shape at a smaller scale. It starts empty, so what the
// story shows is only what a press added, at the duration it was added with.
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
function seeded(
  options: Parameters<typeof messages.add>[1],
  message = 'First item saved',
) {
  const queue = new Snackbar.Queue()
  queue.add(message, { ...options, timeout: 0 })
  return queue
}

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
  component: Snackbar,
  title: 'Components/Snackbar',
} satisfies Meta<typeof Snackbar>

type Story = StoryObj<typeof meta>

// A message alone, with nothing to close it: held on the page so it is there
// whenever the snapshot is taken, which a call site does not do. A message a
// call site holds takes an action or `showCloseButton`, as `timeout` says.
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

// A phone's width, where a strip is as wide as the screen less its margins
// and content runs out of room first. Chromatic is told it through `modes`
// as sheet/index.stories.tsx explains, keeping the project's two mode names.
const PHONE = {
  globals: { viewport: { isRotated: false, value: 'mobile1' } },
  parameters: {
    chromatic: {
      modes: {
        dark: { theme: 'dark', viewport: { height: 700, width: 375 } },
        light: { theme: 'light', viewport: { height: 700, width: 375 } },
      },
    },
    docs: { story: { height: '240px', inline: false } },
  },
}

// A word longer than the strip holds — a file name, an address, a German
// compound — breaks inside itself rather than running under the controls
// and past the strip's edge.
const LongWord: Story = {
  ...PHONE,
  args: {
    queue: seeded(
      { action: UNDO, showCloseButton: true },
      'Supporting'.repeat(8),
    ),
  },
}

// Material Design's two-line snackbar with a longer action: an action too
// long to leave the message half the strip drops onto a line of its own
// under it, with the close button, at the trailing edge.
const LongAction: Story = {
  ...PHONE,
  args: {
    queue: seeded(
      {
        action: { label: 'Long action label', onPress: noop },
        showCloseButton: true,
      },
      'Supporting text long enough to run onto a second line of the strip',
    ),
  },
}

// Its own story because the others are seeded to stay up. Here a press adds
// the message at the component's own duration: five seconds for a bare one,
// until closed for one with an action, and held while hovered or focused.
// Emptied as the story is left, so it opens empty however it was left.
const OnDemand: Story = {
  args: { queue: messages },
  beforeEach: () => clear,
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

// A message with an action over a full-screen dialog, on a phone. The two
// share the window's bottom edge and the snackbar is drawn above the dialog,
// so the message rises to sit over the dialog's action bar rather than on it,
// where it would take the taps meant for Cancel and Confirm until answered.
const OverAFullScreenDialog: Story = {
  args: { queue: seeded({ action: UNDO }) },
  // Sizes the frame in Storybook itself, as Dialog's AlertDialogCompact
  // does, so the story shows the full-screen dialog without narrowing the
  // window by hand.
  globals: { viewport: { isRotated: false, value: 'mobile1' } },
  parameters: {
    // Chromatic is told the width through `modes`, under the project's own
    // mode names, for the reasons BottomSheet in sheet/index.stories.tsx
    // gives.
    chromatic: {
      modes: {
        dark: { theme: 'dark', viewport: { height: 700, width: 375 } },
        light: { theme: 'light', viewport: { height: 700, width: 375 } },
      },
    },
    docs: { story: { height: '600px', inline: false } },
  },
  render: (args) => (
    <>
      <Dialog.Content isOpen>
        <Dialog.Header>
          <Dialog.Title>Headline</Dialog.Title>
        </Dialog.Header>
        <Dialog.Body>
          <Text tone="muted" variant="bodyMedium">
            Supporting text explains what the dialog is asking.
          </Text>
        </Dialog.Body>
        <Dialog.Footer>
          <Button variant="text">Cancel</Button>
          <Button variant="text">Confirm</Button>
        </Dialog.Footer>
      </Dialog.Content>
      <Snackbar {...args} />
    </>
  ),
}

export {
  Default,
  LongAction,
  LongWord,
  OnDemand,
  OverAFullScreenDialog,
  WithAction,
  WithCloseButton,
}

export default meta
