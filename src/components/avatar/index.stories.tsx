import type { Meta, StoryObj } from '@storybook/react-vite'

import * as stylex from '@stylexjs/stylex'

import Avatar from '.'
import { spacing } from '../../tokens/design.tokens.stylex'
import Separator from '../separator'
import Text from '../text'

// An inline SVG rather than a hosted image: a story that reaches the network
// would make the Chromatic snapshot depend on someone else's uptime, and the
// point here is only that a photo fills the circle and crops to it.
const PHOTO =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 80'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0' y1='0' x2='1' y2='1'%3E%3Cstop offset='0' stop-color='%236750a4'/%3E%3Cstop offset='1' stop-color='%23efb8c8'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='120' height='80' fill='url(%23g)'/%3E%3Ccircle cx='60' cy='34' r='16' fill='%23fffbfe' opacity='.9'/%3E%3Cpath d='M28 80c6-18 18-26 32-26s26 8 32 26z' fill='%23fffbfe' opacity='.9'/%3E%3C/svg%3E"

// The overview is built from the library's own Separator and Text rather than
// from shell components written for the stories, so the page is itself a use of
// kanso-ui and drifts the moment either of them does. What is left in StyleX
// here is layout only — flex, gaps, widths — which is what the library has no
// component for.
//
// Sections are divided by a rule rather than boxed in Cards, which leaves every
// sample sitting on the page's own surface. That is the background a consumer
// will actually place them on, and — for Card's own overview — the one its
// variants are meant to be judged against.
//
// Headings go through Text's `render`, so they are real <h1>/<h2> elements
// styled off the type scale rather than off the tag. The templates are hoisted
// to one stable element reference each, which is what react-perf's
// jsx-no-jsx-as-prop is after, and they are empty because useRender injects
// the children — which is all jsx-a11y's heading-has-content can see.
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
  // Bottom-aligned, so across a set of mixed heights the captions still sit on
  // one line. Wraps, so a set too wide for the page runs onto a second row
  // rather than making the card scroll sideways.
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
  // Centred rather than start-aligned: a 40px avatar over the word 'secondary'
  // reads as misplaced when their left edges line up and as a pair when their
  // centres do.
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

const meta = {
  args: {
    name: 'Ada Lovelace',
  },
  component: Avatar,
  title: 'Components/Avatar',
} satisfies Meta<typeof Avatar>

type Story = StoryObj<typeof meta>

// Every axis on one page. The individual stories below are the ones worth
// opening on their own — anything this page shows and they do not is a prop
// away in the Controls panel.
const Overview: Story = {
  render: () => (
    <div {...stylex.props(styles.page)}>
      <header {...stylex.props(styles.header)}>
        <Text render={HEADING_1} variant="displaySmall">
          Avatar
        </Text>
        <Text render={PARAGRAPH} tone="muted" variant="bodyLarge">
          A person, as a tinted circle of initials or a photo cropped to it.
        </Text>
      </header>

      <Separator />

      <section {...stylex.props(styles.section)}>
        <div {...stylex.props(styles.intro)}>
          <Text render={HEADING_2} variant="titleLarge">
            Tones
          </Text>
          <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
            Container/on-container pairs, so the initials are always a role's
            own foreground. Which one a given person gets is the consuming app's
            decision — the design cycles them per person.
          </Text>
        </div>
        <div {...stylex.props(styles.inline)}>
          <div {...stylex.props(styles.sample)}>
            <Avatar name="Ada Lovelace" tone="primary" />
            <Text tone="muted" variant="labelSmall">
              primary
            </Text>
          </div>
          <div {...stylex.props(styles.sample)}>
            <Avatar name="Grace Hopper" tone="secondary" />
            <Text tone="muted" variant="labelSmall">
              secondary
            </Text>
          </div>
          <div {...stylex.props(styles.sample)}>
            <Avatar name="Alan Turing" tone="tertiary" />
            <Text tone="muted" variant="labelSmall">
              tertiary
            </Text>
          </div>
          <div {...stylex.props(styles.sample)}>
            <Avatar name="Katherine Johnson" tone="positive" />
            <Text tone="muted" variant="labelSmall">
              positive
            </Text>
          </div>
          <div {...stylex.props(styles.sample)}>
            <Avatar name="Barbara Liskov" tone="negative" />
            <Text tone="muted" variant="labelSmall">
              negative
            </Text>
          </div>
        </div>
      </section>

      <Separator />

      <section {...stylex.props(styles.section)}>
        <div {...stylex.props(styles.intro)}>
          <Text render={HEADING_2} variant="titleLarge">
            Sizes
          </Text>
          <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
            Each size carries its own type size but not its own weight or
            family, so a large avatar is bigger initials rather than
            differently-styled ones.
          </Text>
        </div>
        <div {...stylex.props(styles.inline)}>
          <div {...stylex.props(styles.sample)}>
            <Avatar name="Ada Lovelace" size="sm" />
            <Text tone="muted" variant="labelSmall">
              sm · 36px
            </Text>
          </div>
          <div {...stylex.props(styles.sample)}>
            <Avatar name="Ada Lovelace" size="md" />
            <Text tone="muted" variant="labelSmall">
              md · 40px
            </Text>
          </div>
          <div {...stylex.props(styles.sample)}>
            <Avatar name="Ada Lovelace" size="lg" />
            <Text tone="muted" variant="labelSmall">
              lg · 56px
            </Text>
          </div>
        </div>
      </section>

      <Separator />

      <section {...stylex.props(styles.section)}>
        <div {...stylex.props(styles.intro)}>
          <Text render={HEADING_2} variant="titleLarge">
            Photo
          </Text>
          <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
            A photo fills the circle and crops to it, so an image of any aspect
            ratio can be handed over uncropped. The initials hold until it
            loads, and come back if it fails.
          </Text>
        </div>
        <div {...stylex.props(styles.inline)}>
          <div {...stylex.props(styles.sample)}>
            <Avatar name="Ada Lovelace" size="lg" src={PHOTO} />
            <Text tone="muted" variant="labelSmall">
              src
            </Text>
          </div>
          <div {...stylex.props(styles.sample)}>
            <Avatar name="Ada Lovelace" size="lg" />
            <Text tone="muted" variant="labelSmall">
              no src
            </Text>
          </div>
        </div>
      </section>

      <Separator />

      <section {...stylex.props(styles.section)}>
        <div {...stylex.props(styles.intro)}>
          <Text render={HEADING_2} variant="titleLarge">
            Initials
          </Text>
          <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
            First letter of the first and last word, upper-cased — so one prop
            covers both a full name and a single one, with no second prop for
            how many letters to take.
          </Text>
        </div>
        <div {...stylex.props(styles.inline)}>
          <div {...stylex.props(styles.sample)}>
            <Avatar name="Ada Lovelace" />
            <Text tone="muted" variant="labelSmall">
              Ada Lovelace
            </Text>
          </div>
          <div {...stylex.props(styles.sample)}>
            <Avatar name="Ada" />
            <Text tone="muted" variant="labelSmall">
              Ada
            </Text>
          </div>
          <div {...stylex.props(styles.sample)}>
            <Avatar name="Ada King Lovelace" />
            <Text tone="muted" variant="labelSmall">
              Ada King Lovelace
            </Text>
          </div>
        </div>
      </section>
    </div>
  ),
}

const Default: Story = {}

// Its own story because the fallback is a behaviour rather than a variant:
// clearing `src` in the Controls panel is what shows the initials taking over.
const WithPhoto: Story = {
  args: {
    size: 'lg',
    src: PHOTO,
  },
}

export { Default, Overview, WithPhoto }

export default meta
