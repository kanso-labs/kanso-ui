import type { Meta, StoryObj } from '@storybook/react-vite'

import * as stylex from '@stylexjs/stylex'

import Select from '.'
import { SearchGlyph } from '../../glyphs'
import ListBox from '../list-box'

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
  // Sized in `em`, so the icon takes the slot's 24.
  icon: {
    blockSize: '1em',
    inlineSize: '1em',
  },
  width: {
    inlineSize: '320px',
  },
})

// The library's own glyphs stand in for an icon set, so the stories stay a
// demonstration of the field alone.
const LEADING_ICON = <SearchGlyph {...stylex.props(styles.icon)} />

const meta = {
  args: {
    label: 'Label',
    options: OPTIONS,
  },
  component: Select,
  title: 'Components/Select',
} satisfies Meta<typeof Select<object>>

type Story = StoryObj<typeof meta>

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
  parameters: { docs: { story: { height: '360px', inline: false } } },
  render: Default.render,
}

const WithLeadingIcon: Story = {
  args: { leadingIcon: LEADING_ICON },
  render: Default.render,
}

// Its own story because the list is a ListBox, so it takes sections with
// headings as well as plain options. Open on load, since the groups cannot be
// seen until it is.
const Grouped: Story = {
  args: { defaultOpen: true, options: GROUPED },
  parameters: { docs: { story: { height: '360px', inline: false } } },
  render: Default.render,
}

export {
  Chosen,
  Default,
  Disabled,
  Grouped,
  Invalid,
  Open,
  Outlined,
  WithDescription,
  WithLeadingIcon,
}

export default meta
