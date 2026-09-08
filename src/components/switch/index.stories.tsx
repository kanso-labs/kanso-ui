import type { Meta, StoryObj } from '@storybook/react-vite'

import * as stylex from '@stylexjs/stylex'

import Switch from '.'
import { spacing } from '../../tokens/design.tokens.stylex'
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
  // A column of switches, each on its own 40dp line, the way a settings
  // page lists them.
  column: {
    display: 'flex',
    flexDirection: 'column',
    maxInlineSize: '420px',
  },
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
})

const meta = {
  args: {
    children: 'Label',
  },
  component: Switch,
  title: 'Components/Switch',
} satisfies Meta<typeof Switch>

type Story = StoryObj<typeof meta>

const Overview: Story = {
  render: () => (
    <div {...stylex.props(styles.page)}>
      <header {...stylex.props(styles.header)}>
        <Text render={HEADING_1} variant="displaySmall">
          Switch
        </Text>
        <Text render={PARAGRAPH} tone="muted" variant="bodyLarge">
          A setting turned on or off, taking effect as it is flipped, with its
          label beside it.
        </Text>
      </header>

      <Separator />

      <section {...stylex.props(styles.section)}>
        <div {...stylex.props(styles.intro)}>
          <Text render={HEADING_2} variant="titleLarge">
            States
          </Text>
          <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
            Off, the track is outlined and the handle small; on, the track fills
            with primary and the handle grows as it crosses. The handle grows
            again while pressed, and the 40dp state layer around it carries
            hover, press and the ripple.
          </Text>
        </div>
        <div {...stylex.props(styles.column)}>
          <Switch>Off</Switch>
          <Switch defaultSelected>On</Switch>
          <Switch defaultSelected icon>
            On, with the check
          </Switch>
          <Switch isDisabled>Disabled</Switch>
          <Switch defaultSelected isDisabled>
            Disabled and on
          </Switch>
        </div>
      </section>

      <Separator />

      <section {...stylex.props(styles.section)}>
        <div {...stylex.props(styles.intro)}>
          <Text render={HEADING_2} variant="titleLarge">
            Description and error
          </Text>
          <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
            A description sits under the label and is read with the switch. An
            error replaces it and marks the switch invalid; the page draws no
            error colours for the switch itself, so the message carries it.
          </Text>
        </div>
        <div {...stylex.props(styles.column)}>
          <Switch description="Supporting line">With a description</Switch>
          <Switch error="Turn this on.">With an error</Switch>
        </div>
      </section>
    </div>
  ),
}

const Default: Story = {}

const On: Story = {
  args: {
    defaultSelected: true,
  },
}

const WithIcon: Story = {
  args: {
    defaultSelected: true,
    icon: true,
  },
}

const WithDescription: Story = {
  args: {
    description: 'Supporting line',
  },
}

const WithError: Story = {
  args: {
    description: 'Supporting line',
    error: 'Turn this on.',
  },
}

const Disabled: Story = {
  args: {
    isDisabled: true,
  },
}

export { Default, Disabled, On, Overview, WithDescription, WithError, WithIcon }

export default meta
