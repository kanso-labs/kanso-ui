import type { Meta, StoryObj } from '@storybook/react-vite'

import * as stylex from '@stylexjs/stylex'

import Code from '.'
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
  narrow: {
    borderColor: 'currentcolor',
    borderStyle: 'dashed',
    borderWidth: '1px',
    maxInlineSize: '220px',
    padding: spacing.sm,
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
    children: 'identifier',
  },
  component: Code,
  title: 'Components/Code',
} satisfies Meta<typeof Code>

type Story = StoryObj<typeof meta>

const Overview: Story = {
  render: () => (
    <div {...stylex.props(styles.page)}>
      <header {...stylex.props(styles.header)}>
        <Text render={HEADING_1} variant="displaySmall">
          Code
        </Text>
        <Text render={PARAGRAPH} tone="muted" variant="bodyLarge">
          A fragment of code, a path, or an identifier set in the mono face. It
          takes its scale from the text around it.
        </Text>
      </header>

      <Separator />

      <section {...stylex.props(styles.section)}>
        <div {...stylex.props(styles.intro)}>
          <Text render={HEADING_2} variant="titleLarge">
            In prose
          </Text>
          <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
            The mono face is the whole signal — there is no tint behind it, so a
            fragment sits inside a Card or a Sheet without introducing a second
            surface.
          </Text>
        </div>
        <div {...stylex.props(styles.prose)}>
          <Text render={PARAGRAPH} variant="bodyLarge">
            Supporting copy naming a value such as{' '}
            <Code>first.second.third</Code> in the middle of a sentence.
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
            Sized in em, so the same component serves a heading and a footnote.
            A mono face reads larger than prose at the same nominal size, and
            the ratio is what makes the two look level.
          </Text>
        </div>
        <div {...stylex.props(styles.sample)}>
          <Text variant="headlineSmall">
            A heading naming <Code>identifier</Code>
          </Text>
          <Text tone="muted" variant="bodySmall">
            A footnote naming <Code>identifier</Code>
          </Text>
        </div>
      </section>

      <Separator />

      <section {...stylex.props(styles.section)}>
        <div {...stylex.props(styles.intro)}>
          <Text render={HEADING_2} variant="titleLarge">
            Long identifiers
          </Text>
          <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
            A package path or a hash has no spaces to break at. Rather than
            pushing its container wider, it breaks inside it — and only when the
            line cannot otherwise fit.
          </Text>
        </div>
        <div {...stylex.props(styles.sample)}>
          <div {...stylex.props(styles.narrow)}>
            <Text variant="bodyMedium">
              <Code>registry.example/first-second/a-long-unbroken-name</Code>
            </Text>
          </div>
          <Text tone="muted" variant="labelSmall">
            the dashed rule is the container, not the component
          </Text>
        </div>
      </section>
    </div>
  ),
}

const Default: Story = {}

export { Default, Overview }

export default meta
