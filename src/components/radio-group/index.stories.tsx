import type { Meta, StoryObj } from '@storybook/react-vite'

import * as stylex from '@stylexjs/stylex'

import RadioGroup, { Radio } from '.'
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

// Pulled out because every story lists the same three options and only the
// group around them differs.
function Options() {
  return (
    <>
      <Radio value="first">First item</Radio>
      <Radio value="second">Second item</Radio>
      <Radio value="third">Third item</Radio>
    </>
  )
}

const meta = {
  args: {
    defaultValue: 'first',
    label: 'Label',
  },
  component: RadioGroup,
  title: 'Components/RadioGroup',
} satisfies Meta<typeof RadioGroup>

type Story = StoryObj<typeof meta>

const Overview: Story = {
  render: () => (
    <div {...stylex.props(styles.page)}>
      <header {...stylex.props(styles.header)}>
        <Text render={HEADING_1} variant="displaySmall">
          RadioGroup
        </Text>
        <Text render={PARAGRAPH} tone="muted" variant="bodyLarge">
          A labelled set of radio buttons with one selected value between them.
        </Text>
      </header>

      <Separator />

      <section {...stylex.props(styles.section)}>
        <div {...stylex.props(styles.intro)}>
          <Text render={HEADING_2} variant="titleLarge">
            Value
          </Text>
          <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
            Each button names the entry it stands for with a value, and the
            group holds the one selected. An unselected ring is on surface
            variant; the selected ring and its dot are primary. The arrow keys
            move the selection.
          </Text>
        </div>
        <div {...stylex.props(styles.sample)}>
          <RadioGroup defaultValue="first" label="Label">
            <Options />
          </RadioGroup>
        </div>
      </section>

      <Separator />

      <section {...stylex.props(styles.section)}>
        <div {...stylex.props(styles.intro)}>
          <Text render={HEADING_2} variant="titleLarge">
            Descriptions and error
          </Text>
          <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
            A description under an option is read with it, and one under the
            group with the group. An error replaces the group&apos;s
            description, colours its label, and marks the group invalid.
          </Text>
        </div>
        <div {...stylex.props(styles.sample)}>
          <RadioGroup
            defaultValue="second"
            description="Supporting line"
            label="With descriptions"
          >
            <Radio description="Supporting line" value="first">
              First item
            </Radio>
            <Radio description="Supporting line" value="second">
              Second item
            </Radio>
            <Radio value="third">Third item</Radio>
          </RadioGroup>
        </div>
        <div {...stylex.props(styles.sample)}>
          <RadioGroup error="Choose one." label="With an error">
            <Options />
          </RadioGroup>
        </div>
      </section>

      <Separator />

      <section {...stylex.props(styles.section)}>
        <div {...stylex.props(styles.intro)}>
          <Text render={HEADING_2} variant="titleLarge">
            Horizontal and disabled
          </Text>
          <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
            A horizontal group lays its options along a line and wraps them when
            the line runs out. Disabling the group disables every option.
          </Text>
        </div>
        <RadioGroup
          defaultValue="first"
          label="Horizontal"
          orientation="horizontal"
        >
          <Options />
        </RadioGroup>
        <div {...stylex.props(styles.sample)}>
          <RadioGroup defaultValue="second" isDisabled label="Disabled">
            <Options />
          </RadioGroup>
        </div>
      </section>
    </div>
  ),
}

const Default: Story = {
  render: (args) => (
    <div {...stylex.props(styles.sample)}>
      <RadioGroup {...args}>
        <Options />
      </RadioGroup>
    </div>
  ),
}

const Horizontal: Story = {
  args: {
    orientation: 'horizontal',
  },
  render: (args) => (
    <RadioGroup {...args}>
      <Options />
    </RadioGroup>
  ),
}

const WithError: Story = {
  args: {
    defaultValue: undefined,
    error: 'Choose one.',
  },
  render: (args) => (
    <div {...stylex.props(styles.sample)}>
      <RadioGroup {...args}>
        <Options />
      </RadioGroup>
    </div>
  ),
}

export { Default, Horizontal, Overview, WithError }

export default meta
