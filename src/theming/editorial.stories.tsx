// One scheme per sidebar entry, which is what makes Theming a section rather
// than a page with five stories under it. The whole file is the scheme: the
// page itself is `showcase.tsx`, shared verbatim by all five.
//
// `globals` pins the toolbar's Theme control for the story, and it beats both
// the toolbar and a Chromatic mode's own globals — so the page renders in this
// scheme whatever is asked of it. That also makes the project's light and dark
// modes redundant here, hence the one that is turned off: a scheme costs one
// snapshot rather than two.
//
// `args` names the same scheme again, for the header the page draws from it.
// The two are set together because the page says which theme it is showing.

import type { Meta, StoryObj } from '@storybook/react-vite'

import Showcase from './showcase'

const meta = {
  args: { name: 'editorial' },
  component: Showcase,
  globals: { theme: 'editorial' },
  parameters: {
    chromatic: { modes: { dark: { disable: true } } },
  },
  title: 'Theming/Editorial',
} satisfies Meta<typeof Showcase>

type Story = StoryObj<typeof meta>

// Named after the entry rather than 'Overview': Storybook folds a component
// holding a single story of the same name into one sidebar leaf, so this is a
// scheme in the list instead of a disclosure triangle with one child.
const Editorial: Story = {}

export { Editorial }

export default meta
