import type { Meta, StoryObj } from '@storybook/react-vite'

import * as stylex from '@stylexjs/stylex'

import SegmentedButton from '.'
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

// Hoisted so the keys are not new arrays on every render, which is what
// react-perf's no-new-array-as-prop is after.
const FIRST = ['first']
const SECOND = ['second']
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

const styles = stylex.create({
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
    alignItems: 'flex-start',
    display: 'flex',
    flexWrap: 'wrap',
    gap: spacing.xl,
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.lg,
  },
})

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

const Overview: Story = {
  render: () => (
    <div {...stylex.props(styles.page)}>
      <header {...stylex.props(styles.header)}>
        <Text render={HEADING_1} variant="displaySmall">
          Segmented button
        </Text>
        <Text render={PARAGRAPH} tone="muted" variant="bodyLarge">
          A row of joined segments, one or more of which is chosen.
        </Text>
      </header>

      <Separator />

      <section {...stylex.props(styles.section)}>
        <div {...stylex.props(styles.intro)}>
          <Text render={HEADING_2} variant="titleLarge">
            Choosing one, or several
          </Text>
          <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
            The mode is a word on the set, and it decides what a screen reader
            hears: choosing one is a radio group, choosing several a toolbar of
            two-state buttons. A chosen segment draws a check.
          </Text>
        </div>
        <div {...stylex.props(styles.row)}>
          <SegmentedButton aria-label="One" defaultSelectedKeys={SECOND}>
            {SEGMENTS}
          </SegmentedButton>
          <SegmentedButton
            aria-label="Several"
            defaultSelectedKeys={FIRST_AND_THIRD}
            selectionMode="multiple"
          >
            {SEGMENTS}
          </SegmentedButton>
        </div>
      </section>

      <Separator />

      <section {...stylex.props(styles.section)}>
        <div {...stylex.props(styles.intro)}>
          <Text render={HEADING_2} variant="titleLarge">
            Icons
          </Text>
          <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
            A segment given an icon shows it while unchosen, and the check once
            chosen. A set that would rather keep its own icons throughout turns
            the check off.
          </Text>
        </div>
        <div {...stylex.props(styles.row)}>
          <SegmentedButton aria-label="With icons" defaultSelectedKeys={FIRST}>
            <SegmentedButton.Segment icon={DOT} id="first">
              First item
            </SegmentedButton.Segment>
            <SegmentedButton.Segment icon={DOT} id="second">
              Second item
            </SegmentedButton.Segment>
          </SegmentedButton>
          <SegmentedButton
            aria-label="Icons kept"
            defaultSelectedKeys={FIRST}
            showSelectedIcon={false}
          >
            <SegmentedButton.Segment icon={DOT} id="first">
              First item
            </SegmentedButton.Segment>
            <SegmentedButton.Segment icon={DOT} id="second">
              Second item
            </SegmentedButton.Segment>
          </SegmentedButton>
        </div>
      </section>

      <Separator />

      <section {...stylex.props(styles.section)}>
        <div {...stylex.props(styles.intro)}>
          <Text render={HEADING_2} variant="titleLarge">
            Disabled
          </Text>
          <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
            A single segment can be turned off, or the whole set at once. Either
            way the outline fades with what is inside it.
          </Text>
        </div>
        <div {...stylex.props(styles.row)}>
          <SegmentedButton
            aria-label="One segment off"
            defaultSelectedKeys={FIRST}
          >
            <SegmentedButton.Segment id="first">
              First item
            </SegmentedButton.Segment>
            <SegmentedButton.Segment id="second" isDisabled>
              Second item
            </SegmentedButton.Segment>
            <SegmentedButton.Segment id="third">
              Third item
            </SegmentedButton.Segment>
          </SegmentedButton>
          <SegmentedButton
            aria-label="All off"
            defaultSelectedKeys={FIRST}
            isDisabled
          >
            {SEGMENTS}
          </SegmentedButton>
        </div>
      </section>
    </div>
  ),
}

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

export {
  Default,
  Disabled,
  MultipleSelection,
  Overview,
  TwoSegments,
  WithIcons,
  WithoutSelectedIcon,
}

export default meta
