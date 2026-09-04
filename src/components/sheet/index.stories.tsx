import type { Meta, StoryObj } from '@storybook/react-vite'

import * as stylex from '@stylexjs/stylex'
import { expect, waitFor } from 'storybook/test'

import Sheet from '.'
import { spacing } from '../../tokens/design.tokens.stylex'
import Button from '../button'
import IconButton from '../icon-button'
import Separator from '../separator'
import Text from '../text'

// See avatar/index.stories.tsx for why the overview is built from the
// library's own components, why its sections are divided by a rule, and why
// the headings go through Text's `render`.
// oxlint-disable-next-line jsx-a11y/heading-has-content -- filled by useRender
const HEADING_1 = <h1 />
// oxlint-disable-next-line jsx-a11y/heading-has-content -- filled by useRender
const HEADING_2 = <h2 />
const PARAGRAPH = <p />

// The library ships no icons, so a story draws the one it needs — the same
// thing icon-button/index.stories.tsx does. Sized in `em` so it follows the
// font size IconButton sets for the control.
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

const styles = stylex.create({
  header: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.xs,
  },
  intro: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.xxs,
  },
  page: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.xl,
    marginInline: 'auto',
    maxInlineSize: '960px',
    padding: spacing.xl,
  },
  row: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.lg,
  },
})

const meta = {
  args: {
    size: 'md',
  },
  component: Sheet,
  title: 'Components/Sheet',
} satisfies Meta<typeof Sheet>

type Story = StoryObj<typeof meta>

// Pulled out because four stories render the same panel and only the sheet
// around it differs.
function PanelContents() {
  return (
    <>
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
        <Button slot="close" variant="text">
          Cancel
        </Button>
        <Button>Confirm</Button>
      </Sheet.Footer>
    </>
  )
}

const Overview: Story = {
  parameters: {
    // The sheet is portalled over the whole viewport, so an open one would
    // cover the prose describing it. The presentations get their own stories
    // below, which is what Chromatic has to look at.
    chromatic: { disableSnapshot: true },
  },
  render: () => (
    <div {...stylex.props(styles.page)}>
      <header {...stylex.props(styles.header)}>
        <Text render={HEADING_1} variant="displaySmall">
          Sheet
        </Text>
        <Text render={PARAGRAPH} tone="muted" variant="bodyLarge">
          A modal panel that arrives from the edge of the screen.
        </Text>
      </header>

      <Separator />

      <section {...stylex.props(styles.section)}>
        <div {...stylex.props(styles.intro)}>
          <Text render={HEADING_2} variant="titleLarge">
            Presentation
          </Text>
          <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
            One component, two presentations. Above the medium breakpoint it is
            a side sheet pinned to the inline end of the viewport; below it, the
            same panel becomes a bottom sheet. Narrow the window to watch it
            change.
          </Text>
        </div>
        <div {...stylex.props(styles.row)}>
          <Sheet size="md">
            <Button variant="outlined">Open medium</Button>
            <Sheet.Content>
              <PanelContents />
            </Sheet.Content>
          </Sheet>
          <Sheet size="sm">
            <Button variant="outlined">Open small</Button>
            <Sheet.Content>
              <PanelContents />
            </Sheet.Content>
          </Sheet>
        </div>
      </section>

      <Separator />

      <section {...stylex.props(styles.section)}>
        <div {...stylex.props(styles.intro)}>
          <Text render={HEADING_2} variant="titleLarge">
            Dismissal
          </Text>
          <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
            React Aria supplies the modal behaviour: focus moves into the panel
            and is trapped there, Escape closes, a press on the scrim closes,
            and the page behind cannot be scrolled. A button placed directly
            inside Sheet opens it, and any button given slot=&quot;close&quot;
            closes it — which is what the header&apos;s icon button and the
            footer&apos;s Cancel both are.
          </Text>
        </div>
        <div {...stylex.props(styles.row)}>
          <Sheet>
            <Button>Open</Button>
            <Sheet.Content>
              <PanelContents />
            </Sheet.Content>
          </Sheet>
        </div>
      </section>
    </div>
  ),
}

// Open on load, since a closed sheet renders nothing for Chromatic to compare.
const Default: Story = {
  render: (args) => (
    <Sheet {...args} defaultOpen>
      <Sheet.Content>
        <PanelContents />
      </Sheet.Content>
    </Sheet>
  ),
}

const Small: Story = {
  args: { size: 'sm' },
  render: (args) => (
    <Sheet {...args} defaultOpen>
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
  },
  render: (args) => (
    <Sheet {...args} defaultOpen>
      <Sheet.Content>
        <PanelContents />
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
  tags: ['!dev'],
}

export { BottomSheet, Default, OpensAndCloses, Overview, Small }

export default meta
