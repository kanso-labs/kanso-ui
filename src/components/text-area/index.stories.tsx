import type { Meta, StoryObj } from '@storybook/react-vite'

import * as stylex from '@stylexjs/stylex'

import TextArea from '.'
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

const THREE_LINES = 'First line.\nSecond line.\nThird line.'
const FIVE_LINES = `${THREE_LINES}\nFourth line.\nFifth line.`

const styles = stylex.create({
  // A field fills its container, so the samples need a width to fill. Two
  // side by side is also what shows that a field growing with its text does
  // not stretch the one beside it.
  columns: {
    alignItems: 'start',
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
    defaultValue: THREE_LINES,
    label: 'Label',
  },
  component: TextArea,
  title: 'Components/TextArea',
} satisfies Meta<typeof TextArea>

type Story = StoryObj<typeof meta>

const Overview: Story = {
  render: () => (
    <div {...stylex.props(styles.page)}>
      <header {...stylex.props(styles.header)}>
        <Text render={HEADING_1} variant="displaySmall">
          TextArea
        </Text>
        <Text render={PARAGRAPH} tone="muted" variant="bodyLarge">
          The filled field holding more than one line: the same box, floating
          label and underline as TextField, grown to fit its text.
        </Text>
      </header>

      <Separator />

      <section {...stylex.props(styles.section)}>
        <div {...stylex.props(styles.intro)}>
          <Text render={HEADING_2} variant="titleLarge">
            Rows
          </Text>
          <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
            The field shows three rows and grows as the text needs more, so
            nothing typed is ever out of view. Pass rows for another minimum,
            and autosize=&#123;false&#125; to keep the rows fixed and scroll the
            text inside instead.
          </Text>
        </div>
        <div {...stylex.props(styles.columns)}>
          <TextArea defaultValue={FIVE_LINES} label="Growing" />
          <TextArea
            autosize={false}
            defaultValue={FIVE_LINES}
            label="Fixed at three rows"
          />
          <TextArea
            defaultValue=""
            label="One row, until typed into"
            rows={1}
          />
        </div>
      </section>

      <Separator />

      <section {...stylex.props(styles.section)}>
        <div {...stylex.props(styles.intro)}>
          <Text render={HEADING_2} variant="titleLarge">
            States
          </Text>
          <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
            The states are TextField&apos;s, drawn by the same chrome: the label
            rests in the middle of an empty field and floats to the top once it
            is focused or holds text, and the underline carries focus and error.
          </Text>
        </div>
        <div {...stylex.props(styles.columns)}>
          <TextArea defaultValue="" label="Empty" />
          <TextArea defaultValue={THREE_LINES} label="Label" />
          <TextArea
            defaultValue={THREE_LINES}
            description="Supporting line"
            label="With a description"
          />
          <TextArea
            defaultValue=""
            error="Enter a value."
            label="With an error"
          />
          <TextArea defaultValue={THREE_LINES} isDisabled label="Disabled" />
          <TextArea defaultValue="" floatingLabel={false} label="Fixed label" />
        </div>
      </section>

      <Separator />

      <section {...stylex.props(styles.section)}>
        <div {...stylex.props(styles.intro)}>
          <Text render={HEADING_2} variant="titleLarge">
            Character counter
          </Text>
          <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
            The count of characters against maxLength, at the end of the
            supporting line, which is where a limit on a note or a message is
            read.
          </Text>
        </div>
        <div {...stylex.props(styles.columns)}>
          <TextArea
            characterCount
            defaultValue={THREE_LINES}
            label="Counter"
            maxLength={200}
          />

          <TextArea
            characterCount
            defaultValue={THREE_LINES}
            description="Supporting line"
            label="With a description"
            maxLength={200}
          />
        </div>
      </section>

      <Separator />

      <section {...stylex.props(styles.section)}>
        <div {...stylex.props(styles.intro)}>
          <Text render={HEADING_2} variant="titleLarge">
            Outlined
          </Text>
          <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
            The page&apos;s other field, with the text area inside it: an
            outline in place of the fill and the underline, and a label that
            moves up onto it. It grows the same way.
          </Text>
        </div>
        <div {...stylex.props(styles.columns)}>
          <TextArea defaultValue="" label="Empty" variant="outlined" />
          <TextArea
            defaultValue={FIVE_LINES}
            label="Growing"
            variant="outlined"
          />
        </div>
      </section>
    </div>
  ),
}

const Default: Story = {}

const Empty: Story = {
  args: {
    defaultValue: '',
  },
}

const FixedRows: Story = {
  args: {
    autosize: false,
    defaultValue: FIVE_LINES,
  },
}

const WithDescription: Story = {
  args: {
    description: 'Supporting line',
  },
}

const WithError: Story = {
  args: {
    error: 'Enter a value.',
  },
}

const Disabled: Story = {
  args: {
    isDisabled: true,
  },
}

const Outlined: Story = {
  args: {
    variant: 'outlined',
  },
}

const WithCharacterCount: Story = {
  args: {
    characterCount: true,
    maxLength: 200,
  },
}

export {
  Default,
  Disabled,
  Empty,
  FixedRows,
  Outlined,
  Overview,
  WithCharacterCount,
  WithDescription,
  WithError,
}

export default meta
