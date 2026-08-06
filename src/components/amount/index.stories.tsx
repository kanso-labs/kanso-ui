import type { Meta, StoryObj } from '@storybook/react-vite'

import * as stylex from '@stylexjs/stylex'

import Amount from '.'
import {
  colors,
  radii,
  spacing,
  typography,
} from '../../tokens/design.tokens.stylex'
import Text from '../text'

// Every story pins an explicit locale. Without one the component formats for
// whatever locale the browser is set to, which would make the Chromatic
// snapshot depend on the machine that took it.
const LOCALE = 'en-US'

// Widths chosen to differ in the integer part, since lining those up on the
// decimal point is exactly what tabular figures are for.
const LEDGER = [
  ['Groceries', -128.4],
  ['Rent', -1450],
  ['Refund', 62.05],
  ['Utilities', -9.99],
] as const satisfies [string, number][]

const styles = stylex.create({
  card: {
    backgroundColor: colors.surfaceContainer,
    borderRadius: radii.lg,
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.sm,
    inlineSize: '300px',
    padding: spacing.lg,
  },
  // The amount sets no size of its own, so this is how a hero figure is made.
  hero: {
    fontSize: typography.displaySmallSize,
  },
  row: {
    alignItems: 'center',
    display: 'flex',
    gap: spacing.md,
    justifyContent: 'space-between',
  },
  stack: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.md,
  },
})

const meta = {
  args: {
    locale: LOCALE,
    value: 42.5,
  },
  component: Amount,
  title: 'Components/Amount',
} satisfies Meta<typeof Amount>

type Story = StoryObj<typeof meta>

// The three tones `auto` resolves to, in the order a reader meets them: owed,
// owing, and settled.
const Tones: Story = {
  render: (args) => (
    <div {...stylex.props(styles.stack)}>
      <Amount {...args} value={42.5} />
      <Amount {...args} value={-12.5} />
      <Amount {...args} value={0} />
    </div>
  ),
}

const Signs: Story = {
  render: (args) => (
    <div {...stylex.props(styles.stack)}>
      <Amount {...args} sign="auto" value={42.5} />
      <Amount {...args} sign="always" value={42.5} />
      <Amount {...args} sign="never" value={-12.5} />
    </div>
  ),
}

const Currencies: Story = {
  render: (args) => (
    <div {...stylex.props(styles.stack)}>
      <Amount {...args} currency="USD" />
      <Amount {...args} currency="EUR" locale="de-DE" />
      <Amount {...args} currency="JPY" locale="ja-JP" />
    </div>
  ),
}

// Tabular figures are the reason a column of amounts is readable at all, so
// the ledger is where they earn their place: the decimal points line up even
// though the integer parts are different widths.
const InALedger: Story = {
  render: (args) => (
    <div {...stylex.props(styles.card)}>
      {LEDGER.map(([label, value]) => (
        <div key={label} {...stylex.props(styles.row)}>
          <Text variant="bodyMedium">{label}</Text>
          <Amount {...args} value={value} />
        </div>
      ))}
    </div>
  ),
}

// Size comes from the container, which is the whole reason the component sets
// none — the same element reads as a hero figure inside larger type.
const Hero: Story = {
  render: (args) => (
    <div {...stylex.props(styles.hero)}>
      <Amount {...args} value={1284.32} />
    </div>
  ),
}

export { Currencies, Hero, InALedger, Signs, Tones }

export default meta
