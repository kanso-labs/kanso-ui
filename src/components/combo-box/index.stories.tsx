import type { Meta, StoryObj } from '@storybook/react-vite'

import * as stylex from '@stylexjs/stylex'
import { expect, waitFor } from 'storybook/test'

import ComboBox from '.'
import { spacing } from '../../tokens/design.tokens.stylex'
import ListBox from '../list-box'

// Hoisted so the options are not a new element on every render, which is
// what react-perf's jsx-no-jsx-as-prop is after.
const OPTIONS = (
  <>
    <ListBox.Item id="first">First item</ListBox.Item>
    <ListBox.Item id="second">Second item</ListBox.Item>
    <ListBox.Item id="third">Third item</ListBox.Item>
  </>
)

const FIRST_AND_THIRD = ['first', 'third']

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

// Two options chosen, which the field draws before its input.
const Multiple: Story = {
  render: () => (
    <div {...stylex.props(styles.width)}>
      <ComboBox
        defaultValue={FIRST_AND_THIRD}
        label="Label"
        options={OPTIONS}
        selectionMode="multiple"
      />
    </div>
  ),
}

// Its own story because `defaultFilter` takes a function, which the Controls
// panel cannot supply, and a predicate reads only against the default it
// replaces: type the same text into both.
const CustomFilter: Story = {
  render: () => (
    <div {...stylex.props(styles.column)}>
      <ComboBox label="Contains" options={PEOPLE} />
      <ComboBox
        defaultFilter={startsWith}
        label="Starts with"
        options={PEOPLE}
      />
    </div>
  ),
}

export {
  Chosen,
  CustomFilter,
  Default,
  Disabled,
  Invalid,
  Multiple,
  Open,
  Outlined,
  WithDescription,
}

export default meta
