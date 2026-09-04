import type { Meta, StoryObj } from '@storybook/react-vite'

import * as stylex from '@stylexjs/stylex'

import Tabs from '.'
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
  panel: {
    paddingBlockStart: spacing.md,
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.lg,
  },
})

const meta = {
  args: {
    defaultSelectedKey: 'first',
  },
  component: Tabs,
  title: 'Components/Tabs',
} satisfies Meta<typeof Tabs>

type Story = StoryObj<typeof meta>

const Overview: Story = {
  render: () => (
    <div {...stylex.props(styles.page)}>
      <header {...stylex.props(styles.header)}>
        <Text render={HEADING_1} variant="displaySmall">
          Tabs
        </Text>
        <Text render={PARAGRAPH} tone="muted" variant="bodyLarge">
          A row of pills and the panels they switch between.
        </Text>
      </header>

      <Separator />

      <section {...stylex.props(styles.section)}>
        <div {...stylex.props(styles.intro)}>
          <Text render={HEADING_2} variant="titleLarge">
            Selection
          </Text>
          <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
            The active tab takes a tinted pill rather than the underline
            Material draws — a row of pills reads as a segmented control inside
            a section, which is what the source design uses.
          </Text>
        </div>
        <Tabs defaultSelectedKey="first">
          <Tabs.List>
            <Tabs.Tab id="first">First item</Tabs.Tab>
            <Tabs.Tab id="second">Second item</Tabs.Tab>
            <Tabs.Tab id="third">Third item</Tabs.Tab>
          </Tabs.List>
          <Tabs.Panel {...stylex.props(styles.panel)} id="first">
            <Text tone="muted" variant="bodyMedium">
              The first panel.
            </Text>
          </Tabs.Panel>
          <Tabs.Panel {...stylex.props(styles.panel)} id="second">
            <Text tone="muted" variant="bodyMedium">
              The second panel.
            </Text>
          </Tabs.Panel>
          <Tabs.Panel {...stylex.props(styles.panel)} id="third">
            <Text tone="muted" variant="bodyMedium">
              The third panel.
            </Text>
          </Tabs.Panel>
        </Tabs>
      </section>

      <Separator />

      <section {...stylex.props(styles.section)}>
        <div {...stylex.props(styles.intro)}>
          <Text render={HEADING_2} variant="titleLarge">
            Disabled
          </Text>
          <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
            A disabled tab is announced as disabled and cannot be activated. The
            arrow keys still move focus onto it, which is what the ARIA pattern
            asks for — a tab you cannot reach is a tab you cannot find out is
            unavailable.
          </Text>
        </div>
        <Tabs defaultSelectedKey="first">
          <Tabs.List>
            <Tabs.Tab id="first">First item</Tabs.Tab>
            <Tabs.Tab id="second" isDisabled>
              Second item
            </Tabs.Tab>
            <Tabs.Tab id="third">Third item</Tabs.Tab>
          </Tabs.List>
        </Tabs>
      </section>
    </div>
  ),
}

const Default: Story = {
  render: (args) => (
    <Tabs {...args}>
      <Tabs.List>
        <Tabs.Tab id="first">First item</Tabs.Tab>
        <Tabs.Tab id="second">Second item</Tabs.Tab>
        <Tabs.Tab id="third">Third item</Tabs.Tab>
      </Tabs.List>
      <Tabs.Panel {...stylex.props(styles.panel)} id="first">
        <Text tone="muted" variant="bodyMedium">
          The first panel.
        </Text>
      </Tabs.Panel>
      <Tabs.Panel {...stylex.props(styles.panel)} id="second">
        <Text tone="muted" variant="bodyMedium">
          The second panel.
        </Text>
      </Tabs.Panel>
      <Tabs.Panel {...stylex.props(styles.panel)} id="third">
        <Text tone="muted" variant="bodyMedium">
          The third panel.
        </Text>
      </Tabs.Panel>
    </Tabs>
  ),
}

// The strip on its own, for the case the design actually draws: tabs that
// filter the content below rather than swapping a panel.
const WithoutPanels: Story = {
  render: (args) => (
    <Tabs {...args}>
      <Tabs.List>
        <Tabs.Tab id="first">First item</Tabs.Tab>
        <Tabs.Tab id="second">Second item</Tabs.Tab>
        <Tabs.Tab id="third">Third item</Tabs.Tab>
      </Tabs.List>
    </Tabs>
  ),
}

export { Default, Overview, WithoutPanels }

export default meta
