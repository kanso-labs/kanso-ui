import type { Meta, StoryObj } from '@storybook/react-vite'

import * as stylex from '@stylexjs/stylex'
import { useState } from 'react'

import Button from './components/button'
import Card from './components/card'
import Dialog from './components/dialog'
import Separator from './components/separator'
import Text from './components/text'
import { SharedElement, SharedElementTransition } from './react-aria'
import {
  colors,
  motion,
  radii,
  spacing,
  typography,
} from './tokens/design.tokens.stylex'

// See avatar/index.stories.tsx for why the page is built from the library's
// own components rather than from shell components of its own.
// oxlint-disable-next-line jsx-a11y/heading-has-content -- filled by useRender
const HEADING_1 = <h1 />
// oxlint-disable-next-line jsx-a11y/heading-has-content -- filled by useRender
const HEADING_2 = <h2 />
const PARAGRAPH = <p />

const styles = stylex.create({
  card: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.sm,
    inlineSize: '280px',
  },
  header: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.xs,
  },
  // The element that moves. Every property it should animate has to be named
  // here — see the page's own copy for why that is the whole mechanism.
  hero: {
    '@media (prefers-reduced-motion: reduce)': {
      transitionDuration: '0s',
    },
    alignItems: 'center',
    backgroundColor: colors.primaryContainer,
    borderRadius: radii.md,
    boxSizing: 'border-box',
    color: colors.onPrimaryContainer,
    display: 'flex',
    fontFamily: typography.labelLargeFont,
    fontSize: typography.labelLargeSize,
    justifyContent: 'center',
    transitionDuration: motion.durationMedium2,
    transitionProperty: 'translate, inline-size, block-size, border-radius',
    transitionTimingFunction: motion.easingEmphasized,
  },
  heroLarge: {
    blockSize: '160px',
    borderRadius: radii.lg,
    inlineSize: '100%',
  },
  heroSmall: {
    blockSize: '72px',
    inlineSize: '96px',
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
    gap: spacing.lg,
  },
})

function GrowIntoDialog() {
  const [open, setOpen] = useState(false)

  return (
    <SharedElementTransition>
      <Dialog isOpen={open} onOpenChange={setOpen}>
        <Card {...stylex.props(styles.card)}>
          {/* `isVisible` is what hands the element over. Two instances of a
              name on screen at once do not animate — they are simply two
              elements. */}
          <SharedElement
            isVisible={!open}
            name="hero"
            {...stylex.props(styles.hero, styles.heroSmall)}
          >
            Label
          </SharedElement>
          <Text render={PARAGRAPH} variant="bodyMedium">
            Headline
          </Text>
          <Button>Open</Button>
        </Card>
        <Dialog.Content>
          <Dialog.Header>
            <Dialog.Title>Headline</Dialog.Title>
          </Dialog.Header>
          <Dialog.Body>
            <SharedElement
              isVisible={open}
              name="hero"
              {...stylex.props(styles.hero, styles.heroLarge)}
            >
              Label
            </SharedElement>
            <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
              Supporting line.
            </Text>
          </Dialog.Body>
          <Dialog.Footer>
            <Button slot="close" variant="text">
              Close
            </Button>
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog>
    </SharedElementTransition>
  )
}

function SharedElementPage() {
  return (
    <div {...stylex.props(styles.page)}>
      <header {...stylex.props(styles.header)}>
        <Text render={HEADING_1} variant="displaySmall">
          Shared elements
        </Text>
        <Text render={PARAGRAPH} tone="muted" variant="bodyLarge">
          An element that animates between two places in the tree, re-exported
          from React Aria rather than wrapped.
        </Text>
      </header>

      <Separator />

      <section {...stylex.props(styles.intro)}>
        <Text render={HEADING_2} variant="titleLarge">
          What the library adds: nothing
        </Text>
        <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
          The motion is a plain CSS transition on the element, so the duration
          and easing are the motion tokens and reduced motion is a media query —
          all of it at the call site, with nothing for this package to mediate.
          Both names are re-exported for the reason every React Aria name here
          is: the scope is a context, and a second copy of the package carries a
          second one.
        </Text>
      </section>

      <Separator />

      <section {...stylex.props(styles.intro)}>
        <Text render={HEADING_2} variant="titleLarge">
          Two things to get right
        </Text>
        <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
          Neither reports anything when you get it wrong, which is why they are
          written here rather than left to be rediscovered.
        </Text>
        <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
          First, name every property you want animated in the element&apos;s own
          transition. React Aria snapshots only the properties a transition
          names, and treats one naming none as an element that does not animate.
          Leave it out and the element still lands in the right place — it
          simply never moves.
        </Text>
        <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
          Second, hand the element over rather than drawing it twice. Two
          instances of a name on screen at once do not animate between
          themselves; the old one has to go as the new one arrives, which is
          what the visibility flag is for. That is also what makes this work
          across a portal, which is where the card below is going.
        </Text>
      </section>

      <Separator />

      <section {...stylex.props(styles.intro)}>
        <Text render={HEADING_2} variant="titleLarge">
          Why not the View Transitions API
        </Text>
        <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
          React 19.3 exports a ViewTransition component and every browser this
          library targets supports the underlying API, so the question is a fair
          one. It is not used here, and could not be without changing how the
          library is styled.
        </Text>
        <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
          A view transition is driven by rules on the pseudo-elements the
          browser hangs off the document root. StyleX scopes every rule it
          writes to a generated class, so the rule it produces for one is scoped
          to an element — a selector that can never match. It compiles without
          complaint and does nothing, which is the worst of both.
        </Text>
        <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
          Driving one properly would need global rules in a stylesheet, and this
          library deliberately ships none. React Aria does not use the API
          either: the primitive below measures the element and animates it with
          its own transition, which is why the motion tokens reach it at all.
        </Text>
      </section>

      <Separator />

      <section {...stylex.props(styles.intro)}>
        <Text render={HEADING_2} variant="titleLarge">
          A card growing into a dialog
        </Text>
        <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
          The block on the card and the block in the dialog are one element.
          Press Open, and it crosses the portal the dialog is rendered into.
        </Text>
      </section>
      <div {...stylex.props(styles.row)}>
        <GrowIntoDialog />
      </div>
    </div>
  )
}

const meta = {
  component: SharedElementPage,
  title: 'Foundations/Shared elements',
} satisfies Meta<typeof SharedElementPage>

type Story = StoryObj<typeof meta>

// Named after the title's last segment for the reason Introduction is: a
// component holding one story of the same name folds into a single sidebar
// leaf, and any other name puts a disclosure triangle with one child in
// front of it.
const SharedElements: Story = {}

export { SharedElements }

export default meta
