import type { Meta, StoryObj } from '@storybook/react-vite'
import type { SyntheticEvent } from 'react'

import * as stylex from '@stylexjs/stylex'

import Form from '.'
import { spacing } from '../../tokens/design.tokens.stylex'
import Button from '../button'
import Checkbox from '../checkbox'
import Separator from '../separator'
import Stack from '../stack'
import Text from '../text'
import TextField from '../text-field'

// See avatar/index.stories.tsx for why the overview is built from the
// library's own components, why its sections are divided by a rule, and why
// the headings go through Text's `render`.
// oxlint-disable-next-line jsx-a11y/heading-has-content -- filled by useRender
const HEADING_1 = <h1 />
// oxlint-disable-next-line jsx-a11y/heading-has-content -- filled by useRender
const HEADING_2 = <h2 />
const PARAGRAPH = <p />

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
  // A field fills its container, so the samples need a width to fill.
  columns: {
    alignItems: 'start',
    display: 'grid',
    gap: spacing.xl,
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
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
  sample: {
    maxInlineSize: '420px',
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.lg,
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

const Overview: Story = {
  render: () => (
    <div {...stylex.props(styles.page)}>
      <header {...stylex.props(styles.header)}>
        <Text render={HEADING_1} variant="displaySmall">
          Form
        </Text>
        <Text render={PARAGRAPH} tone="muted" variant="bodyLarge">
          The fields inside it and what they are told about validation. It draws
          nothing of its own; a Stack inside it spaces the fields.
        </Text>
      </header>

      <Separator />

      <section {...stylex.props(styles.section)}>
        <div {...stylex.props(styles.intro)}>
          <Text render={HEADING_2} variant="titleLarge">
            Server errors
          </Text>
          <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
            Pass validationErrors, keyed by field name, to show what a server
            sent back under each field. The field needs nothing of its own: the
            message, the error colour and aria-invalid all follow from the form.
          </Text>
        </div>
        <div {...stylex.props(styles.sample)}>
          <Form
            aria-label="Server errors"
            onSubmit={stayOnPage}
            validationErrors={SERVER_ERRORS}
          >
            <Stack gap="md">
              <TextField
                defaultValue="Headline"
                label="Headline"
                name="headline"
              />
              <TextField
                defaultValue="Supporting line"
                description="Supporting line"
                label="Supporting line"
                name="supporting"
              />
              <div>
                <Button type="submit">Submit</Button>
              </div>
            </Stack>
          </Form>
        </div>
      </section>

      <Separator />

      <section {...stylex.props(styles.section)}>
        <div {...stylex.props(styles.intro)}>
          <Text render={HEADING_2} variant="titleLarge">
            Native validation
          </Text>
          <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
            By default a required field is marked for a screen reader and
            submission goes ahead, which is what a form validating on the server
            wants. With validationBehavior=&quot;native&quot; the browser holds
            the constraints instead: submitting with a required field empty
            focuses it and shows the browser&apos;s own message under it.
          </Text>
        </div>
        <div {...stylex.props(styles.columns)}>
          <Form aria-label="Default" onSubmit={stayOnPage}>
            <Stack gap="md">
              <TextField isRequired label="Required" name="required" />
              <Checkbox isRequired name="agree">
                Required
              </Checkbox>
              <div>
                <Button type="submit">Submit</Button>
              </div>
            </Stack>
          </Form>
          <Form
            aria-label="Native"
            onSubmit={stayOnPage}
            validationBehavior="native"
          >
            <Stack gap="md">
              <TextField isRequired label="Required" name="required" />
              <Checkbox isRequired name="agree">
                Required
              </Checkbox>
              <div>
                <Button type="submit">Submit</Button>
              </div>
            </Stack>
          </Form>
        </div>
      </section>
    </div>
  ),
}

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

export { Default, NativeValidation, Overview, ServerErrors }

export default meta
