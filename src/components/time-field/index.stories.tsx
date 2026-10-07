import type { Meta, StoryObj } from '@storybook/react-vite'

import * as stylex from '@stylexjs/stylex'
import { I18nProvider } from 'react-aria-components'

import TimeField from '.'
import { Time } from '../../date'
import { spacing } from '../../tokens/design.tokens.stylex'

const styles = stylex.create({
  row: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: spacing.lg,
  },
  width: {
    inlineSize: '240px',
  },
})

// A fixed time, so every snapshot reads the same whenever it is taken.
const TIME = new Time(9, 30)

const meta = {
  args: {
    defaultValue: TIME,
    label: 'Label',
  },
  component: TimeField,
  title: 'Components/TimeField',
} satisfies Meta<typeof TimeField>

type Story = StoryObj<typeof meta>

const Default: Story = {}

// Its own story because an empty field is the one that shows the segment
// placeholders, which are what a reader types over.
const Empty: Story = {
  args: {
    defaultValue: undefined,
  },
}

const Outlined: Story = {
  args: {
    variant: 'outlined',
  },
}

// Its own story because seconds change how many focus stops the field has.
const WithSeconds: Story = {
  args: {
    granularity: 'second',
  },
}

const WithError: Story = {
  args: {
    error: 'Supporting line',
  },
}

// Which clock a reader sees is their locale's, set through React Aria's
// `I18nProvider`: `en-US` adds a day-period segment and `en-GB` does not. The
// two sit side by side, which the toolbar's Locale control cannot show.
const TwelveOrTwentyFourHours: Story = {
  render: () => (
    <div {...stylex.props(styles.row)}>
      <I18nProvider locale="en-US">
        <div {...stylex.props(styles.width)}>
          <TimeField defaultValue={TIME} description="en-US" label="Label" />
        </div>
      </I18nProvider>
      <I18nProvider locale="en-GB">
        <div {...stylex.props(styles.width)}>
          <TimeField defaultValue={TIME} description="en-GB" label="Label" />
        </div>
      </I18nProvider>
    </div>
  ),
}

export {
  Default,
  Empty,
  Outlined,
  TwelveOrTwentyFourHours,
  WithError,
  WithSeconds,
}

export default meta
