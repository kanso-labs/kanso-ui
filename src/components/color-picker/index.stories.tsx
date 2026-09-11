import type { Meta, StoryObj } from '@storybook/react-vite'

import * as stylex from '@stylexjs/stylex'

import ColorPicker from '.'
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
  row: {
    alignItems: 'center',
    display: 'flex',
    flexWrap: 'wrap',
    gap: spacing.lg,
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.lg,
  },
})

const PURPLE = '#6750A4'

const meta = {
  args: {
    defaultValue: PURPLE,
    label: 'Label',
  },
  component: ColorPicker,
  title: 'Components/ColorPicker',
} satisfies Meta<typeof ColorPicker>

type Story = StoryObj<typeof meta>

const Overview: Story = {
  render: () => (
    <div {...stylex.props(styles.page)}>
      <header {...stylex.props(styles.header)}>
        <Text render={HEADING_1} variant="displaySmall">
          ColorPicker
        </Text>
        <Text render={PARAGRAPH} tone="muted" variant="bodyLarge">
          A colour picked from a plane, a hue strip and a text field.
        </Text>
      </header>

      <Separator />

      <section {...stylex.props(styles.section)}>
        <div {...stylex.props(styles.intro)}>
          <Text render={HEADING_2} variant="titleLarge">
            Everything in this phase, in one control
          </Text>
          <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
            React Aria&apos;s picker renders nothing of its own — it is the
            state a plane, two strips, a field and a swatch share. The trigger
            is a swatch beside a name rather than a swatch alone, since a
            coloured square says nothing about being pressable.
          </Text>
          <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
            Press one to see the surface. Above the medium breakpoint it is
            docked to the trigger; below it, it opens centred, the same swap
            DatePicker makes.
          </Text>
        </div>
        <div {...stylex.props(styles.row)}>
          <ColorPicker defaultValue={PURPLE} label="Label" />
          <ColorPicker alpha defaultValue={PURPLE} label="With alpha" />
          <ColorPicker defaultValue={PURPLE} isDisabled label="Label" />
        </div>
      </section>
    </div>
  ),
}

const Default: Story = {}

// Its own story because the surface is the half a closed picker cannot show,
// and it is the state a reviewer most wants to look at.
const Open: Story = {
  args: {
    defaultOpen: true,
  },
}

// Its own story because the alpha strip adds a row to the surface, which
// only shows while it is open.
const WithAlpha: Story = {
  args: {
    alpha: true,
    defaultOpen: true,
  },
}

const Disabled: Story = {
  args: {
    isDisabled: true,
  },
}

export { Default, Disabled, Open, Overview, WithAlpha }

export default meta
