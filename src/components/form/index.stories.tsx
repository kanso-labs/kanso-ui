import type { Meta, StoryObj } from '@storybook/react-vite'
import type { SyntheticEvent } from 'react'

import * as stylex from '@stylexjs/stylex'

import Form from '.'
import Button from '../button'
import Stack from '../stack'
import TextField from '../text-field'

// Hoisted so it is one stable object per render rather than a fresh one,
// which is what react-perf's no-new-object-as-prop is after.
const SERVER_ERRORS = {
  headline: 'Choose another headline.',
}

// A story's form has nowhere to go, so submission stays on the page.
function stayOnPage(event: SyntheticEvent<HTMLFormElement>) {
  event.preventDefault()
}

const styles = stylex.create({
  sample: {
    maxInlineSize: '420px',
  },
})

const meta = {
  args: {
    'aria-label': 'Label',
    onSubmit: stayOnPage,
  },
  component: Form,
  title: 'Components/Form',
} satisfies Meta<typeof Form>

type Story = StoryObj<typeof meta>

const Default: Story = {
  render: (args) => (
    <div {...stylex.props(styles.sample)}>
      <Form {...args}>
        <Stack gap="md">
          <TextField label="Headline" name="headline" />
          <TextField label="Supporting line" name="supporting" />
          <div>
            <Button type="submit">Submit</Button>
          </div>
        </Stack>
      </Form>
    </div>
  ),
}

const ServerErrors: Story = {
  args: {
    validationErrors: SERVER_ERRORS,
  },
  render: (args) => (
    <div {...stylex.props(styles.sample)}>
      <Form {...args}>
        <Stack gap="md">
          <TextField defaultValue="Headline" label="Headline" name="headline" />
          <TextField label="Supporting line" name="supporting" />
          <div>
            <Button type="submit">Submit</Button>
          </div>
        </Stack>
      </Form>
    </div>
  ),
}

const NativeValidation: Story = {
  args: {
    validationBehavior: 'native',
  },
  render: (args) => (
    <div {...stylex.props(styles.sample)}>
      <Form {...args}>
        <Stack gap="md">
          <TextField isRequired label="Headline" name="headline" />
          <TextField label="Supporting line" name="supporting" />
          <div>
            <Button type="submit">Submit</Button>
          </div>
        </Stack>
      </Form>
    </div>
  ),
}

export { Default, NativeValidation, ServerErrors }

export default meta
