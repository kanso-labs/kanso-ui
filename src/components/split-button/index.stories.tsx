import type { Meta, StoryObj } from '@storybook/react-vite'

import * as stylex from '@stylexjs/stylex'

import SplitButton from '.'
import Menu from '../menu'

const styles = stylex.create({
  // Room under the pair for its menu to open into.
  open: {
    minBlockSize: '240px',
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

export { Default, Open }

export default meta
