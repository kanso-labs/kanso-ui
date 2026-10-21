import type { Meta, StoryObj } from '@storybook/react-vite'

import * as stylex from '@stylexjs/stylex'
import { expect, fn } from 'storybook/test'

import Link from '.'
import { spacing } from '../../tokens/design.tokens.stylex'
import Text from '../text'

const BLOCK = <div />
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
// this pairs the inherit tone with a rule that waits for the pointer. The row
// sits in muted body text, which is what the inherit tone takes its colour and
// face from.
const InFooter: Story = {
  render: () => (
    <Text render={BLOCK} tone="muted" variant="bodyMedium">
      <nav {...stylex.props(styles.footer)}>
        {FOOTER_LINKS.map((label) => (
          <Link href="#first" key={label} tone="inherit" underline="hover">
            {label}
          </Link>
        ))}
      </nav>
    </Text>
  ),
}

// Greyed in a sentence beside a live link, so the text around it is what the
// grey reads against: on surface at the disabled-content opacity, the rule
// greyed with it. React Aria renders it as a span announced as a link, which
// a pointer cannot follow and the tab order skips.
const Disabled: Story = {
  render: () => (
    <div {...stylex.props(styles.prose)}>
      <Text render={PARAGRAPH} variant="bodyLarge">
        A paragraph of supporting copy with{' '}
        <Link href="#first">a live link</Link> and{' '}
        <Link href="#second" isDisabled>
          a disabled one
        </Link>{' '}
        beside it.
      </Text>
    </div>
  ),
}

// With no `href`, a link is a span announced as a link and still in the tab
// order, and `onPress` is what it does. The play checks the element and the
// tab order without pressing it, which would leave the story focused.
const WithoutHref: Story = {
  args: {
    href: undefined,
    onPress: fn(),
  },
  play: async ({ canvas }) => {
    const link = canvas.getByRole('link', { name: 'Label' })
    await expect(link.tagName).toBe('SPAN')
    await expect(link.tabIndex).toBe(0)
  },
}

// A link that opens another site in a new tab, with `rel` keeping the opened
// page from reaching back into this one. Both reach the anchor as given. It
// draws exactly what Default does, so Chromatic takes no snapshot of it.
const External: Story = {
  args: {
    href: 'https://example.com',
    rel: 'noreferrer',
    target: '_blank',
  },
  parameters: { chromatic: { disableSnapshot: true } },
  play: async ({ canvas }) => {
    const link = canvas.getByRole('link', { name: 'Label' })
    await expect(link).toHaveAttribute('target', '_blank')
    await expect(link).toHaveAttribute('rel', 'noreferrer')
  },
}

export { Default, Disabled, External, InFooter, InProse, WithoutHref }

export default meta
