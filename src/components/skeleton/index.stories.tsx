import type { Meta, StoryObj } from '@storybook/react-vite'

import * as stylex from '@stylexjs/stylex'

import Skeleton from '.'
import Card from '../card'

const styles = stylex.create({
  // The width of a phone, which is where a list is usually read.
  frame: {
    inlineSize: '360px',
  },
})

// Hoisted so each is one stable element per render, which is what
// react-perf's no-jsx-as-prop is after.
const CIRCLE = <Skeleton.Circle />
const FIGURE = <Skeleton.Bar size="md" width="48px" />

const meta = {
  args: {
    children: (
      <>
        <Skeleton.Row>
          <Skeleton.Bar size="md" width="60%" />
        </Skeleton.Row>
        <Skeleton.Row leading={CIRCLE} lines={2} trailing={FIGURE}>
          <Skeleton.Bar width="40%" />
          <Skeleton.Bar size="md" width="70%" />
        </Skeleton.Row>
        <Skeleton.Row leading={CIRCLE} lines={2} trailing={FIGURE}>
          <Skeleton.Bar width="30%" />
          <Skeleton.Bar size="md" width="55%" />
        </Skeleton.Row>
      </>
    ),
  },
  component: Skeleton,
  // An outlined card holding both heights, as a list in a card is read.
  render: (args) => (
    <div {...stylex.props(styles.frame)}>
      <Card padding="none" variant="outlined">
        <Skeleton {...args} />
      </Card>
    </div>
  ),
  subcomponents: {
    'Skeleton.Bar': Skeleton.Bar,
    'Skeleton.Circle': Skeleton.Circle,
    'Skeleton.Row': Skeleton.Row,
  },
  title: 'Components/Skeleton',
} satisfies Meta<typeof Skeleton>

type Story = StoryObj<typeof meta>

// A one-line row at 56px and two two-line rows at 72px, each with a circle
// in place of a mark and a bar in place of a figure.
const Default: Story = {}

// A headline's 28px bar over the rows, standing in for a screen's figure.
const WithHeadline: Story = {
  args: {
    children: (
      <>
        <Skeleton.Row lines={2}>
          <Skeleton.Bar width="30%" />
          <Skeleton.Bar size="lg" width="50%" />
        </Skeleton.Row>
        <Skeleton.Row leading={CIRCLE}>
          <Skeleton.Bar size="md" width="60%" />
        </Skeleton.Row>
      </>
    ),
  },
}

export { Default, WithHeadline }

export default meta
