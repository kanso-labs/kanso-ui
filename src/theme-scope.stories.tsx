import type { Meta, StoryObj } from '@storybook/react-vite'

import * as stylex from '@stylexjs/stylex'
import { expect, waitFor, within } from 'storybook/test'

import Button from './components/button'
import Popover from './components/popover'
import Separator from './components/separator'
import Stack from './components/stack'
import Text from './components/text'
import { type KuiTheme, ThemeScope as Scope } from './theme-scope'
import { colors, radii, spacing } from './tokens/design.tokens.stylex'

// See getting-started.stories.tsx for why the page is built from the
// library's own components and why the headings go through Text's `render`.
// oxlint-disable-next-line jsx-a11y/heading-has-content -- filled by useRender
const HEADING_1 = <h1 />
// oxlint-disable-next-line jsx-a11y/heading-has-content -- filled by useRender
const HEADING_2 = <h2 />
const PARAGRAPH = <p />

// The two roles a filled button reads, moved to the dark scheme's tertiary
// pair, so the scope differs from the page in more than its scheme. Handed to
// `theme`, the form the README shows.
const ACCENT: KuiTheme = {
  '--kui-color-on-primary': '#492532',
  '--kui-color-primary': '#efb8c8',
}

const styles = stylex.create({
  // A scope with nothing of its own but room around its text: no surface, no
  // text colour. What it paints is the pinned scheme's own.
  bare: {
    borderRadius: radii.lg,
    boxSizing: 'border-box',
    padding: spacing.xl,
  },
  columns: {
    display: 'grid',
    gap: spacing.xl,
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
  },
  header: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.xs,
  },
  page: {
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.xl,
    marginInline: 'auto',
    maxInlineSize: '960px',
    padding: spacing.xl,
  },
  // Painted from the tokens of whichever element carries it, so on the scope
  // it is the scope's container and on the page the page's. The text colour
  // is left to what is around it: the scope sets its own once it is pinned.
  // Tall enough to leave the open popover room under its trigger.
  panel: {
    backgroundColor: colors.surfaceContainer,
    borderRadius: radii.lg,
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.md,
    minBlockSize: '280px',
    padding: spacing.xl,
  },
})

function Panel({ title }: { title: string }) {
  return (
    <>
      <Text render={HEADING_2} variant="titleLarge">
        {title}
      </Text>
      <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
        Supporting line
      </Text>
      <Stack direction="row" gap="sm" wrap>
        <Button>Label</Button>
        <Button variant="outlined">Label</Button>
      </Stack>
    </>
  )
}

function ThemeScopePage() {
  return (
    <div {...stylex.props(styles.page)}>
      <header {...stylex.props(styles.header)}>
        <Text render={HEADING_1} variant="displaySmall">
          Theme scope
        </Text>
        <Text render={PARAGRAPH} tone="muted" variant="bodyLarge">
          The panel titled Page shows the page&apos;s own tokens. The one titled
          Scope is pinned to the dark scheme, with two colour roles of its own
          declared on it. The popover opened inside the scope is portalled into
          it, so it follows the scope rather than the page, and its filled
          button takes the scope&apos;s accent. Below, a pinned scope with no
          colour of its own, which paints its scheme&apos;s surface and text
          itself.
        </Text>
      </header>

      <Separator />

      <div {...stylex.props(styles.columns)}>
        <div {...stylex.props(styles.panel)}>
          <Panel title="Page" />
        </div>
        <Scope
          data-testid="scope"
          scheme="dark"
          theme={ACCENT}
          {...stylex.props(styles.panel)}
        >
          <Panel title="Scope" />
          {/* In a row of its own, so the trigger keeps its own width rather
              than stretching across the panel's column, and opening at its
              inline end, so the panel lands over the scope rather than
              across its edge in either direction: the scope sits at the
              end of the row, and a right-to-left locale moves both. Aligned
              with the trigger's top, so the panel grows down into the scope
              rather than up over the buttons above it. */}
          <Stack direction="row">
            <Popover defaultOpen>
              <Button variant="tonal">Open</Button>
              <Popover.Content align="start" side="end">
                <Popover.Title>Headline</Popover.Title>
                <Popover.Description>Supporting line</Popover.Description>
                <Stack direction="row" justify="end">
                  <Button slot="close">Label</Button>
                </Stack>
              </Popover.Content>
            </Popover>
          </Stack>
        </Scope>
      </div>

      <Scope scheme="dark" {...stylex.props(styles.bare)}>
        <Text render={PARAGRAPH} variant="bodyMedium">
          Supporting line
        </Text>
      </Scope>
    </div>
  )
}

const meta = {
  component: ThemeScopePage,
  tags: ['!autodocs'],
  title: 'Foundations/Theme scope',
} satisfies Meta<typeof ThemeScopePage>

type Story = StoryObj<typeof meta>

// Named after the title's last segment for the reason SharedElements is: a
// component holding one story of the same name folds into a single sidebar
// leaf.
//
// The play takes focus off the open panel. Opened with nothing pressed, the
// panel takes focus as though from the keyboard and draws the focus ring, and
// a scripted press would not help: the browser does not count it as a
// pointer, so the panel still matches `:focus-visible`. A reader's own click
// draws no ring, and the panel, blurred, stays open and draws as that click
// leaves it.
const ThemeScope: Story = {
  play: async ({ canvasElement }) => {
    const scope = within(canvasElement).getByTestId('scope')
    const dialog = within(scope).getByRole('dialog', { name: 'Headline' })

    // Waited for, since the popover fades in from transparent and a busy run
    // can reach this line before its entry animation has painted a frame.
    await waitFor(async () => {
      await expect(dialog).toBeVisible()
    })

    dialog.blur()
    await expect(dialog).not.toHaveFocus()
    await expect(dialog).toBeVisible()
  },
}

export { ThemeScope }

export default meta
