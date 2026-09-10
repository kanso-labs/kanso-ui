import type { Meta, StoryObj } from '@storybook/react-vite'

import * as stylex from '@stylexjs/stylex'
import { expect, waitFor } from 'storybook/test'

import ComboBox from '.'
import { spacing } from '../../tokens/design.tokens.stylex'
import ListBox from '../list-box'
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

// Hoisted so the options are not a new element on every render, which is
// what react-perf's jsx-no-jsx-as-prop is after.
const OPTIONS = (
  <>
    <ListBox.Item id="first">First item</ListBox.Item>
    <ListBox.Item id="second">Second item</ListBox.Item>
    <ListBox.Item id="third">Third item</ListBox.Item>
  </>
)

const PEOPLE = (
  <>
    <ListBox.Item id="ada">Ada Lovelace</ListBox.Item>
    <ListBox.Item id="grace">Grace Hopper</ListBox.Item>
    <ListBox.Item id="alan">Alan Turing</ListBox.Item>
  </>
)

// A filter that matches from the start of the text rather than anywhere in
// it, to show that the predicate is the call site's.
function startsWith(textValue: string, inputValue: string) {
  return textValue.toLowerCase().startsWith(inputValue.toLowerCase())
}

const styles = stylex.create({
  column: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.lg,
    maxInlineSize: '320px',
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
    paddingBlockEnd: spacing.xxxl,
    paddingBlockStart: spacing.xl,
    paddingInline: spacing.xl,
  },
  row: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: spacing.xl,
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.lg,
  },
  width: {
    inlineSize: '320px',
  },
})

const meta = {
  args: {
    label: 'Label',
    options: OPTIONS,
  },
  component: ComboBox,
  title: 'Components/ComboBox',
} satisfies Meta<typeof ComboBox<object>>

type Story = StoryObj<typeof meta>

const Overview: Story = {
  render: () => (
    <div {...stylex.props(styles.page)}>
      <header {...stylex.props(styles.header)}>
        <Text render={HEADING_1} variant="displaySmall">
          ComboBox
        </Text>
        <Text render={PARAGRAPH} tone="muted" variant="bodyLarge">
          A labelled text field that filters a list as it is typed.
        </Text>
      </header>

      <Separator />

      <section {...stylex.props(styles.section)}>
        <div {...stylex.props(styles.intro)}>
          <Text render={HEADING_2} variant="titleLarge">
            The two boxes
          </Text>
          <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
            The same filled and outlined boxes every other field draws. The
            control is a real input, so the box is not a press target — typing
            has to reach it, and the chevron at the end is what opens the list.
          </Text>
        </div>
        <div {...stylex.props(styles.row)}>
          <div {...stylex.props(styles.column)}>
            <ComboBox label="Label" options={OPTIONS} />
            <ComboBox defaultValue="second" label="Label" options={OPTIONS} />
          </div>
          <div {...stylex.props(styles.column)}>
            <ComboBox label="Label" options={OPTIONS} variant="outlined" />
            <ComboBox
              defaultValue="second"
              label="Label"
              options={OPTIONS}
              variant="outlined"
            />
          </div>
        </div>
      </section>

      <Separator />

      <section {...stylex.props(styles.section)}>
        <div {...stylex.props(styles.intro)}>
          <Text render={HEADING_2} variant="titleLarge">
            Filtering
          </Text>
          <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
            The list narrows as the field is typed, on a language-aware contains
            match by default. Pass defaultFilter for a predicate of your own, or
            useFilter for another of React Aria&apos;s.
          </Text>
        </div>
        <div {...stylex.props(styles.column)}>
          <ComboBox label="Contains" options={PEOPLE} />
          <ComboBox
            defaultFilter={startsWith}
            label="Starts with"
            options={PEOPLE}
          />
        </div>
      </section>

      <Separator />

      <section {...stylex.props(styles.section)}>
        <div {...stylex.props(styles.intro)}>
          <Text render={HEADING_2} variant="titleLarge">
            Supporting text and errors
          </Text>
          <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
            A description sits under the box; an error replaces it and turns the
            underline and the label to the error role. allowsCustomValue lets
            the field keep text that matches nothing — without it, the input
            reverts to the last chosen option on blur.
          </Text>
        </div>
        <div {...stylex.props(styles.column)}>
          <ComboBox
            description="Supporting line"
            label="Label"
            options={OPTIONS}
          />
          <ComboBox error="Choose an item" label="Label" options={OPTIONS} />
          <ComboBox allowsCustomValue label="Anything" options={OPTIONS} />
          <ComboBox isDisabled label="Label" options={OPTIONS} />
        </div>
      </section>
    </div>
  ),
}

const Default: Story = {
  render: (args) => (
    <div {...stylex.props(styles.width)}>
      <ComboBox {...args} />
    </div>
  ),
}

const Chosen: Story = {
  args: { defaultValue: 'second' },
  render: Default.render,
}

const Outlined: Story = {
  args: { variant: 'outlined' },
  render: Default.render,
}

const WithDescription: Story = {
  args: { description: 'Supporting line' },
  render: Default.render,
}

const Invalid: Story = {
  args: { error: 'Choose an item' },
  render: Default.render,
}

const Disabled: Story = {
  args: { isDisabled: true },
  render: Default.render,
}

// A combo box has no open prop — the list opens from the field rather than
// from state a story can set — so this one presses the chevron. Chromatic
// snapshots after `play`, which is what makes the open list comparable.
const Open: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button'))
    await waitFor(async () => {
      await expect(document.querySelector('[role="listbox"]')).not.toBeNull()
    })
  },
  render: Default.render,
}

export {
  Chosen,
  Default,
  Disabled,
  Invalid,
  Open,
  Outlined,
  Overview,
  WithDescription,
}

export default meta
