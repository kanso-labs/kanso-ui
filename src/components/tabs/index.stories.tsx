import type { Meta, StoryObj } from '@storybook/react-vite'

import * as stylex from '@stylexjs/stylex'

import Tabs from '.'
import { spacing } from '../../tokens/design.tokens.stylex'
import Text from '../text'

const PARAGRAPH = <p />

const styles = stylex.create({
  // A panel beside a vertical bar, given a height so the bar has a length to
  // run, and set off from the divider as the horizontal one is from below it.
  besideBar: {
    minBlockSize: '200px',
    paddingInlineStart: spacing.lg,
  },
  panel: {
    paddingBlockStart: spacing.md,
  },
  // A phone's width, narrower than either long label below on one line.
  phone: {
    inlineSize: '360px',
    maxInlineSize: '100%',
  },
  // Enough lines that the box has somewhere to grow to.
  tall: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.sm,
  },
})

// An icon slot takes any node; a plain glyph keeps the sample generic. The
// library's own glyphs are private to it, so a story draws its own, `1em`
// square as the README asks.
const DOT = (
  <svg
    aria-hidden="true"
    fill="currentColor"
    height="1em"
    viewBox="0 0 24 24"
    width="1em"
  >
    <circle cx="12" cy="12" r="6" />
  </svg>
)

// More tabs than a phone's width has room for at their labels' widths.
const SCROLLING = [
  ['first', 'First item'],
  ['second', 'Second item'],
  ['third', 'Third item'],
  ['fourth', 'Fourth item'],
  ['fifth', 'Fifth item'],
  ['sixth', 'Sixth item'],
] as const

const meta = {
  args: {
    defaultSelectedKey: 'first',
  },
  component: Tabs,
  title: 'Components/Tabs',
} satisfies Meta<typeof Tabs>

type Story = StoryObj<typeof meta>

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

// A primary bar whose tabs carry icons, which grows it to 64dp, with a badge
// on one of them.
const WithIcons: Story = {
  render: (args) => (
    <Tabs {...args}>
      <Tabs.List>
        <Tabs.Tab icon={DOT} id="first">
          First item
        </Tabs.Tab>
        <Tabs.Tab
          aria-label="Second item, 3 new"
          badge={3}
          icon={DOT}
          id="second"
        >
          Second item
        </Tabs.Tab>
        <Tabs.Tab icon={DOT} id="third">
          Third item
        </Tabs.Tab>
      </Tabs.List>
    </Tabs>
  ),
}

// The strip under a primary bar.
// A bar with more tabs than the room has sections for, opened on one the
// bar has to scroll to.
const Scrollable: Story = {
  args: { defaultSelectedKey: 'fifth', layout: 'scrollable' },
  render: (args) => (
    <div {...stylex.props(styles.phone)}>
      <Tabs {...args}>
        <Tabs.List>
          {SCROLLING.map(([id, label]) => (
            <Tabs.Tab id={id} key={id}>
              {label}
            </Tabs.Tab>
          ))}
        </Tabs.List>
      </Tabs>
    </div>
  ),
}

// The bar on its side, beside its panels.
const Vertical: Story = {
  args: { orientation: 'vertical' },
  render: (args) => (
    <Tabs {...args}>
      <Tabs.List>
        <Tabs.Tab id="first">First item</Tabs.Tab>
        <Tabs.Tab id="second">Second item</Tabs.Tab>
        <Tabs.Tab id="third">Third item</Tabs.Tab>
      </Tabs.List>
      <Tabs.Panel {...stylex.props(styles.panel, styles.besideBar)} id="first">
        <Text tone="muted" variant="bodyMedium">
          The first panel.
        </Text>
      </Tabs.Panel>
      <Tabs.Panel {...stylex.props(styles.panel, styles.besideBar)} id="second">
        <Text tone="muted" variant="bodyMedium">
          The second panel.
        </Text>
      </Tabs.Panel>
      <Tabs.Panel {...stylex.props(styles.panel, styles.besideBar)} id="third">
        <Text tone="muted" variant="bodyMedium">
          The third panel.
        </Text>
      </Tabs.Panel>
    </Tabs>
  ),
}

