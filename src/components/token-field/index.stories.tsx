import type { Meta, StoryObj } from '@storybook/react-vite'

import * as stylex from '@stylexjs/stylex'
import { useState } from 'react'
import { TokenFieldValue } from 'react-aria-components'
import { expect, waitFor } from 'storybook/test'

import TokenField from '.'
import { typography } from '../../tokens/design.tokens.stylex'

// The class StyleX hashes for the floated label's own size, which is the
// observable signal that the box considers the field populated — the same
// probe index.test.tsx reads, since the hash is a pure function of the
// declaration rather than of where it was written.
const probeStyles = stylex.create({
  floated: { fontSize: typography.bodySmallSize },
})

const floatedClassNames = (stylex.props(probeStyles.floated).className ?? '')
  .split(' ')
  .filter(Boolean)

// What counts as a token is the call site's, which is what subclassing the
// value is for: here, a word beginning with a hash, once a space after it
// says it is finished. The value is tokenised on every key, so a tag with
// nothing after it is one still being typed: without the space it became a
// pill at its first letter, `#a`, and the rest was left as text after it.
//
// A token is a part the pattern matched, which `split` puts at the odd
// indices, rather than any part that starts with a hash: a lone `#`, or a
// tag not yet finished, starts with one too and is still text.
class TaggedValue extends TokenFieldValue {
  protected override tokenize(text: string) {
    return text
      .split(/(#[\w-]+)(?=\s)/u)
      .map((part, index) =>
        index % 2 === 1
          ? ({ text: part, type: 'token' } as const)
          : ({ text: part, type: 'text' } as const),
      )
      .filter((segment) => segment.text.length > 0)
  }
}

// A token, as React Aria draws it: the one element inside the editable area
// the caret cannot enter.
const TOKEN = '[contenteditable="false"]'

function isFloated(label: HTMLElement) {
  // The length check matters: `[].every()` is vacuously true, so an empty
  // class list would report "floated" unconditionally.
  return (
    floatedClassNames.length > 0 &&
    floatedClassNames.every((name) => label.classList.contains(name))
  )
}

// The zero-width space React Aria pads either side of a token with, so the
// caret has somewhere to land beside it.
const CARET_PADDING = /\u200B/gu

/** The field's text outside its tokens, without the caret's padding. */
function looseTextIn(box: HTMLElement) {
  const copy = box.cloneNode(true)
  if (!(copy instanceof HTMLElement)) {
    return ''
  }
  for (const token of copy.querySelectorAll(TOKEN)) {
    token.remove()
  }
  return copy.textContent.replaceAll(CARET_PADDING, '').trim()
}

/** The text of each token in the field, in order. */
function tokensIn(box: HTMLElement) {
  return [...box.querySelectorAll(TOKEN)].map((token) => token.textContent)
}

const EMPTY = new TokenFieldValue([])
const TAGGED = new TaggedValue([
  { text: '#first', type: 'token' },
  { text: ' and ', type: 'text' },
  { text: '#second', type: 'token' },
])

const styles = stylex.create({
  // A field fills its container, so the samples need a width to fill. A cap
  // rather than a fixed width, so a phone-sized window narrows it rather
  // than scrolling sideways.
  width: {
    inlineSize: '100%',
    maxInlineSize: '420px',
  },
})

// A field that actually tokenises as it is typed, since that is the one thing
// a static story cannot show. It starts empty, so there is nothing to delete
// before typing, and its supporting line says how a tag is finished.
function Editable() {
  const [value, setValue] = useState<TokenFieldValue>(() => new TaggedValue([]))

  return (
    <TokenField
      description="End a #tag with a space"
      label="Tags"
      onChange={setValue}
      value={value}
    />
  )
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

// Type a word beginning with a hash, then a space, and it becomes a token. The
// box is the one every other field draws and the pill is the one Chip and
// ChipGroup draw; what counts as a token is the call site's, through the
// TaggedValue above.
//
// Its `play` types a tag a key at a time and checks it stays text until a
// space finishes it, then becomes one pill. A genuine key press, for the
// reason `Typed` below gives: nothing short of one moves this field's value.
const Editing: Story = {
  play: async ({ canvas, step, userEvent }) => {
    const box = canvas.getByRole('textbox', { name: 'Tags' })

    await step('type a tag, a key at a time', async () => {
      await userEvent.click(box)
      await userEvent.keyboard('#alpha')
    })

    await expect(tokensIn(box)).toEqual([])

    await step('finish it with a space', async () => {
      await userEvent.keyboard(' ')
    })

    await waitFor(async () => {
      await expect(tokensIn(box)).toEqual(['#alpha'])
    })
    await expect(looseTextIn(box)).toBe('')
  },
  render: () => (
    <div {...stylex.props(styles.width)}>
      <Editable />
    </div>
  ),
}

// The floating label, driven by real typing rather than by a prop. It is here
// and not in index.test.tsx because nothing else moves this component's
// value: React Aria drives it from the target ranges on a `beforeinput`, so a
// dispatched event changes nothing and `execCommand` edits the DOM without
// the state hearing of it. Only a genuine key press does — and a genuine key
// press is a page-level resource, which under the unit project's parallel run
// timed out rather than failing, the same pathology this suite documents for
// media emulation.
//
// Both readings are taken with focus elsewhere, which is the whole point: the
// box floats its label while focus is within it, so a field checked while
// still focused floats whatever it holds.
//
// A test rather than documentation, so it is kept out of the sidebar the way
// button's `Pressed` is — `!dev` subtracts the tag the sidebar filters on and
// leaves `test`, and Chromatic is told separately since it reads the index.
// `Empty` already covers this field visually.
const Typed: Story = {
  args: { defaultValue: EMPTY },
  parameters: {
    chromatic: { disableSnapshot: true },
  },
  play: async ({ canvas, step, userEvent }) => {
    const label = canvas.getByText('Label')
    const box = canvas.getByRole('textbox', { name: 'Label' })

    await expect(isFloated(label)).toBe(false)

    // One character, so the backspace below is a whole round trip rather than
    // a partial deletion — a token would go in one press and plain text a
    // character at a time, and the two need not agree.
    await step('type into it, then leave', async () => {
      await userEvent.click(box)
      await userEvent.keyboard('a')
      await userEvent.tab()
    })

    await waitFor(async () => {
      await expect(isFloated(label)).toBe(true)
    })

    await step('take it back out, then leave again', async () => {
      await userEvent.click(box)
      await userEvent.keyboard('{Backspace}')
      await userEvent.tab()
    })

    await waitFor(async () => {
      await expect(isFloated(label)).toBe(false)
    })
  },
  render: Default.render,
  tags: ['!autodocs', '!dev'],
}

export {
  Default,
  Disabled,
  Editing,
  Empty,
  Invalid,
  Outlined,
  Typed,
  WithDescription,
}

export default meta
