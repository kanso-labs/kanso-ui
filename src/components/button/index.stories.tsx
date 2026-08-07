import type { Meta, StoryObj } from '@storybook/react-vite'

import * as stylex from '@stylexjs/stylex'
import { expect, waitFor } from 'storybook/test'

import Button from '.'
import { rippleStyles } from '../../styles/ripple'
import { spacing } from '../../tokens/design.tokens.stylex'
import Separator from '../separator'
import Text from '../text'

// The classes StyleX generates for the pressed state are the observable signal
// that the hook considers itself pressed, without reaching into React.
const pressedClassNames = (stylex.props(rippleStyles.pressed).className ?? '')
  .split(' ')
  .filter(Boolean)

function isPressed(button: HTMLElement) {
  const span = button.querySelector('span[aria-hidden="true"] > span')
  if (!span) {
    return false
  }
  // The length check matters: `[].every()` is vacuously true, so an empty
  // class list would report "pressed" unconditionally.
  return (
    pressedClassNames.length > 0 &&
    pressedClassNames.every((className) => span.classList.contains(className))
  )
}

// See avatar/index.stories.tsx for why the overview is built from the library's
// own components rather than from shell components of its own, why its sections
// are divided by a rule instead of boxed in Cards, and why the headings go
// through Text's `render`.
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

const meta = {
  args: {
    children: 'Button',
  },
  component: Button,
  title: 'Components/Button',
} satisfies Meta<typeof Button>

type Story = StoryObj<typeof meta>

// Every variant and size on one page, in both themes, for one Chromatic
// snapshot apiece. `disableRipple` is the one prop with nothing to show here:
// it changes what happens on press, and at rest the two are the same pixels.
const Overview: Story = {
  render: () => (
    <div {...stylex.props(styles.page)}>
      <header {...stylex.props(styles.header)}>
        <Text render={HEADING_1} variant="displaySmall">
          Button
        </Text>
        <Text render={PARAGRAPH} tone="muted" variant="bodyLarge">
          The four emphasis levels of the design's button, at four control
          heights.
        </Text>
      </header>

      <Separator />

      <section {...stylex.props(styles.section)}>
        <div {...stylex.props(styles.intro)}>
          <Text render={HEADING_2} variant="titleLarge">
            Variants
          </Text>
          <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
            Emphasis, high to low. Each sits on a different background, so the
            hover and pressed state layers are keyed by variant rather than
            written once for all four.
          </Text>
        </div>
        <div {...stylex.props(styles.inline)}>
          <div {...stylex.props(styles.sample)}>
            <Button variant="filled">Button</Button>
            <Text tone="muted" variant="labelSmall">
              filled
            </Text>
          </div>
          <div {...stylex.props(styles.sample)}>
            <Button variant="tonal">Button</Button>
            <Text tone="muted" variant="labelSmall">
              tonal
            </Text>
          </div>
          <div {...stylex.props(styles.sample)}>
            <Button variant="outlined">Button</Button>
            <Text tone="muted" variant="labelSmall">
              outlined
            </Text>
          </div>
          <div {...stylex.props(styles.sample)}>
            <Button variant="text">Button</Button>
            <Text tone="muted" variant="labelSmall">
              text
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
            Fixed control heights from the design rather than steps of the
            spacing scale. Each takes the size and line-height of a type style
            but never its font or weight, so an xl button still reads as a
            button.
          </Text>
        </div>
        <div {...stylex.props(styles.inline)}>
          <div {...stylex.props(styles.sample)}>
            <Button size="xs">Button</Button>
            <Text tone="muted" variant="labelSmall">
              xs · 32px
            </Text>
          </div>
          <div {...stylex.props(styles.sample)}>
            <Button size="md">Button</Button>
            <Text tone="muted" variant="labelSmall">
              md · 40px
            </Text>
          </div>
          <div {...stylex.props(styles.sample)}>
            <Button size="lg">Button</Button>
            <Text tone="muted" variant="labelSmall">
              lg · 56px
            </Text>
          </div>
          <div {...stylex.props(styles.sample)}>
            <Button size="xl">Button</Button>
            <Text tone="muted" variant="labelSmall">
              xl · 80px
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
            Disabled composites the same on-surface opacity over every variant,
            so the four converge rather than each fading in its own colour.
          </Text>
        </div>
        <div {...stylex.props(styles.inline)}>
          <div {...stylex.props(styles.sample)}>
            <Button disabled variant="filled">
              Button
            </Button>
            <Text tone="muted" variant="labelSmall">
              filled
            </Text>
          </div>
          <div {...stylex.props(styles.sample)}>
            <Button disabled variant="tonal">
              Button
            </Button>
            <Text tone="muted" variant="labelSmall">
              tonal
            </Text>
          </div>
          <div {...stylex.props(styles.sample)}>
            <Button disabled variant="outlined">
              Button
            </Button>
            <Text tone="muted" variant="labelSmall">
              outlined
            </Text>
          </div>
          <div {...stylex.props(styles.sample)}>
            <Button disabled variant="text">
              Button
            </Button>
            <Text tone="muted" variant="labelSmall">
              text
            </Text>
          </div>
        </div>
      </section>
    </div>
  ),
}

const Default: Story = {}

// One full press against real timers and real animations. index.test.tsx stubs
// both the clock and the Web Animations API, so it proves the state machine but
// not that the two work together — this story is where that gets proven, and it
// is deliberately the only copy of that check. It also happens to be the sole
// interaction the Storybook Testing widget can attribute to useRipple, since
// that widget runs this project alone and never the unit tests.
//
// So it is a test rather than documentation, and is kept out of the sidebar to
// stay one: `!dev` subtracts the tag the sidebar filters on, leaving `test`
// untouched, so the story still runs under `npm test` and still counts toward
// the widget's percentage. Hidden, not removed — it stays in the index and is
// still reachable by URL, which is also why Chromatic needs telling separately.
// It skips this one because the ripple is mid-animation for most of the play
// function, so a snapshot would diff against itself. Overview already covers
// the filled button visually.
const Pressed: Story = {
  parameters: {
    chromatic: { disableSnapshot: true },
  },
  play: async ({ canvas, userEvent }) => {
    const button = canvas.getByRole('button')

    // Held rather than clicked: while the press is down the hook has no timer
    // running that could clear `pressed`, so the first assertion can't race a
    // release that already happened. The state machine's own edges — touch
    // delay, cancel, context menu, non-primary pointers — stay in
    // index.test.tsx, where the clock can be controlled.
    await userEvent.pointer({ keys: '[MouseLeft>]', target: button })
    await waitFor(
      async () => {
        await expect(isPressed(button)).toBe(true)
      },
      { timeout: 2000 },
    )

    await userEvent.pointer({ keys: '[/MouseLeft]', target: button })
    await waitFor(
      async () => {
        await expect(isPressed(button)).toBe(false)
      },
      { timeout: 2000 },
    )
  },
  tags: ['!dev'],
}

export { Default, Overview, Pressed }

export default meta
