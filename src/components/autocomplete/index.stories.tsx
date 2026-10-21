import type { Meta, StoryObj } from '@storybook/react-vite'

import * as stylex from '@stylexjs/stylex'
import { expect, waitFor } from 'storybook/test'

import Autocomplete from '.'
import { CloseGlyph } from '../../glyphs'
import { colors, radii, spacing } from '../../tokens/design.tokens.stylex'
import Button from '../button'
import Dialog from '../dialog'
import IconButton from '../icon-button'
import ListBox from '../list-box'
import Menu from '../menu'
import SearchField from '../search-field'

const styles = stylex.create({
  // The palette's close glyph, sized in `em` so it takes the button's own
  // icon size, as the Dialog stories size theirs.
  closeGlyph: {
    blockSize: '1em',
    inlineSize: '1em',
  },
  // A command's icon, at the 24dp the search bar draws its magnifier at. A
  // row sets no icon size of its own, so the size is the story's to give.
  glyph: {
    blockSize: '24px',
    display: 'block',
    inlineSize: '24px',
  },
  // The command palette's own column: the search bar over its results.
  palette: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.sm,
  },
  // The results, inset so they line up with the bar above them. The bar is
  // the search page's, whose padding is to a 48dp tap target with the
  // magnifier 12dp inside it — `spacing.lg + spacing.md` — while a row's
  // own padding is the lists page's 16dp. Insetting the list by the 12dp
  // between them puts a row's leading slot under the magnifier and its
  // headline under the typed text, which is the alignment the search page
  // draws and what makes the two read as one column rather than two.
  paletteResults: {
    paddingInline: spacing.md,
  },
  // A searchable list: the bar over the list on a surface of its own, which
  // is the shape the search page draws.
  surface: {
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: radii.md,
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.sm,
    inlineSize: '320px',
    padding: spacing.sm,
  },
})

const PEOPLE = (
  <>
    <ListBox.Item id="ada" supporting="Supporting line">
      Ada Lovelace
    </ListBox.Item>
    <ListBox.Item id="grace" supporting="Supporting line">
      Grace Hopper
    </ListBox.Item>
    <ListBox.Item id="alan" supporting="Supporting line">
      Alan Turing
    </ListBox.Item>
  </>
)

// A menu's children are a collection, so the bar goes in the surface's
// search slot rather than beside the items — see Menu.Content's own note.
const SEARCH = <SearchField label="Search commands" placeholder="Search" />

const COMMANDS = (
  <>
    <Menu.Item id="open">Open file</Menu.Item>
    <Menu.Item id="save">Save file</Menu.Item>
    <Menu.Item id="close">Close file</Menu.Item>
  </>
)

// A plain glyph per command, drawn by the story: the library's own are
// private to it. They are here because the palette's rows need leading
// content to line up with the bar's magnifier — see `paletteResults`.
function Glyph({ path }: { path: string }) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
      {...stylex.props(styles.glyph)}
    >
      <path d={path} />
    </svg>
  )
}

const OPEN = (
  <Glyph path="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" />
)
const SAVE = <Glyph path="M12 4v10m0 0 4-4m-4 4-4-4M5 19h14" />
const CLOSE = <Glyph path="m7 7 10 10M17 7 7 17" />

// The palette's search bar, which takes focus as the dialog opens: a palette
// is opened to be typed into, so the first keystroke searches rather than
// landing on the dialog.
const PALETTE_SEARCH = (
  <SearchField
    // oxlint-disable-next-line jsx-a11y/no-autofocus -- a palette opens to be typed into, so the input takes focus rather than the dialog around it
    autoFocus
    label="Search commands"
    placeholder="Type a command"
  />
)

