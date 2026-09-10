import type { Meta, StoryObj } from '@storybook/react-vite'

import * as stylex from '@stylexjs/stylex'

import Disclosure from '.'
import { colors, radii, spacing } from '../../tokens/design.tokens.stylex'
import Avatar from '../avatar'
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

// Hoisted so the slot is not a new element on every render, which is what
// react-perf's jsx-no-jsx-as-prop is after.
const ADA = <Avatar name="Ada Lovelace" size="sm" />

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
  // A section fills what it is given, so the samples need a width and
  // something to sit on.
  surface: {
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: radii.md,
    boxSizing: 'border-box',
    inlineSize: '360px',
    overflow: 'hidden',
  },
})

const BODY = (
  <Text tone="muted" variant="bodyMedium">
    Supporting line. The panel opens to whatever height its content turns out to
    have, without one being measured or written down.
  </Text>
)

const meta = {
  args: {
    children: (
      <>
        <Disclosure.Header>Headline</Disclosure.Header>
        <Disclosure.Panel>{BODY}</Disclosure.Panel>
      </>
    ),
  },
  component: Disclosure,
  title: 'Components/Disclosure',
} satisfies Meta<typeof Disclosure>

type Story = StoryObj<typeof meta>

const Overview: Story = {
  render: () => (
    <div {...stylex.props(styles.page)}>
      <header {...stylex.props(styles.header)}>
        <Text render={HEADING_1} variant="displaySmall">
          Disclosure
        </Text>
        <Text render={PARAGRAPH} tone="muted" variant="bodyLarge">
          A section that opens to show what is under it.
        </Text>
      </header>

      <Separator />

      <section {...stylex.props(styles.section)}>
        <div {...stylex.props(styles.intro)}>
          <Text render={HEADING_2} variant="titleLarge">
            Open and closed
          </Text>
          <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
            The header is the row every list here draws, so a section above a
            list of rows lines up with them. The chevron turns a quarter once
            the section is open.
          </Text>
        </div>
        <div {...stylex.props(styles.row)}>
          <div {...stylex.props(styles.surface)}>
            <Disclosure>
              <Disclosure.Header>Headline</Disclosure.Header>
              <Disclosure.Panel>{BODY}</Disclosure.Panel>
            </Disclosure>
          </div>
          <div {...stylex.props(styles.surface)}>
            <Disclosure defaultExpanded>
              <Disclosure.Header>Headline</Disclosure.Header>
              <Disclosure.Panel>{BODY}</Disclosure.Panel>
            </Disclosure>
          </div>
        </div>
      </section>

      <Separator />

      <section {...stylex.props(styles.section)}>
        <div {...stylex.props(styles.intro)}>
          <Text render={HEADING_2} variant="titleLarge">
            The header&apos;s slots
          </Text>
          <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
            It takes the same leading and supporting content a list row does,
            with the chevron in the trailing slot.
          </Text>
        </div>
        <div {...stylex.props(styles.row)}>
          <div {...stylex.props(styles.surface)}>
            <Disclosure defaultExpanded>
              <Disclosure.Header leading={ADA} supporting="Supporting line">
                Ada Lovelace
              </Disclosure.Header>
              <Disclosure.Panel>{BODY}</Disclosure.Panel>
            </Disclosure>
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
            A section that cannot be opened fades its header the way a list row
            does, and stops responding to a press.
          </Text>
        </div>
        <div {...stylex.props(styles.row)}>
          <div {...stylex.props(styles.surface)}>
            <Disclosure isDisabled>
              <Disclosure.Header supporting="Supporting line">
                Headline
              </Disclosure.Header>
              <Disclosure.Panel>{BODY}</Disclosure.Panel>
            </Disclosure>
          </div>
        </div>
      </section>
    </div>
  ),
}

const Default: Story = {
  render: (args) => (
    <div {...stylex.props(styles.surface)}>
      <Disclosure {...args} />
    </div>
  ),
}

const Expanded: Story = {
  args: { defaultExpanded: true },
  render: Default.render,
}

const WithSlots: Story = {
  args: {
    children: (
      <>
        <Disclosure.Header leading={ADA} supporting="Supporting line">
          Ada Lovelace
        </Disclosure.Header>
        <Disclosure.Panel>{BODY}</Disclosure.Panel>
      </>
    ),
    defaultExpanded: true,
  },
  render: Default.render,
}

const Disabled: Story = {
  args: { isDisabled: true },
  render: Default.render,
}

export { Default, Disabled, Expanded, Overview, WithSlots }

export default meta
