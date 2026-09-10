import type { Meta, StoryObj } from '@storybook/react-vite'

import * as stylex from '@stylexjs/stylex'

import DisclosureGroup from '.'
import { colors, radii, spacing } from '../../tokens/design.tokens.stylex'
import Disclosure from '../disclosure'
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

// Hoisted so the keys are not new arrays on every render, which is what
// react-perf's no-new-array-as-prop is after.
const FIRST = ['first']
const FIRST_AND_THIRD = ['first', 'third']

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
  // A group fills what it is given, so the samples need a width and something
  // to sit on.
  surface: {
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: radii.md,
    boxSizing: 'border-box',
    inlineSize: '360px',
    overflow: 'hidden',
  },
})

function body(text: string) {
  return (
    <Text tone="muted" variant="bodyMedium">
      {text}
    </Text>
  )
}

const SECTIONS = (
  <>
    <Disclosure id="first">
      <Disclosure.Header>First item</Disclosure.Header>
      <Disclosure.Panel>
        {body('Supporting line for the first.')}
      </Disclosure.Panel>
    </Disclosure>
    <Disclosure id="second">
      <Disclosure.Header>Second item</Disclosure.Header>
      <Disclosure.Panel>
        {body('Supporting line for the second.')}
      </Disclosure.Panel>
    </Disclosure>
    <Disclosure id="third">
      <Disclosure.Header>Third item</Disclosure.Header>
      <Disclosure.Panel>
        {body('Supporting line for the third.')}
      </Disclosure.Panel>
    </Disclosure>
  </>
)

const meta = {
  args: {
    children: SECTIONS,
    defaultExpandedKeys: FIRST,
  },
  component: DisclosureGroup,
  title: 'Components/DisclosureGroup',
} satisfies Meta<typeof DisclosureGroup>

type Story = StoryObj<typeof meta>

const Overview: Story = {
  render: () => (
    <div {...stylex.props(styles.page)}>
      <header {...stylex.props(styles.header)}>
        <Text render={HEADING_1} variant="displaySmall">
          DisclosureGroup
        </Text>
        <Text render={PARAGRAPH} tone="muted" variant="bodyLarge">
          A stack of sections that agree about what is open.
        </Text>
      </header>

      <Separator />

      <section {...stylex.props(styles.section)}>
        <div {...stylex.props(styles.intro)}>
          <Text render={HEADING_2} variant="titleLarge">
            One at a time, or several
          </Text>
          <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
            One section opens at a time by default, so opening a new one closes
            the last. `allowsMultipleExpanded` lets them stand open together —
            the same stack with a different word.
          </Text>
        </div>
        <div {...stylex.props(styles.row)}>
          <div {...stylex.props(styles.surface)}>
            <DisclosureGroup defaultExpandedKeys={FIRST}>
              {SECTIONS}
            </DisclosureGroup>
          </div>
          <div {...stylex.props(styles.surface)}>
            <DisclosureGroup
              allowsMultipleExpanded
              defaultExpandedKeys={FIRST_AND_THIRD}
            >
              {SECTIONS}
            </DisclosureGroup>
          </div>
        </div>
      </section>

      <Separator />

      <section {...stylex.props(styles.section)}>
        <div {...stylex.props(styles.intro)}>
          <Text render={HEADING_2} variant="titleLarge">
            The rule between them
          </Text>
          <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
            A rule is drawn between each pair and never at the ends, so the
            stack reads as one thing. A group whose sections sit on cards of
            their own turns it off.
          </Text>
        </div>
        <div {...stylex.props(styles.row)}>
          <div {...stylex.props(styles.surface)}>
            <DisclosureGroup defaultExpandedKeys={FIRST} divided={false}>
              {SECTIONS}
            </DisclosureGroup>
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
            A group that cannot be opened fades every header the way a list row
            does, and none of them respond to a press.
          </Text>
        </div>
        <div {...stylex.props(styles.row)}>
          <div {...stylex.props(styles.surface)}>
            <DisclosureGroup defaultExpandedKeys={FIRST} isDisabled>
              {SECTIONS}
            </DisclosureGroup>
          </div>
        </div>
      </section>
    </div>
  ),
}

const Default: Story = {
  render: (args) => (
    <div {...stylex.props(styles.surface)}>
      <DisclosureGroup {...args} />
    </div>
  ),
}

const MultipleExpanded: Story = {
  args: {
    allowsMultipleExpanded: true,
    defaultExpandedKeys: FIRST_AND_THIRD,
  },
  render: Default.render,
}

const Undivided: Story = {
  args: { divided: false },
  render: Default.render,
}

const Disabled: Story = {
  args: { isDisabled: true },
  render: Default.render,
}

export { Default, Disabled, MultipleExpanded, Overview, Undivided }

export default meta
