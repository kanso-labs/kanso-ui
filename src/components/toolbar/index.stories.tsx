import type { Meta, StoryObj } from '@storybook/react-vite'

import * as stylex from '@stylexjs/stylex'

import Toolbar from '.'
import { spacing } from '../../tokens/design.tokens.stylex'
import Button from '../button'
import IconButton from '../icon-button'
import ListBox from '../list-box'
import Select from '../select'
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
  header: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.xs,
  },
  // Sized in `em` so it follows the button's own type size.
  icon: {
    blockSize: '1em',
    inlineSize: '1em',
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
    alignItems: 'flex-start',
    display: 'flex',
    flexWrap: 'wrap',
    gap: spacing.xl,
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.lg,
  },
})

// Plain glyphs rather than an icon set, so the stories stay a demonstration
// of the toolbar alone.
function Glyph({ path }: { path: string }) {
  return (
    <svg
      aria-hidden="true"
      fill="currentColor"
      viewBox="0 0 24 24"
      {...stylex.props(styles.icon)}
    >
      <path d={path} />
    </svg>
  )
}

const FIRST = 'M4 6h16v2H4zm0 5h16v2H4zm0 5h10v2H4z'
const SECOND = 'M6 4h12v2H6zm-2 5h16v2H4zm2 5h12v2H6zm-2 5h16v2H4z'
const THIRD = 'M4 6h16v2H4zm6 5h10v2H10zm-6 5h16v2H4z'
const FOURTH = 'M12 3 4 9v12h6v-7h4v7h6V9z'

const CONTROLS = (
  <>
    <IconButton aria-label="First item">
      <Glyph path={FIRST} />
    </IconButton>
    <IconButton aria-label="Second item">
      <Glyph path={SECOND} />
    </IconButton>
    <IconButton aria-label="Third item">
      <Glyph path={THIRD} />
    </IconButton>
    <Separator />
    <IconButton aria-label="Fourth item">
      <Glyph path={FOURTH} />
    </IconButton>
  </>
)

const OPTIONS = (
  <>
    <ListBox.Item id="first">First item</ListBox.Item>
    <ListBox.Item id="second">Second item</ListBox.Item>
    <ListBox.Item id="third">Third item</ListBox.Item>
  </>
)

// A button and a field beside the icon buttons, which the bar holds as
// readily. The field is a select rather than a text field: the bar takes the
// left and right arrows before anything inside it sees them, which costs a
// select only its shortcut for stepping through the options while closed —
// the up and down arrows still open it — and would leave a text field's
// caret unable to move along the line. Its 56dp box and the bar's 8dp
// either side of it make the bar 72dp, past the 64dp it keeps for icon
// buttons alone.
const MIXED = (
  <>
    <IconButton aria-label="First item">
      <Glyph path={FIRST} />
    </IconButton>
    <IconButton aria-label="Second item">
      <Glyph path={SECOND} />
    </IconButton>
    <Separator />
    <Select defaultValue="first" label="Label" options={OPTIONS} />
    <Button variant="tonal">Label</Button>
  </>
)

const meta = {
  args: {
    'aria-label': 'Label',
    children: CONTROLS,
  },
  component: Toolbar,
  title: 'Components/Toolbar',
} satisfies Meta<typeof Toolbar>

type Story = StoryObj<typeof meta>

const Overview: Story = {
  render: () => (
    <div {...stylex.props(styles.page)}>
      <header {...stylex.props(styles.header)}>
        <Text render={HEADING_1} variant="displaySmall">
          Toolbar
        </Text>
        <Text render={PARAGRAPH} tone="muted" variant="bodyLarge">
          A container for a set of controls, with the arrow keys moving between
          them.
        </Text>
      </header>

      <Separator />

      <section {...stylex.props(styles.section)}>
        <div {...stylex.props(styles.intro)}>
          <Text render={HEADING_2} variant="titleLarge">
            A group of controls
          </Text>
          <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
            The bar is announced as a toolbar, so a screen reader reads the
            controls as one group rather than as unrelated buttons, and the
            arrow keys move between them. Tab still steps through each control —
            the arrows are a second way to move, not a replacement.
          </Text>
        </div>
        <div {...stylex.props(styles.row)}>
          <Toolbar aria-label="Standard">{CONTROLS}</Toolbar>
        </div>
      </section>

      <Separator />

      <section {...stylex.props(styles.section)}>
        <div {...stylex.props(styles.intro)}>
          <Text render={HEADING_2} variant="titleLarge">
            Buttons and fields
          </Text>
          <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
            The bar holds a button or a field as readily as an icon button, and
            grows to fit one taller than its 64dp. A select fits where a text
            field does not: the left and right arrows move between the controls
            before anything inside sees them, which costs a select a shortcut
            but would leave a text field&apos;s caret unable to move.
          </Text>
        </div>
        <div {...stylex.props(styles.row)}>
          <Toolbar aria-label="Buttons and fields">{MIXED}</Toolbar>
        </div>
      </section>

      <Separator />

      <section {...stylex.props(styles.section)}>
        <div {...stylex.props(styles.intro)}>
          <Text render={HEADING_2} variant="titleLarge">
            Colour
          </Text>
          <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
            The page gives the bar two schemes. Its standard one is the neutral
            tone and the default, on surface container; vibrant moves the bar to
            primary container, for a bar meant to carry the page&apos;s accent.
          </Text>
        </div>
        <div {...stylex.props(styles.row)}>
          <Toolbar aria-label="Vibrant" tone="vibrant">
            {CONTROLS}
          </Toolbar>
        </div>
      </section>

      <Separator />

      <section {...stylex.props(styles.section)}>
        <div {...stylex.props(styles.intro)}>
          <Text render={HEADING_2} variant="titleLarge">
            Vertical
          </Text>
          <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
            The orientation decides which arrows move and which way the bar
            runs. A rule inside draws across that direction rather than along
            it, so the same markup is correct either way.
          </Text>
        </div>
        <div {...stylex.props(styles.row)}>
          <Toolbar aria-label="Vertical" orientation="vertical">
            {CONTROLS}
          </Toolbar>
          <Toolbar
            aria-label="Vertical vibrant"
            orientation="vertical"
            tone="vibrant"
          >
            {CONTROLS}
          </Toolbar>
        </div>
      </section>
    </div>
  ),
}

const Default: Story = {}

const Vibrant: Story = {
  args: { tone: 'vibrant' },
}

const Vertical: Story = {
  args: { orientation: 'vertical' },
}

// Its own story because a field is what makes the bar grow past its 64dp,
// which a snapshot shows and the icon buttons never do.
const WithButtonAndField: Story = {
  args: { children: MIXED },
}

const Disabled: Story = {
  args: {
    children: (
      <>
        <IconButton aria-label="First item">
          <Glyph path={FIRST} />
        </IconButton>
        <IconButton aria-label="Second item" isDisabled>
          <Glyph path={SECOND} />
        </IconButton>
        <Separator />
        <IconButton aria-label="Third item">
          <Glyph path={THIRD} />
        </IconButton>
      </>
    ),
  },
}

export { Default, Disabled, Overview, Vertical, Vibrant, WithButtonAndField }

export default meta
