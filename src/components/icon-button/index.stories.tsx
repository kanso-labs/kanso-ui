import type { Meta, StoryObj } from '@storybook/react-vite'

import * as stylex from '@stylexjs/stylex'

import IconButton from '.'
import { spacing } from '../../tokens/design.tokens.stylex'
import Separator from '../separator'
import Text from '../text'

// See avatar/index.stories.tsx for why the overview is built from the library's
// own components rather than from shell components of its own, and why its
// sections are divided by a rule instead of boxed in Cards.
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
  // Sized in `em` so it follows the button's own type size, which is what
  // makes one icon serve all five sizes.
  icon: {
    blockSize: '1em',
    inlineSize: '1em',
  },
  inline: {
    alignItems: 'flex-end',
    display: 'flex',
    flexWrap: 'wrap',
    gap: spacing.lg,
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
  sample: {
    alignItems: 'center',
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.xs,
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.lg,
  },
})

// A plain glyph rather than an icon set, so the stories stay a demonstration
// of the button alone.
function PlusIcon() {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
      {...stylex.props(styles.icon)}
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  )
}

// A second glyph for the toggle samples: a plus that turns on and off reads
// as an odd thing to do, where a star is the shape a toggle usually carries.
function StarIcon() {
  return (
    <svg
      aria-hidden="true"
      fill="currentColor"
      viewBox="0 0 24 24"
      {...stylex.props(styles.icon)}
    >
      <path d="m12 3 2.6 5.6 6.1.8-4.5 4.2 1.2 6-5.4-3-5.4 3 1.2-6L3.3 9.4l6.1-.8z" />
    </svg>
  )
}

// Hoisted so the list is not a new array on every render, which is what
// react-perf's no-new-array-as-prop is after.
const TOGGLE_VARIANTS = ['standard', 'outlined', 'filled', 'tonal'] as const

const meta = {
  args: {
    'aria-label': 'Add',
    children: <PlusIcon />,
  },
  component: IconButton,
  title: 'Components/IconButton',
} satisfies Meta<typeof IconButton>

type Story = StoryObj<typeof meta>

