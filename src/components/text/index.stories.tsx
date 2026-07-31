import type { Meta, StoryObj } from '@storybook/react-vite'

import * as stylex from '@stylexjs/stylex'

import type { TextProps } from '.'

import Text from '.'
import { spacing } from '../../tokens/design.tokens.stylex'

// Listed in scale order rather than alphabetically — reading display down to
// label is the point of the catalogue, and it is what makes a wrong size
// obvious at a glance.
const VARIANTS = [
  'displayLarge',
  'displayMedium',
  'displaySmall',
  'headlineLarge',
  'headlineMedium',
  'headlineSmall',
  'titleLarge',
  'titleMedium',
  'titleSmall',
  'bodyLarge',
  'bodyMedium',
  'bodySmall',
  'labelLarge',
  'labelMedium',
  'labelSmall',
] as const satisfies TextProps['variant'][]

const TONES = [
  'default',
  'muted',
  'primary',
  'positive',
  'negative',
  'error',
] as const satisfies TextProps['tone'][]

// Render templates are hoisted so each is one stable element reference rather
// than a fresh one per render — which is what react-perf's jsx-no-jsx-as-prop
// is after. They are empty on purpose: `useRender` injects the children, so
// jsx-a11y's heading-has-content is reading a template it cannot see the
// content of.
// oxlint-disable-next-line jsx-a11y/heading-has-content -- filled by useRender
const HEADING_2 = <h2 />
// oxlint-disable-next-line jsx-a11y/heading-has-content -- filled by useRender
const HEADING_3 = <h3 />
const PARAGRAPH = <p />

const styles = stylex.create({
  stack: {
    alignItems: 'flex-start',
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.md,
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

const Scale: Story = {
  render: () => (
    <div {...stylex.props(styles.stack)}>
      {VARIANTS.map((variant) => (
        <Text key={variant} variant={variant}>
          {variant}
        </Text>
      ))}
    </div>
  ),
}

// `render` is how a consumer reaches for semantic markup: the heading levels
// here are real <h2>/<h3> elements, styled off the scale rather than off the
// tag.
const Semantic: Story = {
  render: () => (
    <div {...stylex.props(styles.stack)}>
      <Text render={HEADING_2} variant="headlineSmall">
        Section heading
      </Text>
      <Text render={HEADING_3} variant="titleMedium">
        Subsection heading
      </Text>
      <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
        Supporting copy set one step down the scale and in the muted tone.
      </Text>
    </div>
  ),
}

const Tones: Story = {
  render: () => (
    <div {...stylex.props(styles.stack)}>
      {TONES.map((tone) => (
        <Text key={tone} tone={tone} variant="titleMedium">
          {tone}
        </Text>
      ))}
    </div>
  ),
}

export { Default, Scale, Semantic, Tones }

export default meta
