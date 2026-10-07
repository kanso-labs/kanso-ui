// A row's slots take nodes, so passing JSX to them is this component's API
// rather than a misuse of it. react-perf guards against a fresh element
// identity defeating memoization, which the React Compiler this repo builds
// with already handles.
// oxlint-disable react-perf/jsx-no-jsx-as-prop

import type { Meta, StoryObj } from '@storybook/react-vite'

import * as stylex from '@stylexjs/stylex'

import NavigationTree from '.'
import { colors, radii } from '../../tokens/design.tokens.stylex'
import Card from '../card'

const styles = stylex.create({
  // A tinted square standing in for a page's own icon, at the size the
  // drawer page gives one.
  glyph: {
    alignItems: 'center',
    backgroundColor: colors.secondaryContainer,
    blockSize: '24px',
    borderRadius: radii.xs,
    color: colors.onSecondaryContainer,
    display: 'flex',
    inlineSize: '24px',
    justifyContent: 'center',
  },
  // The drawer page's own container width.
  width: {
    inlineSize: '360px',
  },
})

const OPEN = ['first', 'second']

// The tinted square above, in a row's leading slot.
function glyph(mark: string) {
  return <span {...stylex.props(styles.glyph)}>{mark}</span>
}

const meta = {
  args: {
    'aria-label': 'Label',
  },
  component: NavigationTree,
  title: 'Components/NavigationTree',
} satisfies Meta<typeof NavigationTree>

type Story = StoryObj<typeof meta>

function Sample(props: { leading?: boolean }) {
  return (
    <Card padding="none" variant="outlined">
      <NavigationTree
        aria-label="Label"
        defaultExpandedKeys={OPEN}
        selectedRoute="#third"
      >
        <NavigationTree.Item
          href="#first"
          id="first"
          label="First item"
          leading={props.leading === true ? glyph('★') : undefined}
        >
          <NavigationTree.Item
            href="#second"
            id="second"
            label="Second item"
            leading={props.leading === true ? glyph('◆') : undefined}
          >
            <NavigationTree.Item
              href="#third"
              id="third"
              label="Third item"
              leading={props.leading === true ? glyph('●') : undefined}
            />
          </NavigationTree.Item>
          <NavigationTree.Item
            href="#fourth"
            id="fourth"
            label="Fourth item"
            leading={props.leading === true ? glyph('◇') : undefined}
          />
        </NavigationTree.Item>
        <NavigationTree.Item
          href="#fifth"
          id="fifth"
          label="Fifth item"
          leading={props.leading === true ? glyph('○') : undefined}
        />
      </NavigationTree>
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

// Its own story because a page's drawer has icons, and the leading slot is
// what makes the rows line up against them.
const WithIcons: Story = {
  render: () => (
    <div {...stylex.props(styles.width)}>
      <Sample leading />
    </div>
  ),
}

// Its own story because a section is a part of its own rather than a prop on a
// row: it names a group, and its heading takes the headline role, which comes
// to the same values as the label, so colour and room set it apart, not size.
const Sections: Story = {
  render: () => (
    <div {...stylex.props(styles.width)}>
      <Card padding="none" variant="outlined">
        <NavigationTree aria-label="Label" selectedRoute="#second">
          <NavigationTree.Section header="Headline" id="one">
            <NavigationTree.Item href="#first" id="first" label="First item" />
            <NavigationTree.Item
              href="#second"
              id="second"
              label="Second item"
            />
          </NavigationTree.Section>
          <NavigationTree.Section header="Headline" id="two">
            <NavigationTree.Item href="#third" id="third" label="Third item" />
          </NavigationTree.Section>
        </NavigationTree>
      </Card>
    </div>
  ),
}

export { Default, Sections, WithIcons }

export default meta