// Every variant and size on one page, for one Chromatic snapshot per theme.
// `disableRipple` has nothing to show here: it changes what happens on press,
// and at rest the two are the same pixels.
const Overview: Story = {
  render: () => (
    <div {...stylex.props(styles.page)}>
      <header {...stylex.props(styles.header)}>
        <Text render={HEADING_1} variant="displaySmall">
          IconButton
        </Text>
        <Text render={PARAGRAPH} tone="muted" variant="bodyLarge">
          A button whose whole label is its icon, at the same control heights as
          Button.
        </Text>
      </header>

      <Separator />

      <section {...stylex.props(styles.section)}>
        <div {...stylex.props(styles.intro)}>
          <Text render={HEADING_2} variant="titleLarge">
            Variants
          </Text>
          <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
            `standard` is transparent and tints whatever it sits on; `outlined`
            is transparent with a rule around it, which thickens with the size;
            `filled` and `tonal` carry a container of their own.
          </Text>
        </div>
        <div {...stylex.props(styles.inline)}>
          <div {...stylex.props(styles.sample)}>
            <IconButton aria-label="Add" variant="standard">
              <PlusIcon />
            </IconButton>
            <Text tone="muted" variant="labelSmall">
              standard
            </Text>
          </div>
          <div {...stylex.props(styles.sample)}>
            <IconButton aria-label="Add" variant="outlined">
              <PlusIcon />
            </IconButton>
            <Text tone="muted" variant="labelSmall">
              outlined
            </Text>
          </div>
          <div {...stylex.props(styles.sample)}>
            <IconButton aria-label="Add" variant="filled">
              <PlusIcon />
            </IconButton>
            <Text tone="muted" variant="labelSmall">
              filled
            </Text>
          </div>
          <div {...stylex.props(styles.sample)}>
            <IconButton aria-label="Add" variant="tonal">
              <PlusIcon />
            </IconButton>
            <Text tone="muted" variant="labelSmall">
              tonal
            </Text>
          </div>
        </div>
      </section>

      <Separator />

      <section {...stylex.props(styles.section)}>
        <div {...stylex.props(styles.intro)}>
          <Text render={HEADING_2} variant="titleLarge">
            Sizes
          </Text>
          <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
            The icon buttons page's five sizes, XS to XL, which are the heights
            Button uses, so the two line up beside each other in a row. One icon
            serves all five: it is drawn in `em`, so it takes the icon size the
            page gives each container, 20 to 40.
          </Text>
        </div>
        <div {...stylex.props(styles.inline)}>
          <div {...stylex.props(styles.sample)}>
            <IconButton aria-label="Add" size="xs">
              <PlusIcon />
            </IconButton>
            <Text tone="muted" variant="labelSmall">
              xs · 32px
            </Text>
          </div>
          <div {...stylex.props(styles.sample)}>
            <IconButton aria-label="Add" size="md">
              <PlusIcon />
            </IconButton>
            <Text tone="muted" variant="labelSmall">
              md · 40px
            </Text>
          </div>
          <div {...stylex.props(styles.sample)}>
            <IconButton aria-label="Add" size="lg">
              <PlusIcon />
            </IconButton>
            <Text tone="muted" variant="labelSmall">
              lg · 56px
            </Text>
          </div>
          <div {...stylex.props(styles.sample)}>
            <IconButton aria-label="Add" size="xl">
              <PlusIcon />
            </IconButton>
            <Text tone="muted" variant="labelSmall">
              xl · 96px
            </Text>
          </div>
          <div {...stylex.props(styles.sample)}>
            <IconButton aria-label="Add" size="xxl">
              <PlusIcon />
            </IconButton>
            <Text tone="muted" variant="labelSmall">
              xxl · 136px
            </Text>
          </div>
        </div>
      </section>

      <Separator />

      <section {...stylex.props(styles.section)}>
        <div {...stylex.props(styles.intro)}>
          <Text render={HEADING_2} variant="titleLarge">
            Toggle
          </Text>
          <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
            Given `isSelected`, `defaultSelected` or `onChange` the button
            reports a state instead of only firing. Each variant has a second
            pair of colour roles for it, so an unchosen filled toggle rests on
            surface container rather than primary, and a chosen one rests square
            rather than round.
          </Text>
        </div>
        <div {...stylex.props(styles.inline)}>
          {TOGGLE_VARIANTS.map((variant) => (
            <div key={variant} {...stylex.props(styles.sample)}>
              <IconButton
                aria-label="Star"
                defaultSelected={false}
                variant={variant}
              >
                <StarIcon />
              </IconButton>
              <Text tone="muted" variant="labelSmall">
                {variant}
              </Text>
            </div>
          ))}
        </div>
        <div {...stylex.props(styles.inline)}>
          {TOGGLE_VARIANTS.map((variant) => (
            <div key={variant} {...stylex.props(styles.sample)}>
              <IconButton aria-label="Star" defaultSelected variant={variant}>
                <StarIcon />
              </IconButton>
              <Text tone="muted" variant="labelSmall">
                {variant}, chosen
              </Text>
            </div>
          ))}
        </div>
      </section>

      <Separator />

      <section {...stylex.props(styles.section)}>
        <div {...stylex.props(styles.intro)}>
          <Text render={HEADING_2} variant="titleLarge">
            As a link
          </Text>
          <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
            Given `href`, the button is an anchor that navigates — the same
            styles and ripple, announced as the link it is rather than as a
            button.
          </Text>
        </div>
        <div {...stylex.props(styles.inline)}>
          <div {...stylex.props(styles.sample)}>
            <IconButton aria-label="Add" href="#label" variant="standard">
              <PlusIcon />
            </IconButton>
            <Text tone="muted" variant="labelSmall">
              standard
            </Text>
          </div>
          <div {...stylex.props(styles.sample)}>
            <IconButton aria-label="Add" href="#label" variant="filled">
              <PlusIcon />
            </IconButton>
            <Text tone="muted" variant="labelSmall">
              filled
            </Text>
          </div>
        </div>
      </section>

      <Separator />

      <section {...stylex.props(styles.section)}>
        <div {...stylex.props(styles.intro)}>
          <Text render={HEADING_2} variant="titleLarge">
            Disabled
          </Text>
          <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
            The same on-surface opacity composites over every variant, so the
            four converge rather than each fading in its own colour — the
            outlined rule fades with them rather than staying at full strength.
          </Text>
        </div>
        <div {...stylex.props(styles.inline)}>
          <div {...stylex.props(styles.sample)}>
            <IconButton aria-label="Add" isDisabled variant="standard">
              <PlusIcon />
            </IconButton>
            <Text tone="muted" variant="labelSmall">
              standard
            </Text>
          </div>
          <div {...stylex.props(styles.sample)}>
            <IconButton aria-label="Add" isDisabled variant="outlined">
              <PlusIcon />
            </IconButton>
            <Text tone="muted" variant="labelSmall">
              outlined
            </Text>
          </div>
          <div {...stylex.props(styles.sample)}>
            <IconButton aria-label="Add" isDisabled variant="filled">
              <PlusIcon />
            </IconButton>
            <Text tone="muted" variant="labelSmall">
              filled
            </Text>
          </div>
          <div {...stylex.props(styles.sample)}>
            <IconButton aria-label="Add" isDisabled variant="tonal">
              <PlusIcon />
            </IconButton>
            <Text tone="muted" variant="labelSmall">
              tonal
            </Text>
          </div>
        </div>
      </section>
    </div>
  ),
}

const Default: Story = {}

const Pending: Story = {
  args: {
    'aria-label': 'Add',
    isPending: true,
  },
}

const Toggle: Story = {
  args: {
    'aria-label': 'Star',
    children: <StarIcon />,
    defaultSelected: false,
    variant: 'filled',
  },
}

const ToggleSelected: Story = {
  args: {
    'aria-label': 'Star',
    children: <StarIcon />,
    defaultSelected: true,
    variant: 'filled',
  },
}

const Outlined: Story = {
  args: { variant: 'outlined' },
}

export { Default, Outlined, Overview, Pending, Toggle, ToggleSelected }

export default meta
