import type { Meta, StoryObj } from '@storybook/react-vite'

import * as stylex from '@stylexjs/stylex'
import { expect } from 'storybook/test'

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

const styles = stylex.create({
  // A phone's 360dp less the 16dp margins either side.
  narrow: {
    inlineSize: '328px',
  },
})

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

// An icon and an `aria-label` with no label: the icon is centred in its
// segment and kept while chosen, on the stronger container a set without a
// check draws, since a check in its place would hide which one is chosen.
const IconOnly: Story = {
  args: {
    children: (
      <>
        <SegmentedButton.Segment
          aria-label="First item"
          icon={DOT}
          id="first"
        />
        <SegmentedButton.Segment
          aria-label="Second item"
          icon={DOT}
          id="second"
        />
        <SegmentedButton.Segment
          aria-label="Third item"
          icon={DOT}
          id="third"
        />
      </>
    ),
  },
}

// The set on a phone-width container, narrower than the track asks for. The
// room a check needs is given back from the segments not drawing one before
// any label is cut, and a label that is cut still shows whole in its title.
const Narrow: Story = {
  render: (args) => (
    <div {...stylex.props(styles.narrow)}>
      <SegmentedButton {...args} />
    </div>
  ),
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

// What `disallowEmptySelection={false}` gives back: pressing the chosen
// segment clears it, leaving nothing chosen, which a single-select set
// otherwise never allows. Pressed from the keyboard as the story opens, so
// it opens on the cleared set rather than on one that looks like Default.
const EmptySelectionAllowed: Story = {
  args: { disallowEmptySelection: false },
  play: async ({ canvas, canvasElement, userEvent }) => {
    const first = canvas.getByRole('radio', { name: 'First item' })
    first.focus()
    await userEvent.keyboard(' ')
    await expect(first).toHaveAttribute('aria-checked', 'false')

    // The press ripple and the chosen container's fade, played out, so what
    // is snapshotted is the state they end in. One cut short by the next
    // rejects rather than finishing.
    await Promise.all(
      canvasElement
        .getAnimations({ subtree: true })
        .map(async (animation) => animation.finished.catch(() => null)),
    )
  },
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
  EmptySelectionAllowed,
  IconOnly,
  MultipleSelection,
  Narrow,
  TwoSegments,
  WithIcons,
  WithoutSelectedIcon,
}

export default meta
