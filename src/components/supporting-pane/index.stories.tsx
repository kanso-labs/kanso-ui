import type { Meta, StoryObj } from '@storybook/react-vite'

import * as stylex from '@stylexjs/stylex'

import SupportingPane from '.'
import { breakpointModes } from '../../../.storybook/modes'
import { colors, radii, spacing } from '../../tokens/design.tokens.stylex'
import Badge from '../badge'
import Card from '../card'
import Separator from '../separator'
import Text from '../text'

// oxlint-disable-next-line jsx-a11y/heading-has-content -- filled by useRender
const HEADING_1 = <h1 />
// oxlint-disable-next-line jsx-a11y/heading-has-content -- filled by useRender
const HEADING_2 = <h2 />
// oxlint-disable-next-line jsx-a11y/heading-has-content -- filled by useRender
const HEADING_3 = <h3 />
const PARAGRAPH = <p />

const RELATED = ['First item', 'Second item', 'Third item']

const styles = stylex.create({
  header: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.xs,
  },
  intro: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.xxs,
  },
  page: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.xl,
    marginInline: 'auto',
    maxInlineSize: '960px',
    padding: spacing.xl,
  },
  // A dashed outline on each pane, so the tracks are legible in a snapshot.
  // The component paints nothing itself — these are the story's, not its.
  paneOutline: {
    borderColor: colors.outlineVariant,
    borderRadius: radii.md,
    borderStyle: 'dashed',
    borderWidth: '1px',
    padding: spacing.md,
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.lg,
  },
  stack: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.sm,
  },
  // A flex column stretches its children, which leaves an inline-flex Badge
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
          The main pane takes two thirds of the width from the expanded
          breakpoint up, and an even half at medium.
        </Text>
      </div>
    </div>
  )
}

function SupportingContent() {
  return (
    <Card variant="outlined">
      <div {...stylex.props(styles.stackStart)}>
        <Text tone="muted" variant="overline">
          Section label
        </Text>
        {RELATED.map((label) => (
          <Text key={label} variant="bodyMedium">
            {label}
          </Text>
        ))}
        <Badge tone="neutral" variant="outlined">
          Label
        </Badge>
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
  title: 'Components/SupportingPane',
} satisfies Meta<typeof SupportingPane>

type Story = StoryObj<typeof meta>

// Chromatic captures the Overview at the narrow arrangements too, because a
// media query answers to the window rather than to a container and one width
// can only ever show one of them. These merge with the project's light and
// dark rather than replacing them, so the wide arrangement is still covered by
// the default snapshot — see .storybook/modes.ts.
const Overview: Story = {
  parameters: {
    chromatic: { modes: breakpointModes },
  },
  render: (args) => (
    <div {...stylex.props(styles.page)}>
      <header {...stylex.props(styles.header)}>
        <Text render={HEADING_1} variant="displaySmall">
          SupportingPane
        </Text>
        <Text render={PARAGRAPH} tone="muted" variant="bodyLarge">
          Material 3's supporting pane layout. A main pane and a companion that
          reflows underneath it when there is no room beside it.
        </Text>
      </header>

      <Separator />

      <section {...stylex.props(styles.section)}>
        <div {...stylex.props(styles.intro)}>
          <Text render={HEADING_2} variant="titleLarge">
            Across the breakpoints
          </Text>
          <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
            Resize the window to see it move. Below 600px the supporting pane
            sits under the main one; from 600px the two split the width evenly;
            from 840px the main pane takes two thirds.
          </Text>
        </div>
        <SupportingPane {...args} />
      </section>

      <Separator />

      <section {...stylex.props(styles.section)}>
        <div {...stylex.props(styles.intro)}>
          <Text render={HEADING_2} variant="titleLarge">
            Against list-detail
          </Text>
          <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
            Both are two-pane layouts, and which one to reach for comes down to
            the second pane. Supporting content means nothing on its own, so it
            stays on screen at every width and this layout holds no state.
            Detail content stands alone, which is what makes showing it instead
            of the list coherent — so ListDetail has to be told which pane is
            showing.
          </Text>
        </div>
      </section>
    </div>
  ),
}

const Default: Story = {}

export { Default, Overview }

export default meta
