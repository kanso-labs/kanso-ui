import type { Meta, StoryObj } from '@storybook/react-vite'

import * as stylex from '@stylexjs/stylex'

import SearchView from '.'
import { breakpointModes } from '../../../.storybook/modes'
import IconButton from '../icon-button'
import ListBox from '../list-box'

const styles = stylex.create({
  // Room under the trigger for the docked view to open into.
  frame: {
    minBlockSize: '480px',
  },
  icon: {
    blockSize: '1em',
    inlineSize: '1em',
  },
})

// What opens the view, and the results it narrows. Shared by every story,
// so each one differs only in how it is opened and at what width.
function Search({ defaultOpen = false }: { defaultOpen?: boolean }) {
  return (
    <SearchView defaultOpen={defaultOpen}>
      <IconButton aria-label="Search">
        <SearchIcon />
      </IconButton>
      <SearchView.Content label="Search" placeholder="Supporting text">
        <ListBox aria-label="Results">
          <ListBox.Item id="first" supporting="Supporting line">
            First item
          </ListBox.Item>
          <ListBox.Item id="second" supporting="Supporting line">
            Second item
          </ListBox.Item>
          <ListBox.Item id="third" supporting="Supporting line">
            Third item
          </ListBox.Item>
        </ListBox>
      </SearchView.Content>
    </SearchView>
  )
}

// A plain magnifier rather than an icon set, so the stories show the view
// alone. Drawn `1em` square in `currentColor`, as the README asks of every
// icon.
function SearchIcon() {
  return (
    <svg
      aria-hidden="true"
      fill="currentColor"
      viewBox="0 0 24 24"
      {...stylex.props(styles.icon)}
    >
      <path d="M15.5 14h-.79l-.28-.27A6.47 6.47 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16a6.47 6.47 0 0 0 4.23-1.57l.27.28v.79l5 4.99L20.49 19zm-6 0a4.5 4.5 0 1 1 0-9 4.5 4.5 0 0 1 0 9" />
    </svg>
  )
}

const meta = {
  component: SearchView,
  title: 'Components/SearchView',
} satisfies Meta<typeof SearchView>

type Story = StoryObj<typeof meta>

// The docked view, which a wide window draws.
const Default: Story = {
  parameters: { docs: { story: { height: '420px', inline: false } } },
  render: () => (
    <div {...stylex.props(styles.frame)}>
      <Search defaultOpen />
    </div>
  ),
}

// The full-screen view, which a compact window draws. Captured at a compact
// width, since a wide one draws the docked view instead.
const Compact: Story = {
  parameters: {
    chromatic: { modes: { compact: breakpointModes.compact } },
    docs: { story: { height: '420px', inline: false } },
  },
  render: () => <Search defaultOpen />,
}

export { Compact, Default }

export default meta
