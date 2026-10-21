import type { Meta, StoryObj } from '@storybook/react-vite'

import * as stylex from '@stylexjs/stylex'

import Stack from '.'
import { colors, radii, spacing } from '../../tokens/design.tokens.stylex'
import Button from '../button'
import Card from '../card'
import Tag from '../tag'
import Text from '../text'

const LIST = <ul />

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
  // Narrower than the tags in a row, so the story shows them wrapping at
  // every window size rather than only at a narrow one.
  narrow: {
    inlineSize: '280px',
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
  // `gap` and `wrap` are set to what they default to anyway, so the first
  // control opens on `md` rather than on "Choose option…" and the second is
  // a switch rather than a "Set boolean" button.
  args: {
    children: <Blocks />,
    gap: 'md',
    wrap: false,
  },
  component: Stack,
  title: 'Components/Stack',
} satisfies Meta<typeof Stack>

type Story = StoryObj<typeof meta>

const Default: Story = {}

// A stack rendered as a list, which is what `render` is most often for. It
// lines up on its gap with no UA margin, padding or markers, and gives itself
// `role="list"` for Safari, as the doc comment says.
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
//
// Both rows wrap. On a window too narrow for the headline and the actions,
// the actions drop to a line of their own, `sm` below the headline; on one
// too narrow for both buttons, the second drops below the first. Neither
// squeezes a button until its label breaks. The actions row also centres
// its buttons rather than stretching them, so a label that breaks anyway
// leaves its neighbour the height it was.
const HeadlineWithActions: Story = {
  render: () => (
    <Card variant="outlined">
      <Stack align="center" direction="row" gap="sm" justify="between" wrap>
        <Text variant="titleMedium">Headline</Text>
        <Stack align="center" direction="row" gap="sm" wrap>
          <Button size="xs" variant="text">
            Cancel
          </Button>
          <Button size="xs">Save changes</Button>
        </Stack>
      </Stack>
    </Card>
  ),
}

const TAGS = (
  <>
    <Tag>First item</Tag>
    <Tag tone="primary">Second item</Tag>
    <Tag tone="positive">Third item</Tag>
    <Tag variant="outlined">Fourth item</Tag>
    <Tag tone="negative">Fifth item</Tag>
    <Tag>Sixth item</Tag>
  </>
)

// A row of tags in a stack narrower than they are, which wraps them onto
// further lines with the same gap between the lines as between the tags.
// Each tag keeps its own width, as an inline-sized child does in a row.
const Wrap: Story = {
  args: {
    children: TAGS,
    direction: 'row',
    gap: 'sm',
    wrap: true,
  },
  render: (args) => <Stack {...args} {...stylex.props(styles.narrow)} />,
}

export { Default, HeadlineWithActions, List, Row, Wrap }

export default meta
