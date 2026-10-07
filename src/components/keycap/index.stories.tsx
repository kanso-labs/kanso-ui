import type { Meta, StoryObj } from '@storybook/react-vite'

import * as stylex from '@stylexjs/stylex'

import Keycap from '.'
import { spacing } from '../../tokens/design.tokens.stylex'
import Text from '../text'

const PARAGRAPH = <p />

const styles = stylex.create({
  prose: {
    maxInlineSize: '58ch',
  },
  sample: {
    alignItems: 'flex-start',
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.xs,
  },
  stack: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.lg,
  },
})

const meta = {
  args: {
    children: 'Enter',
  },
  component: Keycap,
  title: 'Components/Keycap',
} satisfies Meta<typeof Keycap>

type Story = StoryObj<typeof meta>

const Default: Story = {}

// Its own story because a keycap is named inside a sentence, where its border
// alone carries the metaphor: there is no fill behind it, so one sits inside a
// Card or a Sheet without reading as a nested surface.
const InProse: Story = {
  render: () => (
    <div {...stylex.props(styles.prose)}>
      <Text render={PARAGRAPH} variant="bodyLarge">
        Press <Keycap>Esc</Keycap> to dismiss, or <Keycap>Enter</Keycap> to
        confirm the current selection.
      </Text>
    </div>
  ),
}

// Its own story because a keycap is one key: a chord is several of them
// combined at the call site, which is also how a menu path is written, and the
// separator between them is the sentence's rather than the component's.
const ChordsAndPaths: Story = {
  render: () => (
    <div {...stylex.props(styles.stack)}>
      <div {...stylex.props(styles.sample)}>
        <Text variant="bodyLarge">
          <Keycap>Ctrl</Keycap> + <Keycap>K</Keycap>
        </Text>
        <Text tone="muted" variant="labelSmall">
          a chord
        </Text>
      </div>
      <div {...stylex.props(styles.sample)}>
        <Text variant="bodyLarge">
          <Keycap>First</Keycap> → <Keycap>Second</Keycap> →{' '}
          <Keycap>Third</Keycap>
        </Text>
        <Text tone="muted" variant="labelSmall">
          a path through a menu
        </Text>
      </div>
    </div>
  ),
}

// Its own story because a keycap is sized in em, so a key named in a footnote
// and one named in a heading are the same component. The ratio is a little
// smaller than Code's, because the border adds height the glyphs do not.
const Scale: Story = {
  render: () => (
    <div {...stylex.props(styles.sample)}>
      <Text variant="headlineSmall">
        Press <Keycap>Enter</Keycap>
      </Text>
      <Text tone="muted" variant="bodySmall">
        Press <Keycap>Enter</Keycap>
      </Text>
    </div>
  ),
}

export { ChordsAndPaths, Default, InProse, Scale }

export default meta
