import type { Meta, StoryObj } from '@storybook/react-vite'

import * as stylex from '@stylexjs/stylex'
import { expect, waitFor } from 'storybook/test'

import CopyField from '.'

const VALUE = 'first.second.third'
const LONG_VALUE = 'registry.example/first-second/a-long-unbroken-name'

const styles = stylex.create({
  // Narrower than the value, so the wrap is actually visible rather than
  // merely asserted.
  narrow: {
    maxInlineSize: '300px',
  },
})

const meta = {
  args: {
    value: VALUE,
  },
  component: CopyField,
  title: 'Components/CopyField',
} satisfies Meta<typeof CopyField>

type Story = StoryObj<typeof meta>

const Default: Story = {}

// Its own story because a value with nothing to break at wraps inside the
// field rather than pushing the button out of it, and it only does so where
// the field is narrower than the value.
const LongValue: Story = {
  args: {
    value: LONG_VALUE,
  },
  render: (args) => (
    <div {...stylex.props(styles.narrow)}>
      <CopyField {...args} />
    </div>
  ),
}

// The dwell runs on the document's own clock here, which is the one thing
// index.test.tsx cannot check: every assertion there advances a fake timer, so
// a component that scheduled nothing at all would still pass. This proves the
// timer is really set and really fires.
//
// The clipboard is still stood in for. Its permission is not something a story
// can grant, and it is not what this story is about — the real clock is.
//
// Hidden from the sidebar and from Chromatic, since it documents nothing a
// reader would want to look at and its snapshot would land mid-dwell.
const Copied: Story = {
  parameters: {
    chromatic: { disableSnapshot: true },
  },
  play: async ({ canvas, userEvent }) => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: async () => {} },
    })

    // Found by name rather than read off `textContent`: both labels sit in
    // the DOM so the button keeps its width, and only the accessible name
    // tells the one on show from the one holding the room.
    const button = canvas.getByRole('button')
    await expect(canvas.getByRole('button', { name: 'Copy' })).toBe(button)

    await userEvent.click(button)
    await waitFor(async () => {
      await expect(canvas.getByRole('button', { name: 'Copied' })).toBe(button)
    })

    // No timer is advanced. This waits out the real dwell.
    await waitFor(
      async () => {
        await expect(canvas.getByRole('button', { name: 'Copy' })).toBe(button)
      },
      { timeout: 5000 },
    )
  },
  tags: ['!autodocs', '!dev'],
}

// Under a right-to-left locale, with a value whose ends are neutral
// characters. The value keeps its own left-to-right order, so the field shows
// the string it copies, and still sits at the row's inline start. Pinned to
// Arabic through `globals`, which the locale toolbar cannot override.
const RightToLeft: Story = {
  args: { value: '/usr/local/bin' },
  globals: { locale: 'ar-EG' },
}

export { Copied, Default, LongValue, RightToLeft }

export default meta
