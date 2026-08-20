import type { Meta, StoryObj } from '@storybook/react-vite'

import * as stylex from '@stylexjs/stylex'

import Link from '.'
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

const FOOTER_LINKS = ['First item', 'Second item', 'Third item'] as const

const styles = stylex.create({
  footer: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: spacing.xl,
  },
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
    children: 'Label',
    href: '#first',
  },
  component: Link,
  title: 'Components/Link',
} satisfies Meta<typeof Link>

type Story = StoryObj<typeof meta>

const Overview: Story = {
  render: () => (
    <div {...stylex.props(styles.page)}>
      <header {...stylex.props(styles.header)}>
        <Text render={HEADING_1} variant="displaySmall">
          Link
        </Text>
        <Text render={PARAGRAPH} tone="muted" variant="bodyLarge">
          A navigational link. It sets no type of its own, so it takes the size
          and face of the text it sits in.
        </Text>
      </header>

      <Separator />

      <section {...stylex.props(styles.section)}>
        <div {...stylex.props(styles.intro)}>
          <Text render={HEADING_2} variant="titleLarge">
            In prose
          </Text>
          <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
            The rule under a link is on by default. Colour alone fails anyone
            who cannot separate the two hues, so a link in a sentence that is
            not underlined is only visible to some readers.
          </Text>
        </div>
        <div {...stylex.props(styles.prose)}>
          <Text render={PARAGRAPH} variant="bodyLarge">
            A paragraph of supporting copy with{' '}
            <Link href="#first">a link inside it</Link>, sized and faced by the
            sentence around it rather than by anything the link sets.
          </Text>
        </div>
      </section>

      <Separator />

      <section {...stylex.props(styles.section)}>
        <div {...stylex.props(styles.intro)}>
          <Text render={HEADING_2} variant="titleLarge">
            Tones
          </Text>
          <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
            Primary marks the link out from the text around it. Inherit takes
            the surrounding colour and leans on the rule alone, for a place
            already understood to be links — a footer, a breadcrumb, a nav.
          </Text>
        </div>
        <div {...stylex.props(styles.sample)}>
          <Link href="#first">Label</Link>
          <Text tone="muted" variant="labelSmall">
            primary
          </Text>
        </div>
        <div {...stylex.props(styles.sample)}>
          <Link href="#first" tone="inherit">
            Label
          </Link>
          <Text tone="muted" variant="labelSmall">
            inherit
          </Text>
        </div>
      </section>

      <Separator />

      <section {...stylex.props(styles.section)}>
        <div {...stylex.props(styles.intro)}>
          <Text render={HEADING_2} variant="titleLarge">
            In a footer
          </Text>
          <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
            A row of links needs no colour to be read as links, so this pairs
            the inherit tone with a rule that waits for the pointer.
          </Text>
        </div>
        <nav {...stylex.props(styles.footer)}>
          {FOOTER_LINKS.map((label) => (
            <Link href="#first" key={label} tone="inherit" underline="hover">
              {label}
            </Link>
          ))}
        </nav>
      </section>
    </div>
  ),
}

const Default: Story = {}

export { Default, Overview }

export default meta
