import type { Meta, StoryObj } from '@storybook/react-vite'

import * as stylex from '@stylexjs/stylex'

import Toolbar from '.'
import Button from '../button'
import IconButton from '../icon-button'
import ListBox from '../list-box'
import Select from '../select'
import Separator from '../separator'

const styles = stylex.create({
  // Sized in `em` so it follows the button's own type size.
  icon: {
    blockSize: '1em',
    inlineSize: '1em',
  },
})

// Plain glyphs rather than an icon set, so the stories stay a demonstration
// of the toolbar alone.
function Glyph({ path }: { path: string }) {
  return (
    <svg
      aria-hidden="true"
      fill="currentColor"
      viewBox="0 0 24 24"
      {...stylex.props(styles.icon)}
    >
      <path d={path} />
    </svg>
  )
}

const FIRST = 'M4 6h16v2H4zm0 5h16v2H4zm0 5h10v2H4z'
const SECOND = 'M6 4h12v2H6zm-2 5h16v2H4zm2 5h12v2H6zm-2 5h16v2H4z'
const THIRD = 'M4 6h16v2H4zm6 5h10v2H10zm-6 5h16v2H4z'
const FOURTH = 'M12 3 4 9v12h6v-7h4v7h6V9z'

const CONTROLS = (
  <>
    <IconButton aria-label="First item">
      <Glyph path={FIRST} />
    </IconButton>
    <IconButton aria-label="Second item">
      <Glyph path={SECOND} />
    </IconButton>
    <IconButton aria-label="Third item">
      <Glyph path={THIRD} />
    </IconButton>
    <Separator />
    <IconButton aria-label="Fourth item">
      <Glyph path={FOURTH} />
    </IconButton>
  </>
)

const OPTIONS = (
  <>
    <ListBox.Item id="first">First item</ListBox.Item>
    <ListBox.Item id="second">Second item</ListBox.Item>
    <ListBox.Item id="third">Third item</ListBox.Item>
  </>
)

// A button and a field beside the icon buttons, which the bar holds as
// readily. The field is a select rather than a text field: the bar takes the
// left and right arrows before anything inside it sees them, which costs a
// select only its shortcut for stepping through the options while closed —
// the up and down arrows still open it — and would leave a text field's
// caret unable to move along the line. Its 56dp box and the bar's 8dp
// either side of it make the bar 72dp, past the 64dp it keeps for icon
// buttons alone.
const MIXED = (
  <>
    <IconButton aria-label="First item">
      <Glyph path={FIRST} />
    </IconButton>
    <IconButton aria-label="Second item">
      <Glyph path={SECOND} />
    </IconButton>
    <Separator />
    <Select defaultValue="first" label="Label" options={OPTIONS} />
    <Button variant="tonal">Label</Button>
  </>
)

const meta = {
  args: {
    'aria-label': 'Label',
    children: CONTROLS,
  },
  component: Toolbar,
  title: 'Components/Toolbar',
} satisfies Meta<typeof Toolbar>

type Story = StoryObj<typeof meta>

const Default: Story = {}

const Vibrant: Story = {
  args: { tone: 'vibrant' },
}

const Vertical: Story = {
  args: { orientation: 'vertical' },
}

// Its own story because a field is what makes the bar grow past its 64dp,
// which a snapshot shows and the icon buttons never do.
const WithButtonAndField: Story = {
  args: { children: MIXED },
}

const Disabled: Story = {
  args: {
    children: (
      <>
        <IconButton aria-label="First item">
          <Glyph path={FIRST} />
        </IconButton>
        <IconButton aria-label="Second item" isDisabled>
          <Glyph path={SECOND} />
        </IconButton>
        <Separator />
        <IconButton aria-label="Third item">
          <Glyph path={THIRD} />
        </IconButton>
      </>
    ),
  },
}

export { Default, Disabled, Vertical, Vibrant, WithButtonAndField }

export default meta
