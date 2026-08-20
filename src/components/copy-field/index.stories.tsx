import type { Meta, StoryObj } from '@storybook/react-vite'

import * as stylex from '@stylexjs/stylex'
import { expect, waitFor } from 'storybook/test'

import CopyField from '.'
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

const VALUE = 'first.second.third'
const LONG_VALUE = 'registry.example/first-second/a-long-unbroken-name'

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
  // Narrower than the sample above, so the wrap this section describes is
  // actually visible rather than merely asserted.
  narrowSample: {
    alignItems: 'stretch',
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.xs,
    maxInlineSize: '300px',
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
    alignItems: 'stretch',
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.xs,
    maxInlineSize: '480px',
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.lg,
  },
})

const meta = {
  args: {
    value: VALUE,
  },
  component: CopyField,
  title: 'Components/CopyField',
} satisfies Meta<typeof CopyField>

type Story = StoryObj<typeof meta>

const Overview: Story = {
  render: () => (
    <div {...stylex.props(styles.page)}>
      <header {...stylex.props(styles.header)}>
        <Text render={HEADING_1} variant="displaySmall">
          CopyField
        </Text>
        <Text render={PARAGRAPH} tone="muted" variant="bodyLarge">
          A value to be read and taken away. It shows the value in the mono face
          and copies it on request, confirming on the button itself.
        </Text>
      </header>

      <Separator />

      <section {...stylex.props(styles.section)}>
        <div {...stylex.props(styles.intro)}>
          <Text render={HEADING_2} variant="titleLarge">
            At rest
          </Text>
          <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
            The button confirms in place once the value reaches the clipboard,
            then returns to offering the copy a couple of seconds later. It
            stays at rest if the write is refused, so it never claims a value
            was copied when it was not.
          </Text>
        </div>
        <div {...stylex.props(styles.sample)}>
          <CopyField value={VALUE} />
        </div>
      </section>

      <Separator />

      <section {...stylex.props(styles.section)}>
        <div {...stylex.props(styles.intro)}>
          <Text render={HEADING_2} variant="titleLarge">
            Long values
          </Text>
          <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
            A value with nothing to break at wraps inside the field rather than
            pushing the button out of it.
          </Text>
        </div>
        <div {...stylex.props(styles.narrowSample)}>
          <CopyField value={LONG_VALUE} />
        </div>
      </section>

      <Separator />

      <section {...stylex.props(styles.section)}>
        <div {...stylex.props(styles.intro)}>
          <Text render={HEADING_2} variant="titleLarge">
            Its own words
          </Text>
          <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
            Both labels are the call site&apos;s to set, for a field whose value
            is taken away by some other verb than copying.
          </Text>
        </div>
        <div {...stylex.props(styles.sample)}>
          <CopyField copiedLabel="Taken" copyLabel="Take" value={VALUE} />
        </div>
      </section>
    </div>
  ),
}

const Default: Story = {}

// The dwell runs on the document's own clock here, which is the one thing
// index.test.tsx cannot check: every assertion there advances a fake timer, so
// a component that scheduled nothing at all would still pass. This proves the
// timer is really set and really fires.
//
// The clipboard is still stood in for. Its permission is not something a story
// can grant, and it is not what this story is about — the real clock is.
//
// Hidden from the sidebar and from Chromatic, since it documents nothing a
// reader would want to look at and its snapshot would land mid-dwell.
const Copied: Story = {
  parameters: {
    chromatic: { disableSnapshot: true },
  },
  play: async ({ canvas, userEvent }) => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: async () => {} },
    })

    const button = canvas.getByRole('button')
    await expect(button.textContent).toBe('Copy')

    await userEvent.click(button)
    await waitFor(async () => {
      await expect(button.textContent).toBe('Copied')
    })

    // No timer is advanced. This waits out the real dwell.
    await waitFor(
      async () => {
        await expect(button.textContent).toBe('Copy')
      },
      { timeout: 5000 },
    )
  },
  tags: ['!dev'],
}

export { Copied, Default, Overview }

export default meta
