import type { Meta, StoryObj } from '@storybook/react-vite'

import * as stylex from '@stylexjs/stylex'
import { I18nProvider } from 'react-aria-components'

import TimePicker from '.'
import { Time } from '../../date'
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

// A fixed time, so every snapshot reads the same whenever it is taken.
const TIME = new Time(9, 30)

const meta = {
  args: {
    defaultValue: TIME,
    label: 'Label',
  },
  component: TimePicker,
  title: 'Components/TimePicker',
} satisfies Meta<typeof TimePicker>

type Story = StoryObj<typeof meta>

const Overview: Story = {
  render: () => (
    <div {...stylex.props(styles.page)}>
      <header {...stylex.props(styles.header)}>
        <Text render={HEADING_1} variant="displaySmall">
          TimePicker
        </Text>
        <Text render={PARAGRAPH} tone="muted" variant="bodyLarge">
          A time typed into a field, or picked on a dial behind the clock
          button.
        </Text>
      </header>

      <Separator />

      <section {...stylex.props(styles.section)}>
        <div {...stylex.props(styles.intro)}>
          <Text render={HEADING_2} variant="titleLarge">
            The field
          </Text>
          <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
            TimeField&apos;s segments, with the clock button in the box&apos;s
            trailing slot. The button opens the picker as a modal at every
            width, since the time pickers page has no docked form.
          </Text>
        </div>
        <div {...stylex.props(styles.row)}>
          <div {...stylex.props(styles.width)}>
            <TimePicker defaultValue={TIME} label="Label" />
          </div>
          <div {...stylex.props(styles.width)}>
            <TimePicker label="Label" />
          </div>
          <div {...stylex.props(styles.width)}>
            <TimePicker label="Label" variant="outlined" />
          </div>
        </div>
      </section>

      <Separator />

      <section {...stylex.props(styles.section)}>
        <div {...stylex.props(styles.intro)}>
          <Text render={HEADING_2} variant="titleLarge">
            Twelve or twenty-four hours
          </Text>
          <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
            The reader&apos;s locale decides, as it does for TimeField: `en-US`
            draws a period selector beside the boxes and one ring of hours,
            `en-GB` no period selector and the afternoon on an inner ring.
          </Text>
        </div>
        <div {...stylex.props(styles.row)}>
          <I18nProvider locale="en-US">
            <div {...stylex.props(styles.width)}>
              <TimePicker
                defaultValue={TIME}
                description="en-US"
                label="Label"
              />
            </div>
          </I18nProvider>
          <I18nProvider locale="en-GB">
            <div {...stylex.props(styles.width)}>
              <TimePicker
                defaultValue={TIME}
                description="en-GB"
                label="Label"
              />
            </div>
          </I18nProvider>
        </div>
      </section>

      <Separator />

      <section {...stylex.props(styles.section)}>
        <div {...stylex.props(styles.intro)}>
          <Text render={HEADING_2} variant="titleLarge">
            States
          </Text>
          <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
            Supporting text under the box, an error that replaces it, and the
            disabled fade, which stops the clock button with the segments.
          </Text>
        </div>
        <div {...stylex.props(styles.row)}>
          <div {...stylex.props(styles.width)}>
            <TimePicker
              defaultValue={TIME}
              description="Supporting line"
              label="Label"
            />
          </div>
          <div {...stylex.props(styles.width)}>
            <TimePicker
              defaultValue={TIME}
              error="Supporting line"
              label="Label"
            />
          </div>
          <div {...stylex.props(styles.width)}>
            <TimePicker defaultValue={TIME} isDisabled label="Label" />
          </div>
        </div>
      </section>
    </div>
  ),
}

const Default: Story = {}

// The modal open on the dial, which is what the clock button shows first.
const Dial: Story = {
  args: {
    defaultOpen: true,
  },
  parameters: { docs: { story: { height: '760px', inline: false } } },
}

// The dial on a twenty-four hour clock, the afternoon's hours on the inner
// ring and no period selector beside the boxes.
const TwentyFourHours: Story = {
  args: {
    defaultOpen: true,
    defaultValue: new Time(15, 30),
  },
  parameters: { docs: { story: { height: '760px', inline: false } } },
  render: (args) => (
    <I18nProvider locale="en-GB">
      <TimePicker {...args} />
    </I18nProvider>
  ),
}

// The page's input variant: the boxes as text fields, named underneath, and
// the clock icon that goes back to the dial.
const Input: Story = {
  args: {
    defaultMode: 'input',
    defaultOpen: true,
  },
  parameters: { docs: { story: { height: '620px', inline: false } } },
}

export { Default, Dial, Input, Overview, TwentyFourHours }

export default meta
