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

export { Default, Horizontal, WithDescriptions, WithError, WithValidation }

export default meta