const Secondary: Story = {
  args: { variant: 'secondary' },
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

// The bar on its own: tabs that filter the content below rather than
// swapping a panel.
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

// Its own story because the box around the panels is what animates, and it
// only shows when the panels are different heights.
const AnimatedPanels: Story = {
  render: (args) => (
    <Tabs {...args}>
      <Tabs.List>
        <Tabs.Tab id="first">First item</Tabs.Tab>
        <Tabs.Tab id="second">Second item</Tabs.Tab>
        <Tabs.Tab id="third">Third item</Tabs.Tab>
      </Tabs.List>
      <Tabs.Panels>
        <Tabs.Panel id="first">
          <Text render={PARAGRAPH} variant="bodyMedium">
            One line.
          </Text>
        </Tabs.Panel>
        <Tabs.Panel id="second">
          <div {...stylex.props(styles.tall)}>
            <Text render={PARAGRAPH} variant="bodyMedium">
              Several lines, so the box has somewhere to grow to.
            </Text>
            <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
              Supporting line.
            </Text>
            <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
              Supporting line.
            </Text>
          </div>
        </Tabs.Panel>
        <Tabs.Panel id="third">
          <Text render={PARAGRAPH} variant="bodyMedium">
            One line again.
          </Text>
        </Tabs.Panel>
      </Tabs.Panels>
    </Tabs>
  ),
}

// A badge sits on a primary tab's icon, and 4dp after the label where none is
// stacked over it, as here. It is hidden from assistive technology, so the tab
// says what it says in its own name.
const BadgeAfterLabel: Story = {
  render: (args) => (
    <Tabs {...args}>
      <Tabs.List>
        <Tabs.Tab id="first">First item</Tabs.Tab>
        <Tabs.Tab aria-label="Second item, new" badge id="second">
          Second item
        </Tabs.Tab>
        <Tabs.Tab id="third">Third item</Tabs.Tab>
      </Tabs.List>
    </Tabs>
  ),
}

// Disabling is a prop of one tab, which no other story sets. A disabled tab is
// announced as disabled and cannot be activated, yet the arrow keys still reach
// it: a tab you cannot reach is a tab you cannot find out is unavailable.
const DisabledTab: Story = {
  render: (args) => (
    <Tabs {...args}>
      <Tabs.List>
        <Tabs.Tab id="first">First item</Tabs.Tab>
        <Tabs.Tab id="second" isDisabled>
          Second item
        </Tabs.Tab>
        <Tabs.Tab id="third">Third item</Tabs.Tab>
      </Tabs.List>
    </Tabs>
  ),
}

// A label has its tab's equal share of the bar and no more: a longer word
// breaks inside itself, hyphenated where its language allows, and several words
// take two lines and then an ellipsis. A screen reader still reads it whole.
const LongLabels: Story = {
  render: (args) => (
    <div {...stylex.props(styles.phone)}>
      <Tabs {...args}>
        <Tabs.List>
          {/* Marked as German, which is what lets the browser hyphenate it
              where it breaks — in a German app the page's own language does
              that. */}
          <Tabs.Tab id="first">
            <span lang="de">Unterstützungszeile</span>
          </Tabs.Tab>
          <Tabs.Tab id="second">
            A label long enough that it has nowhere left to go on one line
          </Tabs.Tab>
          <Tabs.Tab id="third">Third item</Tabs.Tab>
        </Tabs.List>
      </Tabs>
    </div>
  ),
}

export {
  AnimatedPanels,
  BadgeAfterLabel,
  Default,
  DisabledTab,
  LongLabels,
  Scrollable,
  Secondary,
  Vertical,
  WithIcons,
  WithoutPanels,
}

export default meta
