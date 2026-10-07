import type { Decorator, Meta, StoryObj } from '@storybook/react-vite'

import * as stylex from '@stylexjs/stylex'

import Card from '.'
import { spacing } from '../../tokens/design.tokens.stylex'
import Separator from '../separator'
import Text from '../text'

const styles = stylex.create({
  // Wider than the other samples, because list rows need room to read as rows.
  list: {
    inlineSize: '320px',
  },
  // The card sets no padding in this mode, so the rows carry their own and
  // the rules between them reach both edges.
  listRow: {
    paddingBlock: spacing.md,
    paddingInline: spacing.lg,
  },
  stack: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.xs,
  },
  wide: {
    inlineSize: '240px',
  },
})

function Body() {
  return (
    <div {...stylex.props(styles.stack)}>
      <Text variant="titleMedium">Headline</Text>
      <Text tone="muted" variant="bodySmall">
        Supporting line
      </Text>
    </div>
  )
}

const ROWS = ['First item', 'Second item', 'Third item']

function List() {
  return (
    <>
      {ROWS.map((label, index) => (
        <div key={label}>
          {index === 0 ? null : <Separator />}
          <div {...stylex.props(styles.listRow)}>
            <Text variant="bodyMedium">{label}</Text>
          </div>
        </div>
      ))}
    </>
  )
}

// A card fills its container, so every sample needs one to have a width. It
// has to be a wrapper rather than a prop: Card spreads its own StyleX
// className last and so cannot be widened from the outside.
const Wide: Decorator = (Story) => (
  <div {...stylex.props(styles.wide)}>
    <Story />
  </div>
)

const CONTENT = <Body />

// Declared at module scope so it is one stable element rather than a fresh one
// per render, which is what react-perf's no-jsx-as-prop is after. Empty, and
// disabled below, because useRender injects the children, so the anchor
// jsx-a11y sees has no content yet.
// oxlint-disable-next-line jsx-a11y/anchor-has-content, jsx-a11y/control-has-associated-label -- filled by useRender
const EXAMPLE_LINK = <a href="https://example.com" />

const meta = {
  args: {
    children: CONTENT,
  },
  component: Card,
  title: 'Components/Card',
} satisfies Meta<typeof Card>

type Story = StoryObj<typeof meta>

// Its own story because it is a composition rather than a variant: an outlined
// card with no padding of its own, holding rows separated by rules, which is
// the design's bordered list container.
const BorderedList: Story = {
  render: () => (
    <div {...stylex.props(styles.list)}>
      <Card padding="none" variant="outlined">
        <List />
      </Card>
    </div>
  ),
}

const Default: Story = {
  decorators: [Wide],
}

// Its own story because it is a different element — a button rather than a
// div — with focus and ripple behaviour a snapshot cannot show.
const Interactive: Story = {
  args: {
    interactive: true,
  },
  decorators: [Wide],
}

// A third element again, and the only place the anchor's own behaviour can be
// exercised: tabbing to it, the status bar showing where it goes, the browser
// menu on a right-click. `render` takes an element rather than a string, so
// none of that is reachable through the controls panel either.
const Link: Story = {
  args: {
    interactive: true,
    render: EXAMPLE_LINK,
  },
  decorators: [Wide],
}

export { BorderedList, Default, Interactive, Link }

export default meta
