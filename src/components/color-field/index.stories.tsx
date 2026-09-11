import type { Meta, StoryObj } from '@storybook/react-vite'

import * as stylex from '@stylexjs/stylex'

import ColorField from '.'
import { spacing } from '../../tokens/design.tokens.stylex'
import ColorSwatch from '../color-swatch'
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
  row: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: spacing.lg,
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.lg,
  },
  width: {
    inlineSize: '240px',
  },
})

const PURPLE = '#6750A4'
// Hoisted, which is what react-perf's no-jsx-as-prop is after.
const PURPLE_SWATCH = <ColorSwatch color={PURPLE} />

const meta = {
  args: {
    defaultValue: PURPLE,
    label: 'Label',
  },
  component: ColorField,
  title: 'Components/ColorField',
} satisfies Meta<typeof ColorField>

type Story = StoryObj<typeof meta>

const Overview: Story = {
  render: () => (
    <div {...stylex.props(styles.page)}>
      <header {...stylex.props(styles.header)}>
        <Text render={HEADING_1} variant="displaySmall">
          ColorField
        </Text>
        <Text render={PARAGRAPH} tone="muted" variant="bodyLarge">
          A colour typed rather than picked.
        </Text>
      </header>

      <Separator />

      <section {...stylex.props(styles.section)}>
        <div {...stylex.props(styles.intro)}>
          <Text render={HEADING_2} variant="titleLarge">
            The box every field draws
          </Text>
          <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
            React Aria renders a plain text input holding the colour&apos;s own
            notation, so this is the text fields page&apos;s box with nothing
            added — a colour field on a form is the same shape as the text field
            beside it. A swatch at the leading end is what makes it show the
            colour it holds.
          </Text>
        </div>
        <div {...stylex.props(styles.row)}>
          <div {...stylex.props(styles.width)}>
            <ColorField defaultValue={PURPLE} label="Label" />
          </div>
          <div {...stylex.props(styles.width)}>
            <ColorField
              defaultValue={PURPLE}
              label="Label"
              leadingIcon={PURPLE_SWATCH}
            />
          </div>
          <div {...stylex.props(styles.width)}>
            <ColorField
              defaultValue={PURPLE}
              label="Label"
              variant="outlined"
            />
          </div>
        </div>
      </section>

      <Separator />

      <section {...stylex.props(styles.section)}>
        <div {...stylex.props(styles.intro)}>
          <Text render={HEADING_2} variant="titleLarge">
            One channel, and the usual states
          </Text>
          <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
            A channel turns the field from a colour into a number a reader can
            step, which is what a picker&apos;s boxes beside a plane are.
            Supporting text, an error that replaces it, and the disabled fade
            every field here takes.
          </Text>
        </div>
        <div {...stylex.props(styles.row)}>
          <div {...stylex.props(styles.width)}>
            <ColorField
              channel="hue"
              colorSpace="hsl"
              defaultValue={PURPLE}
              label="Hue"
            />
          </div>
          <div {...stylex.props(styles.width)}>
            <ColorField
              defaultValue={PURPLE}
              description="Supporting line"
              label="Label"
            />
          </div>
          <div {...stylex.props(styles.width)}>
            <ColorField
              defaultValue={PURPLE}
              error="Supporting line"
              label="Label"
            />
          </div>
          <div {...stylex.props(styles.width)}>
            <ColorField defaultValue={PURPLE} isDisabled label="Label" />
          </div>
        </div>
      </section>
    </div>
  ),
}

const Default: Story = {}

// Its own story because a swatch beside the value is what makes the field
// show the colour, and it is the call site's to pass.
const WithSwatch: Story = {
  args: {
    leadingIcon: <ColorSwatch color={PURPLE} />,
  },
}

const Outlined: Story = {
  args: {
    variant: 'outlined',
  },
}

// Its own story because a channel field holds a number rather than a colour,
// which is a different thing to look at.
const Channel: Story = {
  args: {
    channel: 'hue',
    colorSpace: 'hsl',
    label: 'Hue',
  },
}

const WithError: Story = {
  args: {
    error: 'Supporting line',
  },
}

export { Channel, Default, Outlined, Overview, WithError, WithSwatch }

export default meta
