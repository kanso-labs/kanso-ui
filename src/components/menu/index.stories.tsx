import type { Meta, StoryObj } from '@storybook/react-vite'

import * as stylex from '@stylexjs/stylex'
import { expect, waitFor } from 'storybook/test'

import Menu from '.'
import Button from '../button'
import Keycap from '../keycap'

const styles = stylex.create({
  // An item's icon, at the menus page's 24dp. A row sets no icon size of its
  // own, so the size is the story's to give.
  glyph: {
    blockSize: '24px',
    display: 'block',
    inlineSize: '24px',
  },
})

// A plain glyph per item, drawn by the story: the library's own are private
// to it.
function Glyph({ path }: { path: string }) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
      {...stylex.props(styles.glyph)}
    >
      <path d={path} />
    </svg>
  )
}

// Hoisted so neither the keys nor the slots are new values on every render,
// which is what react-perf's array and JSX rules are after.
const SECOND = ['second']
const FIRST_AND_THIRD = ['first', 'third']
const CUT = <Keycap>⌘X</Keycap>
const COPY = <Keycap>⌘C</Keycap>
const KEY_1 = <Keycap>⌘1</Keycap>
const KEY_2 = <Keycap>⌘2</Keycap>
const KEY_3 = <Keycap>⌘3</Keycap>
const KEY_4 = <Keycap>⌘4</Keycap>
const SQUARE = <Glyph path="M5 5h14v14H5Z" />
const CIRCLE = <Glyph path="M12 5a7 7 0 1 1 0 14 7 7 0 0 1 0-14Z" />
const TRIANGLE = <Glyph path="M12 5 19 19H5Z" />
const DIAMOND = <Glyph path="M12 4 20 12 12 20 4 12Z" />
const OUTWARD = <Glyph path="M8 16 16 8m-7 0h7v7" />

const meta = {
  component: Menu,
  subcomponents: {
    'Menu.Content': Menu.Content,
    'Menu.Item': Menu.Item,
    'Menu.LoadMore': Menu.LoadMore,
    'Menu.Section': Menu.Section,
    'Menu.Separator': Menu.Separator,
    'Menu.Submenu': Menu.Submenu,
  },
  title: 'Components/Menu',
} satisfies Meta<typeof Menu>

type Story = StoryObj<typeof meta>

// Open on load, since a closed menu renders nothing for Chromatic to compare.
const Default: Story = {
  parameters: { docs: { story: { height: '360px', inline: false } } },
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
  parameters: { docs: { story: { height: '360px', inline: false } } },
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

// Opened, so the story shows where a submenu lands: beside the item that
// opens it, at the inline end its chevron points to, rather than over the
// rest of the menu. The menus are portalled to the end of the body, outside
// the canvas, so they are found through the document.
const Submenu: Story = {
  parameters: { docs: { story: { height: '360px', inline: false } } },
  play: async ({ userEvent }) => {
    const item = await waitFor(() => {
      const found = document.querySelector('[role="menuitem"][aria-haspopup]')
      if (!(found instanceof HTMLElement)) {
        throw new Error('expected the item that opens the submenu')
      }
      return found
    })
    await userEvent.click(item)
    await waitFor(async () => {
      await expect(document.querySelectorAll('[role="menu"]')).toHaveLength(2)
    })
  },
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
  parameters: { docs: { story: { height: '360px', inline: false } } },
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

// Any number chosen at once, each marked by the check at the end of its row
// as well as the container — the check is what carries the choice where the
// container is hard to tell from the surface.
const MultipleSelection: Story = {
  parameters: { docs: { story: { height: '360px', inline: false } } },
  render: (args) => (
    <Menu {...args} defaultOpen>
      <Button variant="outlined">Label</Button>
      <Menu.Content
        defaultSelectedKeys={FIRST_AND_THIRD}
        selectionMode="multiple"
      >
        <Menu.Item id="first">First item</Menu.Item>
        <Menu.Item id="second">Second item</Menu.Item>
        <Menu.Item id="third">Third item</Menu.Item>
      </Menu.Content>
    </Menu>
  ),
}

// A shortcut follows its item. On the chosen item it takes the selected
// container's on-colour, the keycap's rule included, and on a disabled item
// it fades with the label rather than staying the darkest thing on the row.
const Shortcuts: Story = {
  parameters: { docs: { story: { height: '360px', inline: false } } },
  render: (args) => (
    <Menu {...args} defaultOpen>
      <Button variant="outlined">Label</Button>
      <Menu.Content defaultSelectedKeys={SECOND} selectionMode="single">
        <Menu.Item id="first" shortcut={KEY_1}>
          First item
        </Menu.Item>
        <Menu.Item id="second" shortcut={KEY_2}>
          Second item
        </Menu.Item>
        <Menu.Item id="third" isDisabled shortcut={KEY_3}>
          Third item
        </Menu.Item>
      </Menu.Content>
    </Menu>
  ),
}

// An item given an `href` renders as an anchor and follows it when chosen,
// drawn exactly as the items beside it are: a menu's items are all followed
// the same way, so none of them is set apart as a link.
const WithLink: Story = {
  parameters: { docs: { story: { height: '360px', inline: false } } },
  render: (args) => (
    <Menu {...args} defaultOpen>
      <Button variant="outlined">Label</Button>
      <Menu.Content>
        <Menu.Item id="first">First item</Menu.Item>
        <Menu.Item href="#second" id="second">
          Second item
        </Menu.Item>
        <Menu.Item id="third">Third item</Menu.Item>
      </Menu.Content>
    </Menu>
  ),
}

// Every slot an item has: an icon before the label, content after it, and a
// shortcut at the end. The chosen item's check takes its icon's place, so
// the label stays where it was, and the disabled item fades its icon and
// shortcut with the label.
const WithIcons: Story = {
  parameters: { docs: { story: { height: '360px', inline: false } } },
  render: (args) => (
    <Menu {...args} defaultOpen>
      <Button variant="outlined">Label</Button>
      <Menu.Content defaultSelectedKeys={SECOND} selectionMode="single">
        <Menu.Item id="first" leading={SQUARE} shortcut={KEY_1}>
          First item
        </Menu.Item>
        <Menu.Item id="second" leading={CIRCLE} shortcut={KEY_2}>
          Second item
        </Menu.Item>
        <Menu.Item id="third" leading={TRIANGLE} trailing={OUTWARD}>
          Third item
        </Menu.Item>
        <Menu.Item id="fourth" isDisabled leading={DIAMOND} shortcut={KEY_4}>
          Fourth item
        </Menu.Item>
      </Menu.Content>
    </Menu>
  ),
}

// A label longer than the menu is wide wraps inside the surface's 280dp, and
// the row grows to hold it rather than running under its shortcut.
const LongLabel: Story = {
  parameters: { docs: { story: { height: '360px', inline: false } } },
  render: (args) => (
    <Menu {...args} defaultOpen>
      <Button variant="outlined">Label</Button>
      <Menu.Content>
        <Menu.Item id="first" shortcut={KEY_1}>
          First item
        </Menu.Item>
        <Menu.Item id="second" shortcut={KEY_2}>
          Second item, with a label long enough to wrap onto another line
        </Menu.Item>
        <Menu.Item id="third" shortcut={KEY_3}>
          Third item
        </Menu.Item>
      </Menu.Content>
    </Menu>
  ),
}

export {
  Default,
  Loading,
  LongLabel,
  MultipleSelection,
  Sections,
  Shortcuts,
  Submenu,
  WithIcons,
  WithLink,
}

export default meta
