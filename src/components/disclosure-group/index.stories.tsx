import type { Meta, StoryObj } from '@storybook/react-vite'

import * as stylex from '@stylexjs/stylex'

import DisclosureGroup from '.'
import { colors, radii } from '../../tokens/design.tokens.stylex'
import Disclosure from '../disclosure'
import Text from '../text'

// Hoisted so the keys are not new arrays on every render, which is what
// react-perf's no-new-array-as-prop is after.
const FIRST = ['first']
const FIRST_AND_THIRD = ['first', 'third']

const styles = stylex.create({
  // A group fills what it is given, so the samples need a width and something
  // to sit on.
  surface: {
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: radii.md,
    boxSizing: 'border-box',
    inlineSize: '360px',
    overflow: 'hidden',
  },
})

function body(text: string) {
  return (
    <Text tone="muted" variant="bodyMedium">
      {text}
    </Text>
  )
}

const SECTIONS = (
  <>
    <Disclosure id="first">
      <Disclosure.Header>First item</Disclosure.Header>
      <Disclosure.Panel>
        {body('Supporting line for the first.')}
      </Disclosure.Panel>
    </Disclosure>
    <Disclosure id="second">
      <Disclosure.Header>Second item</Disclosure.Header>
      <Disclosure.Panel>
        {body('Supporting line for the second.')}
      </Disclosure.Panel>
    </Disclosure>
    <Disclosure id="third">
      <Disclosure.Header>Third item</Disclosure.Header>
      <Disclosure.Panel>
        {body('Supporting line for the third.')}
      </Disclosure.Panel>
    </Disclosure>
  </>
)

const meta = {
  args: {
    children: SECTIONS,
    defaultExpandedKeys: FIRST,
  },
  component: DisclosureGroup,
  title: 'Components/DisclosureGroup',
} satisfies Meta<typeof DisclosureGroup>

type Story = StoryObj<typeof meta>

const Default: Story = {
  render: (args) => (
    <div {...stylex.props(styles.surface)}>
      <DisclosureGroup {...args} />
    </div>
  ),
}

const MultipleExpanded: Story = {
  args: {
    allowsMultipleExpanded: true,
    defaultExpandedKeys: FIRST_AND_THIRD,
  },
  render: Default.render,
}

const Undivided: Story = {
  args: { divided: false },
  render: Default.render,
}

const Disabled: Story = {
  args: { isDisabled: true },
  render: Default.render,
}

export { Default, Disabled, MultipleExpanded, Undivided }

export default meta
