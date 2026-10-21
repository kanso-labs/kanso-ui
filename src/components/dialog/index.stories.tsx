import type { Meta, StoryObj } from '@storybook/react-vite'
import type { ReactNode } from 'react'

import * as stylex from '@stylexjs/stylex'
import { useCallback, useLayoutEffect, useState } from 'react'
import { expect, waitFor, within } from 'storybook/test'

import Dialog from '.'
import { CloseGlyph } from '../../glyphs'
import { colors, spacing } from '../../tokens/design.tokens.stylex'
import Button from '../button'
import IconButton from '../icon-button'
import Text from '../text'

const PARAGRAPH = <p />

const styles = stylex.create({
  // The body under an icon, centred with the headline.
  centredBody: {
    textAlign: 'center',
  },
  // A header with an icon: the icon over the headline, both centred, 16dp
  // apart, as the dialogs page draws it.
  centredHeader: {
    alignItems: 'center',
    flexDirection: 'column',
    gap: spacing.lg,
    justifyContent: 'center',
    textAlign: 'center',
  },
  // Sized in `em`, so the glyph takes the button's own icon size.
  glyph: {
    blockSize: '1em',
    inlineSize: '1em',
  },
  // The icon above the headline, at the page's 24dp in the secondary role.
  icon: {
    blockSize: '24px',
    color: colors.secondary,
    display: 'block',
    inlineSize: '24px',
  },
})

// The phone width the compact stories are drawn at, on the Overview page as
// in Chromatic's modes below.
const COMPACT_WIDTH = '375px'

// Narrows the frame the Overview page draws a compact story in. That frame
// is as wide as the page's column, which is above the medium breakpoint, so
// a compact story drew its wide form there and the page showed nothing the
// story claims. The viewport global the story sets sizes Storybook's own
// canvas alone. Only a frame inside one of the page's story blocks is
// touched: on its own a story's frame is the canvas, which the viewport
// toolbar sizes, and a test run or a Chromatic snapshot frames it otherwise.
function CompactDocsFrame({ children }: { children: ReactNode }) {
  useLayoutEffect(() => {
    const frame = window.frameElement
    if (!isDocsFrame(frame)) {
      return undefined
    }
    const { width } = frame.style
    frame.style.width = COMPACT_WIDTH
    return () => {
      frame.style.width = width
    }
  }, [])

  return <>{children}</>
}

// A dialog nothing on the page opens: the page holds whether it is open, so
// a route, a menu item or a finished request can show it, and `Dialog` is
// left out. The button beside it is the page's own and opens it by setting
// that state. Open on load, as the other stories are, since a closed dialog
// renders nothing for Chromatic to compare.
function ControlledDialog() {
  const [isOpen, setOpen] = useState(true)
  const open = useCallback(() => {
    setOpen(true)
  }, [])

  return (
    <>
      <Button onPress={open} variant="outlined">
        Open dialog
      </Button>
      <Dialog.Content isOpen={isOpen} onOpenChange={setOpen}>
        <Dialog.Header>
          <Dialog.Title>Headline</Dialog.Title>
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
    </>
  )
}

// The frame belongs to the page around it, so `instanceof` against this
// frame's own HTMLIFrameElement would never hold; the tag is read instead.
function isDocsFrame(element: Element | null): element is HTMLIFrameElement {
  return (
    element?.tagName === 'IFRAME' &&
    element.closest('[data-story-block]') !== null
  )
}

const meta = {
  component: Dialog,
  // A tab of its own beside the root's in the Overview page's props table,
  // for each part with props of its own: `Dialog` holds only the open state,
  // and the dismissal settings and the portal are `Dialog.Content`'s. The
  // header, body and footer take a `<div>`'s attributes and nothing else,
  // which the table leaves out, so a tab of theirs would be empty.
  subcomponents: {
    'Dialog.Content': Dialog.Content,
    'Dialog.Title': Dialog.Title,
  },
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
    // React Aria moves focus in a frame after the dialog mounts, so this
    // waits for it: read once, as the dialog appeared, it could find focus
    // still on the page, as it did on the Overview page, which loads this
    // story's frame beside four others.
    await waitFor(async () => {
      await expect(alertDialog()?.contains(document.activeElement)).toBe(true)
    })
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
  // The Overview page's frame, narrowed to the same width.
  decorators: [
    (Story) => (
      <CompactDocsFrame>
        <Story />
      </CompactDocsFrame>
    ),
  ],
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
  decorators: AlertDialogCompact.decorators,
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

// The default dialog below the medium breakpoint, where it fills the window
// as the page's full-screen dialog: square corners, the headline in a 56dp
// bar with a divider under it, and the actions in a 56dp bar with a divider
// over them.
const FullScreen: Story = {
  decorators: AlertDialogCompact.decorators,
  globals: AlertDialogCompact.globals,
  parameters: AlertDialogCompact.parameters,
  render: Default.render,
}

// What the Overview page prints under Controlled. Storybook writes no snippet
// for a story whose render takes no args, which would leave this one's panel
// empty, and the state is inside ControlledDialog in any case, so the pattern
// is written out by hand.
const CONTROLLED_SOURCE = `const [isOpen, setOpen] = useState(false)

<Button onPress={() => setOpen(true)} variant="outlined">
  Open dialog
</Button>
<Dialog.Content isOpen={isOpen} onOpenChange={setOpen}>
  <Dialog.Header>
    <Dialog.Title>Headline</Dialog.Title>
  </Dialog.Header>
  <Dialog.Body>
    <Text tone="muted" variant="bodyMedium">
      Supporting text explains what the dialog is asking.
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
</Dialog.Content>`

const Controlled: Story = {
  parameters: {
    docs: {
      source: { code: CONTROLLED_SOURCE, language: 'tsx' },
      story: { height: '600px', inline: false },
    },
  },
  render: () => <ControlledDialog />,
}

// An icon above the headline, which the page centres the headline and the
// body with. The icon and the centring are the call site's, given to
// `Dialog.Header` and `Dialog.Body`. An alert dialog, so it stays the basic
// dialog at every width, the one the page draws an icon in.
const WithIcon: Story = {
  parameters: { docs: { story: { height: '600px', inline: false } } },
  render: () => (
    <Dialog defaultOpen>
      <Button variant="outlined">Open alert</Button>
      <Dialog.Content
        isDismissable={false}
        isKeyboardDismissDisabled
        role="alertdialog"
      >
        <Dialog.Header {...stylex.props(styles.centredHeader)}>
          <svg
            aria-hidden="true"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
            {...stylex.props(styles.icon)}
          >
            <circle cx="12" cy="12" r="9" />
            <path d="M12 11v6M12 7.5v.01" />
          </svg>
          <Dialog.Title>Headline</Dialog.Title>
        </Dialog.Header>
        <Dialog.Body {...stylex.props(styles.centredBody)}>
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

// A dialog opened from inside another's body. Each draws a scrim of its own,
// so the first dialog is dimmed behind the second as the page is behind the
// first, and the page behind both is dimmed twice over. The second is opened
// by a press rather than `defaultOpen`, as a reader opens it: two dialogs
// opening on the same render are portalled in the order their trees finish,
// which puts the second beneath the first.
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
  decorators: AlertDialogCompact.decorators,
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
  Controlled,
  Default,
  FullScreen,
  LongAddress,
  LongBody,
  Nested,
  ThreeActions,
  WithIcon,
}

export default meta
