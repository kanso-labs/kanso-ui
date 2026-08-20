import type { Meta, StoryObj } from '@storybook/react-vite'

import * as stylex from '@stylexjs/stylex'

import Keycap from '.'
import { spacing } from '../../tokens/design.tokens.stylex'
import Separator from '../separator'
import Text from '../text'

// See avatar/index.stories.tsx for why the overview is built from the library's
// own components rather than from shell components of its own, and why its
// sections are divided by a rule instead of boxed in Cards.
// oxlint-disable-next-line jsx-a11y/heading-has-content -- filled by useRender
const HEADING_1 = <h1 />
// oxlint-disable-next-line jsx-a11y/heading-has-content -- filled by useRender
const HEADING_2 = <h2 />
const PARAGRAPH = <p />

const styles = stylex.create({
  header: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.xs,
  },
  intro: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.xxs,
  },
  page: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.xl,
    marginInline: 'auto',
    maxInlineSize: '960px',
    padding: spacing.xl,
  },
  prose: {
    maxInlineSize: '58ch',
  },
  sample: {
    alignItems: 'flex-start',
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.xs,
  },
  section: {
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

const Overview: Story = {
  render: () => (
    <div {...stylex.props(styles.page)}>
      <header {...stylex.props(styles.header)}>
        <Text render={HEADING_1} variant="displaySmall">
          Keycap
        </Text>
        <Text render={PARAGRAPH} tone="muted" variant="bodyLarge">
          A single key on a keyboard, as named in an instruction. It takes its
          scale from the text around it.
        </Text>
      </header>

      <Separator />

      <section {...stylex.props(styles.section)}>
        <div {...stylex.props(styles.intro)}>
          <Text render={HEADING_2} variant="titleLarge">
            In an instruction
          </Text>
          <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
            The border alone carries the metaphor — there is no fill behind a
            keycap, so one sits inside a Card or a Sheet without reading as a
            nested surface.
          </Text>
        </div>
        <div {...stylex.props(styles.prose)}>
          <Text render={PARAGRAPH} variant="bodyLarge">
            Press <Keycap>Esc</Keycap> to dismiss, or <Keycap>Enter</Keycap> to
            confirm the current selection.
          </Text>
        </div>
      </section>

      <Separator />

      <section {...stylex.props(styles.section)}>
        <div {...stylex.props(styles.intro)}>
          <Text render={HEADING_2} variant="titleLarge">
            Chords and paths
          </Text>
          <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
            A keycap is one key. A chord is several of them combined at the call
            site, which is also how a menu path is written — the separator
            between them is the sentence's, not the component's.
          </Text>
        </div>
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
      </section>

      <Separator />

      <section {...stylex.props(styles.section)}>
        <div {...stylex.props(styles.intro)}>
          <Text render={HEADING_2} variant="titleLarge">
            Scale
          </Text>
          <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
            Sized in em, so a key named in a footnote and one named in a heading
            are the same component. The ratio is a little smaller than
            Code&apos;s, because the border adds height that the glyphs do not.
          </Text>
        </div>
        <div {...stylex.props(styles.sample)}>
          <Text variant="headlineSmall">
            Press <Keycap>Enter</Keycap>
          </Text>
          <Text tone="muted" variant="bodySmall">
            Press <Keycap>Enter</Keycap>
          </Text>
        </div>
      </section>
    </div>
  ),
}

const Default: Story = {}

export { Default, Overview }

export default meta
