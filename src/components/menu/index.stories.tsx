import type { Meta, StoryObj } from '@storybook/react-vite'

import * as stylex from '@stylexjs/stylex'

import Menu from '.'
import { spacing } from '../../tokens/design.tokens.stylex'
import Button from '../button'
import Keycap from '../keycap'
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

// Hoisted so neither the keys nor the slots are new values on every render,
// which is what react-perf's array and JSX rules are after.
const SECOND = ['second']
const CUT = <Keycap>⌘X</Keycap>
const COPY = <Keycap>⌘C</Keycap>
const PASTE = <Keycap>⌘V</Keycap>

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
    // Room under the last row so an open menu has somewhere to go.
    paddingBlockEnd: spacing.xxxl,
    paddingBlockStart: spacing.xl,
    paddingInline: spacing.xl,
  },
  row: {
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

const meta = {
  component: Menu,
  title: 'Components/Menu',
} satisfies Meta<typeof Menu>

type Story = StoryObj<typeof meta>

const Overview: Story = {
  render: () => (
    <div {...stylex.props(styles.page)}>
      <header {...stylex.props(styles.header)}>
        <Text render={HEADING_1} variant="displaySmall">
          Menu
        </Text>
        <Text render={PARAGRAPH} tone="muted" variant="bodyLarge">
          A list of actions opened from a control.
        </Text>
      </header>

      <Separator />

      <section {...stylex.props(styles.section)}>
        <div {...stylex.props(styles.intro)}>
          <Text render={HEADING_2} variant="titleLarge">
            Actions
          </Text>
          <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
            A Button or IconButton placed directly inside Menu opens it.
            Shortcuts go through React Aria&apos;s keyboard slot, so a screen
            reader announces them apart from the label.
          </Text>
        </div>
        <div {...stylex.props(styles.row)}>
          <Menu>
            <Button variant="outlined">Actions</Button>
            <Menu.Content>
              <Menu.Item id="cut" shortcut={CUT}>
                Cut
              </Menu.Item>
              <Menu.Item id="copy" shortcut={COPY}>
                Copy
              </Menu.Item>
              <Menu.Item id="paste" shortcut={PASTE}>
                Paste
              </Menu.Item>
              <Menu.Separator />
              <Menu.Item id="delete" isDisabled>
                Delete
              </Menu.Item>
            </Menu.Content>
          </Menu>
        </div>
      </section>

      <Separator />

      <section {...stylex.props(styles.section)}>
        <div {...stylex.props(styles.intro)}>
          <Text render={HEADING_2} variant="titleLarge">
            Sections and selection
          </Text>
          <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
            A section groups items under a heading. A menu that chooses rather
            than acts takes a selection mode, and a selected item draws on
            tertiary container, which is what the page gives it.
          </Text>
        </div>
        <div {...stylex.props(styles.row)}>
          <Menu>
            <Button variant="outlined">Sort</Button>
            <Menu.Content defaultSelectedKeys={SECOND} selectionMode="single">
              <Menu.Section header="Order">
                <Menu.Item id="first">Ascending</Menu.Item>
                <Menu.Item id="second">Descending</Menu.Item>
              </Menu.Section>
              <Menu.Separator />
              <Menu.Section header="Field">
                <Menu.Item id="third">Name</Menu.Item>
                <Menu.Item id="fourth">Date</Menu.Item>
              </Menu.Section>
            </Menu.Content>
          </Menu>
        </div>
      </section>

      <Separator />

      <section {...stylex.props(styles.section)}>
        <div {...stylex.props(styles.intro)}>
          <Text render={HEADING_2} variant="titleLarge">
            Submenus
          </Text>
          <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
            An item that opens a menu of its own draws the chevron itself —
            React Aria reports it, so the call site does not say so twice. Wrap
            the item and the menu it opens in Menu.Submenu.
          </Text>
        </div>
        <div {...stylex.props(styles.row)}>
          <Menu>
            <Button variant="outlined">Share</Button>
            <Menu.Content>
              <Menu.Item id="link">Copy link</Menu.Item>
              <Menu.Submenu>
                <Menu.Item id="send">Send to</Menu.Item>
                <Menu.Content>
                  <Menu.Item id="ada">Ada Lovelace</Menu.Item>
                  <Menu.Item id="grace">Grace Hopper</Menu.Item>
                </Menu.Content>
              </Menu.Submenu>
              <Menu.Separator />
              <Menu.Item id="export">Export</Menu.Item>
            </Menu.Content>
          </Menu>
        </div>
      </section>
    </div>
  ),
}

// Open on load, since a closed menu renders nothing for Chromatic to compare.
const Default: Story = {
  render: (args) => (
    <Menu {...args} defaultOpen>
      <Button variant="outlined">Actions</Button>
      <Menu.Content>
        <Menu.Item id="cut" shortcut={CUT}>
          Cut
        </Menu.Item>
        <Menu.Item id="copy" shortcut={COPY}>
          Copy
        </Menu.Item>
        <Menu.Separator />
        <Menu.Item id="delete" isDisabled>
          Delete
        </Menu.Item>
      </Menu.Content>
    </Menu>
  ),
}

const Sections: Story = {
  render: (args) => (
    <Menu {...args} defaultOpen>
      <Button variant="outlined">Sort</Button>
      <Menu.Content defaultSelectedKeys={SECOND} selectionMode="single">
        <Menu.Section header="Order">
          <Menu.Item id="first">Ascending</Menu.Item>
          <Menu.Item id="second">Descending</Menu.Item>
        </Menu.Section>
        <Menu.Separator />
        <Menu.Section header="Field">
          <Menu.Item id="third">Name</Menu.Item>
        </Menu.Section>
      </Menu.Content>
    </Menu>
  ),
}

const Submenu: Story = {
  render: (args) => (
    <Menu {...args} defaultOpen>
      <Button variant="outlined">Share</Button>
      <Menu.Content>
        <Menu.Item id="link">Copy link</Menu.Item>
        <Menu.Submenu>
          <Menu.Item id="send">Send to</Menu.Item>
          <Menu.Content>
            <Menu.Item id="ada">Ada Lovelace</Menu.Item>
          </Menu.Content>
        </Menu.Submenu>
      </Menu.Content>
    </Menu>
  ),
}

const Loading: Story = {
  render: (args) => (
    <Menu {...args} defaultOpen>
      <Button variant="outlined">Actions</Button>
      <Menu.Content>
        <Menu.Item id="first">First item</Menu.Item>
        <Menu.Item id="second">Second item</Menu.Item>
        <Menu.LoadMore isLoading />
      </Menu.Content>
    </Menu>
  ),
}

export { Default, Loading, Overview, Sections, Submenu }

export default meta
