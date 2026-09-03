// See editorial.stories.tsx for what the three fields do and why each scheme
// gets a file of its own.

import type { Meta, StoryObj } from '@storybook/react-vite'

import Showcase from './showcase'

const meta = {
  args: { name: 'nordic' },
  component: Showcase,
  globals: { theme: 'nordic' },
  parameters: {
    chromatic: { modes: { dark: { disable: true } } },
  },
  title: 'Theming/Nordic',
} satisfies Meta<typeof Showcase>

type Story = StoryObj<typeof meta>

// Named after the entry rather than 'Overview': Storybook folds a component
// holding a single story of the same name into one sidebar leaf, so this is a
// scheme in the list instead of a disclosure triangle with one child.
const Nordic: Story = {}

export { Nordic }

export default meta
