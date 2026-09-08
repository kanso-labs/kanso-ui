import type { Meta, StoryObj } from '@storybook/react-vite'

import * as stylex from '@stylexjs/stylex'

import Checkbox from '.'
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
  // A column of checkboxes, each on its own 40dp line, the way a form lists
  // them.
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
  component: Checkbox,
  title: 'Components/Checkbox',
} satisfies Meta<typeof Checkbox>

type Story = StoryObj<typeof meta>

const Overview: Story = {
  render: () => (
    <div {...stylex.props(styles.page)}>
      <header {...stylex.props(styles.header)}>
        <Text render={HEADING_1} variant="displaySmall">
          Checkbox
        </Text>
        <Text render={PARAGRAPH} tone="muted" variant="bodyLarge">
          A box that is on, off, or standing for a partly selected set, with its
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
            An unselected box is a rule; a selected or indeterminate one fills
            with primary and takes the check or the dash. The 40dp state layer
            around the box carries hover, press and the ripple, and the label
            keeps its colour whichever state the box is in.
          </Text>
        </div>
        <div {...stylex.props(styles.column)}>
          <Checkbox>Unselected</Checkbox>
          <Checkbox defaultSelected>Selected</Checkbox>
          <Checkbox isIndeterminate>Indeterminate</Checkbox>
          <Checkbox isDisabled>Disabled</Checkbox>
          <Checkbox defaultSelected isDisabled>
            Disabled and selected
          </Checkbox>
        </div>
      </section>

      <Separator />

      <section {...stylex.props(styles.section)}>
        <div {...stylex.props(styles.intro)}>
          <Text render={HEADING_2} variant="titleLarge">
            Description and error
          </Text>
          <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
            A description sits under the label and is read with the box. An
            error replaces it, turns the box the error pair, and marks the
            checkbox invalid.
          </Text>
        </div>
        <div {...stylex.props(styles.column)}>
          <Checkbox description="Supporting line">With a description</Checkbox>
          <Checkbox error="Choose one.">With an error</Checkbox>
          <Checkbox defaultSelected error="Choose one.">
            Selected, with an error
          </Checkbox>
        </div>
      </section>
    </div>
  ),
}

const Default: Story = {}

const Selected: Story = {
  args: {
    defaultSelected: true,
  },
}

const Indeterminate: Story = {
  args: {
    isIndeterminate: true,
  },
}

const WithDescription: Story = {
  args: {
    description: 'Supporting line',
  },
}

// Its own story because the error state is three changes at once — the
// box's colours, the message that replaces the description, and the
// invalid mark.
const WithError: Story = {
  args: {
    description: 'Supporting line',
    error: 'Choose one.',
  },
}

const Disabled: Story = {
  args: {
    isDisabled: true,
  },
}

export {
  Default,
  Disabled,
  Indeterminate,
  Overview,
  Selected,
  WithDescription,
  WithError,
}

export default meta
