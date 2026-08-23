import type { Meta, StoryObj } from '@storybook/react-vite'

import * as stylex from '@stylexjs/stylex'

import type { AppBarProps } from '.'

import AppBar from '.'
import { colors, radii, spacing } from '../../tokens/design.tokens.stylex'
import IconButton from '../icon-button'
import Separator from '../separator'
import Text from '../text'

type Size = NonNullable<AppBarProps['size']>

const SIZES = ['small', 'medium', 'large'] as const satisfies readonly Size[]

// oxlint-disable-next-line jsx-a11y/heading-has-content -- filled by useRender
const HEADING_2 = <h2 />
const PARAGRAPH = <p />

// Two glyphs drawn inline, because the library ships no icon set of its own —
// IconButton takes whatever the call site hands it.
const BackIcon = () => (
  <svg
    aria-hidden="true"
    fill="none"
    height="20"
    stroke="currentColor"
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth="2"
    viewBox="0 0 24 24"
    width="20"
  >
    <path d="M19 12H5M12 19l-7-7 7-7" />
  </svg>
)

const MoreIcon = () => (
  <svg
    aria-hidden="true"
    fill="currentColor"
    height="20"
    viewBox="0 0 24 24"
    width="20"
  >
    <circle cx="12" cy="5" r="2" />
    <circle cx="12" cy="12" r="2" />
    <circle cx="12" cy="19" r="2" />
  </svg>
)

const LEADING = (
  <IconButton aria-label="Back">
    <BackIcon />
  </IconButton>
)

const TRAILING = (
  <IconButton aria-label="More">
    <MoreIcon />
  </IconButton>
)

const styles = stylex.create({
  // A frame around each sample, so a bar's own surface is legible against the
  // page rather than blending into it.
  frame: {
    borderColor: colors.outlineVariant,
    borderRadius: radii.md,
    borderStyle: 'solid',
    borderWidth: '1px',
    overflow: 'hidden',
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
  // Narrow enough to force the headline to wrap, which is what the flexible
  // bars were redesigned to handle.
  narrow: {
    inlineSize: '320px',
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

function Sample({ label, ...props }: AppBarProps & { label: string }) {
  return (
    <div {...stylex.props(styles.sample)}>
      <div {...stylex.props(styles.frame)}>
        <AppBar {...props} />
      </div>
      <Text tone="muted" variant="labelSmall">
        {label}
      </Text>
    </div>
  )
}

const meta = {
  args: {
    headline: 'Headline',
    leading: LEADING,
    trailing: TRAILING,
  },
  component: AppBar,
  title: 'Components/AppBar',
} satisfies Meta<typeof AppBar>

type Story = StoryObj<typeof meta>

const Overview: Story = {
  render: () => (
    <div {...stylex.props(styles.page)}>
      <header {...stylex.props(styles.header)}>
        <Text render={HEADING_2} variant="displaySmall">
          AppBar
        </Text>
        <Text render={PARAGRAPH} tone="muted" variant="bodyLarge">
          Material 3's app bar. The container at the top of a page carrying its
          title, one or two actions, and the way back out.
        </Text>
      </header>

      <Separator />

      <section {...stylex.props(styles.section)}>
        <div {...stylex.props(styles.intro)}>
          <Text render={HEADING_2} variant="titleLarge">
            Three sizes
          </Text>
          <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
            64px, 112px and 120px, each giving the headline a larger type role
            than the one below. `medium` and `large` are M3 Expressive's
            flexible bars; the baseline variants they replaced are no longer
            recommended and are not offered here.
          </Text>
        </div>
        {SIZES.map((size) => (
          <Sample
            headline="Headline"
            key={size}
            label={size}
            leading={LEADING}
            size={size}
            trailing={TRAILING}
          />
        ))}
      </section>

      <Separator />

      <section {...stylex.props(styles.section)}>
        <div {...stylex.props(styles.intro)}>
          <Text render={HEADING_2} variant="titleLarge">
            Hugging the text
          </Text>
          <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
            A subtitle makes the flexible bars taller rather than being fitted
            into the same box — 136px and 152px, both published by M3. The small
            bar keeps its 64px, which a headline and a subtitle at their type
            roles come to exactly, and is why it suits a title that is a label.
          </Text>
        </div>
        {SIZES.map((size) => (
          <Sample
            headline="Headline"
            key={size}
            label={`${size} with subtitle`}
            leading={LEADING}
            size={size}
            subtitle="Supporting line"
            trailing={TRAILING}
          />
        ))}
      </section>

      <Separator />

      <section {...stylex.props(styles.section)}>
        <div {...stylex.props(styles.intro)}>
          <Text render={HEADING_2} variant="titleLarge">
            A headline that wraps
          </Text>
          <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
            The heights are minimums, not fixed. Expressive added multi-line
            support to the flexible bars, so a long headline in a narrow window
            grows the bar instead of being cut off.
          </Text>
        </div>
        <div {...stylex.props(styles.narrow)}>
          <Sample
            headline="A headline long enough to need more than one line"
            label="large, in a narrow window"
            leading={LEADING}
            size="large"
          />
        </div>
      </section>

      <Separator />

      <section {...stylex.props(styles.section)}>
        <div {...stylex.props(styles.intro)}>
          <Text render={HEADING_2} variant="titleLarge">
            Centred text
          </Text>
          <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
            M3 folded the old center-aligned variant into a configuration, so it
            is available at every size rather than only on the small bar.
          </Text>
        </div>
        <Sample
          align="center"
          headline="Headline"
          label="align=center"
          leading={LEADING}
          trailing={TRAILING}
        />
      </section>

      <Separator />

      <section {...stylex.props(styles.section)}>
        <div {...stylex.props(styles.intro)}>
          <Text render={HEADING_2} variant="titleLarge">
            Over scrolled content
          </Text>
          <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
            M3 replaced M2's drop shadow with a fill, so a bar separates itself
            from content beneath by sitting on a different surface rather than
            casting anything. `scrolled` is controlled, because only the app
            knows which element is scrolling.
          </Text>
        </div>
        <Sample
          headline="Headline"
          label="scrolled"
          leading={LEADING}
          scrolled
          trailing={TRAILING}
        />
      </section>
    </div>
  ),
}

const Default: Story = {}

// Its own story because the flexible sizes are the ones with behaviour a
// snapshot of the default never reaches — a taller bar and a larger headline.
const Large: Story = {
  args: {
    size: 'large',
    subtitle: 'Supporting line',
  },
}

export { Default, Large, Overview }

export default meta
