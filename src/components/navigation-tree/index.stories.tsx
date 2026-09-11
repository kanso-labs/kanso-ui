// A row's slots take nodes, so passing JSX to them is this component's API
// rather than a misuse of it. react-perf guards against a fresh element
// identity defeating memoization, which the React Compiler this repo builds
// with already handles.
// oxlint-disable react-perf/jsx-no-jsx-as-prop

import type { Meta, StoryObj } from '@storybook/react-vite'

import * as stylex from '@stylexjs/stylex'

import NavigationTree from '.'
import { colors, radii, spacing } from '../../tokens/design.tokens.stylex'
import Card from '../card'
import Separator from '../separator'
import Text from '../text'

// See avatar/index.stories.tsx for why the overview is built from the
// library's own components rather than from shell components of its own, and
// why its sections are divided by a rule instead of boxed in Cards.
// oxlint-disable-next-line jsx-a11y/heading-has-content -- filled by useRender
const HEADING_1 = <h1 />
// oxlint-disable-next-line jsx-a11y/heading-has-content -- filled by useRender
const HEADING_2 = <h2 />
const PARAGRAPH = <p />

const styles = stylex.create({
  // A tinted square standing in for a page's own icon, at the size the
  // drawer page gives one.
  glyph: {
    alignItems: 'center',
    backgroundColor: colors.secondaryContainer,
    blockSize: '24px',
    borderRadius: radii.xs,
    color: colors.onSecondaryContainer,
    display: 'flex',
    inlineSize: '24px',
    justifyContent: 'center',
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
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.lg,
  },
  // The drawer page's own container width.
  width: {
    inlineSize: '360px',
  },
})

const OPEN = ['first', 'second']

const meta = {
  args: {
    'aria-label': 'Label',
  },
  component: NavigationTree,
  title: 'Components/NavigationTree',
} satisfies Meta<typeof NavigationTree>

type Story = StoryObj<typeof meta>

function Sample(props: { leading?: boolean }) {
  const glyph = (mark: string) => (
    <span {...stylex.props(styles.glyph)}>{mark}</span>
  )

  return (
    <Card padding="none" variant="outlined">
      <NavigationTree
        aria-label="Label"
        defaultExpandedKeys={OPEN}
        selectedRoute="#third"
      >
        <NavigationTree.Item
          href="#first"
          id="first"
          label="First item"
          leading={props.leading === true ? glyph('★') : undefined}
        >
          <NavigationTree.Item
            href="#second"
            id="second"
            label="Second item"
            leading={props.leading === true ? glyph('◆') : undefined}
          >
            <NavigationTree.Item
              href="#third"
              id="third"
              label="Third item"
              leading={props.leading === true ? glyph('●') : undefined}
            />
          </NavigationTree.Item>
          <NavigationTree.Item
            href="#fourth"
            id="fourth"
            label="Fourth item"
            leading={props.leading === true ? glyph('◇') : undefined}
          />
        </NavigationTree.Item>
        <NavigationTree.Item
          href="#fifth"
          id="fifth"
          label="Fifth item"
          leading={props.leading === true ? glyph('○') : undefined}
        />
      </NavigationTree>
    </Card>
  )
}

const Overview: Story = {
  render: () => (
    <div {...stylex.props(styles.page)}>
      <header {...stylex.props(styles.header)}>
        <Text render={HEADING_1} variant="displaySmall">
          NavigationTree
        </Text>
        <Text render={PARAGRAPH} tone="muted" variant="bodyLarge">
          A nested set of links, with the current one marked.
        </Text>
      </header>

      <Separator />

      <section {...stylex.props(styles.section)}>
        <div {...stylex.props(styles.intro)}>
          <Text render={HEADING_2} variant="titleLarge">
            The current row
          </Text>
          <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
            Which row is current comes from the route rather than from anything
            the reader picked: give the tree a `selectedRoute` and each row an
            `href`, and the row whose `href` matches takes the page&apos;s
            active indicator — a secondary-container pill held 12px off each
            edge.
          </Text>
          <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
            The rows on the way to it are marked too, in the label&apos;s
            heavier weight rather than with a pill of their own. That is what
            shows where you are when the current row is collapsed out of sight.
          </Text>
        </div>
        <div {...stylex.props(styles.width)}>
          <Sample />
        </div>
      </section>

      <Separator />

      <section {...stylex.props(styles.section)}>
        <div {...stylex.props(styles.intro)}>
          <Text render={HEADING_2} variant="titleLarge">
            With icons
          </Text>
          <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
            The leading slot takes a node, at the 24px the page gives its icon —
            the same width a level of nesting indents by, so an icon and an
            indent step are the same size.
          </Text>
        </div>
        <div {...stylex.props(styles.width)}>
          <Sample leading />
        </div>
      </section>

      <Separator />

      <section {...stylex.props(styles.section)}>
        <div {...stylex.props(styles.intro)}>
          <Text render={HEADING_2} variant="titleLarge">
            Sections
          </Text>
          <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
            A section names a group of rows. Its heading takes the page&apos;s
            headline role, which comes to the same values as the label — so it
            is set apart by colour and by the room around it rather than by
            size.
          </Text>
        </div>
        <div {...stylex.props(styles.width)}>
          <Card padding="none" variant="outlined">
            <NavigationTree aria-label="Label" selectedRoute="#second">
              <NavigationTree.Section header="Headline" id="one">
                <NavigationTree.Item
                  href="#first"
                  id="first"
                  label="First item"
                />
                <NavigationTree.Item
                  href="#second"
                  id="second"
                  label="Second item"
                />
              </NavigationTree.Section>
              <NavigationTree.Section header="Headline" id="two">
                <NavigationTree.Item
                  href="#third"
                  id="third"
                  label="Third item"
                />
              </NavigationTree.Section>
            </NavigationTree>
          </Card>
        </div>
      </section>
    </div>
  ),
}

const Default: Story = {
  render: () => (
    <div {...stylex.props(styles.width)}>
      <Sample />
    </div>
  ),
}

// Its own story because a page's drawer has icons, and the leading slot is
// what makes the rows line up against them.
const WithIcons: Story = {
  render: () => (
    <div {...stylex.props(styles.width)}>
      <Sample leading />
    </div>
  ),
}

export { Default, Overview, WithIcons }

export default meta
