import type { Meta, StoryObj } from '@storybook/react-vite'

import * as stylex from '@stylexjs/stylex'

import type { AvatarProps } from '.'

import Avatar from '.'
import { spacing } from '../../tokens/design.tokens.stylex'

const TONES = [
  'primary',
  'secondary',
  'tertiary',
  'positive',
  'negative',
] as const satisfies AvatarProps['tone'][]

// An inline SVG rather than a hosted image: a story that reaches the network
// would make the Chromatic snapshot depend on someone else's uptime, and the
// point here is only that a photo fills the circle and crops to it.
const PHOTO =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 80'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0' y1='0' x2='1' y2='1'%3E%3Cstop offset='0' stop-color='%236750a4'/%3E%3Cstop offset='1' stop-color='%23efb8c8'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='120' height='80' fill='url(%23g)'/%3E%3Ccircle cx='60' cy='34' r='16' fill='%23fffbfe' opacity='.9'/%3E%3Cpath d='M28 80c6-18 18-26 32-26s26 8 32 26z' fill='%23fffbfe' opacity='.9'/%3E%3C/svg%3E"

const styles = stylex.create({
  row: {
    alignItems: 'center',
    display: 'flex',
    flexWrap: 'wrap',
    gap: spacing.lg,
  },
})

const meta = {
  args: {
    name: 'Ada Lovelace',
  },
  component: Avatar,
  title: 'Components/Avatar',
} satisfies Meta<typeof Avatar>

type Story = StoryObj<typeof meta>

// The design cycles a colour per person, so the tones are worth seeing as a
// set — that is the decision a consuming app makes with them.
const Tones: Story = {
  render: (args) => (
    <div {...stylex.props(styles.row)}>
      {TONES.map((tone) => (
        <Avatar {...args} key={tone} tone={tone} />
      ))}
    </div>
  ),
}

const Sizes: Story = {
  render: (args) => (
    <div {...stylex.props(styles.row)}>
      <Avatar {...args} size="sm" />
      <Avatar {...args} size="md" />
      <Avatar {...args} size="lg" />
    </div>
  ),
}

// Both states side by side, because what matters is that they are the same
// shape and size — a photo that sat differently from the initials beside it
// would show up here and nowhere else.
const WithPhoto: Story = {
  render: (args) => (
    <div {...stylex.props(styles.row)}>
      <Avatar {...args} size="lg" src={PHOTO} />
      <Avatar {...args} name="Grace Hopper" size="lg" tone="tertiary" />
    </div>
  ),
}

export { Sizes, Tones, WithPhoto }

export default meta
