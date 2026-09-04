import type { Meta, StoryObj } from '@storybook/react-vite'

import * as stylex from '@stylexjs/stylex'
import { expect, waitFor } from 'storybook/test'

import Popover from '.'
import { spacing } from '../../tokens/design.tokens.stylex'
import Button from '../button'
import IconButton from '../icon-button'
import Separator from '../separator'
import Stack from '../stack'
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

// Hoisted for the same reason the headings above are: `render` takes an
// element, and react-perf rejects one built inline on every render.
const FILLED_BUTTON = <Button />
const INFO_BUTTON = <IconButton aria-label="About" variant="tonal" />
const OUTLINED_BUTTON = <Button variant="outlined" />

// Laid out as a two-by-two grid, so each panel has room on the side it asks
// for — `top` next to the edge of the frame would flip to `bottom` instead.
const SIDES = ['top', 'right', 'left', 'bottom'] as const
const TEXT_BUTTON = <Button variant="text" />

const styles = stylex.create({
  // Centres the trigger and leaves the open panel somewhere to go, so the
  // snapshot frames both rather than cropping the panel at the bottom edge.
  frame: {
    display: 'flex',
    justifyContent: 'center',
    padding: spacing.xxxl,
  },
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
  // Every open panel needs room on the side it asks for, or it flips to the
  // opposite one and the story shows the collision handling rather than the
  // placement. A panel is around 56px tall, so the gutters are wider than the
  // spacing scale goes — these are frame measurements rather than a step of
  // the scale, the same way the other overviews set their own measure.
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
        <Popover.Close render={TEXT_BUTTON}>Dismiss</Popover.Close>
      </Stack>
    </>
  )
}

const Overview: Story = {
  parameters: {
    // The panels below open over the prose describing them, so the states
    // Chromatic has to look at get stories of their own.
    chromatic: { disableSnapshot: true },
  },
  render: () => (
    <div {...stylex.props(styles.page)}>
      <header {...stylex.props(styles.header)}>
        <Text render={HEADING_1} variant="displaySmall">
          Popover
        </Text>
        <Text render={PARAGRAPH} tone="muted" variant="bodyLarge">
          A panel anchored to the control that opened it.
        </Text>
      </header>

      <Separator />

      <section {...stylex.props(styles.intro)}>
        <Text render={HEADING_2} variant="titleLarge">
          Anchoring
        </Text>
        <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
          The panel opens against its trigger, eight pixels off it, and flips to
          the opposite side or shifts along the edge of the viewport when there
          is not enough room. Scroll the page with one open to watch it follow.
        </Text>
      </section>
      <div>
        <Popover>
          <Popover.Trigger render={OUTLINED_BUTTON}>Open</Popover.Trigger>
          <Popover.Content>
            <PanelContents />
          </Popover.Content>
        </Popover>
      </div>

      <Separator />

      <section {...stylex.props(styles.intro)}>
        <Text render={HEADING_2} variant="titleLarge">
          Width
        </Text>
        <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
          Two widths, and both are caps rather than fixed measures: a panel is
          only as wide as its contents, and never wider than the room left
          beside its anchor.
        </Text>
      </section>
      <Stack direction="row" gap="sm">
        <Popover size="sm">
          <Popover.Trigger render={OUTLINED_BUTTON}>Open small</Popover.Trigger>
          <Popover.Content>
            <PanelContents />
          </Popover.Content>
        </Popover>
        <Popover size="md">
          <Popover.Trigger render={OUTLINED_BUTTON}>
            Open medium
          </Popover.Trigger>
          <Popover.Content>
            <PanelContents />
          </Popover.Content>
        </Popover>
      </Stack>

      <Separator />

      <section {...stylex.props(styles.intro)}>
        <Text render={HEADING_2} variant="titleLarge">
          Dismissal
        </Text>
        <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
          Base UI supplies the behaviour: Escape closes, a press outside closes,
          and focus returns to the trigger. The page behind stays scrollable and
          clickable, which is the difference from Sheet. Anything wrapped in
          Popover.Close closes it too.
        </Text>
      </section>
      <div>
        <Popover>
          <Popover.Trigger render={INFO_BUTTON}>
            <InfoIcon />
          </Popover.Trigger>
          <Popover.Content>
            <PanelContents />
          </Popover.Content>
        </Popover>
      </div>
    </div>
  ),
}

// Open on load, since a closed popover renders nothing for Chromatic to
// compare.
const Default: Story = {
  render: (args) => (
    <div {...stylex.props(styles.frame)}>
      <Popover {...args} defaultOpen>
        <Popover.Trigger render={FILLED_BUTTON}>Open</Popover.Trigger>
        <Popover.Content>
          <PanelContents />
        </Popover.Content>
      </Popover>
    </div>
  ),
}

const Small: Story = {
  args: { size: 'sm' },
  render: (args) => (
    <div {...stylex.props(styles.frame)}>
      <Popover {...args} defaultOpen>
        <Popover.Trigger render={FILLED_BUTTON}>Open</Popover.Trigger>
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
  render: (args) => (
    <div {...stylex.props(styles.sides)}>
      {SIDES.map((side) => (
        <Popover {...args} defaultOpen key={side}>
          <Popover.Trigger render={OUTLINED_BUTTON}>{side}</Popover.Trigger>
          {/* Four panels open at once means four of them reaching for the
              focus, and whichever wins draws a ring the story is not about.
              Nothing here is meant to be operated, so none of them takes it. */}
          <Popover.Content initialFocus={false} side={side}>
            <Popover.Title>{side}</Popover.Title>
          </Popover.Content>
        </Popover>
      ))}
    </div>
  ),
}

// The one check that runs against the real entry animation and Base UI's own
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
    // which is what lets a keyboard carry on from where it was.
    await expect(document.activeElement).toBe(trigger)
    await expect(trigger.getAttribute('aria-expanded')).toBe('false')
  },
  render: (args) => (
    <Popover {...args}>
      <Popover.Trigger render={FILLED_BUTTON}>Open</Popover.Trigger>
      <Popover.Content>
        <PanelContents />
      </Popover.Content>
    </Popover>
  ),
  tags: ['!dev'],
}

export { Default, OpensAndCloses, Overview, Sides, Small }

export default meta
