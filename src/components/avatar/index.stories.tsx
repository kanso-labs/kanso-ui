import type { Meta, StoryObj } from '@storybook/react-vite'

import Avatar from '.'

// An inline SVG rather than a hosted image: a story that reaches the network
// would make the Chromatic snapshot depend on someone else's uptime, and the
// point here is only that a photo fills the circle and crops to it.
const PHOTO =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 80'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0' y1='0' x2='1' y2='1'%3E%3Cstop offset='0' stop-color='%236750a4'/%3E%3Cstop offset='1' stop-color='%23efb8c8'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='120' height='80' fill='url(%23g)'/%3E%3Ccircle cx='60' cy='34' r='16' fill='%23fffbfe' opacity='.9'/%3E%3Cpath d='M28 80c6-18 18-26 32-26s26 8 32 26z' fill='%23fffbfe' opacity='.9'/%3E%3C/svg%3E"

const meta = {
  args: {
    name: 'Ada Lovelace',
  },
  component: Avatar,
  title: 'Components/Avatar',
} satisfies Meta<typeof Avatar>

type Story = StoryObj<typeof meta>

const Default: Story = {}

// Its own story because the fallback is a behaviour rather than a variant:
// clearing `src` in the Controls panel is what shows the initials taking over.
const WithPhoto: Story = {
  args: {
    size: 'lg',
    src: PHOTO,
  },
}

export { Default, WithPhoto }

export default meta
