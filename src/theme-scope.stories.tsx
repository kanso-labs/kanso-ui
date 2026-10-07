import type { Meta, StoryObj } from '@storybook/react-vite'

import * as stylex from '@stylexjs/stylex'
import { expect, waitFor, within } from 'storybook/test'

import Button from './components/button'
import Popover from './components/popover'
import Separator from './components/separator'
import Stack from './components/stack'
import Text from './components/text'
import { ThemeScope as Scope } from './theme-scope'
import { colors, radii, spacing } from './tokens/design.tokens.stylex'

// See components/avatar/index.stories.tsx for why the page is built from the
// library's own components and why the headings go through Text's `render`.
// oxlint-disable-next-line jsx-a11y/heading-has-content -- filled by useRender
const HEADING_1 = <h1 />
// oxlint-disable-next-line jsx-a11y/heading-has-content -- filled by useRender
const HEADING_2 = <h2 />
const PARAGRAPH = <p />

const styles = stylex.create({
  // An override written as an app's own stylesheet would write it: the two
  // roles a filled button reads, moved to the dark scheme's tertiary pair, so
  // the scope differs from the page in more than its scheme. A class rather
  // than inline styles, the form the README shows.
  accent: {
    '--kui-color-on-primary': '#492532',
    '--kui-color-primary': '#efb8c8',
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
  // it is the scope's surface and on the page the page's. Tall enough to
  // leave the open popover room under its trigger.
  panel: {
    backgroundColor: colors.surfaceContainer,
    borderRadius: radii.lg,
    boxSizing: 'border-box',
    color: colors.onSurface,
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
          The page&apos;s tokens on the left. On the right, a scope pinned to
          the dark scheme, with two colour roles of its own declared on it. The
          popover opened inside the scope is portalled into it, so it follows
          the scope rather than the page.
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
          {...stylex.props(styles.panel, styles.accent)}
        >
          <Panel title="Scope" />
          {/* In a row of its own, so the trigger keeps its own width rather
              than stretching across the panel's column, and opening to its
              right, so the panel lands over the scope rather than across
              its edge. */}
          <Stack direction="row">
            <Popover defaultOpen>
              <Button variant="tonal">Open</Button>
              <Popover.Content side="right">
                <Popover.Title>Headline</Popover.Title>
                <Popover.Description>Supporting line</Popover.Description>
              </Popover.Content>
            </Popover>
          </Stack>
        </Scope>
      </div>
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
const ThemeScope: Story = {
  play: async ({ canvasElement }) => {
    const scope = within(canvasElement).getByTestId('scope')
    const dialog = within(scope).getByRole('dialog', { name: 'Headline' })

    // Waited for, since the popover fades in from transparent and a busy run
    // can reach this line before its entry animation has painted a frame.
    await waitFor(async () => {
      await expect(dialog).toBeVisible()
    })
  },
}

export { ThemeScope }

export default meta
