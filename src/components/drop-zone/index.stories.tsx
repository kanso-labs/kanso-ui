// The target's children take nodes, so passing JSX to it is this component's
// API rather than a misuse of it. react-perf guards against a fresh element
// identity defeating memoization, which the React Compiler this repo builds
// with already handles.
// oxlint-disable react-perf/jsx-no-jsx-as-prop
// oxlint-disable react-perf/jsx-no-new-function-as-prop

import type { Meta, StoryObj } from '@storybook/react-vite'

import * as stylex from '@stylexjs/stylex'
import { useState } from 'react'

import DropZone, { FileTrigger } from '.'
import { spacing } from '../../tokens/design.tokens.stylex'
import Button from '../button'
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
  width: {
    inlineSize: '420px',
  },
})

const IMAGES = ['image/png', 'image/jpeg']

const meta = {
  component: DropZone,
  title: 'Components/DropZone',
} satisfies Meta<typeof DropZone>

type Story = StoryObj<typeof meta>

// What a page actually builds: a target that takes a drop, with a picker
// inside it for the pointer that would rather click.
function Sample() {
  const [picked, setPicked] = useState<string | undefined>(undefined)

  return (
    <DropZone
      label="Drop a file here"
      onDrop={() => {
        setPicked('Dropped')
      }}
    >
      <FileTrigger
        onSelect={(files) => {
          setPicked(files?.[0]?.name ?? undefined)
        }}
      >
        <Button variant="outlined">Choose a file</Button>
      </FileTrigger>
      {picked === undefined ? null : (
        <Text tone="muted" variant="labelSmall">
          {picked}
        </Text>
      )}
    </DropZone>
  )
}

const Overview: Story = {
  render: () => (
    <div {...stylex.props(styles.page)}>
      <header {...stylex.props(styles.header)}>
        <Text render={HEADING_1} variant="displaySmall">
          DropZone
        </Text>
        <Text render={PARAGRAPH} tone="muted" variant="bodyLarge">
          A place to drop files, and a button that opens the file picker.
        </Text>
      </header>

      <Separator />

      <section {...stylex.props(styles.section)}>
        <div {...stylex.props(styles.intro)}>
          <Text render={HEADING_2} variant="titleLarge">
            The target
          </Text>
          <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
            The design carries no page for a drop target, so this is drawn from
            the nearest thing it does carry — the outlined card — with one
            change: the rule is dashed. A solid rule reads as a card, which
            holds content; a dashed one reads as a place to put something.
          </Text>
          <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
            `label` both draws the words and names the target, so a target with
            one needs no `aria-label`. React Aria puts a keyboard- reachable
            button inside, which is what lets a drop be done without a pointer
            at all.
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
            The picker on its own
          </Text>
          <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
            `FileTrigger` renders nothing but a hidden input, so what is seen is
            whatever it wraps — normally the library&apos;s Button. It is useful
            with no drop target anywhere near it, which is why the two are
            separate exports rather than one nested in the other.
          </Text>
        </div>
        <FileTrigger acceptedFileTypes={IMAGES} allowsMultiple>
          <Button variant="outlined">Choose images</Button>
        </FileTrigger>
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

// Its own story because the label is the whole of a bare target, and a page
// that already says what it takes uses `aria-label` instead.
const Bare: Story = {
  render: () => (
    <div {...stylex.props(styles.width)}>
      <DropZone label="Drop a file here" />
    </div>
  ),
}

export { Bare, Default, Overview }

export default meta
