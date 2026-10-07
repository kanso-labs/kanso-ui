import type { Meta, StoryObj } from '@storybook/react-vite'

import * as stylex from '@stylexjs/stylex'

import Container from '.'
import { colors, radii, spacing } from '../../tokens/design.tokens.stylex'
import Card from '../card'
import Stack from '../stack'
import Text from '../text'

// A measure for prose, in characters rather than pixels: what makes a line
// hard to read is how many characters the eye has to track back across.
const PROSE = '58ch'
const PARAGRAPH = <p />

const styles = stylex.create({
  // Paints the room the container was given, so the leftover space either
  // side of the measure is visible rather than being taken on trust.
  room: {
    backgroundColor: colors.surfaceContainerHighest,
    borderRadius: radii.md,
    paddingBlock: spacing.md,
  },
  ruled: {
    backgroundColor: colors.surfaceContainerLow,
    outlineColor: colors.outline,
    outlineOffset: '-1px',
    outlineStyle: 'dashed',
    outlineWidth: '1px',
    paddingBlock: spacing.md,
  },
})

const meta = {
  args: {
    children: <Text>First item</Text>,
  },
  component: Container,
  title: 'Components/Container',
} satisfies Meta<typeof Container>

type Story = StoryObj<typeof meta>

const Default: Story = {}

// The prose case gets its own entry because it is the one a reader is most
// likely to be looking for, and the default measure never reaches it.
const Prose: Story = {
  args: {
    children: (
      <Text render={PARAGRAPH} variant="bodyLarge">
        Kanso is the elimination of clutter. A measure is one of the places it
        shows: the line stops where the reader stops being able to follow it,
        rather than where the window happens to end.
      </Text>
    ),
    maxInlineSize: PROSE,
  },
}

// Its own story because a container paints nothing, so its measure shows only
// against what does: the shaded band is the room it was given, and the box or
// Card inside is its content, held in from the measure's edge by the padding.
const Measure: Story = {
  render: (args) => (
    <Stack gap="lg">
      <div {...stylex.props(styles.room)}>
        <Container {...args} maxInlineSize="420px">
          <div {...stylex.props(styles.ruled)}>
            <Text>First item</Text>
          </div>
        </Container>
      </div>
      <div {...stylex.props(styles.room)}>
        <Container maxInlineSize="420px">
          <Card variant="outlined">
            <Text>First item</Text>
          </Card>
        </Container>
      </div>
    </Stack>
  ),
}

export { Default, Measure, Prose }

export default meta
