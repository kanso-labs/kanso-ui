import type { Decorator, Meta, StoryObj } from '@storybook/react-vite'

import * as stylex from '@stylexjs/stylex'

import Separator from '.'
import { colors, radii, spacing } from '../../tokens/design.tokens.stylex'
import Text from '../text'

// See avatar/index.stories.tsx for why the overview is built from the library's
// own components rather than from shell components of its own, and why its
// sections are divided by a rule instead of boxed in Cards.
// oxlint-disable-next-line jsx-a11y/heading-has-content -- filled by useRender
const HEADING_1 = <h1 />
// oxlint-disable-next-line jsx-a11y/heading-has-content -- filled by useRender
const HEADING_2 = <h2 />
const PARAGRAPH = <p />

// A separator is a 1px rule, so on its own there is nothing to look at and
// nothing to judge it against. The overview's sections place it where it will
// actually be used — between stacked rows, and between inline items — since
// what matters is whether it reads as a divider next to real content.
//
// The demo boxes are plain divs rather than Cards: they have to be flex
// containers, and Card spreads its own StyleX class last so its display cannot
// be changed from the call site. They take surfaceContainer so as to sit
// distinctly on the page's own surface.
const styles = stylex.create({
  demoRow: {
    alignItems: 'center',
    backgroundColor: colors.surfaceContainer,
    borderRadius: radii.lg,
    display: 'flex',
    gap: spacing.md,
    inlineSize: 'fit-content',
    padding: spacing.lg,
  },
  demoStack: {
    backgroundColor: colors.surfaceContainer,
    borderRadius: radii.lg,
    display: 'flex',
    flexDirection: 'column',
    inlineSize: '280px',
    padding: spacing.lg,
  },
  // The frame Default renders in, and it has to be a flex box with a height
  // of its own: a vertical separator takes its length from a flex or grid
  // parent via alignSelf: stretch and has none otherwise, so in a plain block
  // this story would go blank the moment the orientation control was flipped.
  // `alignItems: center` puts a horizontal rule down the middle rather than
  // against the top edge; the vertical one overrides it with its own stretch.
  //
  // surfaceContainer, not the surface the overview's boxes sit on: this story
  // renders straight onto the canvas, which is painted surface, so a frame in
  // that colour would be invisible and the rule would look as though it were
  // floating on the page.
  frame: {
    alignItems: 'center',
    backgroundColor: colors.surfaceContainer,
    blockSize: '96px',
    borderRadius: radii.lg,
    boxSizing: 'border-box',
    display: 'flex',
    inlineSize: '280px',
    padding: spacing.lg,
  },
  header: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.xs,
  },
  // Wraps each sample to its content and starts it at the left, the same as
  // every other overview's sample row.
  inline: {
    alignItems: 'flex-end',
    display: 'flex',
    flexWrap: 'wrap',
    gap: spacing.lg,
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
  row: {
    paddingBlock: spacing.md,
  },
  sample: {
    alignItems: 'center',
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

const Framed: Decorator = (Story) => (
  <div {...stylex.props(styles.frame)}>
    <Story />
  </div>
)

const meta = {
  component: Separator,
  title: 'Components/Separator',
} satisfies Meta<typeof Separator>

type Story = StoryObj<typeof meta>

const Overview: Story = {
  render: () => (
    <div {...stylex.props(styles.page)}>
      <header {...stylex.props(styles.header)}>
        <Text render={HEADING_1} variant="displaySmall">
          Separator
        </Text>
        <Text render={PARAGRAPH} tone="muted" variant="bodyLarge">
          A 1px rule between items, in either orientation.
        </Text>
      </header>

      <Separator />

      <section {...stylex.props(styles.section)}>
        <div {...stylex.props(styles.intro)}>
          <Text render={HEADING_2} variant="titleLarge">
            Horizontal
          </Text>
          <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
            The default. Spans the full width of whatever contains it, so in a
            padded container it stops at the padding and in an unpadded one it
            reaches both edges.
          </Text>
        </div>
        <div {...stylex.props(styles.inline)}>
          <div {...stylex.props(styles.sample)}>
            <div {...stylex.props(styles.demoStack)}>
              <div {...stylex.props(styles.row)}>
                <Text variant="bodyMedium">First item</Text>
              </div>
              <Separator />
              <div {...stylex.props(styles.row)}>
                <Text variant="bodyMedium">Second item</Text>
              </div>
              <Separator />
              <div {...stylex.props(styles.row)}>
                <Text variant="bodyMedium">Third item</Text>
              </div>
            </div>
            <Text tone="muted" variant="labelSmall">
              orientation="horizontal"
            </Text>
          </div>
        </div>
      </section>

      <Separator />

      <section {...stylex.props(styles.section)}>
        <div {...stylex.props(styles.intro)}>
          <Text render={HEADING_2} variant="titleLarge">
            Vertical
          </Text>
          <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
            Takes its height from the row it sits in rather than being given
            one, which is the whole reason it is worth showing next to content
            of a real height.
          </Text>
        </div>
        <div {...stylex.props(styles.inline)}>
          <div {...stylex.props(styles.sample)}>
            <div {...stylex.props(styles.demoRow)}>
              <Text variant="labelLarge">First</Text>
              <Separator orientation="vertical" />
              <Text variant="labelLarge">Second</Text>
              <Separator orientation="vertical" />
              <Text variant="labelLarge">Third</Text>
            </div>
            <Text tone="muted" variant="labelSmall">
              orientation="vertical"
            </Text>
          </div>
        </div>
      </section>
    </div>
  ),
}

// Bare, in a frame that gives it something to span, so `orientation` is
// something the Controls panel can actually turn over.
const Default: Story = {
  decorators: [Framed],
}

export { Default, Overview }

export default meta
