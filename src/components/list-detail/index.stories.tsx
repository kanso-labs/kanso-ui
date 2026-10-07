import type { Meta, StoryObj } from '@storybook/react-vite'

import * as stylex from '@stylexjs/stylex'

import ListDetail from '.'
import { breakpointModes } from '../../../.storybook/modes'
import { colors, radii, spacing } from '../../tokens/design.tokens.stylex'
import Card from '../card'
import ListItem from '../list-item'
import Separator from '../separator'
import Text from '../text'

// oxlint-disable-next-line jsx-a11y/heading-has-content -- filled by useRender
const HEADING_2 = <h2 />

const ITEMS = ['First item', 'Second item', 'Third item']

const styles = stylex.create({
  // A dashed outline on each pane, so the tracks are legible in a snapshot.
  // The component paints nothing itself — these are the story's, not its.
  paneOutline: {
    borderColor: colors.outlineVariant,
    borderRadius: radii.md,
    borderStyle: 'dashed',
    borderWidth: '1px',
    padding: spacing.md,
  },
  stack: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.sm,
  },
})

function DetailPane() {
  return (
    <div {...stylex.props(styles.paneOutline)}>
      <div {...stylex.props(styles.stack)}>
        <Text render={HEADING_2} variant="titleLarge">
          Headline
        </Text>
        <Text tone="muted" variant="bodyMedium">
          Supporting line
        </Text>
        <Separator />
        <Text tone="muted" variant="bodyMedium">
          The detail pane takes the flexible track, so it absorbs whatever the
          list does not.
        </Text>
      </div>
    </div>
  )
}

function ListPane() {
  return (
    <Card padding="none" variant="outlined">
      {ITEMS.map((label, index) => (
        <div key={label}>
          {index === 0 ? null : <Separator />}
          <ListItem interactive supporting="Supporting line">
            {label}
          </ListItem>
        </div>
      ))}
    </Card>
  )
}

const meta = {
  args: {
    detail: <DetailPane />,
    list: <ListPane />,
  },
  component: ListDetail,
  // Chromatic captures both stories at the narrow arrangements too, because a
  // media query answers to the window rather than to a container and one
  // width can only ever show one of them. These merge with the project's light
  // and dark rather than replacing them, so the wide arrangement is still
  // covered by the default snapshot — see .storybook/modes.ts.
  parameters: {
    chromatic: { modes: breakpointModes },
  },
  title: 'Components/ListDetail',
} satisfies Meta<typeof ListDetail>

type Story = StoryObj<typeof meta>

const Default: Story = {}

// Its own story because below the expanded breakpoint it is a different
// layout rather than a differently-sized one — the list is gone, not narrower.
const ShowingDetail: Story = {
  args: {
    showing: 'detail',
  },
}

export { Default, ShowingDetail }

export default meta
