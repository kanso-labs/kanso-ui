import type { Meta, StoryObj } from '@storybook/react-vite'

import * as stylex from '@stylexjs/stylex'

import SearchField from '.'
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
  // A bar fills its container up to the page's 720, so the samples need a
  // width to fill.
  sample: {
    maxInlineSize: '420px',
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.lg,
  },
  stack: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.lg,
  },
})

const meta = {
  args: {
    label: 'Label',
    placeholder: 'Supporting text',
  },
  component: SearchField,
  title: 'Components/SearchField',
} satisfies Meta<typeof SearchField>

type Story = StoryObj<typeof meta>

const Overview: Story = {
  render: () => (
    <div {...stylex.props(styles.page)}>
      <header {...stylex.props(styles.header)}>
        <Text render={HEADING_1} variant="displaySmall">
          SearchField
        </Text>
        <Text render={PARAGRAPH} tone="muted" variant="bodyLarge">
          A search bar: a keyword typed into a pill, submitted with Enter and
          cleared with Escape or its button.
        </Text>
      </header>

      <Separator />

      <section {...stylex.props(styles.section)}>
        <div {...stylex.props(styles.intro)}>
          <Text render={HEADING_2} variant="titleLarge">
            The bar
          </Text>
          <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
            The bar draws no label of its own; the supporting text is what a
            person reads, and the label is what a screen reader reads. The clear
            button appears once the bar holds anything.
          </Text>
        </div>
        <div {...stylex.props(styles.stack)}>
          <div {...stylex.props(styles.sample)}>
            <SearchField label="Label" placeholder="Supporting text" />
          </div>
          <div {...stylex.props(styles.sample)}>
            <SearchField
              defaultValue="Typed keyword"
              label="Label"
              placeholder="Supporting text"
            />
          </div>
        </div>
      </section>

      <Separator />

      <section {...stylex.props(styles.section)}>
        <div {...stylex.props(styles.intro)}>
          <Text render={HEADING_2} variant="titleLarge">
            States
          </Text>
          <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
            The description, the error and the disabled state are the field
            chrome&apos;s, under the bar; the search page draws no error colours
            for the bar itself, so the message carries it.
          </Text>
        </div>
        <div {...stylex.props(styles.stack)}>
          <div {...stylex.props(styles.sample)}>
            <SearchField
              description="Supporting line"
              label="With a description"
              placeholder="Supporting text"
            />
          </div>
          <div {...stylex.props(styles.sample)}>
            <SearchField
              error="Enter a keyword."
              label="With an error"
              placeholder="Supporting text"
            />
          </div>
          <div {...stylex.props(styles.sample)}>
            <SearchField
              defaultValue="Typed keyword"
              isDisabled
              label="Disabled"
              placeholder="Supporting text"
            />
          </div>
        </div>
      </section>
    </div>
  ),
}

const Default: Story = {
  render: (args) => (
    <div {...stylex.props(styles.sample)}>
      <SearchField {...args} />
    </div>
  ),
}

const WithValue: Story = {
  args: {
    defaultValue: 'Typed keyword',
  },
  render: (args) => (
    <div {...stylex.props(styles.sample)}>
      <SearchField {...args} />
    </div>
  ),
}

const WithError: Story = {
  args: {
    error: 'Enter a keyword.',
  },
  render: (args) => (
    <div {...stylex.props(styles.sample)}>
      <SearchField {...args} />
    </div>
  ),
}

const Disabled: Story = {
  args: {
    defaultValue: 'Typed keyword',
    isDisabled: true,
  },
  render: (args) => (
    <div {...stylex.props(styles.sample)}>
      <SearchField {...args} />
    </div>
  ),
}

export { Default, Disabled, Overview, WithError, WithValue }

export default meta
