import type { Meta, StoryObj } from '@storybook/react-vite'

import * as stylex from '@stylexjs/stylex'

import ColorSwatchPicker from '.'
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
  width: {
    maxInlineSize: '320px',
  },
})

const PALETTE = ['#6750A4', '#625B71', '#7D5260', '#B3261E', '#386A20']
const WIDE = [
  '#6750A4',
  '#625B71',
  '#7D5260',
  '#B3261E',
  '#386A20',
  '#00658F',
  '#8C4A00',
  '#4A4458',
  '#1D1B20',
  '#FFFFFF',
]

const meta = {
  args: {
    'aria-label': 'Label',
    children: PALETTE.map((color) => (
      <ColorSwatchPicker.Item color={color} key={color} />
    )),
    defaultValue: PALETTE[0],
  },
  component: ColorSwatchPicker,
  title: 'Components/ColorSwatchPicker',
} satisfies Meta<typeof ColorSwatchPicker>

type Story = StoryObj<typeof meta>

const Overview: Story = {
  render: () => (
    <div {...stylex.props(styles.page)}>
      <header {...stylex.props(styles.header)}>
        <Text render={HEADING_1} variant="displaySmall">
          ColorSwatchPicker
        </Text>
        <Text render={PARAGRAPH} tone="muted" variant="bodyLarge">
          A row of colours to choose one from, drawn as swatches.
        </Text>
      </header>

      <Separator />

      <section {...stylex.props(styles.section)}>
        <div {...stylex.props(styles.intro)}>
          <Text render={HEADING_2} variant="titleLarge">
            Choosing a colour
          </Text>
          <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
            It is a listbox, so arrow keys move between colours rather than each
            swatch taking a tab stop. The chosen one carries a ring around it —
            a tick drawn over a colour would have to be readable against every
            colour in the row, which no single ink is.
          </Text>
        </div>
        <ColorSwatchPicker aria-label="Label" defaultValue={PALETTE[0]}>
          {PALETTE.map((color) => (
            <ColorSwatchPicker.Item color={color} key={color} />
          ))}
        </ColorSwatchPicker>
      </section>

      <Separator />

      <section {...stylex.props(styles.section)}>
        <div {...stylex.props(styles.intro)}>
          <Text render={HEADING_2} variant="titleLarge">
            Wrapping, and a colour ruled out
          </Text>
          <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
            A palette wider than its container becomes rows rather than a
            scrollbar. A swatch that cannot be chosen fades, and stays in place
            so the palette keeps its shape.
          </Text>
        </div>
        <div {...stylex.props(styles.width)}>
          <ColorSwatchPicker aria-label="Label" defaultValue={WIDE[5]}>
            {WIDE.map((color, index) => (
              <ColorSwatchPicker.Item
                color={color}
                isDisabled={index === 3}
                key={color}
              />
            ))}
          </ColorSwatchPicker>
        </div>
      </section>
    </div>
  ),
}

const Default: Story = {}

// Its own story because wrapping is what a palette longer than one row does,
// and the default one never reaches the edge.
const Wrapped: Story = {
  args: {
    children: WIDE.map((color) => (
      <ColorSwatchPicker.Item color={color} key={color} />
    )),
    defaultValue: WIDE[5],
  },
  render: (args) => (
    <div {...stylex.props(styles.width)}>
      <ColorSwatchPicker {...args} />
    </div>
  ),
}

// Its own story because a ruled-out colour is a state a consumer looks at,
// and it is drawn on the item rather than on the picker.
const WithDisabled: Story = {
  args: {
    children: PALETTE.map((color, index) => (
      <ColorSwatchPicker.Item
        color={color}
        isDisabled={index === 2}
        key={color}
      />
    )),
  },
}

export { Default, Overview, WithDisabled, Wrapped }

export default meta
