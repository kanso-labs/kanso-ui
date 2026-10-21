import type { Decorator, Meta, StoryObj } from '@storybook/react-vite'

import * as stylex from '@stylexjs/stylex'

import Separator from '.'
import { colors, radii, spacing } from '../../tokens/design.tokens.stylex'
import Button from '../button'
import Card from '../card'
import ListItem from '../list-item'
import Menu from '../menu'
import Text from '../text'
import Toolbar from '../toolbar'

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
  // parent via alignSelf: stretch and is one line of text otherwise, so in a
  // plain block this story would shrink to a stub the moment the orientation
  // control was flipped.
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
  list: {
    inlineSize: '280px',
  },
  row: {
    paddingBlock: spacing.md,
  },
  // A plain block, neither flex nor grid, so a vertical rule in it has
  // nothing to stretch to.
  textBlock: {
    backgroundColor: colors.surfaceContainer,
    borderRadius: radii.lg,
    inlineSize: 'fit-content',
    padding: spacing.lg,
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

// For a story whose layout decides the orientation: a stack of rows only has
// a horizontal rule to show, and a row of inline items a vertical one, so
// turning it over would draw a stub of `1em` rather than the other form.
const ORIENTATION_FIXED = { orientation: { control: false } } as const

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

// A vertical rule held off both ends, which the frame's 64dp of height
// shortens to 32: the inset moves with the axis the rule runs along.
const VerticalMiddleInset: Story = {
  args: { inset: 'both', orientation: 'vertical' },
  decorators: [Framed],
}

// Its own story because a rule is judged against content: between stacked rows
// it spans whatever holds them, stopping at the padding. The rules take `args`,
// so `inset` can be tried between rows as well.
const BetweenRows: Story = {
  argTypes: ORIENTATION_FIXED,
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

// The rows of BetweenRows with decorative rules, which draw exactly as those
// do. What changes is not drawn: a reader moving down the rows hears no
// "separator" between them, which suits rows that each carry their own
// structure — a heading, a control.
const Decorative: Story = {
  args: { decorative: true },
  argTypes: ORIENTATION_FIXED,
  render: BetweenRows.render,
}

// The inset rule between list rows, which is what it is for. A row holds its
// content 16dp off its leading edge and `start` holds the rule the same 16dp
// off, so the rule begins where the row's text does rather than at the
// card's edge.
const BetweenListItems: Story = {
  args: { inset: 'start' },
  argTypes: ORIENTATION_FIXED,
  render: (args) => (
    <div {...stylex.props(styles.list)}>
      <Card padding="none" variant="outlined">
        <ListItem supporting="Supporting line">First item</ListItem>
        <Separator {...args} />
        <ListItem supporting="Supporting line">Second item</ListItem>
        <Separator {...args} />
        <ListItem supporting="Supporting line">Third item</ListItem>
      </Card>
    </div>
  ),
}

// Its own story because a vertical rule in a flex row has no length of its
// own: it takes the height of the row it sits in, so it is worth seeing beside
// content of a real height.
const BetweenInlineItems: Story = {
  argTypes: ORIENTATION_FIXED,
  render: (args) => (
    <div {...stylex.props(styles.demoRow)}>
      <Text variant="labelLarge">First</Text>
      <Separator {...args} orientation="vertical" />
      <Text variant="labelLarge">Second</Text>
      <Separator {...args} orientation="vertical" />
      <Text variant="labelLarge">Third</Text>
    </div>
  ),
}

// A vertical rule in a parent that is neither flex nor grid, where there is
// nothing to stretch to: it is one line of the text around it, and sits in
// that line between the words rather than breaking it.
const InRunningText: Story = {
  argTypes: ORIENTATION_FIXED,
  render: (args) => (
    <div {...stylex.props(styles.textBlock)}>
      <Text variant="bodyMedium">First item</Text>{' '}
      <Separator {...args} orientation="vertical" />{' '}
      <Text variant="bodyMedium">Second item</Text>
    </div>
  ),
}

// Written inside a Toolbar with no orientation of its own: the toolbar asks
// for the rule across its own direction, so between buttons in a row it is
// vertical, and spans the bar's height inside its padding.
const InToolbar: Story = {
  argTypes: ORIENTATION_FIXED,
  render: (args) => (
    <Toolbar aria-label="Label">
      <Button variant="text">First</Button>
      <Button variant="text">Second</Button>
      <Separator {...args} />
      <Button variant="text">Third</Button>
    </Toolbar>
  ),
}

// `Menu.Separator` between two groups of items, open on load since a closed
// menu draws nothing. The menu supplies its role, so it needs no slot.
const InMenu: Story = {
  argTypes: ORIENTATION_FIXED,
  parameters: { docs: { story: { height: '280px', inline: false } } },
  render: (args) => (
    <Menu defaultOpen>
      <Button variant="outlined">Label</Button>
      <Menu.Content>
        <Menu.Item id="first">First item</Menu.Item>
        <Menu.Item id="second">Second item</Menu.Item>
        <Menu.Separator {...args} />
        <Menu.Item id="third">Third item</Menu.Item>
      </Menu.Content>
    </Menu>
  ),
}

export {
  BetweenInlineItems,
  BetweenListItems,
  BetweenRows,
  Decorative,
  Default,
  InMenu,
  InRunningText,
  Inset,
  InToolbar,
  MiddleInset,
  VerticalMiddleInset,
}

export default meta
