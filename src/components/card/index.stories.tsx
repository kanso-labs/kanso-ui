import type { Decorator, Meta, StoryObj } from '@storybook/react-vite'

import * as stylex from '@stylexjs/stylex'

import Card from '.'
import { spacing } from '../../tokens/design.tokens.stylex'
import Separator from '../separator'
import Text from '../text'

// See avatar/index.stories.tsx for why the overview is built from the library's
// own components rather than from shell components of its own, and why its
// sections are divided by a rule instead of boxed in Cards. That matters most
// here: every sample sits directly on the page's surface, which is the
// background these three variants are defined against — a Card panel around
// them would have been the one context in which they cannot be judged.
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
  // Wider than a variant sample, because list rows need room to read as rows.
  list: {
    inlineSize: '320px',
  },
  // The card sets no padding in this mode, so the rows carry their own and
  // the rules between them reach both edges.
  listRow: {
    paddingBlock: spacing.md,
    paddingInline: spacing.lg,
  },
  page: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.xl,
    marginInline: 'auto',
    maxInlineSize: '960px',
    padding: spacing.xl,
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
  stack: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.xs,
  },
  wide: {
    inlineSize: '240px',
  },
})

function Body() {
  return (
    <div {...stylex.props(styles.stack)}>
      <Text variant="titleMedium">Headline</Text>
      <Text tone="muted" variant="bodySmall">
        Supporting line
      </Text>
    </div>
  )
}

const ROWS = ['First item', 'Second item', 'Third item']

function List() {
  return (
    <>
      {ROWS.map((label, index) => (
        <div key={label}>
          {index === 0 ? null : <Separator />}
          <div {...stylex.props(styles.listRow)}>
            <Text variant="bodyMedium">{label}</Text>
          </div>
        </div>
      ))}
    </>
  )
}

// A card fills its container, so every sample needs one to have a width. It
// has to be a wrapper rather than a prop: Card spreads its own StyleX
// className last and so cannot be widened from the outside.
const Wide: Decorator = (Story) => (
  <div {...stylex.props(styles.wide)}>
    <Story />
  </div>
)

const CONTENT = <Body />

// Declared at module scope so it is one stable element rather than a fresh one
// per render, matching how the heading templates above are handled. Empty for
// the same reason they are, and disabled for the same reason too: useRender
// injects the children, so the anchor jsx-a11y sees has no content yet.
// oxlint-disable-next-line jsx-a11y/anchor-has-content, jsx-a11y/control-has-associated-label -- filled by useRender
const EXAMPLE_LINK = <a href="https://example.com" />

const meta = {
  args: {
    children: CONTENT,
  },
  component: Card,
  title: 'Components/Card',
} satisfies Meta<typeof Card>

type Story = StoryObj<typeof meta>

