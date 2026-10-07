import type { Meta, StoryObj } from '@storybook/react-vite'

import * as stylex from '@stylexjs/stylex'

import Disclosure from '.'
import { colors, radii } from '../../tokens/design.tokens.stylex'
import Avatar from '../avatar'
import Text from '../text'

// Hoisted so the slot is not a new element on every render, which is what
// react-perf's jsx-no-jsx-as-prop is after.
const ADA = <Avatar name="Ada Lovelace" size="sm" />

const styles = stylex.create({
  // A section fills what it is given, so the samples need a width and
  // something to sit on.
  surface: {
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: radii.md,
    boxSizing: 'border-box',
    inlineSize: '360px',
    overflow: 'hidden',
  },
})

const BODY = (
  <Text tone="muted" variant="bodyMedium">
    Supporting line. The panel opens to whatever height its content turns out to
    have, without one being measured or written down.
  </Text>
)

const meta = {
  args: {
    children: (
      <>
        <Disclosure.Header>Headline</Disclosure.Header>
        <Disclosure.Panel>{BODY}</Disclosure.Panel>
      </>
    ),
  },
  component: Disclosure,
  title: 'Components/Disclosure',
} satisfies Meta<typeof Disclosure>

type Story = StoryObj<typeof meta>

const Default: Story = {
  render: (args) => (
    <div {...stylex.props(styles.surface)}>
      <Disclosure {...args} />
    </div>
  ),
}

const Expanded: Story = {
  args: { defaultExpanded: true },
  render: Default.render,
}

const WithSlots: Story = {
  args: {
    children: (
      <>
        <Disclosure.Header leading={ADA} supporting="Supporting line">
          Ada Lovelace
        </Disclosure.Header>
        <Disclosure.Panel>{BODY}</Disclosure.Panel>
      </>
    ),
    defaultExpanded: true,
  },
  render: Default.render,
}

const Disabled: Story = {
  args: { isDisabled: true },
  render: Default.render,
}

export { Default, Disabled, Expanded, WithSlots }

export default meta
