import type { Meta, StoryObj } from '@storybook/react-vite'
import type { UIEvent } from 'react'

import * as stylex from '@stylexjs/stylex'
import { useCallback, useState } from 'react'

import type { AppBarProps } from '.'

import AppBar from '.'
import { colors, radii, spacing } from '../../tokens/design.tokens.stylex'
import { spacingPx } from '../../tokens/values'
import Container from '../container'
import IconButton from '../icon-button'
import Separator from '../separator'
import Text from '../text'

type Size = NonNullable<AppBarProps['size']>

const SIZES = ['small', 'medium', 'large'] as const satisfies readonly Size[]

// The measure the page under the bar runs at, and the gutter Container pads
// it with. Both are the call site's, which is the whole point: the bar is told
// them rather than assuming M3's own. The gutter is read off the scale rather
// than repeated as a figure, so the two cannot drift apart.
const PAGE_MEASURE = '520px'
const PAGE_GUTTER = `${spacingPx.xl}px`

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
  // Block spacing only. The measure and the gutter under the bar are
  // Container's, which is the pairing this section is about.
  measured: {
    paddingBlock: spacing.lg,
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
  // A pinned bar needs a scroll container to be pinned inside, and this is
  // the call site's job rather than the component's — the bar paints a
  // surface and sets a height, and nothing else.
  pinned: {
    insetBlockStart: 0,
    position: 'sticky',
  },
  sample: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.xs,
  },
  // The scrolling demo's body, long enough that the bar has somewhere to
  // collapse into.
  scrollBody: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.md,
    padding: spacing.lg,
  },
  scroller: {
    blockSize: '320px',
    // What keeps the collapse from flickering, and the one thing a pinned
    // flexible bar asks of the container it scrolls in. Without it the
    // browser answers the bar giving its height back by moving the scroll
    // offset the same distance, which is the offset `collapsed` was derived
    // from — so it lands back under the threshold and the two take turns.
    overflowAnchor: 'none',
    overflowY: 'auto',
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.lg,
  },
})

// How far the page scrolls before the bar collapses. The figure is the call
// site's to choose, and no figure makes the bar stable on its own — see
// `overflowAnchor` on the scroller above, which is what does.
const COLLAPSE_AFTER = 24

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

function ScrollingPage() {
  const [scrollTop, setScrollTop] = useState(0)

  // Both props come off one handler, because both answer the same scroll.
  const handleScroll = useCallback((event: UIEvent<HTMLDivElement>) => {
    setScrollTop(event.currentTarget.scrollTop)
  }, [])

  return (
    <div {...stylex.props(styles.scroller)} onScroll={handleScroll}>
      <AppBar
        {...stylex.props(styles.pinned)}
        collapsed={scrollTop > COLLAPSE_AFTER}
        headline="Headline"
        leading={LEADING}
        scrolled={scrollTop > 0}
        size="large"
        subtitle="Supporting line"
        trailing={TRAILING}
      />
      <div {...stylex.props(styles.scrollBody)}>
        {Array.from({ length: 12 }, (_, index) => (
          <Text key={index} render={PARAGRAPH} tone="muted">
            Supporting line. Scroll this panel to watch the bar give its height
            back to the page.
          </Text>
        ))}
      </div>
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

      <Separator />

      <section {...stylex.props(styles.section)}>
        <div {...stylex.props(styles.intro)}>
          <Text render={HEADING_2} variant="titleLarge">
            Collapsing on scroll
          </Text>
          <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
            A pinned flexible bar gives its height back as the page scrolls,
            becoming the small bar. Without it a large bar costs 152px of the
            viewport for as long as the page is open, which is most of a phone
            screen. The subtitle goes with the height, since there is no second
            line in a 64px bar.
          </Text>
        </div>
        <Sample
          headline="Headline"
          label="expanded"
          leading={LEADING}
          size="large"
          subtitle="Supporting line"
          trailing={TRAILING}
        />
        <Sample
          collapsed
          headline="Headline"
          label="collapsed"
          leading={LEADING}
          size="large"
          subtitle="Supporting line"
          trailing={TRAILING}
        />
      </section>

      <Separator />

      <section {...stylex.props(styles.section)}>
        <div {...stylex.props(styles.intro)}>
          <Text render={HEADING_2} variant="titleLarge">
            Lining up with the page
          </Text>
          <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
            A bar that paints edge to edge sits over a page whose content
            usually does not. Give it the page's measure and the page's gutter
            and its headline starts where the page's own text does, with the
            surface still running the full width.
          </Text>
          <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
            A leading slot changes what lands on the measure. The icon takes the
            inset and the headline sits after it, which is M3's own arrangement
            rather than something to correct.
          </Text>
        </div>
        <div {...stylex.props(styles.frame)}>
          <AppBar
            contentInset={PAGE_GUTTER}
            contentMaxInlineSize={PAGE_MEASURE}
            headline="Headline"
            trailing={TRAILING}
          />
          <Container
            {...stylex.props(styles.measured)}
            maxInlineSize={PAGE_MEASURE}
          >
            <Text render={PARAGRAPH} tone="muted">
              Supporting line. This paragraph sits at the page's own measure and
              gutter, and the headline above starts on the same line.
            </Text>
          </Container>
        </div>
        <div {...stylex.props(styles.frame)}>
          <AppBar headline="Headline" trailing={TRAILING} />
          <Container
            {...stylex.props(styles.measured)}
            maxInlineSize={PAGE_MEASURE}
          >
            <Text render={PARAGRAPH} tone="muted">
              Supporting line. The same page under a bar left at M3's own
              margin, which is where the two come apart.
            </Text>
          </Container>
        </div>
        <div {...stylex.props(styles.frame)}>
          <AppBar
            contentInset={PAGE_GUTTER}
            contentMaxInlineSize={PAGE_MEASURE}
            headline="Headline"
            leading={LEADING}
            trailing={TRAILING}
          />
          <Container
            {...stylex.props(styles.measured)}
            maxInlineSize={PAGE_MEASURE}
          >
            <Text render={PARAGRAPH} tone="muted">
              Supporting line. The same bar with a leading slot. The icon is
              what sits on the measure now, and the headline follows it.
            </Text>
          </Container>
        </div>
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

// The one story that has to be driven rather than described: both props are
// controlled, so what a reader needs to see is the wiring, not the states.
const Collapsing: Story = {
  render: () => <ScrollingPage />,
}

export { Collapsing, Default, Large, Overview }

export default meta
