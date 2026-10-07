import type { Meta, StoryObj } from '@storybook/react-vite'

import * as stylex from '@stylexjs/stylex'

import Code from '.'
import { spacing } from '../../tokens/design.tokens.stylex'
import Text from '../text'

const styles = stylex.create({
  narrow: {
    borderColor: 'currentcolor',
    borderStyle: 'dashed',
    borderWidth: '1px',
    maxInlineSize: '220px',
    padding: spacing.sm,
  },
  sample: {
    alignItems: 'flex-start',
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.xs,
  },
})

const meta = {
  args: {
    children: 'identifier',
  },
  component: Code,
  title: 'Components/Code',
} satisfies Meta<typeof Code>

type Story = StoryObj<typeof meta>

// Code takes its colour and its size from the text it interrupts, so it is
// shown inside a line of body text, the way a call site uses it.
const Default: Story = {
  render: (args) => (
    <Text variant="bodyLarge">
      A sentence naming <Code {...args} />
    </Text>
  ),
}

// Its own story because it takes a narrow container as well as a long value: a
// package path or a hash has no spaces to break at, so rather than pushing its
// container wider it breaks inside it, and only when the line cannot fit.
const LongIdentifier: Story = {
  render: () => (
    <div {...stylex.props(styles.sample)}>
      <div {...stylex.props(styles.narrow)}>
        <Text variant="bodyMedium">
          <Code>registry.example/first-second/a-long-unbroken-name</Code>
        </Text>
      </div>
      <Text tone="muted" variant="labelSmall">
        the dashed rule is the container, not the component
      </Text>
    </div>
  ),
}

// Its own story because the point is the text around it: sized in em, the same
// component serves a heading and a footnote, and a mono face reads larger than
// prose at the same nominal size, so the ratio is what keeps the two level.
const Scale: Story = {
  render: () => (
    <div {...stylex.props(styles.sample)}>
      <Text variant="headlineSmall">
        A heading naming <Code>identifier</Code>
      </Text>
      <Text tone="muted" variant="bodySmall">
        A footnote naming <Code>identifier</Code>
      </Text>
    </div>
  ),
}

export { Default, LongIdentifier, Scale }

export default meta
