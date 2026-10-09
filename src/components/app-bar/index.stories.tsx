import type { Meta, StoryObj } from '@storybook/react-vite'

import * as stylex from '@stylexjs/stylex'
import { expect } from 'storybook/test'

import type { AppBarProps } from '.'

import AppBar from '.'
import { useAppBarScroll } from '../../hooks/useAppBarScroll'
import { colors, radii, spacing } from '../../tokens/design.tokens.stylex'
import Container from '../container'
import IconButton from '../icon-button'
import Text from '../text'

// The measure the page under the bar runs at, and the gutter Container pads
// it with from a medium window up. Both are the call site's, which is the
// whole point: the bar is told them rather than assuming Material Design's
// own. The gutter is the spacing token itself rather than its default figure,
// so a scheme that changes the scale moves the bar and the page together.
const PAGE_MEASURE = '520px'
const PAGE_GUTTER = spacing.xl

const PARAGRAPH = <p />

// Two glyphs drawn inline: IconButton takes whatever the call site hands it.
// At the 24dp the app bar's tokens give an icon, which is the size the bar's
// layout centres in each button's target.
const BackIcon = () => (
  <svg
    aria-hidden="true"
    fill="none"
    height="24"
    stroke="currentColor"
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth="2"
    viewBox="0 0 24 24"
    width="24"
  >
    <path d="M19 12H5M12 19l-7-7 7-7" />
  </svg>
)

const MoreIcon = () => (
  <svg
    aria-hidden="true"
    fill="currentColor"
    height="24"
    viewBox="0 0 24 24"
    width="24"
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

// One German word, as wide as a headline gets without a space to break at.
const LONG_WORD = 'Unterstützungszeilenüberschrift'

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
// `overflowAnchor` on the scroller above, and the short-page rule
// `useAppBarScroll` applies.
const COLLAPSE_AFTER = 24

// How many paragraphs each scrolling page holds. The short one overflows its
// 320px panel by less than COLLAPSE_AFTER plus the 88px a large bar with a
// subtitle gives back, which is the page the bar used to flicker on.
const LONG_PAGE = 12
const SHORT_PAGE = 6

/**
 * The bar's height once the page is scrolled to `top`, its transition
 * finished, and every scroll that answers it reported.
 */
async function heightAt(bar: HTMLElement, scroller: HTMLElement, top: number) {
  scroller.scrollTop = top
  await nextFrame()
  for (const animation of bar.getAnimations()) {
    animation.finish()
  }
  await nextFrame()
  await nextFrame()
  return bar.getBoundingClientRect().height
}

/** The next frame, by which a scroll the story set has been reported. */
async function nextFrame() {
  await new Promise((resolve) => {
    requestAnimationFrame(resolve)
  })
}

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

function ScrollingPage({ paragraphs }: { paragraphs: number }) {
  // Both props come off one hook, because both answer the same scroll.
  const { collapsed, onScroll, ref, scrolled } = useAppBarScroll({
    collapseAfter: COLLAPSE_AFTER,
  })

  return (
    <div {...stylex.props(styles.scroller)} onScroll={onScroll}>
      <AppBar
        {...stylex.props(styles.pinned)}
        collapsed={collapsed}
        headline="Headline"
        leading={LEADING}
        ref={ref}
        scrolled={scrolled}
        size="lg"
        subtitle="Supporting line"
        trailing={TRAILING}
      />
      <div {...stylex.props(styles.scrollBody)}>
        {Array.from({ length: paragraphs }, (_, index) => (
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
  render: () => <ScrollingPage paragraphs={LONG_PAGE} />,
}

// A page too short to stay scrolled past the threshold once the bar has
// collapsed, so the bar stays expanded rather than collapsing and being
// pulled back open on the next scroll. The play steps down the page and
// checks the bar's height changes at most once.
const ShortPage: Story = {
  play: async ({ canvas }) => {
    const bar = canvas.getByRole('banner')
    const scroller = bar.parentElement
    if (scroller === null) {
      throw new Error('expected the bar to sit in its scroll container')
    }

    const heights: number[] = []
    for (let step = 1; step <= 6; step += 1) {
      // oxlint-disable-next-line no-await-in-loop -- inherently sequential
      heights.push(await heightAt(bar, scroller, step * 20))
    }

    const changes = heights.filter(
      (height, index) => index > 0 && height !== heights[index - 1],
    )
    await expect(changes.length).toBeLessThanOrEqual(1)
  },
  render: () => <ScrollingPage paragraphs={SHORT_PAGE} />,
}

// Its own story because the heights are minimums rather than fixed: in a window
// too narrow for the headline the bar grows to a second line instead of cutting
// it off, which Material Design gives the flexible bars as multi-line support.
// A word wider than the room breaks too, hyphenated in the language the page
// is in, rather than running under the trailing slot.
const LongHeadline: Story = {
  render: () => (
    <div {...stylex.props(styles.narrow, styles.stack)}>
      <Sample
        headline="A headline long enough to need more than one line"
        label="lg, in a narrow window"
        leading={LEADING}
        size="lg"
      />
      {/* A section, so this second bar is a header of its own content
          rather than a second banner landmark on the page. */}
      <section lang="de">
        <Sample
          headline={LONG_WORD}
          label="sm, one word wider than the room, in German"
          leading={LEADING}
          trailing={TRAILING}
        />
      </section>
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

export { Collapsing, Default, Large, LongHeadline, PageAlignment, ShortPage }

export default meta
