import type { Meta, StoryObj } from '@storybook/react-vite'

import * as stylex from '@stylexjs/stylex'

import ColorSwatch from '.'
import { parseColor } from '../../react-aria'
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
  large: {
    blockSize: '72px',
    inlineSize: '72px',
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
    gap: spacing.sm,
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.lg,
  },
})

const meta = {
  args: {
    color: '#6750A4',
  },
  component: ColorSwatch,
  title: 'Components/ColorSwatch',
} satisfies Meta<typeof ColorSwatch>

type Story = StoryObj<typeof meta>

const Overview: Story = {
  render: () => (
    <div {...stylex.props(styles.page)}>
      <header {...stylex.props(styles.header)}>
        <Text render={HEADING_1} variant="displaySmall">
          ColorSwatch
        </Text>
        <Text render={PARAGRAPH} tone="muted" variant="bodyLarge">
          A colour shown as a value, with a chequer behind so transparency reads
          as transparency.
        </Text>
      </header>

      <Separator />

      <section {...stylex.props(styles.section)}>
        <div {...stylex.props(styles.intro)}>
          <Text render={HEADING_2} variant="titleLarge">
            Opaque colours
          </Text>
          <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
            Each swatch is outlined, since its own colour is the content and
            cannot carry a contrasting edge — a white one on a light surface
            would otherwise have none at all.
          </Text>
        </div>
        <div {...stylex.props(styles.row)}>
          <ColorSwatch color="#6750A4" />
          <ColorSwatch color="#625B71" />
          <ColorSwatch color="#7D5260" />
          <ColorSwatch color="#1D1B20" />
          <ColorSwatch color="#FFFFFF" />
        </div>
      </section>

      <Separator />

      <section {...stylex.props(styles.section)}>
        <div {...stylex.props(styles.intro)}>
          <Text render={HEADING_2} variant="titleLarge">
            Transparency
          </Text>
          <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
            The chequer is the only thing telling a half-transparent colour from
            an opaque one of the same shade. It is built from surface tokens, so
            it follows the theme.
          </Text>
        </div>
        <div {...stylex.props(styles.row)}>
          <ColorSwatch color={parseColor('hsla(265, 35%, 47%, 1)')} />
          <ColorSwatch color={parseColor('hsla(265, 35%, 47%, 0.75)')} />
          <ColorSwatch color={parseColor('hsla(265, 35%, 47%, 0.5)')} />
          <ColorSwatch color={parseColor('hsla(265, 35%, 47%, 0.25)')} />
          <ColorSwatch color={parseColor('hsla(265, 35%, 47%, 0)')} />
        </div>
      </section>

      <Separator />

      <section {...stylex.props(styles.section)}>
        <div {...stylex.props(styles.intro)}>
          <Text render={HEADING_2} variant="titleLarge">
            Size
          </Text>
          <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
            The call site&apos;s class lands on the square around the swatch,
            which is what carries the size — the colour fills whatever square it
            is given.
          </Text>
        </div>
        <div {...stylex.props(styles.row)}>
          <ColorSwatch color="#6750A4" />
          <ColorSwatch
            color={parseColor('hsla(200, 100%, 50%, 0.4)')}
            {...stylex.props(styles.large)}
          />
        </div>
      </section>
    </div>
  ),
}

const Default: Story = {}

// Its own story because the chequer is the component's one drawing decision,
// and an opaque swatch never shows it.
const Transparent: Story = {
  args: {
    color: parseColor('hsla(200, 100%, 50%, 0.4)'),
  },
}

export { Default, Overview, Transparent }

export default meta
