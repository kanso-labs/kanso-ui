import type { Meta, StoryObj } from '@storybook/react-vite'
import type { Selection } from 'react-aria-components'

import * as stylex from '@stylexjs/stylex'
import { useCallback, useState } from 'react'

import ChipGroup from '.'
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

const SECOND = ['second']
const FIRST_AND_THIRD = ['first', 'third']

const CHIPS = (
  <>
    <ChipGroup.Chip id="first">First item</ChipGroup.Chip>
    <ChipGroup.Chip id="second">Second item</ChipGroup.Chip>
    <ChipGroup.Chip id="third">Third item</ChipGroup.Chip>
  </>
)

const styles = stylex.create({
  column: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.xl,
    maxInlineSize: '420px',
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
  width: {
    inlineSize: '420px',
  },
})

// A group whose chips can actually be removed, since removal is the one
// thing a static story cannot show.
const ITEMS = [
  { id: 'first', label: 'First item' },
  { id: 'second', label: 'Second item' },
  { id: 'third', label: 'Third item' },
]

function Removable() {
  const [items, setItems] = useState(ITEMS)
  const remove = useCallback((keys: Selection) => {
    setItems((current) =>
      current.filter((item) => keys === 'all' || !keys.has(item.id)),
    )
  }, [])

  return (
    <ChipGroup label="Removable" onRemove={remove} selectionMode="multiple">
      {items.map((item) => (
        <ChipGroup.Chip id={item.id} key={item.id}>
          {item.label}
        </ChipGroup.Chip>
      ))}
    </ChipGroup>
  )
}

const meta = {
  args: {
    children: CHIPS,
    label: 'Label',
  },
  component: ChipGroup,
  title: 'Components/ChipGroup',
} satisfies Meta<typeof ChipGroup<object>>

type Story = StoryObj<typeof meta>

const Overview: Story = {
  render: () => (
    <div {...stylex.props(styles.page)}>
      <header {...stylex.props(styles.header)}>
        <Text render={HEADING_1} variant="displaySmall">
          ChipGroup
        </Text>
        <Text render={PARAGRAPH} tone="muted" variant="bodyLarge">
          A labelled set of chips, one or more of which can be chosen.
        </Text>
      </header>

      <Separator />

      <section {...stylex.props(styles.section)}>
        <div {...stylex.props(styles.intro)}>
          <Text render={HEADING_2} variant="titleLarge">
            Selection
          </Text>
          <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
            Selection is the group&apos;s rather than each chip&apos;s, so a set
            that chooses one and a set that chooses several are the same
            component with a different word. A chip on its own that toggles
            nothing else is still Chip.
          </Text>
        </div>
        <div {...stylex.props(styles.column)}>
          <ChipGroup
            defaultSelectedKeys={SECOND}
            label="One of these"
            selectionMode="single"
          >
            {CHIPS}
          </ChipGroup>
          <ChipGroup
            defaultSelectedKeys={FIRST_AND_THIRD}
            label="Any of these"
            selectionMode="multiple"
          >
            {CHIPS}
          </ChipGroup>
        </div>
      </section>

      <Separator />

      <section {...stylex.props(styles.section)}>
        <div {...stylex.props(styles.intro)}>
          <Text render={HEADING_2} variant="titleLarge">
            Removing
          </Text>
          <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
            Give the group onRemove and every chip draws the page&apos;s close
            target. Backspace and Delete remove the focused chip too, and the
            arrow keys move between them — a set of many is one tab stop rather
            than many.
          </Text>
        </div>
        <div {...stylex.props(styles.column)}>
          <Removable />
        </div>
      </section>

      <Separator />

      <section {...stylex.props(styles.section)}>
        <div {...stylex.props(styles.intro)}>
          <Text render={HEADING_2} variant="titleLarge">
            Supporting text and errors
          </Text>
          <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
            The label, the supporting line and the error are the field
            chrome&apos;s, so a group reads like the fields beside it — the same
            arrangement CheckboxGroup and RadioGroup take.
          </Text>
        </div>
        <div {...stylex.props(styles.column)}>
          <ChipGroup
            description="Supporting line"
            label="Label"
            selectionMode="multiple"
          >
            {CHIPS}
          </ChipGroup>
          <ChipGroup
            error="Choose at least one"
            label="Label"
            selectionMode="multiple"
          >
            {CHIPS}
          </ChipGroup>
          <ChipGroup
            disabledKeys={SECOND}
            label="Label"
            selectionMode="multiple"
          >
            {CHIPS}
          </ChipGroup>
        </div>
      </section>
    </div>
  ),
}

const Default: Story = {
  render: (args) => (
    <div {...stylex.props(styles.width)}>
      <ChipGroup {...args} />
    </div>
  ),
}

const SingleSelection: Story = {
  args: { defaultSelectedKeys: SECOND, selectionMode: 'single' },
  render: Default.render,
}

const MultipleSelection: Story = {
  args: {
    defaultSelectedKeys: FIRST_AND_THIRD,
    selectionMode: 'multiple',
  },
  render: Default.render,
}

const Removing: Story = {
  args: { onRemove: noop, selectionMode: 'multiple' },
  render: Default.render,
}

const WithDescription: Story = {
  args: { description: 'Supporting line' },
  render: Default.render,
}

const Invalid: Story = {
  args: { error: 'Choose at least one' },
  render: Default.render,
}

const Disabled: Story = {
  args: { disabledKeys: SECOND },
  render: Default.render,
}

// The story shows the close target rather than what pressing it does, which
// the Removable section of the overview covers instead.
function noop(_keys: Selection) {}

export {
  Default,
  Disabled,
  Invalid,
  MultipleSelection,
  Overview,
  Removing,
  SingleSelection,
  WithDescription,
}

export default meta
