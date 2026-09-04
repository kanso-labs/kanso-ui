import type { Meta, StoryObj } from '@storybook/react-vite'

import * as stylex from '@stylexjs/stylex'

import TextField from '.'
import { spacing } from '../../tokens/design.tokens.stylex'
import Separator from '../separator'
import Text from '../text'

// See avatar/index.stories.tsx for why the overview is built from the
// library's own components, why its sections are divided by a rule, and why
// the headings go through Text's `render`.
// oxlint-disable-next-line jsx-a11y/heading-has-content -- filled by useRender
const HEADING_1 = <h1 />
// oxlint-disable-next-line jsx-a11y/heading-has-content -- filled by useRender
const HEADING_2 = <h2 />
const PARAGRAPH = <p />

const styles = stylex.create({
  // A field fills its container, so the samples need a width to fill. Two
  // side by side is also what shows that a field with a message below it does
  // not shift the one beside it.
  columns: {
    display: 'grid',
    gap: spacing.lg,
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
  },
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
})

const meta = {
  args: {
    defaultValue: 'Value',
    label: 'Label',
  },
  component: TextField,
  title: 'Components/TextField',
} satisfies Meta<typeof TextField>

type Story = StoryObj<typeof meta>

const Overview: Story = {
  render: () => (
    <div {...stylex.props(styles.page)}>
      <header {...stylex.props(styles.header)}>
        <Text render={HEADING_1} variant="displaySmall">
          TextField
        </Text>
        <Text render={PARAGRAPH} tone="muted" variant="bodyLarge">
          A filled field: a tinted box, a small label held at the top, and an
          underline that carries the focus and error states.
        </Text>
      </header>

      <Separator />

      <section {...stylex.props(styles.section)}>
        <div {...stylex.props(styles.intro)}>
          <Text render={HEADING_2} variant="titleLarge">
            States
          </Text>
          <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
            Focus and error are both drawn on the underline, as an inset shadow
            rather than a border that thickens — a border growing from 1px to
            2px would push everything below the field down by a pixel each time
            focus arrived.
          </Text>
        </div>
        <div {...stylex.props(styles.columns)}>
          <TextField defaultValue="Value" label="Label" />
          <TextField
            defaultValue="Value"
            description="Supporting line"
            label="With a description"
          />
          <TextField
            defaultValue=""
            error="Enter a value."
            label="With an error"
          />
          <TextField defaultValue="Value" isDisabled label="Disabled" />
        </div>
      </section>

      <Separator />

      <section {...stylex.props(styles.section)}>
        <div {...stylex.props(styles.intro)}>
          <Text render={HEADING_2} variant="titleLarge">
            Numeric
          </Text>
          <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
            The mono face with tabular figures, so digits are one width and a
            column of values lines up. The label and the box are unchanged —
            only the value's face differs.
          </Text>
        </div>
        <div {...stylex.props(styles.columns)}>
          <TextField defaultValue="01234.56" label="Default" />
          <TextField defaultValue="01234.56" label="Numeric" numeric />
        </div>
      </section>
    </div>
  ),
}

const Default: Story = {}

const WithDescription: Story = {
  args: {
    description: 'Supporting line',
  },
}

// Its own story because the error state is three changes at once — the
// underline, the label, and the message that replaces the description.
const WithError: Story = {
  args: {
    defaultValue: '',
    description: 'Supporting line',
    error: 'Enter a value.',
  },
}

const Numeric: Story = {
  args: {
    defaultValue: '01234.56',
    numeric: true,
  },
}

const Disabled: Story = {
  args: {
    isDisabled: true,
  },
}

export { Default, Disabled, Numeric, Overview, WithDescription, WithError }

export default meta
