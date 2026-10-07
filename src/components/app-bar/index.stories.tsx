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
import Text from '../text'

// The measure the page under the bar runs at, and the gutter Container pads
// it with. Both are the call site's, which is the whole point: the bar is told
// them rather than assuming Material Design's own. The gutter is read off the
// scale rather than repeated as a figure, so the two cannot drift apart.
const PAGE_MEASURE = '520px'
const PAGE_GUTTER = `${spacingPx.xl}px`

const PARAGRAPH = <p />

// Two glyphs drawn inline: IconButton takes whatever the call site hands it.
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
  // Block spacing only. The measure and the gutter under the bar are
  // Container's, which is the pairing the page-alignment story is about.
  measured: {
    paddingBlock: spacing.lg,
  },
  // Narrow enough to force the headline to wrap, which is what the flexible
  // bars were redesigned to handle.
  narrow: {
    inlineSize: '320px',
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
  stack: {
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
        size="lg"
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

const Default: Story = {}

// Its own story because the flexible sizes are the ones with behaviour a
// snapshot of the default never reaches — a taller bar and a larger headline.
const Large: Story = {
  args: {
    size: 'lg',
    subtitle: 'Supporting line',
  },
}

// The one story that has to be driven rather than described: both props are
// controlled, so what a reader needs to see is the wiring, not the states.
const Collapsing: Story = {
  render: () => <ScrollingPage />,
}

// Its own story because the heights are minimums rather than fixed: in a window
// too narrow for the headline the bar grows to a second line instead of cutting
// it off, which Material Design gives the flexible bars as multi-line support.
const LongHeadline: Story = {
  render: () => (
    <div {...stylex.props(styles.narrow)}>
      <Sample
        headline="A headline long enough to need more than one line"
        label="lg, in a narrow window"
        leading={LEADING}
        size="lg"
      />
    </div>
  ),
}

// Its own story because the comparison is with the page beneath the bar. Given
// the page's measure and gutter, the headline starts where the page's text does
// and a leading slot puts the icon there instead, as Material Design arranges.
const PageAlignment: Story = {
  render: () => (
    // A section rather than a div: a bar is a header, and one outside
    // sectioning content is a banner landmark, of which a page may have one.
    <section {...stylex.props(styles.stack)}>
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
            Supporting line. The same page under a bar left at Material Design's
            own margin, which is where the two come apart.
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
            Supporting line. The same bar with a leading slot. The icon is what
            sits on the measure now, and the headline follows it.
          </Text>
        </Container>
      </div>
    </section>
  ),
}

export { Collapsing, Default, Large, LongHeadline, PageAlignment }

export default meta
