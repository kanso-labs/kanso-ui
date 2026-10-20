import type { Meta, StoryObj } from '@storybook/react-vite'

import * as stylex from '@stylexjs/stylex'
import { expect, waitFor, within } from 'storybook/test'

import Dialog from '.'
import { CloseGlyph } from '../../glyphs'
import Button from '../button'
import IconButton from '../icon-button'
import Text from '../text'

const PARAGRAPH = <p />

const styles = stylex.create({
  // Sized in `em`, so the glyph takes the button's own icon size.
  glyph: {
    blockSize: '1em',
    inlineSize: '1em',
  },
})

const meta = {
  component: Dialog,
  title: 'Components/Dialog',
} satisfies Meta<typeof Dialog>

type Story = StoryObj<typeof meta>

const Default: Story = {
  parameters: { docs: { story: { height: '600px', inline: false } } },
  render: () => (
    <Dialog defaultOpen>
      <Button variant="outlined">Open dialog</Button>
      <Dialog.Content>
        <Dialog.Header>
          <Dialog.Title>Headline</Dialog.Title>
          <IconButton aria-label="Close" slot="close">
            <CloseGlyph {...stylex.props(styles.glyph)} />
          </IconButton>
        </Dialog.Header>
        <Dialog.Body>
          <Text tone="muted" variant="bodyMedium">
            Supporting text explains what the dialog is asking, in as many lines
            as it needs.
          </Text>
        </Dialog.Body>
        <Dialog.Footer>
          <Button slot="close" variant="text">
            Cancel
          </Button>
          <Button slot="close" variant="text">
            Confirm
          </Button>
        </Dialog.Footer>
      </Dialog.Content>
    </Dialog>
  ),
}

// Forty lines of body: more than the dialog has room for at any width, so
// the story shows what the body does when it runs out.
const LONG_BODY = Array.from({ length: 40 }, (_, index) => (
  <Text key={index} render={PARAGRAPH} tone="muted" variant="bodyMedium">
    Supporting line
  </Text>
))

// A body longer than the room is the one part that scrolls: the header and
// the actions stay on screen, and the rest of the text is a scroll away
// rather than clipped past the container's edge.
const LongBody: Story = {
  parameters: { docs: { story: { height: '600px', inline: false } } },
  render: () => (
    <Dialog defaultOpen>
      <Button variant="outlined">Open dialog</Button>
      <Dialog.Content>
        <Dialog.Header>
          <Dialog.Title>Headline</Dialog.Title>
          <IconButton aria-label="Close" slot="close">
            <CloseGlyph {...stylex.props(styles.glyph)} />
          </IconButton>
        </Dialog.Header>
        <Dialog.Body>{LONG_BODY}</Dialog.Body>
        <Dialog.Footer>
          <Button slot="close" variant="text">
            Cancel
          </Button>
          <Button slot="close" variant="text">
            Confirm
          </Button>
        </Dialog.Footer>
      </Dialog.Content>
    </Dialog>
  ),
}

// The alert dialog, found from the document: it is portalled to the end of
// the body, outside the story's canvas.
function alertDialog() {
  return document.querySelector('[role="alertdialog"]')
}

const AlertDialog: Story = {
  parameters: { docs: { story: { height: '600px', inline: false } } },
  // The story is the pattern a call site copies, so what it promises is
  // checked on the story itself: a question that has to be answered stays on
  // screen when Escape is pressed. React Aria keeps Escape and a press outside
  // on two separate props, and a story passing only the second documented an
  // alert dialog that closed on the first.
  play: async ({ userEvent }) => {
    await waitFor(async () => {
      await expect(alertDialog()).not.toBeNull()
    })
    // Escape reaches React Aria only from inside the dialog, so a press made
    // anywhere else would leave it open for a reason that proves nothing.
    await expect(alertDialog()?.contains(document.activeElement)).toBe(true)
    // And a dialog that is closing stays on screen until the animations on
    // it end, which the entry one has not yet: without this, the check below
    // passed on a dialog that Escape had already closed.
    for (const animation of document.getAnimations()) {
      animation.finish()
    }

    await userEvent.keyboard('{Escape}')

    await expect(alertDialog()).not.toBeNull()
  },
  render: () => (
    <Dialog defaultOpen>
      <Button variant="outlined">Open alert</Button>
      <Dialog.Content
        isDismissable={false}
        isKeyboardDismissDisabled
        role="alertdialog"
      >
        <Dialog.Header>
          <Dialog.Title>Headline</Dialog.Title>
        </Dialog.Header>
        <Dialog.Body>
          <Text tone="muted" variant="bodyMedium">
            Supporting text explains what happens either way.
          </Text>
        </Dialog.Body>
        <Dialog.Footer>
          <Button slot="close" variant="text">
            Cancel
          </Button>
          <Button slot="close" variant="text">
            Confirm
          </Button>
        </Dialog.Footer>
      </Dialog.Content>
    </Dialog>
  ),
}

