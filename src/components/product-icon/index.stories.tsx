import type { Meta, StoryObj } from '@storybook/react-vite'

import * as stylex from '@stylexjs/stylex'

import type { ProductIconProps } from '.'

import ProductIcon from '.'
import { spacing } from '../../tokens/design.tokens.stylex'
import Avatar from '../avatar'
import Card from '../card'
import Separator from '../separator'
import Text from '../text'

type Size = NonNullable<ProductIconProps['size']>
type Tone = NonNullable<ProductIconProps['tone']>

const SIZES = ['sm', 'md', 'lg'] as const satisfies readonly Size[]
const TONES = [
  'primary',
  'secondary',
  'tertiary',
  'positive',
  'negative',
] as const satisfies readonly Tone[]

// Two marks of deliberately awkward proportions, inline so the stories need
// no fixture served alongside them. The wide one is what makes `contain`
// visible: cropped to fill the square it would lose its ends, which for a
// real wordmark means losing the word.
const WIDE_MARK =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 32"><rect width="96" height="32" rx="4" fill="%23394b47"/><circle cx="16" cy="16" r="8" fill="%23f2b8b5"/><rect x="32" y="12" width="52" height="8" rx="4" fill="%23e7edea"/></svg>`,
  )
const TALL_MARK =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 96"><rect width="32" height="96" rx="4" fill="%23394b47"/><circle cx="16" cy="20" r="8" fill="%2374d9af"/><rect x="12" y="36" width="8" height="48" rx="4" fill="%23e7edea"/></svg>`,
  )

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
  page: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.xl,
    marginInline: 'auto',
    maxInlineSize: '960px',
    padding: spacing.xl,
  },
  // A card's worth of content led by a mark, which is where these mostly sit.
  row: {
    alignItems: 'center',
    display: 'flex',
    gap: spacing.md,
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

const Overview: Story = {
  render: () => (
    <div {...stylex.props(styles.page)}>
      <header {...stylex.props(styles.header)}>
        <Text render={HEADING_1} variant="displaySmall">
          ProductIcon
        </Text>
        <Text render={PARAGRAPH} tone="muted" variant="bodyLarge">
          A small square mark identifying something that is not a person — an
          application, a service, a brand. Reach for Avatar when it is a person.
        </Text>
      </header>

      <Separator />

      <section {...stylex.props(styles.intro)}>
        <Text render={HEADING_2} variant="titleLarge">
          Against Avatar
        </Text>
        <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
          The same three sizes, so either can lead a row without moving what
          sits beside it. They differ in the two ways that matter for a mark
          rather than a face: a rounded square instead of a circle, and a mark
          letterboxed instead of cropped. Both samples below are handed the same
          wide image.
        </Text>
      </section>
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

      <Separator />

      <section {...stylex.props(styles.intro)}>
        <Text render={HEADING_2} variant="titleLarge">
          Any aspect ratio
        </Text>
        <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
          A mark is drawn to its own bounding box, so it is fitted inside the
          square rather than filled to it. A wide mark leaves space above and
          below, a tall one leaves space either side, and neither loses an edge.
        </Text>
      </section>
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

      <Separator />

      <section {...stylex.props(styles.intro)}>
        <Text render={HEADING_2} variant="titleLarge">
          Sizes
        </Text>
        <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
          `sm` 36px, `md` 40px, `lg` 56px — Avatar's three, so the two are
          interchangeable.
        </Text>
      </section>
      <div {...stylex.props(styles.inline)}>
        {SIZES.map((size) => (
          <div key={size} {...stylex.props(styles.sample)}>
            <ProductIcon name="First item" size={size} src={WIDE_MARK} />
            <Text tone="muted" variant="labelSmall">
              {size}
            </Text>
          </div>
        ))}
      </div>

      <Separator />

      <section {...stylex.props(styles.intro)}>
        <Text render={HEADING_2} variant="titleLarge">
          Without a mark
        </Text>
        <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
          One initial of the name, on a tinted container. One rather than
          Avatar's two: a thing has no surname to initialise, so the second
          letter would be a pair of initials for something that was never two
          names. The tone is only ever seen here, since a loaded mark covers it.
        </Text>
      </section>
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

      <Separator />

      <section {...stylex.props(styles.intro)}>
        <Text render={HEADING_2} variant="titleLarge">
          Leading a card
        </Text>
        <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
          Where these mostly sit: a mark, a name, and a line about what the
          thing is.
        </Text>
      </section>
      <div {...stylex.props(styles.wide)}>
        <Card variant="outlined">
          <div {...stylex.props(styles.row)}>
            <ProductIcon name="First item" src={WIDE_MARK} />
            <div {...stylex.props(styles.stack)}>
              <Text variant="titleSmall">First item</Text>
              <Text tone="muted" variant="bodySmall">
                Supporting line
              </Text>
            </div>
          </div>
        </Card>
      </div>
    </div>
  ),
}

const Default: Story = {}

// Its own story because the fallback is the state a snapshot of the default
// never reaches — the mark covers it as soon as it loads.
const WithoutMark: Story = {
  args: {
    src: undefined,
  },
}

export { Default, Overview, WithoutMark }

export default meta
