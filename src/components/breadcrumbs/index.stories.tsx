import type { Meta, StoryObj } from '@storybook/react-vite'
import type { Key } from 'react-aria-components'

import * as stylex from '@stylexjs/stylex'
import { useCallback, useState } from 'react'

import Breadcrumbs from '.'
import { spacing } from '../../tokens/design.tokens.stylex'
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
  intro: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.xxs,
  },
  // A narrow column, so the long trail below has something to wrap inside.
  narrow: {
    boxSizing: 'border-box',
    inlineSize: '320px',
  },
  page: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.xl,
    marginInline: 'auto',
    maxInlineSize: '960px',
    padding: spacing.xl,
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.lg,
  },
})

const TRAIL = (
  <>
    <Breadcrumbs.Item href="#first">First item</Breadcrumbs.Item>
    <Breadcrumbs.Item href="#second">Second item</Breadcrumbs.Item>
    <Breadcrumbs.Item>Third item</Breadcrumbs.Item>
  </>
)

const meta = {
  args: {
    'aria-label': 'Label',
    children: TRAIL,
  },
  component: Breadcrumbs,
  title: 'Components/Breadcrumbs',
} satisfies Meta<typeof Breadcrumbs>

type Story = StoryObj<typeof meta>

// A trail whose items report their key rather than navigating, which is what
// a page routing on its own needs.
function Routed() {
  const [pressed, setPressed] = useState<string>('none')
  // The React Compiler memoises this on `setPressed`, which is stable, so it
  // is one function rather than a new one per render — what react-perf's
  // no-new-function-as-prop is after.
  const onAction = useCallback((key: Key) => {
    setPressed(String(key))
  }, [])

  return (
    <div {...stylex.props(styles.intro)}>
      <Breadcrumbs aria-label="Routed" onAction={onAction}>
        <Breadcrumbs.Item id="first">First item</Breadcrumbs.Item>
        <Breadcrumbs.Item id="second">Second item</Breadcrumbs.Item>
        <Breadcrumbs.Item id="third">Third item</Breadcrumbs.Item>
      </Breadcrumbs>
      <Text tone="muted" variant="bodySmall">
        Last pressed: {pressed}
      </Text>
    </div>
  )
}

const Overview: Story = {
  render: () => (
    <div {...stylex.props(styles.page)}>
      <header {...stylex.props(styles.header)}>
        <Text render={HEADING_1} variant="displaySmall">
          Breadcrumbs
        </Text>
        <Text render={PARAGRAPH} tone="muted" variant="bodyLarge">
          A trail of links back up a hierarchy, ending at the page you are on.
        </Text>
      </header>

      <Separator />

      <section {...stylex.props(styles.section)}>
        <div {...stylex.props(styles.intro)}>
          <Text render={HEADING_2} variant="titleLarge">
            The trail
          </Text>
          <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
            The last item is the page you are on. It is drawn as text in the
            full-strength content role rather than as a link, and announced as
            the current page; everything before it is a link in the muted role
            that underlines on hover.
          </Text>
        </div>
        <Breadcrumbs aria-label="Trail">{TRAIL}</Breadcrumbs>
      </section>

      <Separator />

      <section {...stylex.props(styles.section)}>
        <div {...stylex.props(styles.intro)}>
          <Text render={HEADING_2} variant="titleLarge">
            Without an href
          </Text>
          <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
            A page that routes on its own gives each item an id and the trail an
            onAction, which reports the key that was pressed. The items are
            still announced as links.
          </Text>
        </div>
        <Routed />
      </section>

      <Separator />

      <section {...stylex.props(styles.section)}>
        <div {...stylex.props(styles.intro)}>
          <Text render={HEADING_2} variant="titleLarge">
            A long trail
          </Text>
          <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
            The row wraps rather than scrolling or truncating, so a deep trail
            in a narrow column stays readable rather than running off the edge.
          </Text>
        </div>
        <div {...stylex.props(styles.narrow)}>
          <Breadcrumbs aria-label="Long">
            <Breadcrumbs.Item href="#first">First item</Breadcrumbs.Item>
            <Breadcrumbs.Item href="#second">Second item</Breadcrumbs.Item>
            <Breadcrumbs.Item href="#third">Third item</Breadcrumbs.Item>
            <Breadcrumbs.Item href="#fourth">Fourth item</Breadcrumbs.Item>
            <Breadcrumbs.Item>Fifth item</Breadcrumbs.Item>
          </Breadcrumbs>
        </div>
      </section>
    </div>
  ),
}

const Default: Story = {}

const TwoItems: Story = {
  args: {
    children: (
      <>
        <Breadcrumbs.Item href="#first">First item</Breadcrumbs.Item>
        <Breadcrumbs.Item>Second item</Breadcrumbs.Item>
      </>
    ),
  },
}

const Disabled: Story = {
  args: { isDisabled: true },
}

export { Default, Disabled, Overview, TwoItems }

export default meta
