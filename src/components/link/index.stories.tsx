import type { Meta, StoryObj } from '@storybook/react-vite'

import * as stylex from '@stylexjs/stylex'

import Link from '.'
import { spacing } from '../../tokens/design.tokens.stylex'
import Text from '../text'

const PARAGRAPH = <p />

const FOOTER_LINKS = ['First item', 'Second item', 'Third item'] as const

const styles = stylex.create({
  footer: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: spacing.xl,
  },
  prose: {
    maxInlineSize: '58ch',
  },
})

const meta = {
  args: {
    children: 'Label',
    href: '#first',
  },
  component: Link,
  title: 'Components/Link',
} satisfies Meta<typeof Link>

type Story = StoryObj<typeof meta>

const Default: Story = {}

// Its own story because a link sets no type of its own, so it takes the size
// and face of the sentence it sits in. The rule under it is on by default:
// colour alone fails anyone who cannot separate the two hues.
const InProse: Story = {
  render: () => (
    <div {...stylex.props(styles.prose)}>
      <Text render={PARAGRAPH} variant="bodyLarge">
        A paragraph of supporting copy with{' '}
        <Link href="#first">a link inside it</Link>, sized and faced by the
        sentence around it rather than by anything the link sets.
      </Text>
    </div>
  ),
}

// Its own story because a row of links needs no colour to be read as links, so
// this pairs the inherit tone with a rule that waits for the pointer.
const InFooter: Story = {
  render: () => (
    <nav {...stylex.props(styles.footer)}>
      {FOOTER_LINKS.map((label) => (
        <Link href="#first" key={label} tone="inherit" underline="hover">
          {label}
        </Link>
      ))}
    </nav>
  ),
}

export { Default, InFooter, InProse }

export default meta
