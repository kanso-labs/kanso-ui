import type { Meta, StoryObj } from '@storybook/react-vite'

import * as stylex from '@stylexjs/stylex'

import ListBox from '.'
import { colors, radii, spacing } from '../../tokens/design.tokens.stylex'
import Avatar from '../avatar'
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
    gap: spacing.xl,
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.lg,
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

const Overview: Story = {
  render: () => (
    <div {...stylex.props(styles.page)}>
      <header {...stylex.props(styles.header)}>
        <Text render={HEADING_1} variant="displaySmall">
          ListBox
        </Text>
        <Text render={PARAGRAPH} tone="muted" variant="bodyLarge">
          A list of options one or more of which can be selected.
        </Text>
      </header>

      <Separator />

      <section {...stylex.props(styles.section)}>
        <div {...stylex.props(styles.intro)}>
          <Text render={HEADING_2} variant="titleLarge">
            Selection
          </Text>
          <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
            A selected option takes primary container and on primary container,
            which is the page&apos;s selected state. Single selection replaces;
            multiple toggles, and a list that selects more than one usually puts
            a checkbox in the trailing slot as well.
          </Text>
        </div>
        <div {...stylex.props(styles.row)}>
          <div {...stylex.props(styles.surface)}>
            <ListBox
              aria-label="Single"
              defaultSelectedKeys={SECOND}
              selectionMode="single"
            >
              <ListBox.Item id="first">First item</ListBox.Item>
              <ListBox.Item id="second">Second item</ListBox.Item>
              <ListBox.Item id="third">Third item</ListBox.Item>
            </ListBox>
          </div>
          <div {...stylex.props(styles.surface)}>
            <ListBox
              aria-label="Multiple"
              defaultSelectedKeys={FIRST_AND_THIRD}
              selectionMode="multiple"
            >
              <ListBox.Item id="first">First item</ListBox.Item>
              <ListBox.Item id="second">Second item</ListBox.Item>
              <ListBox.Item id="third">Third item</ListBox.Item>
            </ListBox>
          </div>
        </div>
      </section>

      <Separator />

      <section {...stylex.props(styles.section)}>
        <div {...stylex.props(styles.intro)}>
          <Text render={HEADING_2} variant="titleLarge">
            Slots
          </Text>
          <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
            An option is the row every list here draws, so it takes the same
            leading, supporting and trailing content ListItem does. A disabled
            option cannot be selected or focused.
          </Text>
        </div>
        <div {...stylex.props(styles.row)}>
          <div {...stylex.props(styles.surface)}>
            <ListBox
              aria-label="Slots"
              disabledKeys={THIRD}
              selectionMode="single"
            >
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
        </div>
      </section>

      <Separator />

      <section {...stylex.props(styles.section)}>
        <div {...stylex.props(styles.intro)}>
          <Text render={HEADING_2} variant="titleLarge">
            Sections and loading
          </Text>
          <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
            A section groups options under a heading, which is what names it for
            a screen reader. The load-more row is a sentinel: React Aria calls
            onLoadMore when it comes into view, and draws the ring only while
            isLoading.
          </Text>
        </div>
        <div {...stylex.props(styles.row)}>
          <div {...stylex.props(styles.surface)}>
            <ListBox aria-label="Sections" selectionMode="single">
              <ListBox.Section header="First group">
                <ListBox.Item id="first">First item</ListBox.Item>
                <ListBox.Item id="second">Second item</ListBox.Item>
              </ListBox.Section>
              <ListBox.Section header="Second group">
                <ListBox.Item id="third">Third item</ListBox.Item>
              </ListBox.Section>
              <ListBox.LoadMore isLoading />
            </ListBox>
          </div>
        </div>
      </section>
    </div>
  ),
}

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
  Overview,
  Sections,
  Selected,
}

export default meta
