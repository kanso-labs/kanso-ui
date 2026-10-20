import type { Meta, StoryObj } from '@storybook/react-vite'

import * as stylex from '@stylexjs/stylex'

import Checkbox from '.'

const styles = stylex.create({
  // Narrower than the address, so it has to break.
  narrow: {
    inlineSize: '200px',
  },
})

const meta = {
  args: {
    children: 'Label',
  },
  component: Checkbox,
  title: 'Components/Checkbox',
} satisfies Meta<typeof Checkbox>

type Story = StoryObj<typeof meta>

const Default: Story = {}

const Selected: Story = {
  args: {
    defaultSelected: true,
  },
}

const Indeterminate: Story = {
  args: {
    isIndeterminate: true,
  },
}

const WithDescription: Story = {
  args: {
    description: 'Supporting line',
  },
}

// Its own story because the error state is three changes at once — the
// box's colours, the message that replaces the description, and the
// invalid mark.
const WithError: Story = {
  args: {
    description: 'Supporting line',
    error: 'Choose one.',
  },
}

// The description fades with the label it explains.
//
// `color-contrast` is off for this story alone, as it is for DropZone's
// `Disabled`. The faded description is the 38% on the content role every
// disabled control here fades to, and WCAG 1.4.3 exempts text that is part of
// an inactive component from the 4.5:1 it would otherwise ask for. axe passes
// the label, which is tied to the disabled input, but reads the description
// beside it as ordinary body text and reports 2.35:1. The rest of the rules
// still run here.
const Disabled: Story = {
  args: {
    description: 'Supporting line',
    isDisabled: true,
  },
  parameters: {
    a11y: {
      config: {
        rules: [{ enabled: false, id: 'color-contrast' }],
      },
    },
  },
}

// Its own story because a word with nowhere to break — an address, a long
// compound — breaks inside the label and the line under it rather than
// widening the page.
const LongLabel: Story = {
  args: {
    children: 'firstname.lastname@organisation.example.com',
    description: 'Unterstützungszeilenüberschrift',
  },
  render: (args) => (
    <div {...stylex.props(styles.narrow)}>
      <Checkbox {...args} />
    </div>
  ),
}

// A label carrying a link, as rich text from a translation or markdown
// arrives. The link is a plain anchor; it is followed on a press or Enter, as
// in a native label, and the checkbox stays as it was. Hoisted so it is one
// element rather than a fresh one per render.
const AGREEMENT = (
  <>
    I agree to the <a href="#terms">terms</a>
  </>
)

// No `play`: Storybook's `userEvent` acts out a label's forwarding of a click
// to its control in script, without the exception a native label makes for a
// link inside it, so it toggles the box where a real click does not. The
// press and Enter are pinned in src/control/index.test.tsx instead.
const WithLink: Story = {
  args: { children: AGREEMENT },
}

// A checkbox that must be ticked, as an "accept the terms" box is: its label
// ends in the asterisk every required field's label ends in.
const Required: Story = {
  args: { isRequired: true },
}

export {
  Default,
  Disabled,
  Indeterminate,
  LongLabel,
  Required,
  Selected,
  WithDescription,
  WithError,
  WithLink,
}

export default meta
