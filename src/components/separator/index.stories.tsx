import type { Decorator, Meta, StoryObj } from '@storybook/react-vite'

import * as stylex from '@stylexjs/stylex'

import Separator from '.'
import { colors, radii, spacing } from '../../tokens/design.tokens.stylex'
import Text from '../text'

// A separator is a 1px rule, so on its own there is nothing to look at and
// nothing to judge it against. `BetweenRows` and `BetweenInlineItems` place it
// where it will actually be used — between stacked rows, and between inline
// items — since what matters is whether it reads as a divider next to real
// content.
//
// The demo boxes are plain divs rather than Cards: they have to be flex
// containers, and Card spreads its own StyleX class last so its display cannot
// be changed from the call site. They take surfaceContainer so as to sit
// distinctly on the page's own surface.
const styles = stylex.create({
  demoRow: {
    alignItems: 'center',
    backgroundColor: colors.surfaceContainer,
    borderRadius: radii.lg,
    display: 'flex',
    gap: spacing.md,
    inlineSize: 'fit-content',
    padding: spacing.lg,
  },
  demoStack: {
    backgroundColor: colors.surfaceContainer,
    borderRadius: radii.lg,
    display: 'flex',
    flexDirection: 'column',
    inlineSize: '280px',
    padding: spacing.lg,
  },
  // The frame Default renders in, and it has to be a flex box with a height
  // of its own: a vertical separator takes its length from a flex or grid
  // parent via alignSelf: stretch and has none otherwise, so in a plain block
  // this story would go blank the moment the orientation control was flipped.
  // `alignItems: center` puts a horizontal rule down the middle rather than
  // against the top edge; the vertical one overrides it with its own stretch.
  //
  // surfaceContainer, not the surface the demo boxes sit on: this story
  // renders straight onto the canvas, which is painted surface, so a frame in
  // that colour would be invisible and the rule would look as though it were
  // floating on the page.
  frame: {
    alignItems: 'center',
    backgroundColor: colors.surfaceContainer,
    blockSize: '96px',
    borderRadius: radii.lg,
    boxSizing: 'border-box',
    display: 'flex',
    inlineSize: '280px',
    padding: spacing.lg,
  },
  row: {
    paddingBlock: spacing.md,
  },
})

const Framed: Decorator = (Story) => (
  <div {...stylex.props(styles.frame)}>
    <Story />
  </div>
)

const meta = {
  component: Separator,
  title: 'Components/Separator',
} satisfies Meta<typeof Separator>

type Story = StoryObj<typeof meta>

// Bare, in a frame that gives it something to span, so `orientation` is
// something the Controls panel can actually turn over.
const Default: Story = {
  decorators: [Framed],
}

const Inset: Story = {
  args: { inset: 'start' },
  decorators: [Framed],
}

const MiddleInset: Story = {
  args: { inset: 'both' },
  decorators: [Framed],
}

// Its own story because a rule is judged against content: between stacked rows
// it spans whatever holds them, stopping at the padding. The rules take `args`,
// so `inset` can be tried between rows as well.
const BetweenRows: Story = {
  render: (args) => (
    <div {...stylex.props(styles.demoStack)}>
      <div {...stylex.props(styles.row)}>
        <Text variant="bodyMedium">First item</Text>
      </div>
      <Separator {...args} />
      <div {...stylex.props(styles.row)}>
        <Text variant="bodyMedium">Second item</Text>
      </div>
      <Separator {...args} />
      <div {...stylex.props(styles.row)}>
        <Text variant="bodyMedium">Third item</Text>
      </div>
    </div>
  ),
}

// Its own story because a vertical rule has no length of its own: it takes the
// height of the row it sits in, so it is worth seeing beside content of a real
// height.
const BetweenInlineItems: Story = {
  render: () => (
    <div {...stylex.props(styles.demoRow)}>
      <Text variant="labelLarge">First</Text>
      <Separator orientation="vertical" />
      <Text variant="labelLarge">Second</Text>
      <Separator orientation="vertical" />
      <Text variant="labelLarge">Third</Text>
    </div>
  ),
}

export { BetweenInlineItems, BetweenRows, Default, Inset, MiddleInset }

export default meta
