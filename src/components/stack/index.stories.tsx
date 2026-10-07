import type { Meta, StoryObj } from '@storybook/react-vite'

import * as stylex from '@stylexjs/stylex'

import Stack from '.'
import { colors, radii, spacing } from '../../tokens/design.tokens.stylex'
import Button from '../button'
import Card from '../card'
import Text from '../text'

// oxlint-disable-next-line jsx-a11y/no-redundant-roles -- Safari's VoiceOver drops the role once the markers are cleared
const LIST = <ul role="list" />

const styles = stylex.create({
  // A block with no width of its own, so what the alignment stories show is
  // the stack deciding the width rather than the child asking for one.
  block: {
    backgroundColor: colors.primaryContainer,
    borderRadius: radii.sm,
    color: colors.onPrimaryContainer,
    paddingBlock: spacing.sm,
    paddingInline: spacing.md,
  },
})

function Blocks({ count = 3 }: { count?: number }) {
  return Array.from({ length: count }, (_, index) => (
    <div key={index} {...stylex.props(styles.block)}>
      <Text variant="labelLarge">{`0${index + 1}`}</Text>
    </div>
  ))
}

const meta = {
  args: {
    children: <Blocks />,
  },
  component: Stack,
  title: 'Components/Stack',
} satisfies Meta<typeof Stack>

type Story = StoryObj<typeof meta>

const Default: Story = {}

// A stack rendered as a list, which is what `render` is most often for. It
// lines up on its gap with no UA margin, padding or markers, and carries
// `role="list"` for Safari, as the doc comment asks.
const List: Story = {
  render: (args) => (
    <Stack {...args} render={LIST}>
      {['01', '02', '03'].map((label) => (
        <li key={label} {...stylex.props(styles.block)}>
          <Text variant="labelLarge">{label}</Text>
        </li>
      ))}
    </Stack>
  ),
}

const Row: Story = {
  args: {
    direction: 'row',
  },
}

// Its own story because it is stacks composing: `justify="between"` puts a
// headline at one end of a row and its actions at the other, without either
// side needing a width, and the actions are a row of their own.
const HeadlineWithActions: Story = {
  render: () => (
    <Card variant="outlined">
      <Stack align="center" direction="row" justify="between">
        <Text variant="titleMedium">Headline</Text>
        <Stack direction="row" gap="sm">
          <Button size="xs" variant="text">
            Cancel
          </Button>
          <Button size="xs">Save changes</Button>
        </Stack>
      </Stack>
    </Card>
  ),
}

export { Default, HeadlineWithActions, List, Row }

export default meta
