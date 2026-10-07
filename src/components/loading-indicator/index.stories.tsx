import type { Meta, StoryObj } from '@storybook/react-vite'

import * as stylex from '@stylexjs/stylex'

import LoadingIndicator from '.'
import { colors, radii, spacing } from '../../tokens/design.tokens.stylex'
import Separator from '../separator'
import Text from '../text'

// See avatar/index.stories.tsx for why the overview is built from the
// library's own components, why its sections are divided by a rule, and why
// the headings go through Text's `render`.
// oxlint-disable-next-line jsx-a11y/heading-has-content -- filled by useRender
const HEADING_1 = <h1 />
// oxlint-disable-next-line jsx-a11y/heading-has-content -- filled by useRender
const HEADING_2 = <h2 />
const PARAGRAPH = <p />

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
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.lg,
  },
  // Something for a contained indicator to sit over, standing in for the
  // content it is drawn on top of.
  surface: {
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerHighest,
    blockSize: '160px',
    borderRadius: radii.lg,
    display: 'flex',
    justifyContent: 'center',
    maxInlineSize: '360px',
  },
})

const meta = {
  args: {
    'aria-label': 'Label',
  },
  component: LoadingIndicator,
  title: 'Components/LoadingIndicator',
} satisfies Meta<typeof LoadingIndicator>

type Story = StoryObj<typeof meta>

const Overview: Story = {
  render: () => (
    <div {...stylex.props(styles.page)}>
      <header {...stylex.props(styles.header)}>
        <Text render={HEADING_1} variant="displaySmall">
          LoadingIndicator
        </Text>
        <Text render={PARAGRAPH} tone="muted" variant="bodyLarge">
          A shape that morphs through seven others as it turns, for a wait of a
          few seconds whose length is not worth showing. It slows down for a
          reader who has asked for reduced motion rather than stopping.
        </Text>
      </header>

      <Separator />

      <section {...stylex.props(styles.section)}>
        <div {...stylex.props(styles.intro)}>
          <Text render={HEADING_2} variant="titleLarge">
            Uncontained
          </Text>
          <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
            The bare shape in primary, for a page or a pane that has nothing
            else to show yet.
          </Text>
        </div>
        <LoadingIndicator aria-label="Label" />
      </section>

      <Separator />

      <section {...stylex.props(styles.section)}>
        <div {...stylex.props(styles.intro)}>
          <Text render={HEADING_2} variant="titleLarge">
            Contained
          </Text>
          <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
            contained draws the shape on a circle in the primary container pair,
            so it reads against whatever it is drawn over.
          </Text>
        </div>
        <div {...stylex.props(styles.surface)}>
          <LoadingIndicator aria-label="Label" contained />
        </div>
      </section>
    </div>
  ),
}

const Default: Story = {}

const Contained: Story = {
  args: {
    contained: true,
  },
}

export { Contained, Default, Overview }

export default meta
