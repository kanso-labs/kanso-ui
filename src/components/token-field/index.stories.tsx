import type { Meta, StoryObj } from '@storybook/react-vite'

import * as stylex from '@stylexjs/stylex'
import { useState } from 'react'
import { TokenFieldValue } from 'react-aria-components'

import TokenField from '.'
import { spacing } from '../../tokens/design.tokens.stylex'
import Separator from '../separator'
import Text from '../text'

// See avatar/index.stories.tsx for why the overview is built from the
// library's own components, why its sections are divided by a rule, and why
// the headings go through Text's `render`.
// oxlint-disable-next-line jsx-a11y/heading-has-content -- filled by useRender
const HEADING_1 = <h1 />
// oxlint-disable-next-line jsx-a11y/heading-has-content -- filled by useRender
const HEADING_2 = <h2 />
const PARAGRAPH = <p />

// What counts as a token is the call site's, which is what subclassing the
// value is for: here, a word beginning with a hash.
class TaggedValue extends TokenFieldValue {
  protected override tokenize(text: string) {
    return text
      .split(/(#[\w-]+)/u)
      .filter((part) => part.length > 0)
      .map((part) =>
        part.startsWith('#')
          ? ({ text: part, type: 'token' } as const)
          : ({ text: part, type: 'text' } as const),
      )
  }
}

const EMPTY = new TokenFieldValue([])
const TAGGED = new TaggedValue([
  { text: '#first', type: 'token' },
  { text: ' and ', type: 'text' },
  { text: '#second', type: 'token' },
])

const styles = stylex.create({
  column: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.xl,
    maxInlineSize: '420px',
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
  width: {
    inlineSize: '420px',
  },
})

// A field that actually tokenises as it is typed, since that is the one thing
// a static story cannot show.
function Editable() {
  const [value, setValue] = useState<TokenFieldValue>(
    () => new TaggedValue([{ text: 'Type a #tag', type: 'text' }]),
  )

  return <TokenField label="Tags" onChange={setValue} value={value} />
}

const meta = {
  args: {
    defaultValue: TAGGED,
    label: 'Label',
  },
  component: TokenField,
  title: 'Components/TokenField',
} satisfies Meta<typeof TokenField>

type Story = StoryObj<typeof meta>

const Overview: Story = {
  render: () => (
    <div {...stylex.props(styles.page)}>
      <header {...stylex.props(styles.header)}>
        <Text render={HEADING_1} variant="displaySmall">
          TokenField
        </Text>
        <Text render={PARAGRAPH} tone="muted" variant="bodyLarge">
          A labelled field whose value is text with inline tokens.
        </Text>
      </header>

      <Separator />

      <section {...stylex.props(styles.section)}>
        <div {...stylex.props(styles.intro)}>
          <Text render={HEADING_2} variant="titleLarge">
            Tokens in a field
          </Text>
          <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
            The box is the same one every other field draws and the pill is the
            same one Chip and ChipGroup draw. What counts as a token is the call
            site&apos;s: subclass TokenFieldValue and override tokenize. Here a
            word beginning with a hash becomes one.
          </Text>
        </div>
        <div {...stylex.props(styles.column)}>
          <Editable />
          <TokenField defaultValue={TAGGED} label="Label" variant="outlined" />
        </div>
      </section>

      <Separator />

      <section {...stylex.props(styles.section)}>
        <div {...stylex.props(styles.intro)}>
          <Text render={HEADING_2} variant="titleLarge">
            Supporting text and errors
          </Text>
          <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
            A description sits under the box; an error replaces it and turns the
            underline and the label to the error role, the same way every other
            field reports one.
          </Text>
        </div>
        <div {...stylex.props(styles.column)}>
          <TokenField
            defaultValue={TAGGED}
            description="Supporting line"
            label="Label"
          />
          <TokenField
            defaultValue={TAGGED}
            error="Add at least one tag"
            label="Label"
          />
          <TokenField defaultValue={EMPTY} isDisabled label="Label" />
        </div>
      </section>
    </div>
  ),
}

const Default: Story = {
  render: (args) => (
    <div {...stylex.props(styles.width)}>
      <TokenField {...args} />
    </div>
  ),
}

const Empty: Story = {
  args: { defaultValue: EMPTY },
  render: Default.render,
}

const Outlined: Story = {
  args: { variant: 'outlined' },
  render: Default.render,
}

const WithDescription: Story = {
  args: { description: 'Supporting line' },
  render: Default.render,
}

const Invalid: Story = {
  args: { error: 'Add at least one tag' },
  render: Default.render,
}

const Disabled: Story = {
  args: { isDisabled: true },
  render: Default.render,
}

export {
  Default,
  Disabled,
  Empty,
  Invalid,
  Outlined,
  Overview,
  WithDescription,
}

export default meta