// The palette's results, which run a command rather than select one: no
// `selectionMode`, and an `onAction` that closes the dialog, since what a
// command does is the page's and closing is what every command shares. A
// selectable list would mark the row and leave the dialog open, which is a
// picker's behaviour rather than a palette's.
function paletteResults(close: () => void) {
  return (
    <ListBox
      aria-label="Commands"
      onAction={close}
      {...stylex.props(styles.paletteResults)}
    >
      <ListBox.Item id="open" leading={OPEN}>
        Open file
      </ListBox.Item>
      <ListBox.Item id="save" leading={SAVE}>
        Save file
      </ListBox.Item>
      <ListBox.Item id="close" leading={CLOSE}>
        Close file
      </ListBox.Item>
    </ListBox>
  )
}

const meta = {
  component: Autocomplete,
  title: 'Components/Autocomplete',
} satisfies Meta<typeof Autocomplete>

type Story = StoryObj<typeof meta>

const Default: Story = {
  render: (args) => (
    <div {...stylex.props(styles.surface)}>
      <Autocomplete {...args}>
        <SearchField label="Search people" placeholder="Search" />
        <ListBox aria-label="People" selectionMode="single">
          {PEOPLE}
        </ListBox>
      </Autocomplete>
    </div>
  ),
}

// Filtered down to one, so a snapshot shows what searching does rather than
// what the list looks like before it starts.
const Filtered: Story = {
  args: { defaultInputValue: 'Ada' },
  render: Default.render,
}

const InAMenu: Story = {
  parameters: { docs: { story: { height: '360px', inline: false } } },
  render: (args) => (
    <Menu defaultOpen>
      <Button variant="outlined">Commands</Button>
      <Autocomplete {...args}>
        <Menu.Content search={SEARCH}>{COMMANDS}</Menu.Content>
      </Autocomplete>
    </Menu>
  ),
}

// A search that matches nothing. The list draws its empty row in place of
// the options, and the status Autocomplete renders says the same to a
// screen reader.
const FilteredEmpty: Story = {
  args: { defaultInputValue: 'zzz' },
  render: Default.render,
}

// The same in a menu, which keeps a row's height rather than shrinking to
// its search bar, and announces it from its own surface.
const FilteredEmptyInAMenu: Story = {
  args: { defaultInputValue: 'zzz' },
  parameters: InAMenu.parameters,
  render: InAMenu.render,
}

// The palette open on load, since a closed dialog renders nothing for
// Chromatic to compare. The trigger is kept: React Aria's DialogTrigger wraps
// its children in one PressResponder and warns when nothing inside it is
// pressable, so a Dialog written without a button is a shape no call site
// should copy.
//
// The header is what closes it on a compact window. Below the medium
// breakpoint the dialog fills the window, so there is no scrim to press, and
// a phone has no Escape key; the close button is the one way out there.
const CommandPalette: Story = {
  parameters: { docs: { story: { height: '640px', inline: false } } },
  // The story is the pattern a call site copies, so what it promises is
  // checked on the story itself: the search field has focus once the palette
  // is open. React Aria's dialog takes focus a frame after it mounts unless
  // something inside it already has it, so this waits rather than reading
  // once. Running a command is left unchecked here, since it closes the
  // dialog the snapshot is of.
  play: async () => {
    await waitFor(async () => {
      const search = document.querySelector('[role="dialog"] input')
      await expect(search).not.toBeNull()
      await expect(document.activeElement).toBe(search)
    })
  },
  render: (args) => (
    <Dialog defaultOpen>
      <Button variant="outlined">Open the palette</Button>
      <Dialog.Content>
        {({ close }) => (
          <>
            <Dialog.Header>
              <Dialog.Title>Commands</Dialog.Title>
              <IconButton aria-label="Close" slot="close">
                <CloseGlyph {...stylex.props(styles.closeGlyph)} />
              </IconButton>
            </Dialog.Header>
            <Dialog.Body>
              <div {...stylex.props(styles.palette)}>
                <Autocomplete {...args}>
                  {PALETTE_SEARCH}
                  {paletteResults(close)}
                </Autocomplete>
              </div>
            </Dialog.Body>
          </>
        )}
      </Dialog.Content>
    </Dialog>
  ),
}

export {
  CommandPalette,
  Default,
  Filtered,
  FilteredEmpty,
  FilteredEmptyInAMenu,
  InAMenu,
}

export default meta
