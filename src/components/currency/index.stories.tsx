import type { Meta, StoryObj } from '@storybook/react-vite'

import * as stylex from '@stylexjs/stylex'

import Currency from '.'
import {
  colors,
  radii,
  spacing,
  typography,
} from '../../tokens/design.tokens.stylex'
import List from '../list'
import Text from '../text'

// Widths chosen to differ in the integer part, since lining those up on the
// decimal point is exactly what tabular figures are for.
const LEDGER = [
  ['First item', -128.4],
  ['Second item', -1450],
  ['Third item', 62.05],
  ['Fourth item', -9.99],
] as const satisfies [string, number][]

// The second row is the selected one, and the amounts take every sign.
// Hoisted so neither the keys nor the slots are new values on every render,
// which is what react-perf's array and JSX rules are after.
const SELECTED = ['second']
const FIRST_AMOUNT = <Currency tone="inherit" value={1250} />
const SECOND_AMOUNT = <Currency tone="inherit" value={-480} />
const THIRD_AMOUNT = <Currency tone="inherit" value={0} />

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
  // Currency sets no size of its own, so this is how a hero figure is made.
  hero: {
    fontSize: typography.displaySmallSize,
  },
  // A list fills what it is given, so the sample needs a width and something
  // to sit on, as List's own stories give it, and capped as they cap it.
  list: {
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: radii.md,
    boxSizing: 'border-box',
    inlineSize: '100%',
    maxInlineSize: '360px',
    overflow: 'hidden',
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

// No story names a locale it is not about, so the amounts follow the Locale
// toolbar through the decorator's I18nProvider. The provider opens on English,
// which is what keeps a snapshot the same whichever machine takes it.
const meta = {
  args: {
    currency: 'USD',
    value: 42.5,
  },
  component: Currency,
  title: 'Components/Currency',
} satisfies Meta<typeof Currency>

type Story = StoryObj<typeof meta>

// One amount, so every control drives the figure on the canvas.
const Default: Story = {}

// The three tones `auto` resolves to, in the order it decides them: a
// positive value, a negative one, and zero.
const Tones: Story = {
  render: (args) => (
    <div {...stylex.props(styles.stack)}>
      <Currency {...args} value={42.5} />
      <Currency {...args} value={-12.5} />
      <Currency {...args} value={0} />
    </div>
  ),
}

const Signs: Story = {
  render: (args) => (
    <div {...stylex.props(styles.stack)}>
      <Currency {...args} sign="auto" value={42.5} />
      <Currency {...args} sign="always" value={42.5} />
      <Currency {...args} sign="never" value={-12.5} />
    </div>
  ),
}

// Each currency in a locale of its own. The Egyptian pound is written right
// to left, as Arabic is, whatever the page's direction: the amount carries its
// locale's `lang` and `dir`. Every row names its currency, so that control is
// off here. The first row takes its locale from the toolbar or the locale
// control, and the rest name their own.
const Currencies: Story = {
  argTypes: {
    currency: { control: false },
  },
  render: (args) => (
    <div {...stylex.props(styles.stack)}>
      <Currency {...args} currency="USD" />
      <Currency {...args} currency="EUR" locale="de-DE" />
      <Currency {...args} currency="JPY" locale="ja-JP" />
      <Currency {...args} currency="EGP" locale="ar-EG" />
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
          <Currency {...args} value={value} />
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
      <Currency {...args} value={1284.32} />
    </div>
  ),
}

// A hero figure too long for a narrow container: an amount has no break
// opportunity, so in full it overflows rather than wrapping. Compact notation
// shortens it to a few digits and a scale, rounded to two significant digits
// unless a fraction-digit count says otherwise.
const Compact: Story = {
  render: (args) => (
    <div {...stylex.props(styles.hero, styles.stack)}>
      <Currency {...args} notation="compact" value={12_345_678_901.23} />
      <Currency
        {...args}
        maximumFractionDigits={1}
        notation="compact"
        value={-12_345_678.9}
      />
    </div>
  ),
}

// Over a selected row's container the positive and negative roles are one
// colour family on top of another, so the amounts take the inherit tone and
// read in the row's own colour, with the sign saying which way each goes.
const InASelectedRow: Story = {
  render: () => (
    <div {...stylex.props(styles.list)}>
      <List
        aria-label="Label"
        defaultSelectedKeys={SELECTED}
        selectionMode="single"
      >
        <List.Item id="first" trailing={FIRST_AMOUNT}>
          First item
        </List.Item>
        <List.Item id="second" trailing={SECOND_AMOUNT}>
          Second item
        </List.Item>
        <List.Item id="third" trailing={THIRD_AMOUNT}>
          Third item
        </List.Item>
      </List>
    </div>
  ),
}

export {
  Compact,
  Currencies,
  Default,
  Hero,
  InALedger,
  InASelectedRow,
  Signs,
  Tones,
}

export default meta
