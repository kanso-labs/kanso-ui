import type { Meta, StoryObj } from '@storybook/react-vite'

import * as stylex from '@stylexjs/stylex'

import SplitButton from '.'
import { spacing } from '../../tokens/design.tokens.stylex'
import Menu from '../menu'
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
  // Room under the pair for its menu to open into.
  open: {
    minBlockSize: '240px',
  },
  page: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.xl,
    marginInline: 'auto',
    maxInlineSize: '960px',
    padding: spacing.xl,
  },
  // A row of samples, bottom-aligned so the sizes share a baseline.
  row: {
    alignItems: 'flex-end',
    display: 'flex',
    flexWrap: 'wrap',
    gap: spacing.lg,
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.lg,
  },
})

const HALVES = [
  <SplitButton.Action key="action">Label</SplitButton.Action>,
  <SplitButton.Menu aria-label="More options" key="menu">
    <Menu.Item id="first">First item</Menu.Item>
    <Menu.Item id="second">Second item</Menu.Item>
    <Menu.Item id="third">Third item</Menu.Item>
  </SplitButton.Menu>,
]

const meta = {
  args: {
    children: HALVES,
  },
  component: SplitButton,
  title: 'Components/SplitButton',
} satisfies Meta<typeof SplitButton>

type Story = StoryObj<typeof meta>

const Overview: Story = {
  render: () => (
    <div {...stylex.props(styles.page)}>
      <header {...stylex.props(styles.header)}>
        <Text render={HEADING_1} variant="displaySmall">
          SplitButton
        </Text>
        <Text render={PARAGRAPH} tone="muted" variant="bodyLarge">
          An action, and a menu of alternatives beside it.
        </Text>
      </header>

      <Separator />

      <section {...stylex.props(styles.section)}>
        <div {...stylex.props(styles.intro)}>
          <Text render={HEADING_2} variant="titleLarge">
            Variants
          </Text>
          <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
            Button&apos;s four styles with a container. The two halves meet 2px
            apart at a tighter corner, which opens out while either is hovered,
            focused or pressed.
          </Text>
        </div>
        <div {...stylex.props(styles.row)}>
          <SplitButton variant="filled">{HALVES}</SplitButton>
          <SplitButton variant="tonal">{HALVES}</SplitButton>
          <SplitButton variant="elevated">{HALVES}</SplitButton>
          <SplitButton variant="outlined">{HALVES}</SplitButton>
        </div>
      </section>

      <Separator />

      <section {...stylex.props(styles.section)}>
        <div {...stylex.props(styles.intro)}>
          <Text render={HEADING_2} variant="titleLarge">
            Sizes
          </Text>
          <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
            Button&apos;s sizes, each with the page&apos;s own padding, inner
            corner and chevron.
          </Text>
        </div>
        <div {...stylex.props(styles.row)}>
          <SplitButton size="xs">{HALVES}</SplitButton>
          <SplitButton size="md">{HALVES}</SplitButton>
          <SplitButton size="lg">{HALVES}</SplitButton>
          <SplitButton size="xl">{HALVES}</SplitButton>
        </div>
      </section>
    </div>
  ),
}

const Default: Story = {}

// The menu open: the chevron centred and the inner corner rounded off.
const Open: Story = {
  args: {
    children: [
      <SplitButton.Action key="action">Label</SplitButton.Action>,
      <SplitButton.Menu aria-label="More options" defaultOpen key="menu">
        <Menu.Item id="first">First item</Menu.Item>
        <Menu.Item id="second">Second item</Menu.Item>
        <Menu.Item id="third">Third item</Menu.Item>
      </SplitButton.Menu>,
    ],
  },
  parameters: { docs: { story: { height: '320px', inline: false } } },
  render: (args) => (
    <div {...stylex.props(styles.open)}>
      <SplitButton {...args} />
    </div>
  ),
}

export { Default, Open, Overview }

export default meta
