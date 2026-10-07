import type { Meta, StoryObj } from '@storybook/react-vite'

import SegmentedButton from '.'

// Hoisted so the keys are not new arrays on every render, which is what
// react-perf's no-new-array-as-prop is after.
const FIRST = ['first']
const FIRST_AND_THIRD = ['first', 'third']

// An icon slot takes any node; a plain glyph keeps the sample generic. The
// library's own glyphs are private to it, so a story draws its own.
const DOT = (
  <svg aria-hidden="true" fill="currentColor" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="6" />
  </svg>
)

const SEGMENTS = (
  <>
    <SegmentedButton.Segment id="first">First item</SegmentedButton.Segment>
    <SegmentedButton.Segment id="second">Second item</SegmentedButton.Segment>
    <SegmentedButton.Segment id="third">Third item</SegmentedButton.Segment>
  </>
)

const meta = {
  args: {
    'aria-label': 'Label',
    children: SEGMENTS,
    defaultSelectedKeys: FIRST,
  },
  component: SegmentedButton,
  title: 'Components/SegmentedButton',
} satisfies Meta<typeof SegmentedButton>

type Story = StoryObj<typeof meta>

const Default: Story = {}

const MultipleSelection: Story = {
  args: {
    defaultSelectedKeys: FIRST_AND_THIRD,
    selectionMode: 'multiple',
  },
}

const WithIcons: Story = {
  args: {
    children: (
      <>
        <SegmentedButton.Segment icon={DOT} id="first">
          First item
        </SegmentedButton.Segment>
        <SegmentedButton.Segment icon={DOT} id="second">
          Second item
        </SegmentedButton.Segment>
        <SegmentedButton.Segment icon={DOT} id="third">
          Third item
        </SegmentedButton.Segment>
      </>
    ),
  },
}

const WithoutSelectedIcon: Story = {
  args: { showSelectedIcon: false },
}

const TwoSegments: Story = {
  args: {
    children: (
      <>
        <SegmentedButton.Segment id="first">First item</SegmentedButton.Segment>
        <SegmentedButton.Segment id="second">
          Second item
        </SegmentedButton.Segment>
      </>
    ),
  },
}

const Disabled: Story = {
  args: { isDisabled: true },
}

// Its own story because a single segment can be turned off without the set,
// which is a prop of the segment that the Controls panel cannot reach.
const DisabledSegment: Story = {
  args: {
    children: (
      <>
        <SegmentedButton.Segment id="first">First item</SegmentedButton.Segment>
        <SegmentedButton.Segment id="second" isDisabled>
          Second item
        </SegmentedButton.Segment>
        <SegmentedButton.Segment id="third">Third item</SegmentedButton.Segment>
      </>
    ),
  },
}

export {
  Default,
  Disabled,
  DisabledSegment,
  MultipleSelection,
  TwoSegments,
  WithIcons,
  WithoutSelectedIcon,
}

export default meta
