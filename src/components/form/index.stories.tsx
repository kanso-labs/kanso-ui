import type { Meta, StoryObj } from '@storybook/react-vite'
import type { ComponentProps, SyntheticEvent } from 'react'

import * as stylex from '@stylexjs/stylex'
import { useEffect, useRef, useState } from 'react'
import { expect, waitFor } from 'storybook/test'

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

// How long the story's stand-in for a server takes to answer.
const ROUND_TRIP_MS = 600

type Errors = Partial<typeof SERVER_ERRORS>

const NO_ERRORS: Errors = {}

/**
 * A form whose submission goes out to a stand-in for a server and comes back
 * with an error for the headline.
 */
function AsyncSubmitForm(args: ComponentProps<typeof Form>) {
  const [errors, setErrors] = useState(NO_ERRORS)
  const [isPending, setPending] = useState(false)
  const headline = useRef<HTMLInputElement>(null)

  // The one part of the round trip the form leaves to the call site: once
  // the errors are under their fields, focus moves to the first of them.
  // Moved after they render rather than with the reply, so the field is
  // already marked invalid when focus lands on it.
  useEffect(() => {
    if (errors.headline !== undefined) {
      headline.current?.focus()
    }
  }, [errors])

  return (
    <div {...stylex.props(styles.sample)}>
      <Form
        {...args}
        onSubmit={submitTo(setPending, setErrors)}
        validationErrors={errors}
      >
        <Stack gap="md">
          <TextField
            defaultValue="Headline"
            inputRef={headline}
            label="Headline"
            name="headline"
          />
          <TextField label="Supporting line" name="supporting" />
          <div>
            <Button isPending={isPending} type="submit">
              Submit
            </Button>
          </div>
        </Stack>
      </Form>
    </div>
  )
}

// The submit handler, built by a call rather than written inline at the prop,
// which is what react-perf's no-new-function-as-prop is after. It sends the
// form to the stand-in for a server and hands back what it answers.
function submitTo(
  setPending: (isPending: boolean) => void,
  setErrors: (errors: Errors) => void,
) {
  return (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault()
    setErrors(NO_ERRORS)
    setPending(true)
    setTimeout(() => {
      setPending(false)
      setErrors(SERVER_ERRORS)
    }, ROUND_TRIP_MS)
  }
}

// A submission that goes to a server and comes back with errors: pending
// while it is out, then the errors handed back through `validationErrors`.
// Each is read out as it appears under its field, and the call site moves
// focus to the first field that came back invalid — see
// `validationBehavior` for why that part is the call site's.
const AsyncSubmit: Story = {
  play: async ({ canvas, userEvent }) => {
    // Submitted with Enter from the second field, so focus starts somewhere
    // other than where it has to end up. A press on Submit would do too, but
    // React Aria announces a focused button's pending state through a node
    // labelled by the button, which outlives the story in the test run and
    // fails the next story's accessibility check once the button is gone.
    await userEvent.click(canvas.getByLabelText('Supporting line'))
    await userEvent.keyboard('{Enter}')

    const field = canvas.getByLabelText('Headline')
    await waitFor(
      async () => {
        await expect(field).toHaveFocus()
      },
      { timeout: ROUND_TRIP_MS * 5 },
    )
    await expect(field).toHaveAttribute('aria-invalid', 'true')
    await expect(canvas.getByText(SERVER_ERRORS.headline)).toBeVisible()
  },
  render: (args) => <AsyncSubmitForm {...args} />,
}

export { AsyncSubmit, Default, NativeValidation, ServerErrors }

export default meta
