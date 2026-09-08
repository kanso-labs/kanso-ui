import type { Meta, StoryObj } from '@storybook/react-vite'

import * as stylex from '@stylexjs/stylex'

import CheckboxGroup from '.'
import { spacing } from '../../tokens/design.tokens.stylex'
import Checkbox from '../checkbox'
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
  // A group fills its container, so the samples need a width to fill.
  sample: {
    maxInlineSize: '420px',
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.lg,
  },
})

// Hoisted so each is one stable array per render rather than a fresh one,
// which is what react-perf's no-new-array-as-prop is after.
const FIRST = ['first']
const SECOND = ['second']
const NONE: string[] = []

// Pulled out because every story lists the same three items and only the
// group around them differs.
function Items() {
  return (
    <>
      <Checkbox value="first">First item</Checkbox>
      <Checkbox value="second">Second item</Checkbox>
      <Checkbox value="third">Third item</Checkbox>
    </>
  )
}

const meta = {
  args: {
    defaultValue: FIRST,
    label: 'Label',
  },
  component: CheckboxGroup,
  title: 'Components/CheckboxGroup',
} satisfies Meta<typeof CheckboxGroup>

type Story = StoryObj<typeof meta>

const Overview: Story = {
  render: () => (
    <div {...stylex.props(styles.page)}>
      <header {...stylex.props(styles.header)}>
        <Text render={HEADING_1} variant="displaySmall">
          CheckboxGroup
        </Text>
        <Text render={PARAGRAPH} tone="muted" variant="bodyLarge">
          A labelled set of checkboxes with one value between them.
        </Text>
      </header>

      <Separator />

      <section {...stylex.props(styles.section)}>
        <div {...stylex.props(styles.intro)}>
          <Text render={HEADING_2} variant="titleLarge">
            Value
          </Text>
          <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
            Each checkbox names the entry it stands for with a value, and the
            group holds the selection as an array of them. It is introduced by
            its label before its boxes are read.
          </Text>
        </div>
        <div {...stylex.props(styles.sample)}>
          <CheckboxGroup defaultValue={FIRST} label="Label">
            <Items />
          </CheckboxGroup>
        </div>
      </section>

      <Separator />

      <section {...stylex.props(styles.section)}>
        <div {...stylex.props(styles.intro)}>
          <Text render={HEADING_2} variant="titleLarge">
            Description and error
          </Text>
          <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
            A description sits under the group. An error replaces it, marks the
            group invalid, and turns every box the error pair.
          </Text>
        </div>
        <div {...stylex.props(styles.sample)}>
          <CheckboxGroup
            description="Supporting line"
            label="With a description"
          >
            <Items />
          </CheckboxGroup>
        </div>
        <div {...stylex.props(styles.sample)}>
          <CheckboxGroup error="Choose at least one." label="With an error">
            <Items />
          </CheckboxGroup>
        </div>
      </section>

      <Separator />

      <section {...stylex.props(styles.section)}>
        <div {...stylex.props(styles.intro)}>
          <Text render={HEADING_2} variant="titleLarge">
            Disabled
          </Text>
          <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
            Disabling the group disables every checkbox in it.
          </Text>
        </div>
        <div {...stylex.props(styles.sample)}>
          <CheckboxGroup defaultValue={SECOND} isDisabled label="Disabled">
            <Items />
          </CheckboxGroup>
        </div>
      </section>
    </div>
  ),
}

const Default: Story = {
  render: (args) => (
    <div {...stylex.props(styles.sample)}>
      <CheckboxGroup {...args}>
        <Items />
      </CheckboxGroup>
    </div>
  ),
}

const WithError: Story = {
  args: {
    defaultValue: NONE,
    error: 'Choose at least one.',
  },
  render: (args) => (
    <div {...stylex.props(styles.sample)}>
      <CheckboxGroup {...args}>
        <Items />
      </CheckboxGroup>
    </div>
  ),
}

export { Default, Overview, WithError }

export default meta
