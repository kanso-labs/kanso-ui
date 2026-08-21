import type { Meta, StoryObj } from '@storybook/react-vite'

import * as stylex from '@stylexjs/stylex'

import type { TextProps } from '.'

import Text from '.'
import { colors, spacing } from '../../tokens/design.tokens.stylex'
import Separator from '../separator'

type Tone = NonNullable<TextProps['tone']>
type Variant = NonNullable<TextProps['variant']>

// Grouped by family and listed large to small within each, because reading
// display down to label is what makes a wrong size obvious at a glance.
// Overline is a family of one and comes last: it sits outside the five, and
// is the only style set in the mono face.
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
  { label: 'Overline', variants: ['overline'] },
] as const satisfies readonly { label: string; variants: readonly Variant[] }[]

// `inherit` is missing on purpose — it sets no colour, so it has nothing to
// show in a list of colours. It gets its own sample below, inside an element
// that sets one, which is the only context in which it means anything.
const TONES = [
  'default',
  'muted',
  'primary',
  'positive',
  'negative',
  'error',
] as const satisfies readonly Tone[]

// See avatar/index.stories.tsx for why the overview is built from the library's
// own components rather than from shell components of its own, and why its
// sections are divided by a rule instead of boxed in Cards. Text is both the
// subject here and every label on the page, which is as it should be: a page
// documenting the type scale ought to be set in it.
// oxlint-disable-next-line jsx-a11y/heading-has-content -- filled by useRender
const HEADING_1 = <h1 />
// oxlint-disable-next-line jsx-a11y/heading-has-content -- filled by useRender
const HEADING_2 = <h2 />
// oxlint-disable-next-line jsx-a11y/heading-has-content -- filled by useRender
const HEADING_3 = <h3 />
const PARAGRAPH = <p />

const styles = stylex.create({
  // An eyebrow sits tighter to the heading it introduces than the section gap
  // would put it, so the two read as one block rather than as two.
  eyebrow: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.xxs,
  },
  // Lets a sample take the rest of the row and wrap inside it, rather than
  // sizing to its own text and pushing out of the page at display sizes.
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
  header: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.xs,
  },
  // A colour on an ancestor, so `inherit` has something to inherit.
  inherited: {
    color: colors.tertiary,
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
  section: {
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

const Overview: Story = {
  render: () => (
    <div {...stylex.props(styles.page)}>
      <header {...stylex.props(styles.header)}>
        <Text render={HEADING_1} variant="displaySmall">
          Text
        </Text>
        <Text render={PARAGRAPH} tone="muted" variant="bodyLarge">
          The type scale, as a component. Size and colour are separate axes, so
          the two compose freely.
        </Text>
      </header>

      <Separator />

      <section {...stylex.props(styles.section)}>
        <div {...stylex.props(styles.intro)}>
          <Text render={HEADING_2} variant="titleLarge">
            Type scale
          </Text>
          <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
            Fifteen styles in five families, plus an overline outside them. Each
            carries its own size, weight, tracking, and line height — a variant
            is one decision, not four.
          </Text>
        </div>
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
      </section>

      <Separator />

      <section {...stylex.props(styles.section)}>
        <div {...stylex.props(styles.intro)}>
          <Text render={HEADING_2} variant="titleLarge">
            Overline
          </Text>
          <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
            The eyebrow over a heading, and the label down the side of a
            section. Write it in sentence case — the capitals are applied in
            CSS, so the DOM keeps what you wrote and a screen reader announces
            that rather than the shouted form.
          </Text>
        </div>
        <div {...stylex.props(styles.rows)}>
          <div {...stylex.props(styles.row)}>
            <div {...stylex.props(styles.rowLabel)}>
              <Text tone="muted" variant="labelSmall">
                eyebrow
              </Text>
            </div>
            <div {...stylex.props(styles.eyebrow)}>
              <Text tone="primary" variant="overline">
                Section label
              </Text>
              <Text render={HEADING_3} variant="headlineSmall">
                Headline
              </Text>
            </div>
          </div>
          <div {...stylex.props(styles.row)}>
            <div {...stylex.props(styles.rowLabel)}>
              <Text tone="muted" variant="labelSmall">
                rail
              </Text>
            </div>
            <Text tone="muted" variant="overline">
              Supporting line
            </Text>
          </div>
        </div>
      </section>

      <Separator />

      <section {...stylex.props(styles.section)}>
        <div {...stylex.props(styles.intro)}>
          <Text render={HEADING_2} variant="titleLarge">
            Tones
          </Text>
          <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
            A separate axis from variant, so any tone composes with any size.
            `inherit` sets no colour at all and takes whatever the nearest
            coloured ancestor has.
          </Text>
        </div>
        <div {...stylex.props(styles.rows)}>
          {TONES.map((tone) => (
            <div key={tone} {...stylex.props(styles.row)}>
              <div {...stylex.props(styles.rowLabel)}>
                <Text tone="muted" variant="labelSmall">
                  {tone}
                </Text>
              </div>
              <Text tone={tone} variant="titleMedium">
                The quick brown fox jumps over the lazy dog
              </Text>
            </div>
          ))}
          <div {...stylex.props(styles.row)}>
            <div {...stylex.props(styles.rowLabel)}>
              <Text tone="muted" variant="labelSmall">
                inherit
              </Text>
            </div>
            <div {...stylex.props(styles.inherited)}>
              <Text tone="inherit" variant="titleMedium">
                The quick brown fox jumps over the lazy dog
              </Text>
            </div>
          </div>
        </div>
      </section>

      <Separator />

      <section {...stylex.props(styles.section)}>
        <div {...stylex.props(styles.intro)}>
          <Text render={HEADING_2} variant="titleLarge">
            Semantic elements
          </Text>
          <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
            `render` swaps the element without touching the styling, so a
            heading can be a real h2 styled off the scale rather than off the
            tag. Every heading and label on this page is a Text.
          </Text>
        </div>
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
                Supporting copy set one step down the scale and in the muted
                tone.
              </Text>
            </div>
          </div>
        </div>
      </section>
    </div>
  ),
}

const Default: Story = {}

export { Default, Overview }

export default meta
