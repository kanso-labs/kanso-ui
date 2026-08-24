import type { Meta, StoryObj } from '@storybook/react-vite'

import * as stylex from '@stylexjs/stylex'

import Stack from '.'
import { colors, radii, spacing } from '../../tokens/design.tokens.stylex'
import Badge from '../badge'
import Button from '../button'
import Card from '../card'
import Chip from '../chip'
import Code from '../code'
import Container from '../container'
import Separator from '../separator'
import Text from '../text'

// oxlint-disable-next-line jsx-a11y/heading-has-content -- filled by useRender
const HEADING_1 = <h1 />
// oxlint-disable-next-line jsx-a11y/heading-has-content -- filled by useRender
const HEADING_2 = <h2 />
const PARAGRAPH = <p />

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
  room: {
    backgroundColor: colors.surfaceContainerHighest,
    borderRadius: radii.md,
    padding: spacing.md,
  },
  // A fixed width for the two alignment boxes, so the only thing that differs
  // between them is what the stack does to its children rather than how much
  // room each box happened to take.
  sample: {
    inlineSize: '220px',
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

const Overview: Story = {
  render: () => (
    <Container>
      <Stack gap="xl">
        <Stack gap="xs">
          <Text render={HEADING_1} variant="displaySmall">
            Stack
          </Text>
          <Text render={PARAGRAPH} tone="muted" variant="bodyLarge">
            A row or a column of children with one gap between them, taken from
            the spacing scale. It is why no component here carries a margin of
            its own: the space between two things belongs to whatever holds both
            of them.
          </Text>
        </Stack>

        <Separator />

        <Stack gap="lg">
          <Stack gap="xxs">
            <Text render={HEADING_2} variant="titleLarge">
              One gap, from the scale
            </Text>
            <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
              Every step of the spacing scale is a value of <Code>gap</Code>, so
              the space between things is a decision from the same set of
              numbers as the space inside them.
            </Text>
          </Stack>
          <Stack direction="row" gap="xl" wrap>
            {(['xs', 'md', 'xl', 'xxxl'] as const).map((gap) => (
              <Stack gap="xs" key={gap}>
                <Text tone="muted" variant="labelMedium">
                  {gap}
                </Text>
                <div {...stylex.props(styles.room)}>
                  <Stack direction="row" gap={gap}>
                    <Blocks count={2} />
                  </Stack>
                </div>
              </Stack>
            ))}
          </Stack>
        </Stack>

        <Separator />

        <Stack gap="lg">
          <Stack gap="xxs">
            <Text render={HEADING_2} variant="titleLarge">
              A column stretches, until it is told not to
            </Text>
            <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
              Stretching is what makes every card in a column the same width. It
              is also what makes an inline-sized child span the whole column,
              which is what <Code>align=&quot;start&quot;</Code> is for.
            </Text>
          </Stack>
          <Stack direction="row" gap="lg" wrap>
            <div {...stylex.props(styles.room, styles.sample)}>
              <Stack gap="sm">
                <Text tone="muted" variant="labelMedium">
                  Stretched
                </Text>
                <Badge>Label</Badge>
                <Chip>Label</Chip>
              </Stack>
            </div>
            <div {...stylex.props(styles.room, styles.sample)}>
              <Stack align="start" gap="sm">
                <Text tone="muted" variant="labelMedium">
                  align=&quot;start&quot;
                </Text>
                <Badge>Label</Badge>
                <Chip>Label</Chip>
              </Stack>
            </div>
          </Stack>
        </Stack>

        <Separator />

        <Stack gap="lg">
          <Stack gap="xxs">
            <Text render={HEADING_2} variant="titleLarge">
              A row with the space in the middle
            </Text>
            <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
              <Code>justify=&quot;between&quot;</Code> is the one that puts a
              headline at one end of a row and its actions at the other, without
              either side needing a width.
            </Text>
          </Stack>
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
        </Stack>

        <Separator />

        <Stack gap="lg">
          <Stack gap="xxs">
            <Text render={HEADING_2} variant="titleLarge">
              Rows wrap on request
            </Text>
            <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
              A row overflows rather than wrapping unless it is told to, so a
              toolbar that should stay on one line does. A group of chips
              usually should not.
            </Text>
          </Stack>
          <Stack direction="row" gap="sm" wrap>
            <Chip>First item</Chip>
            <Chip>Second item</Chip>
            <Chip>Third item</Chip>
            <Chip>Fourth item</Chip>
            <Chip>Fifth item</Chip>
            <Chip>Sixth item</Chip>
          </Stack>
        </Stack>
      </Stack>
    </Container>
  ),
}

const Default: Story = {}

const Row: Story = {
  args: {
    direction: 'row',
  },
}

export { Default, Overview, Row }

export default meta
