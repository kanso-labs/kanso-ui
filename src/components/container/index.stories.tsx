import type { Meta, StoryObj } from '@storybook/react-vite'

import * as stylex from '@stylexjs/stylex'

import Container from '.'
import { colors, radii, spacing } from '../../tokens/design.tokens.stylex'
import Card from '../card'
import Code from '../code'
import Separator from '../separator'
import Stack from '../stack'
import Text from '../text'

// A measure for prose, in characters rather than pixels: what makes a line
// hard to read is how many characters the eye has to track back across.
const PROSE = '58ch'

// oxlint-disable-next-line jsx-a11y/heading-has-content -- filled by useRender
const HEADING_1 = <h1 />
// oxlint-disable-next-line jsx-a11y/heading-has-content -- filled by useRender
const HEADING_2 = <h2 />
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

const Overview: Story = {
  render: (args) => (
    <Container>
      <Stack gap="xl">
        <Stack gap="xs">
          <Text render={HEADING_1} variant="displaySmall">
            Container
          </Text>
          <Text render={PARAGRAPH} tone="muted" variant="bodyLarge">
            A centred measure for a page or a section of one. Content grows to a
            width and stops, and the space left over is split evenly either
            side.
          </Text>
        </Stack>

        <Separator />

        <Stack gap="lg">
          <Stack gap="xxs">
            <Text render={HEADING_2} variant="titleLarge">
              The measure is the point
            </Text>
            <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
              The shaded band below is the room the container was given. The
              ruled box inside it is the container, at a measure narrower than
              that room.
            </Text>
          </Stack>
          <div {...stylex.props(styles.room)}>
            <Container {...args} maxInlineSize="420px">
              <div {...stylex.props(styles.ruled)}>
                <Text>First item</Text>
              </div>
            </Container>
          </div>
        </Stack>

        <Separator />

        <Stack gap="lg">
          <Stack gap="xxs">
            <Text render={HEADING_2} variant="titleLarge">
              Prose wants a narrower one
            </Text>
            <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
              A page of mixed components reads well at the default. A paragraph
              does not, because a long line makes the eye lose its place
              tracking back to the next one. Give the measure in <Code>ch</Code>{' '}
              for prose, and it follows the type size rather than fighting it.
            </Text>
          </Stack>
          <div {...stylex.props(styles.room)}>
            <Container maxInlineSize={PROSE}>
              <Text render={PARAGRAPH} variant="bodyLarge">
                Kanso is the elimination of clutter. A measure is one of the
                places it shows: the line stops where the reader stops being
                able to follow it, rather than where the window happens to end.
              </Text>
            </Container>
          </div>
        </Stack>

        <Separator />

        <Stack gap="lg">
          <Stack gap="xxs">
            <Text render={HEADING_2} variant="titleLarge">
              Padding holds the content off the edge
            </Text>
            <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
              Once the window is narrower than the measure, the padding is what
              stops the content running into the edge of the screen. It sits
              inside the measure rather than widening the box past it, so two
              containers at the same measure line up whether they are padded or
              not.
            </Text>
          </Stack>
          <div {...stylex.props(styles.room)}>
            <Container maxInlineSize="420px">
              <Card variant="outlined">
                <Text>First item</Text>
              </Card>
            </Container>
          </div>
        </Stack>
      </Stack>
    </Container>
  ),
}

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

export { Default, Overview, Prose }

export default meta
