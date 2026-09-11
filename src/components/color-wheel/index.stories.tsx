import type { Meta, StoryObj } from '@storybook/react-vite'

import * as stylex from '@stylexjs/stylex'

import ColorWheel from '.'
import { spacing } from '../../tokens/design.tokens.stylex'
import ColorArea from '../color-area'
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
  // What sits in the hole: centred on the wheel, and small enough to clear
  // the band on every side.
  inside: {
    inlineSize: '100px',
    insetBlockStart: '50%',
    insetInlineStart: '50%',
    position: 'absolute',
    transform: 'translate(-50%, -50%)',
  },
  intro: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.xxs,
  },
  nest: {
    display: 'inline-block',
    position: 'relative',
  },
  page: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.xl,
    marginInline: 'auto',
    maxInlineSize: '960px',
    padding: spacing.xl,
  },
  row: {
    alignItems: 'center',
    display: 'flex',
    flexWrap: 'wrap',
    gap: spacing.xl,
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.lg,
  },
})

const BLUE = 'hsl(200, 100%, 50%)'

const meta = {
  args: {
    defaultValue: BLUE,
  },
  component: ColorWheel,
  title: 'Components/ColorWheel',
} satisfies Meta<typeof ColorWheel>

type Story = StoryObj<typeof meta>

const Overview: Story = {
  render: () => (
    <div {...stylex.props(styles.page)}>
      <header {...stylex.props(styles.header)}>
        <Text render={HEADING_1} variant="displaySmall">
          ColorWheel
        </Text>
        <Text render={PARAGRAPH} tone="muted" variant="bodyLarge">
          Hue as a ring, with a handle on it.
        </Text>
      </header>

      <Separator />

      <section {...stylex.props(styles.section)}>
        <div {...stylex.props(styles.intro)}>
          <Text render={HEADING_2} variant="titleLarge">
            One band, as wide as a slider&apos;s
          </Text>
          <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
            A hue wheel and a hue slider are the same control in two shapes, so
            the band a reader drags along is the same width in both. The
            thickness is a prop and the inner radius is derived from it, which
            is what stops the two disagreeing.
          </Text>
        </div>
        <div {...stylex.props(styles.row)}>
          <ColorWheel defaultValue={BLUE} />
          <ColorWheel defaultValue={BLUE} outerRadius={70} />
          <ColorWheel defaultValue={BLUE} outerRadius={70} thickness={32} />
        </div>
      </section>

      <Separator />

      <section {...stylex.props(styles.section)}>
        <div {...stylex.props(styles.intro)}>
          <Text render={HEADING_2} variant="titleLarge">
            The middle is genuinely empty
          </Text>
          <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
            The hole is cut with a mask rather than covered by a disc, so
            whatever the wheel sits over shows through — and a colour area can
            sit inside one, which is what a picker built from both looks like.
          </Text>
        </div>
        <div {...stylex.props(styles.row)}>
          <div {...stylex.props(styles.nest)}>
            <ColorWheel defaultValue={BLUE} />
            <ColorArea
              defaultValue={BLUE}
              xChannel="saturation"
              yChannel="lightness"
              {...stylex.props(styles.inside)}
            />
          </div>
          <ColorWheel defaultValue={BLUE} isDisabled />
        </div>
      </section>
    </div>
  ),
}

const Default: Story = {}

// Its own story because a band this wide is what shows the inner radius
// following the thickness rather than being set beside it.
const Thick: Story = {
  args: {
    outerRadius: 70,
    thickness: 32,
  },
}

const Disabled: Story = {
  args: {
    isDisabled: true,
  },
}

export { Default, Disabled, Overview, Thick }

export default meta
