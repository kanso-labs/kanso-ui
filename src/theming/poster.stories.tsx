// See editorial.stories.tsx for what the three fields do and why each scheme
// gets a file of its own.

import type { Meta, StoryObj } from '@storybook/react-vite'

import Showcase from './showcase'

const meta = {
  args: { name: 'poster' },
  component: Showcase,
  globals: { theme: 'poster' },
  parameters: {
    chromatic: { modes: { dark: { disable: true } } },
  },
  tags: ['!autodocs'],
  title: 'Theming/Poster',
} satisfies Meta<typeof Showcase>

type Story = StoryObj<typeof meta>

// Named after the entry rather than 'Overview': Storybook folds a component
// holding a single story of the same name into one sidebar leaf, so this is a
// scheme in the list instead of a disclosure triangle with one child.
const Poster: Story = {
  parameters: { chromatic: { disableSnapshot: true } },
}

// The page in two halves for Chromatic, as in editorial.stories.tsx.
const FirstHalf: Story = {
  args: { half: 'first' },
  tags: ['!dev'],
}

const SecondHalf: Story = {
  args: { half: 'second' },
  tags: ['!dev'],
}

export { FirstHalf, Poster, SecondHalf }

export default meta
