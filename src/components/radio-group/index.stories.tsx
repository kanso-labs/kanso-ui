import type { Meta, StoryObj } from '@storybook/react-vite'
import type { SyntheticEvent } from 'react'

import * as stylex from '@stylexjs/stylex'
import { expect } from 'storybook/test'

import RadioGroup, { Radio } from '.'
import Button from '../button'
import Form from '../form'
import Stack from '../stack'

// A story's form has nowhere to go, so submission stays on the page.
function stayOnPage(event: SyntheticEvent<HTMLFormElement>) {
  event.preventDefault()
}

const styles = stylex.create({
  // A group fills its container, so the samples need a width to fill.
  // Narrower than the address, so it has to break.
  narrow: {
    inlineSize: '200px',
  },
  sample: {
    maxInlineSize: '420px',
  },
})

// Pulled out because every story lists the same three options and only the
// group around them differs.
function Options() {
  return (
    <>
      <Radio value="first">First item</Radio>
      <Radio value="second">Second item</Radio>
      <Radio value="third">Third item</Radio>
    </>
  )
}

const meta = {
  args: {
    defaultValue: 'first',
    label: 'Label',
  },
  component: RadioGroup,
  // A tab of its own beside the group's in the Overview page's props table,
  // since a group is written with its options.
  subcomponents: { Radio },
  title: 'Components/RadioGroup',
} satisfies Meta<typeof RadioGroup>

type Story = StoryObj<typeof meta>

const Default: Story = {
  render: (args) => (
    <div {...stylex.props(styles.sample)}>
      <RadioGroup {...args}>
        <Options />
      </RadioGroup>
    </div>
  ),
}

// Disabled as a whole, then one option alone. A disabled group fades its
// label, every option and every description together, the chosen one
// included; a disabled option fades by itself and the rest stay as they were.
const Disabled: Story = {
  args: {
    description: 'Supporting line',
    isDisabled: true,
  },
  render: (args) => (
    <div {...stylex.props(styles.sample)}>
      <Stack gap="lg">
        <RadioGroup {...args}>
          <Radio description="Supporting line" value="first">
            First item
          </Radio>
          <Radio value="second">Second item</Radio>
          <Radio value="third">Third item</Radio>
        </RadioGroup>
        <RadioGroup defaultValue="first" label="Label">
          <Radio value="first">First item</Radio>
          <Radio value="second">Second item</Radio>
          <Radio isDisabled value="third">
            Third item
          </Radio>
        </RadioGroup>
      </Stack>
    </div>
  ),
}

// The choice can be read but not changed. It looks as an enabled group does,
// so it carries no snapshot of its own: what sets it apart is that a press
// leaves the choice where it was.
const ReadOnly: Story = {
  args: {
    isReadOnly: true,
  },
  parameters: { chromatic: { disableSnapshot: true } },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('radio', { name: 'Second item' }))
    await expect(
      canvas.getByRole('radio', { name: 'First item' }),
    ).toBeChecked()
  },
  render: (args) => (
    <div {...stylex.props(styles.sample)}>
      <RadioGroup {...args}>
        <Options />
      </RadioGroup>
    </div>
  ),
}

// The label carries the asterisk. WithValidation submits one with nothing
// chosen.
const Required: Story = {
  args: {
    defaultValue: undefined,
    isRequired: true,
  },
  render: (args) => (
    <div {...stylex.props(styles.sample)}>
      <RadioGroup {...args}>
        <Options />
      </RadioGroup>
    </div>
  ),
}

const Horizontal: Story = {
  args: {
    orientation: 'horizontal',
  },
  render: (args) => (
    <RadioGroup {...args}>
      <Options />
    </RadioGroup>
  ),
}

// Its own story because an option's description is a prop of the option rather
// than of the group, so the Controls panel cannot reach it: it is read with the
// option, and the one under the group is read with the group.
const WithDescriptions: Story = {
  args: {
    defaultValue: 'second',
    description: 'Supporting line',
  },
  render: (args) => (
    <div {...stylex.props(styles.sample)}>
      <RadioGroup {...args}>
        <Radio description="Supporting line" value="first">
          First item
        </Radio>
        <Radio description="Supporting line" value="second">
          Second item
        </Radio>
        <Radio value="third">Third item</Radio>
      </RadioGroup>
    </div>
  ),
}

const WithError: Story = {
  args: {
    defaultValue: undefined,
    error: 'Choose one.',
  },
  render: (args) => (
    <div {...stylex.props(styles.sample)}>
      <RadioGroup {...args}>
        <Options />
      </RadioGroup>
    </div>
  ),
}

// Its own story because the message here is the browser's rather than one
// passed as `error`: a required group in a form that validates natively,
// submitted with nothing chosen. The options keep their descriptions under
// the group's message.
const WithValidation: Story = {
  args: {
    defaultValue: undefined,
    isRequired: true,
    name: 'choice',
  },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Submit' }))
    await expect(
      canvas.getByRole('radiogroup', { name: 'Label' }),
    ).toHaveAttribute('aria-invalid', 'true')
    await expect(canvas.getByText('Supporting line')).toBeVisible()
  },
  render: (args) => (
    <div {...stylex.props(styles.sample)}>
      <Form aria-label="Form" onSubmit={stayOnPage} validationBehavior="native">
        <Stack gap="md">
          <RadioGroup {...args}>
            <Radio description="Supporting line" value="first">
              First item
            </Radio>
            <Radio value="second">Second item</Radio>
          </RadioGroup>
          <div>
            <Button type="submit">Submit</Button>
          </div>
        </Stack>
      </Form>
    </div>
  ),
}

// Its own story because a word with nowhere to break — an address, a long
// compound — breaks inside an option's label, the group's label and the lines under them rather than
// widening the page.
const LongLabel: Story = {
  args: {
    description: 'firstname.lastname@organisation.example.com',
    label: 'Unterstützungszeilenüberschrift',
  },
  render: (args) => (
    <div {...stylex.props(styles.narrow)}>
      <RadioGroup {...args}>
        <Radio
          description="firstname.lastname@organisation.example.com"
          value="first"
        >
          Unterstützungszeilenüberschrift
        </Radio>
        <Radio value="second">Second item</Radio>
      </RadioGroup>
    </div>
  ),
}

export {
  Default,
  Disabled,
  Horizontal,
  LongLabel,
  ReadOnly,
  Required,
  WithDescriptions,
  WithError,
  WithValidation,
}

export default meta
