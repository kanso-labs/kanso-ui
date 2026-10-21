import type { Meta, StoryObj } from '@storybook/react-vite'

import * as stylex from '@stylexjs/stylex'

import ProductIcon from '.'
import { spacing } from '../../tokens/design.tokens.stylex'
import Avatar from '../avatar'
import Card from '../card'
import Text from '../text'

// Two marks of deliberately awkward proportions, inline so the stories need
// no fixture served alongside them. The wide one is what makes `contain`
// visible: cropped to fill the square it would lose its ends, which for a
// real wordmark means losing the word. Their colours are plain `#` hex,
// since `encodeURIComponent` escapes the `#` itself: a `%23` written here
// would be escaped a second time into no colour at all, and draw black.
const WIDE_MARK =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 32"><rect width="96" height="32" rx="4" fill="#394b47"/><circle cx="16" cy="16" r="8" fill="#f2b8b5"/><rect x="32" y="12" width="52" height="8" rx="4" fill="#e7edea"/></svg>`,
  )
const TALL_MARK =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 96"><rect width="32" height="96" rx="4" fill="#394b47"/><circle cx="16" cy="20" r="8" fill="#74d9af"/><rect x="12" y="36" width="8" height="48" rx="4" fill="#e7edea"/></svg>`,
  )

// A data URL that names a PNG and holds none, so the mark fails to load with
// nothing reaching the network: the fallback a snapshot can rely on.
const BROKEN = 'data:image/png;base64,AAAA'

const SIZES = ['sm', 'md', 'lg'] as const

const TONES = [
  'primary',
  'secondary',
  'tertiary',
  'positive',
  'negative',
] as const

const styles = stylex.create({
  inline: {
    alignItems: 'flex-end',
    display: 'flex',
    flexWrap: 'wrap',
    gap: spacing.lg,
  },
  // A card's worth of content led by a mark, which is where these mostly sit.
  row: {
    alignItems: 'center',
    display: 'flex',
    gap: spacing.md,
  },
  // Rows a story draws one under the other.
  rows: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.lg,
  },
  sample: {
    alignItems: 'center',
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.xs,
  },
  stack: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.xxs,
  },
  wide: {
    inlineSize: '260px',
  },
})

const meta = {
  args: {
    name: 'First item',
    src: WIDE_MARK,
  },
  component: ProductIcon,
  title: 'Components/ProductIcon',
} satisfies Meta<typeof ProductIcon>

type Story = StoryObj<typeof meta>

const Default: Story = {}

// Its own story because the fallback is the state a snapshot of the default
// never reaches — the mark covers it as soon as it loads.
const WithoutMark: Story = {
  args: {
    src: undefined,
  },
}

// The three edge lengths, 36, 40 and 56px, with a mark over the initial it
// falls back to.
const Sizes: Story = {
  render: () => (
    <div {...stylex.props(styles.rows)}>
      {[WIDE_MARK, undefined].map((src) => (
        <div key={src ?? 'none'} {...stylex.props(styles.inline)}>
          {SIZES.map((size) => (
            <div key={size} {...stylex.props(styles.sample)}>
              <ProductIcon name="First item" size={size} src={src} />
              <Text tone="muted" variant="labelSmall">
                {size}
              </Text>
            </div>
          ))}
        </div>
      ))}
    </div>
  ),
}

// The five container and on-container pairs the fallback is tinted with. A
// mark that loads covers its tone, so these show only without one.
const Tones: Story = {
  render: () => (
    <div {...stylex.props(styles.inline)}>
      {TONES.map((tone) => (
        <div key={tone} {...stylex.props(styles.sample)}>
          <ProductIcon name="First item" tone={tone} />
          <Text tone="muted" variant="labelSmall">
            {tone}
          </Text>
        </div>
      ))}
    </div>
  ),
}

// A mark that fails to load: the initial it was drawn over stays.
const BrokenSource: Story = {
  args: {
    src: BROKEN,
  },
}

// Its own story because the two only read against each other: handed the same
// wide image, ProductIcon letterboxes it in a rounded square where Avatar crops
// it to a circle, in a box of the same size, so either can lead a row.
const AvatarComparison: Story = {
  render: () => (
    <div {...stylex.props(styles.inline)}>
      <div {...stylex.props(styles.sample)}>
        <ProductIcon name="First item" src={WIDE_MARK} />
        <Text tone="muted" variant="labelSmall">
          ProductIcon
        </Text>
      </div>
      <div {...stylex.props(styles.sample)}>
        <Avatar name="Ada Lovelace" src={WIDE_MARK} />
        <Text tone="muted" variant="labelSmall">
          Avatar
        </Text>
      </div>
    </div>
  ),
}

// Its own story because a mark is drawn to its own bounding box and fitted
// inside the square rather than filled to it: a wide one leaves space above
// and below, a tall one space either side, and neither loses an edge.
const AspectRatios: Story = {
  render: () => (
    <div {...stylex.props(styles.inline)}>
      <div {...stylex.props(styles.sample)}>
        <ProductIcon name="First item" size="lg" src={WIDE_MARK} />
        <Text tone="muted" variant="labelSmall">
          wide
        </Text>
      </div>
      <div {...stylex.props(styles.sample)}>
        <ProductIcon name="Second item" size="lg" src={TALL_MARK} />
        <Text tone="muted" variant="labelSmall">
          tall
        </Text>
      </div>
    </div>
  ),
}

// Its own story because this is where a mark mostly sits: leading a card, with
// a name and a line about what the thing is.
// The mark beside the name of what it identifies, which is where these
// mostly sit — so it is decorative, and a screen reader reads the name once,
// from the text.
const InACard: Story = {
  render: () => (
    <div {...stylex.props(styles.wide)}>
      <Card variant="outlined">
        <div {...stylex.props(styles.row)}>
          <ProductIcon decorative name="First item" src={WIDE_MARK} />
          <div {...stylex.props(styles.stack)}>
            <Text variant="titleSmall">First item</Text>
            <Text tone="muted" variant="bodySmall">
              Supporting line
            </Text>
          </div>
        </div>
      </Card>
    </div>
  ),
}

export {
  AspectRatios,
  AvatarComparison,
  BrokenSource,
  Default,
  InACard,
  Sizes,
  Tones,
  WithoutMark,
}

export default meta
