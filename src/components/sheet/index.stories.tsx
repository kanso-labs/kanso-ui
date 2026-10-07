import type { Meta, StoryObj } from '@storybook/react-vite'

import { expect, waitFor } from 'storybook/test'

import Sheet from '.'
import Button from '../button'
import IconButton from '../icon-button'
import Text from '../text'

const PARAGRAPH = <p />

// A story draws the one icon it needs, the same thing
// icon-button/index.stories.tsx does. Sized in `em` so it follows the font
// size IconButton sets for the control.
function CloseIcon() {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height="1em"
      stroke="currentColor"
      strokeLinecap="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
      width="1em"
    >
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  )
}

const meta = {
  component: Sheet,
  title: 'Components/Sheet',
} satisfies Meta<typeof Sheet>

type Story = StoryObj<typeof meta>

// Pulled out because four stories render the same panel and only the sheet
// around it differs.
function PanelContents() {
  return (
    <>
      <Sheet.Handle />
      <Sheet.Header>
        <Sheet.Title>Headline</Sheet.Title>
        <IconButton aria-label="Close" slot="close">
          <CloseIcon />
        </IconButton>
      </Sheet.Header>
      <Sheet.Body>
        <Text tone="muted" variant="bodyMedium">
          Supporting line describing what the sheet is for.
        </Text>
        <Text tone="muted" variant="bodyMedium">
          The body is the only part that scrolls, so the header and footer keep
          their place however much content sits between them.
        </Text>
      </Sheet.Body>
      <Sheet.Footer>
        <Button>Confirm</Button>
        <Button slot="close" variant="outlined">
          Cancel
        </Button>
      </Sheet.Footer>
    </>
  )
}

// Open on load, since a closed sheet renders nothing for Chromatic to compare.
//
// The trigger is here rather than left out, even though the panel is what the
// story is for. React Aria's DialogTrigger wraps its children in one
// PressResponder and warns when nothing inside it is pressable, so a Sheet
// written without a button is a shape no call site should copy — and the
// scrim over the page behind is part of what a modal sheet looks like.
const Default: Story = {
  parameters: { docs: { story: { height: '600px', inline: false } } },
  render: (args) => (
    <Sheet {...args} defaultOpen>
      <Button variant="outlined">Open</Button>
      <Sheet.Content>
        <PanelContents />
      </Sheet.Content>
    </Sheet>
  ),
}

// The same sheet under the medium breakpoint, where it becomes a bottom sheet:
// full width, only as tall as its content, and rounded along the top instead
// of down the leading edge.
const BottomSheet: Story = {
  // Sizes the frame in Storybook itself, so the story shows a bottom sheet
  // without having to narrow the window by hand.
  globals: { viewport: { isRotated: false, value: 'mobile1' } },
  parameters: {
    chromatic: {
      // Chromatic renders in a browser of its own and has to be told the
      // width separately, or it captures the side sheet again. It has to be
      // told through `modes` rather than the older `viewports`: the project
      // sets `modes` for both themes, and Chromatic errors outright if a
      // story carries both keys. Redeclared here rather than extended,
      // because this story overrides the width of the two themes it already
      // has rather than adding baselines of its own — see
      // list-detail/index.stories.tsx for the case that does, which imports
      // its modes from .storybook/modes.ts instead.
      //
      // The mode *names* match it too, and that part matters: baselines are
      // keyed on the name, so renaming either restarts its history.
      modes: {
        dark: { theme: 'dark', viewport: { height: 700, width: 375 } },
        light: { theme: 'light', viewport: { height: 700, width: 375 } },
      },
    },
    docs: { story: { height: '600px', inline: false } },
  },
  render: (args) => (
    <Sheet {...args} defaultOpen>
      <Button variant="outlined">Open</Button>
      <Sheet.Content>
        <PanelContents />
      </Sheet.Content>
    </Sheet>
  ),
}

// Forty lines of body: more than the bottom sheet has room for, so the story
// shows what the body does when it runs out.
const LONG_BODY = Array.from({ length: 40 }, (_, index) => (
  <Text key={index} render={PARAGRAPH} tone="muted" variant="bodyMedium">
    Supporting line
  </Text>
))

// A body longer than the room is the one part that scrolls: the handle, the
// header and the actions stay on screen, and the rest of the text is a scroll
// away rather than clipped past the panel's edge. The bottom sheet, since it
// is only as tall as its content up to a cap, and that is the presentation
// that clipped; the side sheet fills the height and always scrolled.
const LongBody: Story = {
  globals: BottomSheet.globals,
  parameters: BottomSheet.parameters,
  render: (args) => (
    <Sheet {...args} defaultOpen>
      <Button variant="outlined">Open</Button>
      <Sheet.Content>
        <Sheet.Handle />
        <Sheet.Header>
          <Sheet.Title>Headline</Sheet.Title>
          <IconButton aria-label="Close" slot="close">
            <CloseIcon />
          </IconButton>
        </Sheet.Header>
        <Sheet.Body>{LONG_BODY}</Sheet.Body>
        <Sheet.Footer>
          <Button>Confirm</Button>
          <Button slot="close" variant="outlined">
            Cancel
          </Button>
        </Sheet.Footer>
      </Sheet.Content>
    </Sheet>
  ),
}

// The one check that runs against the real entry animation rather than a
// stubbed clock — 250ms of it — which is why it is a story and not a case in
// index.test.tsx. See AGENTS.md, "Controlling time".
const OpensAndCloses: Story = {
  parameters: {
    chromatic: { disableSnapshot: true },
  },
  play: async ({ canvas, userEvent }) => {
    const trigger = canvas.getByRole('button', { name: 'Open' })
    await userEvent.click(trigger)

    // The panel is portalled to the end of the body, so it is outside the
    // canvas and has to be found through the document. Going via the
    // trigger's own aria-controls rather than querying for [role=dialog]
    // keeps this story looking at its own sheet — a document-wide query finds
    // whichever panel a neighbouring story left mounted, which is a flake
    // that only shows up in a full run.
    const panelId = await waitFor(() => {
      const id = trigger.getAttribute('aria-controls')
      if (!id) {
        throw new Error('the trigger never pointed at a panel')
      }
      return id
    })
    const panel = document.getElementById(panelId)
    await expect(panel).not.toBeNull()

    // Focus has to land inside the panel, or the keyboard is still back on
    // the page the sheet is covering.
    await waitFor(async () => {
      await expect(panel?.contains(document.activeElement)).toBe(true)
    })

    await userEvent.keyboard('{Escape}')
    await waitFor(async () => {
      await expect(document.getElementById(panelId)).toBeNull()
    })
    await expect(trigger.getAttribute('aria-expanded')).toBe('false')
  },
  render: (args) => (
    <Sheet {...args}>
      <Button>Open</Button>
      <Sheet.Content>
        <PanelContents />
      </Sheet.Content>
    </Sheet>
  ),
  tags: ['!autodocs', '!dev'],
}

export { BottomSheet, Default, LongBody, OpensAndCloses }

export default meta
