import type { Meta, StoryObj } from '@storybook/react-vite'

import * as stylex from '@stylexjs/stylex'

import Snackbar from '.'
import { spacing } from '../../tokens/design.tokens.stylex'
import Button from '../button'
import Separator from '../separator'
import Text from '../text'

// See avatar/index.stories.tsx for why the overview is built from the
// library's own components, why its sections are divided by a rule, and why
// the headings go through Text's `render`.
// oxlint-disable-next-line jsx-a11y/heading-has-content -- filled by useRender
const HEADING_1 = <h1 />
// oxlint-disable-next-line jsx-a11y/heading-has-content -- filled by useRender
const HEADING_2 = <h2 />
const PARAGRAPH = <p />

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

// The handlers the page's buttons take, built by a call rather than written
// inline at the prop, which is what react-perf's no-new-function-as-prop is
// after. Each message takes the component's own duration, which is what the
// page is there to show.
function show(message: string, options: Parameters<typeof messages.add>[1]) {
  return () => {
    messages.add(message, options)
  }
}

const styles = stylex.create({
  header: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.xs,
  },
  intro: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.xxs,
  },
  page: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.xl,
    marginInline: 'auto',
    maxInlineSize: '960px',
    // Room under the last row so the snackbar does not sit over it.
    paddingBlockEnd: spacing.xxxl,
    paddingBlockStart: spacing.xl,
    paddingInline: spacing.xl,
  },
  row: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.lg,
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

const Overview: Story = {
  parameters: { docs: { story: { height: '760px', inline: false } } },
  render: (args) => (
    <div {...stylex.props(styles.page)}>
      <header {...stylex.props(styles.header)}>
        <Text render={HEADING_1} variant="displaySmall">
          Snackbar
        </Text>
        <Text render={PARAGRAPH} tone="muted" variant="bodyLarge">
          A brief message at the bottom of the screen.
        </Text>
      </header>

      <Separator />

      <section {...stylex.props(styles.section)}>
        <div {...stylex.props(styles.intro)}>
          <Text render={HEADING_2} variant="titleLarge">
            Message
          </Text>
          <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
            A message on its own leaves after five seconds. Show one by calling
            add on the queue — nothing is rendered until you do, which is why
            this page seeds one to open with.
          </Text>
        </div>
        <div {...stylex.props(styles.row)}>
          <Button onPress={show('First item saved', {})} variant="tonal">
            Show a message
          </Button>
        </div>
      </section>

      <Separator />

      <section {...stylex.props(styles.section)}>
        <div {...stylex.props(styles.intro)}>
          <Text render={HEADING_2} variant="titleLarge">
            Action
          </Text>
          <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
            One action sits after the message, and pressing it closes the
            snackbar. A message carrying an action stays until the action is
            taken or something closes it, since a reader may need longer to
            reach the action than any timer allows.
          </Text>
        </div>
        <div {...stylex.props(styles.row)}>
          <Button
            onPress={show('First item removed', { action: UNDO })}
            variant="tonal"
          >
            Show an action
          </Button>
        </div>
      </section>

      <Separator />

      <section {...stylex.props(styles.section)}>
        <div {...stylex.props(styles.intro)}>
          <Text render={HEADING_2} variant="titleLarge">
            Close button
          </Text>
          <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
            A close button puts the message away without taking its action.
            Every timer pauses while the region is hovered or focused, so a
            message never leaves while it is being read.
          </Text>
        </div>
        <div {...stylex.props(styles.row)}>
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
      </section>

      <Snackbar {...args} />
    </div>
  ),
}

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

export { Default, Overview, WithAction, WithCloseButton }

export default meta