const Overview: Story = {
  render: () => (
    <div {...stylex.props(styles.page)}>
      <header {...stylex.props(styles.header)}>
        <Text render={HEADING_1} variant="displaySmall">
          Card
        </Text>
        <Text render={PARAGRAPH} tone="muted" variant="bodyLarge">
          A surface that groups related content, and optionally makes the whole
          group pressable.
        </Text>
      </header>

      <Separator />

      <section {...stylex.props(styles.section)}>
        <div {...stylex.props(styles.intro)}>
          <Text render={HEADING_2} variant="titleLarge">
            Variants
          </Text>
          <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
            The three differ only in how they separate themselves from the page:
            a shadow, a darker fill, or a border. Each therefore sits on a
            different background, which is why the interaction styles are keyed
            by variant too.
          </Text>
        </div>
        <div {...stylex.props(styles.inline)}>
          <div {...stylex.props(styles.sample)}>
            <div {...stylex.props(styles.wide)}>
              <Card variant="elevated">
                <Body />
              </Card>
            </div>
            <Text tone="muted" variant="labelSmall">
              elevated
            </Text>
          </div>
          <div {...stylex.props(styles.sample)}>
            <div {...stylex.props(styles.wide)}>
              <Card variant="filled">
                <Body />
              </Card>
            </div>
            <Text tone="muted" variant="labelSmall">
              filled
            </Text>
          </div>
          <div {...stylex.props(styles.sample)}>
            <div {...stylex.props(styles.wide)}>
              <Card variant="outlined">
                <Body />
              </Card>
            </div>
            <Text tone="muted" variant="labelSmall">
              outlined
            </Text>
          </div>
        </div>
      </section>

      <Separator />

      <section {...stylex.props(styles.section)}>
        <div {...stylex.props(styles.intro)}>
          <Text render={HEADING_2} variant="titleLarge">
            Interactive
          </Text>
          <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
            Makes the card the thing you press: it ripples, lifts on hover, and
            takes focus. Renders a button unless `render` says otherwise. Only
            the resting state is visible here — the rest is what you get by
            pressing it.
          </Text>
        </div>
        <div {...stylex.props(styles.inline)}>
          <div {...stylex.props(styles.sample)}>
            <div {...stylex.props(styles.wide)}>
              <Card interactive>
                <Body />
              </Card>
            </div>
            <Text tone="muted" variant="labelSmall">
              interactive
            </Text>
          </div>
        </div>
      </section>

      <Separator />

      <section {...stylex.props(styles.section)}>
        <div {...stylex.props(styles.intro)}>
          <Text render={HEADING_2} variant="titleLarge">
            As a link
          </Text>
          <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
            `render` decides which element the card is, so one that navigates
            can be a real anchor. It is announced as a link, opens in a new tab
            on a modifier click, and offers the browser's own link menu — none
            of which a button with an onClick does.
          </Text>
        </div>
        <div {...stylex.props(styles.inline)}>
          <div {...stylex.props(styles.sample)}>
            <div {...stylex.props(styles.wide)}>
              <Card interactive render={EXAMPLE_LINK}>
                <Body />
              </Card>
            </div>
            <Text tone="muted" variant="labelSmall">
              interactive · render
            </Text>
          </div>
        </div>
      </section>

      <Separator />

      <section {...stylex.props(styles.section)}>
        <div {...stylex.props(styles.intro)}>
          <Text render={HEADING_2} variant="titleLarge">
            Padding
          </Text>
          <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
            `none` removes the card's own padding, for children that run to its
            edges.
          </Text>
        </div>
        <div {...stylex.props(styles.inline)}>
          <div {...stylex.props(styles.sample)}>
            <div {...stylex.props(styles.wide)}>
              <Card variant="outlined">
                <Body />
              </Card>
            </div>
            <Text tone="muted" variant="labelSmall">
              default
            </Text>
          </div>
          <div {...stylex.props(styles.sample)}>
            <div {...stylex.props(styles.wide)}>
              <Card padding="none" variant="outlined">
                <Body />
              </Card>
            </div>
            <Text tone="muted" variant="labelSmall">
              none
            </Text>
          </div>
        </div>
      </section>

      <Separator />

      <section {...stylex.props(styles.section)}>
        <div {...stylex.props(styles.intro)}>
          <Text render={HEADING_2} variant="titleLarge">
            As a list
          </Text>
          <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
            The design's bordered list container is exactly this — an outlined
            card with no padding of its own, holding rows separated by rules. It
            is the reason the library has no List component.
          </Text>
        </div>
        <div {...stylex.props(styles.inline)}>
          <div {...stylex.props(styles.sample)}>
            <div {...stylex.props(styles.list)}>
              <Card padding="none" variant="outlined">
                <List />
              </Card>
            </div>
            <Text tone="muted" variant="labelSmall">
              padding="none" · variant="outlined"
            </Text>
          </div>
        </div>
      </section>
    </div>
  ),
}

const Default: Story = {
  decorators: [Wide],
}

// Its own story because it is a different element — a button rather than a
// div — with focus and ripple behaviour a snapshot cannot show.
const Interactive: Story = {
  args: {
    interactive: true,
  },
  decorators: [Wide],
}

// A third element again, and the only place the anchor's own behaviour can be
// exercised: tabbing to it, the status bar showing where it goes, the browser
// menu on a right-click. `render` takes an element rather than a string, so
// none of that is reachable through the controls panel either.
const Link: Story = {
  args: {
    interactive: true,
    render: EXAMPLE_LINK,
  },
  decorators: [Wide],
}

export { Default, Interactive, Link, Overview }

export default meta
