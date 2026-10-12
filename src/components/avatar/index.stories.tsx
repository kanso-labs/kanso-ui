import type { Meta, StoryObj } from '@storybook/react-vite'

import * as stylex from '@stylexjs/stylex'

import Avatar from '.'
import { spacing } from '../../tokens/design.tokens.stylex'
import Text from '../text'

// An inline SVG rather than a hosted image: a story that reaches the network
// would make the Chromatic snapshot depend on someone else's uptime, and the
// point here is only that a photo fills the circle and crops to it.
const PHOTO =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 80'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0' y1='0' x2='1' y2='1'%3E%3Cstop offset='0' stop-color='%236750a4'/%3E%3Cstop offset='1' stop-color='%23efb8c8'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='120' height='80' fill='url(%23g)'/%3E%3Ccircle cx='60' cy='34' r='16' fill='%23fffbfe' opacity='.9'/%3E%3Cpath d='M28 80c6-18 18-26 32-26s26 8 32 26z' fill='%23fffbfe' opacity='.9'/%3E%3C/svg%3E"

const styles = stylex.create({
  row: {
    alignItems: 'center',
    display: 'flex',
    gap: spacing.md,
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

const Default: Story = {}

// Its own story because the fallback is a behaviour rather than a variant:
// clearing `src` in the Controls panel is what shows the initials taking over.
const WithPhoto: Story = {
  args: {
    size: 'lg',
    src: PHOTO,
  },
}

// An avatar beside the person's name, as a byline or a list row draws one.
// The name is written next to it, so the avatar is decorative: a screen
// reader reads the name once, from the text, rather than from the avatar and
// then again from the text.
const BesideAName: Story = {
  render: () => (
    <div {...stylex.props(styles.row)}>
      <Avatar decorative name="Ada Lovelace" />
      <Text variant="bodyLarge">Ada Lovelace</Text>
    </div>
  ),
}

export { BesideAName, Default, WithPhoto }

export default meta
