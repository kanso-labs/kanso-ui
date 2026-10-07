import type { Meta, StoryObj } from '@storybook/react-vite'

import * as stylex from '@stylexjs/stylex'

import SupportingPane from '.'
import { breakpointModes } from '../../../.storybook/modes'
import { colors, radii, spacing } from '../../tokens/design.tokens.stylex'
import Card from '../card'
import Separator from '../separator'
import Tag from '../tag'
import Text from '../text'

// oxlint-disable-next-line jsx-a11y/heading-has-content -- filled by useRender
const HEADING_3 = <h3 />

const RELATED = ['First item', 'Second item', 'Third item']

const styles = stylex.create({
  // A dashed outline on each pane, so the tracks are legible in a snapshot.
  // The component paints nothing itself — these are the story's, not its.
  paneOutline: {
    borderColor: colors.outlineVariant,
    borderRadius: radii.md,
    borderStyle: 'dashed',
    borderWidth: '1px',
    padding: spacing.md,
  },
  stack: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.sm,
  },
  // A flex column stretches its children, which leaves an inline-flex Tag
  // spanning the pane instead of sizing to its own label.
  stackStart: {
    alignItems: 'flex-start',
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.sm,
  },
})

function MainPane() {
  return (
    <div {...stylex.props(styles.paneOutline)}>
      <div {...stylex.props(styles.stack)}>
        <Text render={HEADING_3} variant="titleLarge">
          Headline
        </Text>
        <Text tone="muted" variant="bodyMedium">
          Supporting line
        </Text>
        <Separator />
        <Text tone="muted" variant="bodyMedium">
          The main pane takes whatever width the supporting pane leaves from the
          expanded breakpoint up.
        </Text>
      </div>
    </div>
  )
}

function SupportingContent() {
  return (
    <Card variant="outlined">
      <div {...stylex.props(styles.stackStart)}>
        <Text tone="muted" variant="labelSmall">
          Section label
        </Text>
        {RELATED.map((label) => (
          <Text key={label} variant="bodyMedium">
            {label}
          </Text>
        ))}
        <Tag tone="neutral" variant="outlined">
          Label
        </Tag>
      </div>
    </Card>
  )
}

const meta = {
  args: {
    main: <MainPane />,
    supporting: <SupportingContent />,
  },
  component: SupportingPane,
  // Chromatic captures the stories at the narrow arrangements too, because a
  // media query answers to the window rather than to a container and one
  // width can only ever show one of them. These merge with the project's light
  // and dark rather than replacing them, so the wide arrangement is still
  // covered by the default snapshot — see .storybook/modes.ts.
  parameters: {
    chromatic: { modes: breakpointModes },
  },
  title: 'Components/SupportingPane',
} satisfies Meta<typeof SupportingPane>

type Story = StoryObj<typeof meta>

const Default: Story = {}

// Its own story because which side the supporting pane takes only shows from
// expanded up — below that the layout stacks the same way either way, which
// is what the canonical layout page asks for.
const Leading: Story = {
  args: {
    placement: 'leading',
  },
}

export { Default, Leading }

export default meta
