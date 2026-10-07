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
import Button from '../button'
import Text from '../text'

const styles = stylex.create({
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

// Its own story because a target that takes nothing is a state a consumer
// has to be able to look at: React Aria stops it responding, and the fade
// and the cursor are what say so before anything is dragged onto it.
//
// `color-contrast` is off for this story alone. The faded label is the 38%
// on the content role every disabled control here fades to, and WCAG 1.4.3
// exempts text that is part of an inactive component from the 4.5:1 it would
// otherwise ask for. axe cannot see that: the words are a `<p>`, drawn
// beside the visually hidden button that actually carries the disabled
// state, so the rule reads them as ordinary body text and reports 2.35:1.
// Scoped to the one story rather than turned off for the component, and the
// rest of the rules still run here.
const Disabled: Story = {
  parameters: {
    a11y: {
      config: {
        rules: [{ enabled: false, id: 'color-contrast' }],
      },
    },
  },
  render: () => (
    <div {...stylex.props(styles.width)}>
      <DropZone isDisabled label="Drop a file here" />
    </div>
  ),
}

// Its own story because FileTrigger renders nothing but a hidden input, so what
// is seen is whatever it wraps, normally a Button. It needs no drop target
// near it, which is why the two are separate exports.
const StandalonePicker: Story = {
  render: () => (
    <FileTrigger acceptedFileTypes={IMAGES} allowsMultiple>
      <Button variant="outlined">Choose images</Button>
    </FileTrigger>
  ),
}

export { Bare, Default, Disabled, StandalonePicker }

export default meta
