import type { Meta, StoryObj } from '@storybook/react-vite'

import * as stylex from '@stylexjs/stylex'
import { expect, waitFor } from 'storybook/test'

import Popover from '.'
import { spacing } from '../../tokens/design.tokens.stylex'
import Button from '../button'
import IconButton from '../icon-button'
import Stack from '../stack'

// A story draws the one icon it needs, the same thing
// icon-button/index.stories.tsx does. Sized in `em` so it follows the font
// size IconButton sets for the control.
function InfoIcon() {
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
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5M12 8h.01" />
    </svg>
  )
}

// Laid out as a two-by-two grid, so each panel has room on the side it asks
// for — `top` next to the edge of the frame would flip to `bottom` instead.
const SIDES = ['top', 'right', 'left', 'bottom'] as const

const styles = stylex.create({
  // Centres the trigger and leaves the open panel somewhere to go, so the
  // snapshot frames both rather than cropping the panel at the bottom edge.
  frame: {
    display: 'flex',
    justifyContent: 'center',
    padding: spacing.xxxl,
  },
  // Every open panel needs room on the side it asks for, or it flips to the
  // opposite one and the story shows the collision handling rather than the
  // placement. A panel is around 56px tall, so the gutters are wider than the
  // spacing scale goes — these are frame measurements rather than a step of
  // the scale.
  sides: {
    display: 'grid',
    gap: '96px',
    gridTemplateColumns: 'repeat(2, max-content)',
    justifyContent: 'center',
    padding: '96px',
  },
})

const meta = {
  args: {
    size: 'md',
  },
  component: Popover,
  title: 'Components/Popover',
} satisfies Meta<typeof Popover>

type Story = StoryObj<typeof meta>

// Pulled out because several stories show the same panel and only the popover
// around it differs.
function PanelContents() {
  return (
    <>
      <Popover.Title>Headline</Popover.Title>
      <Popover.Description>
        Supporting line describing what the popover is for.
      </Popover.Description>
      <Stack direction="row" gap="sm" justify="end">
        <Button slot="close" variant="text">
          Dismiss
        </Button>
      </Stack>
    </>
  )
}

// Open on load, since a closed popover renders nothing for Chromatic to
// compare.
// Open on load, for the same reason the others are: a hovered popover that
// nothing is hovering renders nothing to compare.
const HoverTrigger: Story = {
  args: {
    defaultOpen: true,
    trigger: 'hover',
  },
  parameters: { docs: { story: { height: '400px', inline: false } } },
  render: (args) => (
    <Popover {...args}>
      <Button variant="outlined">Hover or focus</Button>
      <Popover.Content>
        <PanelContents />
      </Popover.Content>
    </Popover>
  ),
}

const Default: Story = {
  parameters: { docs: { story: { height: '400px', inline: false } } },
  render: (args) => (
    <div {...stylex.props(styles.frame)}>
      <Popover {...args} defaultOpen>
        <Button>Open</Button>
        <Popover.Content>
          <PanelContents />
        </Popover.Content>
      </Popover>
    </div>
  ),
}

const Small: Story = {
  args: { size: 'sm' },
  parameters: { docs: { story: { height: '400px', inline: false } } },
  render: (args) => (
    <div {...stylex.props(styles.frame)}>
      <Popover {...args} defaultOpen>
        <Button>Open</Button>
        <Popover.Content>
          <PanelContents />
        </Popover.Content>
      </Popover>
    </div>
  ),
}

// Its own story because an IconButton opens a popover the way a Button does,
// with no visible label to name it, so its `aria-label` does. Escape, a press
// outside and the button given `slot="close"` each dismiss the panel.
const OnAnIconButton: Story = {
  parameters: { docs: { story: { height: '400px', inline: false } } },
  render: (args) => (
    <div {...stylex.props(styles.frame)}>
      <Popover {...args} defaultOpen>
        <IconButton aria-label="About" variant="tonal">
          <InfoIcon />
        </IconButton>
        <Popover.Content>
          <PanelContents />
        </Popover.Content>
      </Popover>
    </div>
  ),
}

// All four sides at once, which is the one thing the parts cannot show
// separately: `side` names a preference, and what the panel does with it
// depends on the room around the trigger.
//
// Each panel carries a title as well as its trigger label, because a dialog
// without one has no accessible name — `a11y.test` is `'error'` here, so a
// story that leaves it out fails rather than merely warning.
const Sides: Story = {
  parameters: { docs: { story: { height: '400px', inline: false } } },
  render: (args) => (
    <div {...stylex.props(styles.sides)}>
      {SIDES.map((side) => (
        <Popover {...args} defaultOpen key={side}>
          <Button variant="outlined">{side}</Button>
          {/* Four panels open at once means four of them reaching for the
              focus, and whichever wins draws a ring the story is not about.
              Nothing here is meant to be operated, so none of them takes it. */}
          <Popover.Content side={side}>
            <Popover.Title>{side}</Popover.Title>
          </Popover.Content>
        </Popover>
      ))}
    </div>
  ),
}

// The one check that runs against the real entry animation and React Aria's own
// focus handling rather than a stubbed clock, which is why it is a story and
// not a case in index.test.tsx. See AGENTS.md, "Controlling time".
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
    // keeps this story looking at its own panel — a document-wide query finds
    // whichever one a neighbouring story left mounted, which is a flake that
    // only shows up in a full run.
    const panelId = await waitFor(() => {
      const id = trigger.getAttribute('aria-controls')
      if (!id) {
        throw new Error('the trigger never pointed at a panel')
      }
      return id
    })
    await expect(document.getElementById(panelId)).not.toBeNull()

    await userEvent.keyboard('{Escape}')
    await waitFor(async () => {
      await expect(document.getElementById(panelId)).toBeNull()
    })

    // Focus goes back to the trigger rather than to the top of the page,
    // which is what lets a keyboard carry on from where it was. React Aria
    // restores it a frame after the panel unmounts, so the panel being gone
    // does not mean focus has landed yet — reading it straight away caught
    // the trigger under Chromium 152 and `<body>` under 153.
    await waitFor(async () => {
      await expect(document.activeElement).toBe(trigger)
    })
    await expect(trigger.getAttribute('aria-expanded')).toBe('false')
  },
  render: (args) => (
    <Popover {...args}>
      <Button>Open</Button>
      <Popover.Content>
        <PanelContents />
      </Popover.Content>
    </Popover>
  ),
  tags: ['!autodocs', '!dev'],
}

export { Default, HoverTrigger, OnAnIconButton, OpensAndCloses, Sides, Small }

export default meta
