import type { Meta, StoryObj } from '@storybook/react-vite'
import type { Key } from 'react-aria-components'

import * as stylex from '@stylexjs/stylex'
import { useCallback, useState } from 'react'

import Breadcrumbs from '.'
import { spacing } from '../../tokens/design.tokens.stylex'
import Text from '../text'

const styles = stylex.create({
  // A narrow column, so the long trail has something to wrap inside.
  narrow: {
    boxSizing: 'border-box',
    inlineSize: '320px',
  },
  // The trail with the key it last reported under it.
  routed: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.xxs,
  },
})

const TRAIL = (
  <>
    <Breadcrumbs.Item href="#first">First item</Breadcrumbs.Item>
    <Breadcrumbs.Item href="#second">Second item</Breadcrumbs.Item>
    <Breadcrumbs.Item>Third item</Breadcrumbs.Item>
  </>
)

const meta = {
  args: {
    'aria-label': 'Label',
    children: TRAIL,
  },
  component: Breadcrumbs,
  title: 'Components/Breadcrumbs',
} satisfies Meta<typeof Breadcrumbs>

type Story = StoryObj<typeof meta>

// A trail whose items report their key rather than navigating, which is what
// a page routing on its own needs.
function Routed() {
  const [pressed, setPressed] = useState<string>('none')
  // The React Compiler memoises this on `setPressed`, which is stable, so it
  // is one function rather than a new one per render — what react-perf's
  // no-new-function-as-prop is after.
  const onAction = useCallback((key: Key) => {
    setPressed(String(key))
  }, [])

  return (
    <div {...stylex.props(styles.routed)}>
      <Breadcrumbs aria-label="Routed" onAction={onAction}>
        <Breadcrumbs.Item id="first">First item</Breadcrumbs.Item>
        <Breadcrumbs.Item id="second">Second item</Breadcrumbs.Item>
        <Breadcrumbs.Item id="third">Third item</Breadcrumbs.Item>
      </Breadcrumbs>
      <Text tone="muted" variant="bodySmall">
        Last pressed: {pressed}
      </Text>
    </div>
  )
}

const Default: Story = {}

const TwoItems: Story = {
  args: {
    children: (
      <>
        <Breadcrumbs.Item href="#first">First item</Breadcrumbs.Item>
        <Breadcrumbs.Item>Second item</Breadcrumbs.Item>
      </>
    ),
  },
}

const Disabled: Story = {
  args: { isDisabled: true },
}

// Its own story because it takes a deep trail and a column too narrow for it:
// the row wraps rather than scrolling or truncating, so nothing runs off the
// edge.
const LongTrail: Story = {
  render: () => (
    <div {...stylex.props(styles.narrow)}>
      <Breadcrumbs aria-label="Long">
        <Breadcrumbs.Item href="#first">First item</Breadcrumbs.Item>
        <Breadcrumbs.Item href="#second">Second item</Breadcrumbs.Item>
        <Breadcrumbs.Item href="#third">Third item</Breadcrumbs.Item>
        <Breadcrumbs.Item href="#fourth">Fourth item</Breadcrumbs.Item>
        <Breadcrumbs.Item>Fifth item</Breadcrumbs.Item>
      </Breadcrumbs>
    </div>
  ),
}

// Its own story because it has to be driven: a page that routes on its own
// gives each item an id and the trail an `onAction`, which reports the key that
// was pressed. The items are still announced as links.
const RoutedTrail: Story = {
  render: () => <Routed />,
}

export { Default, Disabled, LongTrail, RoutedTrail, TwoItems }

export default meta
