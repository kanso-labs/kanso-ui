import type { Meta, StoryObj } from '@storybook/react-vite'

import * as stylex from '@stylexjs/stylex'

import ColorArea from '.'
import { spacing } from '../../tokens/design.tokens.stylex'
import ColorSlider from '../color-slider'
import Separator from '../separator'
import Text from '../text'

// See avatar/index.stories.tsx for why the overview is built from the
// library's own components rather than from shell components of its own, and
// why its sections are divided by a rule instead of boxed in Cards.
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
  page: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.xl,
    marginInline: 'auto',
    maxInlineSize: '960px',
    padding: spacing.xl,
  },
  // A picker is the plane with the channels it does not carry beside it,
  // which is the arrangement ColorPicker will compose later.
  picker: {
    display: 'flex',
    flexDirection: 'column',
    flexShrink: 0,
    gap: spacing.md,
    inlineSize: '240px',
  },
  row: {
    alignItems: 'flex-start',
    display: 'flex',
    flexWrap: 'wrap',
    gap: spacing.xl,
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.lg,
  },
  width: {
    inlineSize: '240px',
  },
  widthNarrow: {
    inlineSize: '140px',
  },
})

const BLUE = 'hsl(200, 100%, 50%)'
// RGB, not HSL: alpha is a channel of a colour area only in RGB, and in
// HSL React Aria quietly draws saturation and lightness instead.
const TRANSLUCENT = 'rgba(0, 170, 255, 0.6)'

const meta = {
  args: {
    defaultValue: BLUE,
    xChannel: 'saturation',
    yChannel: 'lightness',
  },
  component: ColorArea,
  title: 'Components/ColorArea',
} satisfies Meta<typeof ColorArea>

type Story = StoryObj<typeof meta>

const Overview: Story = {
  render: () => (
    <div {...stylex.props(styles.page)}>
      <header {...stylex.props(styles.header)}>
        <Text render={HEADING_1} variant="displaySmall">
          ColorArea
        </Text>
        <Text render={PARAGRAPH} tone="muted" variant="bodyLarge">
          Two channels of a colour at once, as a plane.
        </Text>
      </header>

      <Separator />

      <section {...stylex.props(styles.section)}>
        <div {...stylex.props(styles.intro)}>
          <Text render={HEADING_2} variant="titleLarge">
            Two channels at once
          </Text>
          <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
            React Aria paints both gradients and moves the handle in two axes.
            The handle is the one ColorSlider draws, so a plane and the sliders
            beside it cannot come apart.
          </Text>
          <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
            The plane takes the width it is given and stays square: two channels
            sharing an oblong would get unequal travel, so the same drag would
            move one further than the other.
          </Text>
        </div>
        <div {...stylex.props(styles.row)}>
          <div {...stylex.props(styles.picker)}>
            <ColorArea
              defaultValue={BLUE}
              xChannel="saturation"
              yChannel="lightness"
            />
            <ColorSlider channel="hue" defaultValue={BLUE} label="Hue" />
          </div>
          <div {...stylex.props(styles.widthNarrow)}>
            <ColorArea
              defaultValue={BLUE}
              xChannel="saturation"
              yChannel="lightness"
            />
          </div>
        </div>
      </section>

      <Separator />

      <section {...stylex.props(styles.section)}>
        <div {...stylex.props(styles.intro)}>
          <Text render={HEADING_2} variant="titleLarge">
            Alpha, and a plane ruled out
          </Text>
          <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
            Alpha is a channel of a plane only in RGB, and even there the plane
            stays opaque — React Aria stacks its gradients so the topmost covers
            the box, which is why this carries no chequer where a swatch and a
            slider&apos;s alpha track both do. Asked for alpha in HSL it draws
            saturation and lightness instead, and says nothing. Disabled, the
            plane fades.
          </Text>
        </div>
        <div {...stylex.props(styles.row)}>
          <div {...stylex.props(styles.width)}>
            <ColorArea
              defaultValue={TRANSLUCENT}
              xChannel="red"
              yChannel="alpha"
            />
          </div>
          <div {...stylex.props(styles.width)}>
            <ColorArea
              defaultValue={BLUE}
              isDisabled
              xChannel="saturation"
              yChannel="lightness"
            />
          </div>
        </div>
      </section>
    </div>
  ),
}

const Default: Story = {
  render: (args) => (
    <div {...stylex.props(styles.width)}>
      <ColorArea {...args} />
    </div>
  ),
}

// Its own story because alpha is the one channel pairing that behaves
// differently from the rest — and the one a consumer is most likely to
// reach for and find does nothing in HSL.
const Alpha: Story = {
  args: {
    defaultValue: TRANSLUCENT,
    xChannel: 'red',
    yChannel: 'alpha',
  },
  render: (args) => (
    <div {...stylex.props(styles.width)}>
      <ColorArea {...args} />
    </div>
  ),
}

const Disabled: Story = {
  args: {
    isDisabled: true,
  },
  render: (args) => (
    <div {...stylex.props(styles.width)}>
      <ColorArea {...args} />
    </div>
  ),
}

export { Alpha, Default, Disabled, Overview }

export default meta
