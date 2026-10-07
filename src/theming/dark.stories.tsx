// The library's own dark theme, run through the accessibility check the
// Vitest storybook project gives every story. Every other story renders in
// the light theme the toolbar opens on, and the dark one reached Chromatic
// only as a snapshot mode, which compares pixels rather than contrast — so a
// dark role pair below AA shipped with every check green. The showcase is the
// whole library at once, which makes it the page to check.
//
// A check rather than a page, so it is hidden from the sidebar (`!dev`) and
// from Chromatic (`disableSnapshot`): what the dark theme looks like is
// already every story's dark snapshot. `globals` pins the theme for the
// story whatever the toolbar says, as the demo schemes' files do.

import type { Meta, StoryObj } from '@storybook/react-vite'

import Showcase from './showcase'

const meta = {
  args: { name: 'dark' },
  component: Showcase,
  globals: { theme: 'dark' },
  parameters: {
    chromatic: { disableSnapshot: true },
  },
  tags: ['!autodocs', '!dev'],
  title: 'Theming/Dark',
} satisfies Meta<typeof Showcase>

type Story = StoryObj<typeof meta>

// Named after the entry, as the schemes' own stories are.
const Dark: Story = {}

export { Dark }

export default meta