// The same alert dialog below the medium breakpoint, where a dialog of the
// default role fills the window. An alert dialog stays the basic one there:
// rounded, centred over the scrim, and only as tall as its question.
const AlertDialogCompact: Story = {
  // Sizes the frame in Storybook itself, as Sheet's BottomSheet does, so the
  // story shows the compact width without narrowing the window by hand.
  globals: { viewport: { isRotated: false, value: 'mobile1' } },
  parameters: {
    // Chromatic is told the width through `modes`, under the project's own
    // mode names, for the reasons BottomSheet in sheet/index.stories.tsx
    // gives.
    chromatic: {
      modes: {
        dark: { theme: 'dark', viewport: { height: 700, width: 375 } },
        light: { theme: 'light', viewport: { height: 700, width: 375 } },
      },
    },
    docs: { story: { height: '600px', inline: false } },
  },
  render: AlertDialog.render,
}

// Three answers on a phone are more than one row holds, so the actions wrap
// onto a second row at the trailing edge rather than running the first of
// them past the container's start edge.
const ThreeActions: Story = {
  globals: AlertDialogCompact.globals,
  parameters: AlertDialogCompact.parameters,
  render: () => (
    <Dialog defaultOpen>
      <Button variant="outlined">Open alert</Button>
      <Dialog.Content
        isDismissable={false}
        isKeyboardDismissDisabled
        role="alertdialog"
      >
        <Dialog.Header>
          <Dialog.Title>Headline</Dialog.Title>
        </Dialog.Header>
        <Dialog.Body>
          <Text tone="muted" variant="bodyMedium">
            Supporting text explains what each answer does.
          </Text>
        </Dialog.Body>
        <Dialog.Footer>
          <Button slot="close" variant="text">
            First action
          </Button>
          <Button slot="close" variant="text">
            Second action
          </Button>
          <Button slot="close" variant="text">
            Third action
          </Button>
        </Dialog.Footer>
      </Dialog.Content>
    </Dialog>
  ),
}

// A dialog opened from inside another's body. The page is dimmed once, by
// the first dialog's scrim: the second draws its scrim with no fill, so the
// first dialog stays at full strength around it rather than dimmed again.
// The second is opened by a press rather than `defaultOpen`, as a reader
// opens it: two dialogs opening on the same render are portalled in the
// order their trees finish, which puts the second beneath the first.
const Nested: Story = {
  parameters: { docs: { story: { height: '600px', inline: false } } },
  play: async ({ canvasElement, userEvent }) => {
    // Both dialogs are portalled to the end of the body, outside the canvas.
    const page = within(canvasElement.ownerDocument.body)
    await userEvent.click(
      await page.findByRole('button', { name: 'Open second dialog' }),
    )
    // It fades in, and an element at the start of that is not yet visible.
    await waitFor(async () => {
      await expect(page.getByRole('alertdialog')).toBeVisible()
    })
  },
  render: () => (
    <Dialog defaultOpen>
      <Button variant="outlined">Open dialog</Button>
      <Dialog.Content>
        <Dialog.Header>
          <Dialog.Title>Headline</Dialog.Title>
        </Dialog.Header>
        <Dialog.Body>
          <Text tone="muted" variant="bodyMedium">
            Supporting text explains what the dialog is asking, in as many lines
            as it needs.
          </Text>
          <Dialog>
            <Button variant="outlined">Open second dialog</Button>
            <Dialog.Content role="alertdialog">
              <Dialog.Header>
                <Dialog.Title>Second headline</Dialog.Title>
              </Dialog.Header>
              <Dialog.Body>
                <Text tone="muted" variant="bodyMedium">
                  Supporting line
                </Text>
              </Dialog.Body>
              <Dialog.Footer>
                <Button slot="close" variant="text">
                  Cancel
                </Button>
                <Button slot="close" variant="text">
                  Confirm
                </Button>
              </Dialog.Footer>
            </Dialog.Content>
          </Dialog>
        </Dialog.Body>
        <Dialog.Footer>
          <Button slot="close" variant="text">
            Close
          </Button>
        </Dialog.Footer>
      </Dialog.Content>
    </Dialog>
  ),
}

// An address with nowhere to break, which is the string a body most often
// has to hold whole. It wraps inside the body rather than running past its
// edge, so on a phone the body has nothing to scroll sideways.
const ADDRESS =
  'https://example.com/firstitem/seconditem/thirditem/supportingline?query=0123456789'

const LongAddress: Story = {
  globals: AlertDialogCompact.globals,
  parameters: AlertDialogCompact.parameters,
  render: () => (
    <Dialog defaultOpen>
      <Button variant="outlined">Open alert</Button>
      <Dialog.Content
        isDismissable={false}
        isKeyboardDismissDisabled
        role="alertdialog"
      >
        <Dialog.Header>
          <Dialog.Title>Headline</Dialog.Title>
        </Dialog.Header>
        <Dialog.Body>
          <Text tone="muted" variant="bodyMedium">
            Supporting text names an address.
          </Text>
          {ADDRESS}
        </Dialog.Body>
        <Dialog.Footer>
          <Button slot="close" variant="text">
            Cancel
          </Button>
          <Button slot="close" variant="text">
            Confirm
          </Button>
        </Dialog.Footer>
      </Dialog.Content>
    </Dialog>
  ),
}

export {
  AlertDialog,
  AlertDialogCompact,
  Default,
  LongAddress,
  LongBody,
  Nested,
  ThreeActions,
}

export default meta
