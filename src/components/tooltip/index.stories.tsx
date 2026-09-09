import type { Meta, StoryObj } from '@storybook/react-vite'

import * as stylex from '@stylexjs/stylex'

import Tooltip from '.'
import { SearchGlyph } from '../../glyphs'
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

const styles = stylex.create({
  // Sized in `em`, so the glyph takes the button's own icon size.
  glyph: {
    blockSize: '1em',
    inlineSize: '1em',
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
  // Room around the samples, so a tooltip opens on the side it is asked for
  // rather than flipping for want of space.
  row: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: spacing.xxl,
    paddingBlock: spacing.xxl,
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.lg,
  },
})

const meta = {
  args: {
    label: 'Supporting text',
  },
  component: Tooltip,
  title: 'Components/Tooltip',
} satisfies Meta<typeof Tooltip>

type Story = StoryObj<typeof meta>

const Overview: Story = {
  render: () => (
    <div {...stylex.props(styles.page)}>
      <header {...stylex.props(styles.header)}>
        <Text render={HEADING_1} variant="displaySmall">
          Tooltip
        </Text>
        <Text render={PARAGRAPH} tone="muted" variant="bodyLarge">
          A label for the element it wraps, shown while that element is hovered
          or focused.
        </Text>
      </header>

      <Separator />

      <section {...stylex.props(styles.section)}>
        <div {...stylex.props(styles.intro)}>
          <Text render={HEADING_2} variant="titleLarge">
            What it is for
          </Text>
          <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
            A tooltip repeats what an element already means — most often the
            name of an icon button, which has no visible label of its own. It is
            skipped by touch entirely and dismissed by Escape, so nothing in it
            can be the only place something is said. Anything with a button in
            it belongs in a Popover.
          </Text>
        </div>
        <div {...stylex.props(styles.row)}>
          <Tooltip label="Search">
            <IconButton aria-label="Search">
              <SearchGlyph {...stylex.props(styles.glyph)} />
            </IconButton>
          </Tooltip>
          <Tooltip label="Supporting text">
            <Button variant="outlined">Hover or focus</Button>
          </Tooltip>
        </div>
      </section>

      <Separator />

      <section {...stylex.props(styles.section)}>
        <div {...stylex.props(styles.intro)}>
          <Text render={HEADING_2} variant="titleLarge">
            Sides
          </Text>
          <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
            It opens above the element by default, and flips to the opposite
            side on its own when there is no room. side and align place it, and
            sideOffset sets the gap.
          </Text>
        </div>
        <div {...stylex.props(styles.row)}>
          <Tooltip label="Above" side="top">
            <Button variant="outlined">Top</Button>
          </Tooltip>
          <Tooltip label="Below" side="bottom">
            <Button variant="outlined">Bottom</Button>
          </Tooltip>
          <Tooltip label="Before" side="left">
            <Button variant="outlined">Left</Button>
          </Tooltip>
          <Tooltip label="After" side="right">
            <Button variant="outlined">Right</Button>
          </Tooltip>
        </div>
      </section>
    </div>
  ),
}

const Default: Story = {
  render: (args) => (
    <div {...stylex.props(styles.row)}>
      <Tooltip {...args} defaultOpen side="bottom">
        <Button variant="outlined">Hover or focus</Button>
      </Tooltip>
    </div>
  ),
}

const OnAnIconButton: Story = {
  args: {
    label: 'Search',
  },
  render: (args) => (
    <div {...stylex.props(styles.row)}>
      <Tooltip {...args} defaultOpen side="bottom">
        <IconButton aria-label="Search">
          <SearchGlyph {...stylex.props(styles.glyph)} />
        </IconButton>
      </Tooltip>
    </div>
  ),
}

export { Default, OnAnIconButton, Overview }

export default meta
