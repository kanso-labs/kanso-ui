import type { Meta, StoryObj } from '@storybook/react-vite'

import * as stylex from '@stylexjs/stylex'

import type { TextProps } from '.'

import Text from '.'
import { colors, spacing } from '../../tokens/design.tokens.stylex'

type Variant = NonNullable<TextProps['variant']>

// Grouped by family and listed large to small within each, because reading
// display down to label is what makes a wrong size obvious at a glance.
const SCALE_GROUPS = [
  {
    label: 'Display',
    variants: ['displayLarge', 'displayMedium', 'displaySmall'],
  },
  {
    label: 'Headline',
    variants: ['headlineLarge', 'headlineMedium', 'headlineSmall'],
  },
  { label: 'Title', variants: ['titleLarge', 'titleMedium', 'titleSmall'] },
  { label: 'Body', variants: ['bodyLarge', 'bodyMedium', 'bodySmall'] },
  { label: 'Label', variants: ['labelLarge', 'labelMedium', 'labelSmall'] },
] as const satisfies readonly { label: string; variants: readonly Variant[] }[]

// oxlint-disable-next-line jsx-a11y/heading-has-content -- filled by useRender
const HEADING_2 = <h2 />
// oxlint-disable-next-line jsx-a11y/heading-has-content -- filled by useRender
const HEADING_3 = <h3 />
const PARAGRAPH = <p />

const styles = stylex.create({
  // Lets a sample take the rest of the row and wrap inside it, rather than
  // sizing to its own text and pushing out of the frame at display sizes.
  fill: {
    flexBasis: 0,
    flexGrow: 1,
    minInlineSize: 0,
  },
  group: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.sm,
  },
  // A colour on an ancestor, so `inherit` has something to inherit.
  inherited: {
    color: colors.tertiary,
  },
  // A measure for the prose samples: what makes a line hard to read is how
  // many characters the eye has to track back across.
  prose: {
    maxInlineSize: '58ch',
  },
  // Two paragraphs with the space between them coming from the scale, which is
  // where a block Text leaves it.
  proseSpaced: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.md,
    maxInlineSize: '58ch',
  },
  row: {
    alignItems: 'center',
    display: 'flex',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  rowLabel: {
    flexShrink: 0,
    inlineSize: '128px',
  },
  rows: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.sm,
  },
  // The families one under another, with more room between them than between
  // the rows of one.
  scale: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.lg,
  },
})

const meta = {
  args: {
    children: 'The quick brown fox jumps over the lazy dog',
  },
  component: Text,
  title: 'Components/Text',
} satisfies Meta<typeof Text>

type Story = StoryObj<typeof meta>

const Default: Story = {}

// Its own entry because prose is what `block` exists for, and the default
// story is a single line where the difference does not show.
const Prose: Story = {
  args: {
    block: true,
    children:
      'Kanso is the elimination of clutter. The writing follows the visual system in that: plain, concrete, and no longer than it needs to be.',
    variant: 'bodyLarge',
  },
}

// Fifteen styles in five families, one row to a style. Each carries its own
// size, weight, tracking and line height, so a variant is one decision rather
// than four, and the scale is read whole here instead of one style at a time.
const TypeScale: Story = {
  render: () => (
    <div {...stylex.props(styles.scale)}>
      {SCALE_GROUPS.map((group) => (
        <div key={group.label} {...stylex.props(styles.group)}>
          <Text render={HEADING_3} tone="muted" variant="labelMedium">
            {group.label}
          </Text>
          <div {...stylex.props(styles.rows)}>
            {group.variants.map((variant) => (
              <div key={variant} {...stylex.props(styles.row)}>
                <div {...stylex.props(styles.rowLabel)}>
                  <Text tone="muted" variant="labelSmall">
                    {variant}
                  </Text>
                </div>
                <div {...stylex.props(styles.fill)}>
                  <Text variant={variant}>
                    The quick brown fox jumps over the lazy dog
                  </Text>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  ),
}

// `tone="inherit"` sets no colour and takes the nearest coloured ancestor's, so
// the only context in which it means anything is inside an element that sets
// one, which no other story here has.
const InheritedTone: Story = {
  render: () => (
    <div {...stylex.props(styles.inherited)}>
      <Text tone="inherit" variant="titleMedium">
        The quick brown fox jumps over the lazy dog
      </Text>
    </div>
  ),
}

// `render` swaps the element without touching the styling, so a heading can be
// a real h2 styled off the scale rather than off the tag. Each row names the
// element its Text renders.
const SemanticElements: Story = {
  render: () => (
    <div {...stylex.props(styles.rows)}>
      <div {...stylex.props(styles.row)}>
        <div {...stylex.props(styles.rowLabel)}>
          <Text tone="muted" variant="labelSmall">
            h2
          </Text>
        </div>
        <Text render={HEADING_2} variant="headlineSmall">
          Section heading
        </Text>
      </div>
      <div {...stylex.props(styles.row)}>
        <div {...stylex.props(styles.rowLabel)}>
          <Text tone="muted" variant="labelSmall">
            h3
          </Text>
        </div>
        <Text render={HEADING_3} variant="titleMedium">
          Subsection heading
        </Text>
      </div>
      <div {...stylex.props(styles.row)}>
        <div {...stylex.props(styles.rowLabel)}>
          <Text tone="muted" variant="labelSmall">
            p
          </Text>
        </div>
        <div {...stylex.props(styles.fill)}>
          <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
            Supporting copy set one step down the scale and in the muted tone.
          </Text>
        </div>
      </div>
    </div>
  ),
}

// A Text is a span, which is right for a run of text inside a line and wrong
// for a paragraph, so `block` renders a p. Neither carries a margin, so the
// paragraphs sit flush until whatever holds them spaces them from the scale.
const SpanAndBlock: Story = {
  render: () => (
    <div {...stylex.props(styles.rows)}>
      <div {...stylex.props(styles.row)}>
        <div {...stylex.props(styles.rowLabel)}>
          <Text tone="muted" variant="labelSmall">
            span
          </Text>
        </div>
        <div {...stylex.props(styles.fill, styles.prose)}>
          <Text>First sentence of the copy.</Text>
          <Text>Second sentence, which runs on from it.</Text>
        </div>
      </div>
      <div {...stylex.props(styles.row)}>
        <div {...stylex.props(styles.rowLabel)}>
          <Text tone="muted" variant="labelSmall">
            block
          </Text>
        </div>
        <div {...stylex.props(styles.fill, styles.prose)}>
          <Text block>First sentence of the copy.</Text>
          <Text block>Second sentence, which runs on from it.</Text>
        </div>
      </div>
      <div {...stylex.props(styles.row)}>
        <div {...stylex.props(styles.rowLabel)}>
          <Text tone="muted" variant="labelSmall">
            block, spaced
          </Text>
        </div>
        <div {...stylex.props(styles.fill, styles.proseSpaced)}>
          <Text block>First sentence of the copy.</Text>
          <Text block>Second sentence, which runs on from it.</Text>
        </div>
      </div>
    </div>
  ),
}

export {
  Default,
  InheritedTone,
  Prose,
  SemanticElements,
  SpanAndBlock,
  TypeScale,
}

export default meta
