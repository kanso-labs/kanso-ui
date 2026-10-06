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
  // A panel beside a vertical bar, given a height so the bar has a length to
  // run, and set off from the divider as the horizontal one is from below it.
  besideBar: {
    minBlockSize: '200px',
    paddingInlineStart: spacing.lg,
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
  panel: {
    paddingBlockStart: spacing.md,
  },
  // A phone's width, narrower than either long label below on one line.
  phone: {
    inlineSize: '360px',
    maxInlineSize: '100%',
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.lg,
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

const Overview: Story = {
  render: () => (
    <div {...stylex.props(styles.page)}>
      <header {...stylex.props(styles.header)}>
        <Text render={HEADING_1} variant="displaySmall">
          Tabs
        </Text>
        <Text render={PARAGRAPH} tone="muted" variant="bodyLarge">
          A tab bar and the panels it switches between.
        </Text>
      </header>

      <Separator />

      <section {...stylex.props(styles.section)}>
        <div {...stylex.props(styles.intro)}>
          <Text render={HEADING_2} variant="titleLarge">
            Selection
          </Text>
          <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
            The bar divides its width into equal sections and draws a divider
            along its bottom edge. The active tab&apos;s label takes the primary
            role and an indicator underneath it, as wide as the label and
            rounded along its top; an inactive label sits in on surface variant.
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
            Icons and badges
          </Text>
          <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
            A tab given an icon stacks it over the label, and the bar grows to
            64dp. A badge sits on the icon, or 4dp after a label with no icon
            over it. The badge is hidden from assistive technology, so its tab
            says what it says in its name.
          </Text>
        </div>
        <Tabs defaultSelectedKey="first">
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
        <Tabs defaultSelectedKey="first">
          <Tabs.List>
            <Tabs.Tab id="first">First item</Tabs.Tab>
            <Tabs.Tab aria-label="Second item, new" badge id="second">
              Second item
            </Tabs.Tab>
            <Tabs.Tab id="third">Third item</Tabs.Tab>
          </Tabs.List>
        </Tabs>
      </section>

      <Separator />

      <section {...stylex.props(styles.section)}>
        <div {...stylex.props(styles.intro)}>
          <Text render={HEADING_2} variant="titleLarge">
            Secondary
          </Text>
          <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
            The strip under a primary bar. Its active label stays on surface,
            and the indicator is a 2dp line across the whole tab. An icon sits
            before the label, so the strip keeps its 48dp.
          </Text>
        </div>
        <Tabs defaultSelectedKey="first" variant="secondary">
          <Tabs.List>
            <Tabs.Tab id="first">First item</Tabs.Tab>
            <Tabs.Tab id="second">Second item</Tabs.Tab>
            <Tabs.Tab id="third">Third item</Tabs.Tab>
          </Tabs.List>
        </Tabs>
        <Tabs defaultSelectedKey="second" variant="secondary">
          <Tabs.List>
            <Tabs.Tab icon={DOT} id="first">
              First item
            </Tabs.Tab>
            <Tabs.Tab icon={DOT} id="second">
              Second item
            </Tabs.Tab>
            <Tabs.Tab
              aria-label="Third item, 3 new"
              badge={3}
              icon={DOT}
              id="third"
            >
              Third item
            </Tabs.Tab>
          </Tabs.List>
        </Tabs>
      </section>

      <Separator />

      <section {...stylex.props(styles.section)}>
        <div {...stylex.props(styles.intro)}>
          <Text render={HEADING_2} variant="titleLarge">
            Scrollable
          </Text>
          <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
            `layout="scrollable"` gives each tab its label&apos;s width, between
            72dp and 264dp, in a bar that scrolls without a scrollbar. The tabs
            cut off at the edge say there is more, and the selected tab is
            scrolled into view. Equal sections stay the default.
          </Text>
        </div>
        <div {...stylex.props(styles.phone)}>
          <Tabs defaultSelectedKey="fifth" layout="scrollable">
            <Tabs.List>
              {SCROLLING.map(([id, label]) => (
                <Tabs.Tab id={id} key={id}>
                  {label}
                </Tabs.Tab>
              ))}
            </Tabs.List>
          </Tabs>
        </div>
      </section>

      <Separator />

      <section {...stylex.props(styles.section)}>
        <div {...stylex.props(styles.intro)}>
          <Text render={HEADING_2} variant="titleLarge">
            Vertical
          </Text>
          <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
            `orientation="vertical"` stands the bar beside its panels. The page
            draws no vertical tabs, so this is the horizontal bar on its side:
            the divider and the indicator move to the bar&apos;s inline end, and
            the up and down arrows move between the tabs.
          </Text>
        </div>
        <Tabs defaultSelectedKey="first" orientation="vertical">
          <Tabs.List>
            <Tabs.Tab id="first">First item</Tabs.Tab>
            <Tabs.Tab id="second">Second item</Tabs.Tab>
            <Tabs.Tab id="third">Third item</Tabs.Tab>
          </Tabs.List>
          <Tabs.Panel
            {...stylex.props(styles.panel, styles.besideBar)}
            id="first"
          >
            <Text tone="muted" variant="bodyMedium">
              The first panel.
            </Text>
          </Tabs.Panel>
          <Tabs.Panel
            {...stylex.props(styles.panel, styles.besideBar)}
            id="second"
          >
            <Text tone="muted" variant="bodyMedium">
              The second panel.
            </Text>
          </Tabs.Panel>
          <Tabs.Panel
            {...stylex.props(styles.panel, styles.besideBar)}
            id="third"
          >
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

      <Separator />

      <section {...stylex.props(styles.section)}>
        <div {...stylex.props(styles.intro)}>
          <Text render={HEADING_2} variant="titleLarge">
            Long labels
          </Text>
          <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
            A label has its tab&apos;s equal share of the bar and no more. A
            word longer than that breaks inside itself, hyphenated where its
            language allows, and a label of several words takes two lines and
            then ends in an ellipsis, so neither runs into its neighbours or out
            of the bar. A screen reader still reads the whole label.
          </Text>
        </div>
        <div {...stylex.props(styles.phone)}>
          <Tabs defaultSelectedKey="first">
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

export {
  AnimatedPanels,
  Default,
  Overview,
  Scrollable,
  Secondary,
  Vertical,
  WithIcons,
  WithoutPanels,
}

export default meta
