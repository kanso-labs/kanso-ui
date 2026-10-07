import type { Meta, StoryObj } from '@storybook/react-vite'

import { expect, waitFor } from 'storybook/test'

import Menu from '.'
import Button from '../button'
import Keycap from '../keycap'

// Hoisted so neither the keys nor the slots are new values on every render,
// which is what react-perf's array and JSX rules are after.
const SECOND = ['second']
const CUT = <Keycap>⌘X</Keycap>
const COPY = <Keycap>⌘C</Keycap>

const meta = {
  component: Menu,
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

export { Default, Loading, Sections, Submenu }

export default meta
