import type { Meta, StoryObj } from '@storybook/react-vite'

import * as stylex from '@stylexjs/stylex'

import ListBox from '.'
import { colors, radii, spacing } from '../../tokens/design.tokens.stylex'
import Avatar from '../avatar'
import Text from '../text'

// Hoisted so neither the keys nor the slots are new values on every render,
// which is what react-perf's two array and JSX rules are after.
const FIRST_AND_THIRD = ['first', 'third']
const SECOND = ['second']
const THIRD = ['third']
const ADA = <Avatar name="Ada Lovelace" size="sm" />
const GRACE = <Avatar name="Grace Hopper" size="sm" />
const COUNT_ONE = (
  <Text tone="muted" variant="labelMedium">
    01
  </Text>
)
const COUNT_TWO = (
  <Text tone="muted" variant="labelMedium">
    02
  </Text>
)

const styles = stylex.create({
  // What a list with nothing in it shows. `renderEmptyState` is React Aria's
  // and returns whatever the call site draws, so the inset and the muted
  // role are the page's rather than the component's.
  empty: {
    boxSizing: 'border-box',
    color: colors.onSurfaceVariant,
    paddingBlock: spacing.md,
    paddingInline: spacing.lg,
  },
  // A list fills what it is given, so the samples need a width and something
  // to sit on — a surface with a corner is the shape a picker's popover
  // gives it.
  surface: {
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: radii.md,
    boxSizing: 'border-box',
    inlineSize: '320px',
    overflow: 'hidden',
  },
})

const meta = {
  args: {
    'aria-label': 'Label',
    selectionMode: 'single',
  },
  component: ListBox,
  title: 'Components/ListBox',
} satisfies Meta<typeof ListBox<object>>

type Story = StoryObj<typeof meta>

const Default: Story = {
  render: (args) => (
    <div {...stylex.props(styles.surface)}>
      <ListBox {...args}>
        <ListBox.Item id="first">First item</ListBox.Item>
        <ListBox.Item id="second">Second item</ListBox.Item>
        <ListBox.Item id="third">Third item</ListBox.Item>
      </ListBox>
    </div>
  ),
}

const Selected: Story = {
  args: {
    defaultSelectedKeys: SECOND,
  },
  render: Default.render,
}

const ThreeLine: Story = {
  render: (args) => (
    <div {...stylex.props(styles.surface)}>
      <ListBox {...args}>
        <ListBox.Item
          id="first"
          overline="Overline"
          supporting="Supporting line"
        >
          First item
        </ListBox.Item>
        <ListBox.Item id="second" overline="Overline">
          Second item
        </ListBox.Item>
        <ListBox.Item id="third" supporting="Supporting line">
          Third item
        </ListBox.Item>
      </ListBox>
    </div>
  ),
}

// Its own story because an option is the row every list here draws, so it takes
// the same leading, supporting and trailing content a ListItem does. A
// disabled option cannot be selected or focused.
const WithSlots: Story = {
  args: {
    disabledKeys: THIRD,
  },
  render: (args) => (
    <div {...stylex.props(styles.surface)}>
      <ListBox {...args}>
        <ListBox.Item
          id="first"
          leading={ADA}
          supporting="Supporting line"
          trailing={COUNT_ONE}
        >
          Ada Lovelace
        </ListBox.Item>
        <ListBox.Item
          id="second"
          leading={GRACE}
          supporting="Supporting line"
          trailing={COUNT_TWO}
        >
          Grace Hopper
        </ListBox.Item>
        <ListBox.Item id="third" supporting="Supporting line">
          Third item
        </ListBox.Item>
      </ListBox>
    </div>
  ),
}

const MultipleSelection: Story = {
  args: {
    defaultSelectedKeys: FIRST_AND_THIRD,
    selectionMode: 'multiple',
  },
  render: Default.render,
}

const Disabled: Story = {
  args: {
    disabledKeys: SECOND,
  },
  render: Default.render,
}

const Sections: Story = {
  render: (args) => (
    <div {...stylex.props(styles.surface)}>
      <ListBox {...args}>
        <ListBox.Section header="First group">
          <ListBox.Item id="first">First item</ListBox.Item>
          <ListBox.Item id="second">Second item</ListBox.Item>
        </ListBox.Section>
        <ListBox.Section header="Second group">
          <ListBox.Item id="third">Third item</ListBox.Item>
        </ListBox.Section>
      </ListBox>
    </div>
  ),
}

const Loading: Story = {
  render: (args) => (
    <div {...stylex.props(styles.surface)}>
      <ListBox {...args}>
        <ListBox.Item id="first">First item</ListBox.Item>
        <ListBox.Item id="second">Second item</ListBox.Item>
        <ListBox.LoadMore isLoading />
      </ListBox>
    </div>
  ),
}

const Empty: Story = {
  render: (args) => (
    <div {...stylex.props(styles.surface)}>
      <ListBox {...args} renderEmptyState={emptyState} />
    </div>
  ),
}

// Built by a call rather than written inline at the prop, which is what
// react-perf's no-new-function-as-prop is after.
function emptyState() {
  return <div {...stylex.props(styles.empty)}>Nothing to show</div>
}

export {
  Default,
  Disabled,
  Empty,
  Loading,
  MultipleSelection,
  Sections,
  Selected,
  ThreeLine,
  WithSlots,
}

export default meta
