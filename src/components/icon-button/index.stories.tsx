import type { Meta, StoryObj } from '@storybook/react-vite'

import * as stylex from '@stylexjs/stylex'

import IconButton from '.'
import { spacing } from '../../tokens/design.tokens.stylex'

const styles = stylex.create({
  // Sized in `em` so it follows the button's own type size, which is what
  // makes one icon serve all three sizes.
  icon: {
    blockSize: '1em',
    inlineSize: '1em',
  },
  row: {
    alignItems: 'center',
    display: 'flex',
    flexWrap: 'wrap',
    gap: spacing.lg,
  },
})

// A plain glyph rather than an icon set, so the stories stay a demonstration
// of the button and not of a dependency the library does not have.
function PlusIcon() {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
      {...stylex.props(styles.icon)}
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  )
}

const meta = {
  args: {
    'aria-label': 'Add',
    children: <PlusIcon />,
  },
  component: IconButton,
  title: 'Components/IconButton',
} satisfies Meta<typeof IconButton>

type Story = StoryObj<typeof meta>

const Variants: Story = {
  render: (args) => (
    <div {...stylex.props(styles.row)}>
      <IconButton {...args} variant="standard" />
      <IconButton {...args} variant="filled" />
      <IconButton {...args} variant="tonal" />
    </div>
  ),
}

// One icon at three sizes: it is drawn in `em`, so it scales with the button
// rather than needing a size of its own.
const Sizes: Story = {
  render: (args) => (
    <div {...stylex.props(styles.row)}>
      <IconButton {...args} size="xs" />
      <IconButton {...args} size="md" />
      <IconButton {...args} size="lg" />
    </div>
  ),
}

const Disabled: Story = {
  args: {
    disabled: true,
  },
  render: (args) => (
    <div {...stylex.props(styles.row)}>
      <IconButton {...args} variant="standard" />
      <IconButton {...args} variant="filled" />
      <IconButton {...args} variant="tonal" />
    </div>
  ),
}

export { Disabled, Sizes, Variants }

export default meta
