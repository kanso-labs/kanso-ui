import type { Meta, StoryObj } from '@storybook/react-vite'

import * as stylex from '@stylexjs/stylex'

import ColorSlider from '.'
import { spacing } from '../../tokens/design.tokens.stylex'
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
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.lg,
  },
  stack: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.md,
    maxInlineSize: '360px',
  },
})

const BLUE = 'hsl(200, 100%, 50%)'
const TRANSLUCENT = 'hsla(200, 100%, 50%, 0.6)'

const meta = {
  args: {
    channel: 'hue',
    defaultValue: BLUE,
    label: 'Label',
  },
  component: ColorSlider,
  title: 'Components/ColorSlider',
} satisfies Meta<typeof ColorSlider>

type Story = StoryObj<typeof meta>

const Overview: Story = {
  render: () => (
    <div {...stylex.props(styles.page)}>
      <header {...stylex.props(styles.header)}>
        <Text render={HEADING_1} variant="displaySmall">
          ColorSlider
        </Text>
        <Text render={PARAGRAPH} tone="muted" variant="bodyLarge">
          A slider over one channel of a colour.
        </Text>
      </header>

      <Separator />

      <section {...stylex.props(styles.section)}>
        <div {...stylex.props(styles.intro)}>
          <Text render={HEADING_2} variant="titleLarge">
            One channel each
          </Text>
          <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
            React Aria paints the gradient and names the value, so the readout
            beside each label is what a screen reader is told. The handle
            carries the colour it sits on, which is why it is ringed rather than
            filled — its fill is the value.
          </Text>
        </div>
        <div {...stylex.props(styles.stack)}>
          <ColorSlider channel="hue" defaultValue={BLUE} label="Hue" />
          <ColorSlider
            channel="saturation"
            defaultValue={BLUE}
            label="Saturation"
          />
          <ColorSlider
            channel="lightness"
            defaultValue={BLUE}
            label="Lightness"
          />
        </div>
      </section>

      <Separator />

      <section {...stylex.props(styles.section)}>
        <div {...stylex.props(styles.intro)}>
          <Text render={HEADING_2} variant="titleLarge">
            Alpha, and a slider ruled out
          </Text>
          <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
            The alpha channel is the one that needs the chequer behind it: a
            track fading to transparent over a light surface and one fading to
            white are the same pixels without it. Disabled, the strip fades and
            the label does not — a control nobody can use still has to say what
            it was for.
          </Text>
        </div>
        <div {...stylex.props(styles.stack)}>
          <ColorSlider
            channel="alpha"
            defaultValue={TRANSLUCENT}
            label="Alpha"
          />
          <ColorSlider
            channel="hue"
            defaultValue={BLUE}
            isDisabled
            label="Label"
          />
          <ColorSlider
            channel="hue"
            defaultValue={BLUE}
            label="Label"
            showValue={false}
          />
        </div>
      </section>
    </div>
  ),
}

const Default: Story = {}

// Its own story because the chequer is only visible under a channel that
// fades out, and no other channel does.
const Alpha: Story = {
  args: {
    channel: 'alpha',
    defaultValue: TRANSLUCENT,
  },
}

const Disabled: Story = {
  args: {
    isDisabled: true,
  },
}

export { Alpha, Default, Disabled, Overview }

export default meta
