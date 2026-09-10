import type { Meta, StoryObj } from '@storybook/react-vite'

import * as stylex from '@stylexjs/stylex'

import Select from '.'
import { spacing } from '../../tokens/design.tokens.stylex'
import ListBox from '../list-box'
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

// Hoisted so the options are not a new element on every render, which is
// what react-perf's jsx-no-jsx-as-prop is after.
const OPTIONS = (
  <>
    <ListBox.Item id="first">First item</ListBox.Item>
    <ListBox.Item id="second">Second item</ListBox.Item>
    <ListBox.Item id="third">Third item</ListBox.Item>
  </>
)

const GROUPED = (
  <>
    <ListBox.Section header="First group">
      <ListBox.Item id="first">First item</ListBox.Item>
      <ListBox.Item id="second">Second item</ListBox.Item>
    </ListBox.Section>
    <ListBox.Section header="Second group">
      <ListBox.Item id="third">Third item</ListBox.Item>
    </ListBox.Section>
  </>
)

const styles = stylex.create({
  column: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.lg,
    maxInlineSize: '320px',
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
    paddingBlockEnd: spacing.xxxl,
    paddingBlockStart: spacing.xl,
    paddingInline: spacing.xl,
  },
  row: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: spacing.xl,
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.lg,
  },
  width: {
    inlineSize: '320px',
  },
})

const meta = {
  args: {
    label: 'Label',
    options: OPTIONS,
  },
  component: Select,
  title: 'Components/Select',
} satisfies Meta<typeof Select<object>>

type Story = StoryObj<typeof meta>

const Overview: Story = {
  render: () => (
    <div {...stylex.props(styles.page)}>
      <header {...stylex.props(styles.header)}>
        <Text render={HEADING_1} variant="displaySmall">
          Select
        </Text>
        <Text render={PARAGRAPH} tone="muted" variant="bodyLarge">
          A labelled field that opens a list to choose from.
        </Text>
      </header>

      <Separator />

      <section {...stylex.props(styles.section)}>
        <div {...stylex.props(styles.intro)}>
          <Text render={HEADING_2} variant="titleLarge">
            The two boxes
          </Text>
          <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
            The same filled and outlined boxes every other field draws, with a
            chevron at the end that turns while the list is open. The whole box
            opens it — the padding, the label and the icons, not only the
            value&apos;s line.
          </Text>
        </div>
        <div {...stylex.props(styles.row)}>
          <div {...stylex.props(styles.column)}>
            <Select label="Label" options={OPTIONS} />
            <Select defaultValue="second" label="Label" options={OPTIONS} />
          </div>
          <div {...stylex.props(styles.column)}>
            <Select label="Label" options={OPTIONS} variant="outlined" />
            <Select
              defaultValue="second"
              label="Label"
              options={OPTIONS}
              variant="outlined"
            />
          </div>
        </div>
      </section>

      <Separator />

      <section {...stylex.props(styles.section)}>
        <div {...stylex.props(styles.intro)}>
          <Text render={HEADING_2} variant="titleLarge">
            Supporting text and errors
          </Text>
          <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
            A description sits under the box; an error replaces it and turns the
            underline and the label to the error role, the same way every other
            field reports one.
          </Text>
        </div>
        <div {...stylex.props(styles.column)}>
          <Select
            description="Supporting line"
            label="Label"
            options={OPTIONS}
          />
          <Select error="Choose an item" label="Label" options={OPTIONS} />
          <Select isDisabled label="Label" options={OPTIONS} />
        </div>
      </section>

      <Separator />

      <section {...stylex.props(styles.section)}>
        <div {...stylex.props(styles.intro)}>
          <Text render={HEADING_2} variant="titleLarge">
            The list
          </Text>
          <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
            The list is a ListBox, so it takes everything one does — sections
            with headings, disabled options, supporting lines. It opens under
            the field and as wide as it.
          </Text>
        </div>
        <div {...stylex.props(styles.column)}>
          <Select label="Label" options={GROUPED} />
        </div>
      </section>
    </div>
  ),
}

const Default: Story = {
  render: (args) => (
    <div {...stylex.props(styles.width)}>
      <Select {...args} />
    </div>
  ),
}

const Chosen: Story = {
  args: { defaultValue: 'second' },
  render: Default.render,
}

const Outlined: Story = {
  args: { variant: 'outlined' },
  render: Default.render,
}

const WithDescription: Story = {
  args: { description: 'Supporting line' },
  render: Default.render,
}

const Invalid: Story = {
  args: { error: 'Choose an item' },
  render: Default.render,
}

const Disabled: Story = {
  args: { isDisabled: true },
  render: Default.render,
}

const Open: Story = {
  args: { defaultOpen: true, defaultValue: 'second' },
  render: Default.render,
}

export {
  Chosen,
  Default,
  Disabled,
  Invalid,
  Open,
  Outlined,
  Overview,
  WithDescription,
}

export default meta
