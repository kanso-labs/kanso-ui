// A row's slots take nodes, so passing JSX to them is this component's API
// rather than a misuse of it — and in a tree the node depends on the row's
// own data, so there is nothing to hoist. react-perf guards against a fresh
// element identity defeating memoization, which the React Compiler this repo
// builds with already handles.
// oxlint-disable react-perf/jsx-no-jsx-as-prop

import type { Meta, StoryObj } from '@storybook/react-vite'

import * as stylex from '@stylexjs/stylex'

import Tree from '.'
import Card from '../card'

const styles = stylex.create({
  width: {
    inlineSize: '420px',
  },
})

const OPEN = ['first', 'second']

const meta = {
  args: {
    'aria-label': 'Label',
  },
  component: Tree,
  title: 'Components/Tree',
} satisfies Meta<typeof Tree>

type Story = StoryObj<typeof meta>

function Sample(props: {
  selectionMode?: 'multiple' | 'none' | 'single'
  supporting?: boolean
}) {
  return (
    <Card padding="none" variant="outlined">
      <Tree
        aria-label="Label"
        defaultExpandedKeys={OPEN}
        defaultSelectedKeys={OPEN}
        selectionMode={props.selectionMode}
      >
        <Tree.Item
          headline="First item"
          id="first"
          supporting={props.supporting === true ? 'Supporting line' : undefined}
        >
          <Tree.Item
            headline="Second item"
            id="second"
            supporting={
              props.supporting === true ? 'Supporting line' : undefined
            }
          >
            <Tree.Item headline="Third item" id="third" />
          </Tree.Item>
          <Tree.Item headline="Fourth item" id="fourth" />
        </Tree.Item>
        <Tree.Item headline="Fifth item" id="fifth" />
      </Tree>
    </Card>
  )
}

// Two groups under their headings, the first holding a branch.
function SectionsSample() {
  return (
    <Card padding="none" variant="outlined">
      <Tree aria-label="Label" defaultExpandedKeys={OPEN}>
        <Tree.Section header="First group" id="first-group">
          <Tree.Item headline="First item" id="first">
            <Tree.Item headline="Second item" id="second" />
          </Tree.Item>
          <Tree.Item headline="Third item" id="third" />
        </Tree.Section>
        <Tree.Section header="Second group" id="second-group">
          <Tree.Item headline="Fourth item" id="fourth" />
        </Tree.Section>
      </Tree>
    </Card>
  )
}

const Default: Story = {
  render: () => (
    <div {...stylex.props(styles.width)}>
      <Sample />
    </div>
  ),
}

// Its own story because the checkbox column changes the row's leading edge,
// which a snapshot shows and a description cannot.
const Selectable: Story = {
  render: () => (
    <div {...stylex.props(styles.width)}>
      <Sample selectionMode="multiple" />
    </div>
  ),
}

const Sections: Story = {
  render: () => (
    <div {...stylex.props(styles.width)}>
      <SectionsSample />
    </div>
  ),
}

// Its own story because the ring is the one part of the tree that is drawn
// only while something is in flight.
const Loading: Story = {
  render: () => (
    <div {...stylex.props(styles.width)}>
      <Card padding="none" variant="outlined">
        <Tree aria-label="Label" defaultExpandedKeys={OPEN}>
          <Tree.Item headline="First item" id="first">
            <Tree.Item headline="Second item" id="second" />
          </Tree.Item>
          <Tree.Item headline="Third item" id="third" />
          <Tree.LoadMore isLoading />
        </Tree>
      </Card>
    </div>
  ),
}

// The supporting line is a prop of the row, so no control on the tree reaches
// it. It grows the row past its 56px floor exactly as it does in a list, and
// the caret stays centred against the pair.
const TwoLine: Story = {
  render: () => (
    <div {...stylex.props(styles.width)}>
      <Sample supporting />
    </div>
  ),
}

export { Default, Loading, Sections, Selectable, TwoLine }

export default meta
