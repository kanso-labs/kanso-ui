import type { Meta, StoryObj } from '@storybook/react-vite'

import * as stylex from '@stylexjs/stylex'

import Tooltip from '.'
import { SearchGlyph } from '../../glyphs'
import { spacing } from '../../tokens/design.tokens.stylex'
import Button from '../button'
import IconButton from '../icon-button'

const styles = stylex.create({
  // Sized in `em`, so the glyph takes the button's own icon size.
  glyph: {
    blockSize: '1em',
    inlineSize: '1em',
  },
  // Room around the samples, so a tooltip opens on the side it is asked for
  // rather than flipping for want of space.
  row: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: spacing.xxl,
    paddingBlock: spacing.xxl,
  },
})

const meta = {
  args: {
    label: 'Supporting text',
  },
  component: Tooltip,
  title: 'Components/Tooltip',
} satisfies Meta<typeof Tooltip>

type Story = StoryObj<typeof meta>

const Default: Story = {
  render: (args) => (
    <div {...stylex.props(styles.row)}>
      <Tooltip {...args} defaultOpen side="bottom">
        <Button variant="outlined">Hover or focus</Button>
      </Tooltip>
    </div>
  ),
}

const OnAnIconButton: Story = {
  args: {
    label: 'Search',
  },
  render: (args) => (
    <div {...stylex.props(styles.row)}>
      <Tooltip {...args} defaultOpen side="bottom">
        <IconButton aria-label="Search">
          <SearchGlyph {...stylex.props(styles.glyph)} />
        </IconButton>
      </Tooltip>
    </div>
  ),
}

// Its own story because the cap is what a long label runs into, and a
// snapshot is what shows the shape it wraps to: 320px wide at most, with
// the label running on over as many lines as it needs.
const LongLabel: Story = {
  args: {
    label:
      'Supporting text long enough to pass the width the tooltip allows. It wraps onto further lines rather than running the width of the window.',
  },
  render: (args) => (
    <div {...stylex.props(styles.row)}>
      <Tooltip {...args} defaultOpen side="bottom">
        <Button variant="outlined">Hover or focus</Button>
      </Tooltip>
    </div>
  ),
}

// Opens above by default and flips to the opposite side when there is no room;
// `side` and `align` place it and `sideOffset` sets the gap. The other stories
// fix one side, so hover or focus a button here to see each tooltip open.
const Sides: Story = {
  render: () => (
    <div {...stylex.props(styles.row)}>
      <Tooltip label="Above" side="top">
        <Button variant="outlined">Top</Button>
      </Tooltip>
      <Tooltip label="Below" side="bottom">
        <Button variant="outlined">Bottom</Button>
      </Tooltip>
      <Tooltip label="Before" side="left">
        <Button variant="outlined">Left</Button>
      </Tooltip>
      <Tooltip label="After" side="right">
        <Button variant="outlined">Right</Button>
      </Tooltip>
    </div>
  ),
}

export { Default, LongLabel, OnAnIconButton, Sides }

export default meta
