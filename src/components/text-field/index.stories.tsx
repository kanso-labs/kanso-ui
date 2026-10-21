import type { Meta, StoryObj } from '@storybook/react-vite'

import * as stylex from '@stylexjs/stylex'
import { useCallback, useState } from 'react'
import { expect } from 'storybook/test'

import TextField, { type TextFieldProps } from '.'
import { CloseGlyph, SearchGlyph } from '../../glyphs'
import { spacing } from '../../tokens/design.tokens.stylex'
import IconButton from '../icon-button'

const styles = stylex.create({
  // The button is 40px around its 24px icon, 8px more on each side than the
  // icon alone, so it reaches 8px into the gap before it and the padding
  // after it, and its icon lands where a bare trailing icon sits.
  clear: {
    marginInline: `calc(-1 * ${spacing.sm})`,
  },
  // A field fills its container, so the samples need a width to fill.
  columns: {
    display: 'grid',
    gap: spacing.lg,
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
  },
  // Sized in `em`, so the icon takes the slot's 24.
  icon: {
    blockSize: '1em',
    inlineSize: '1em',
  },
})

// The library's own glyphs stand in for an icon set, so the stories stay a
// demonstration of the field alone.
const LEADING_ICON = <SearchGlyph {...stylex.props(styles.icon)} />
const CLOSE_ICON = <CloseGlyph {...stylex.props(styles.icon)} />

// A field whose trailing icon is a control: an icon button that clears it.
// The field is controlled so the button can empty it, and the press hands
// focus back to the input, since the button it landed on is gone once the
// field is empty. The input is held in state rather than a ref, since the
// handler that reads it is handed to a call during render.
function ClearableField({
  defaultValue = '',
  ...props
}: Omit<TextFieldProps, 'onChange' | 'trailingIcon' | 'value'>) {
  const [value, setValue] = useState(defaultValue)
  const [input, setInput] = useState<HTMLInputElement | null>(null)
  const clear = useCallback(() => {
    setValue('')
    input?.focus()
  }, [input])

  return (
    <TextField
      {...props}
      inputRef={setInput}
      onChange={setValue}
      trailingIcon={clearButton(value, clear)}
      value={value}
    />
  )
}

// The clear button, while there is something to clear. Built by a call
// rather than written at the prop, which is what react-perf's
// no-jsx-as-prop is after.
function clearButton(value: string, clear: () => void) {
  return value === '' ? undefined : (
    <IconButton
      aria-label="Clear"
      onPress={clear}
      {...stylex.props(styles.clear)}
    >
      {CLOSE_ICON}
    </IconButton>
  )
}

const LONG_LABEL =
  'A label long enough that it has nowhere left to go on one line'

const meta = {
  args: {
    defaultValue: 'Value',
    label: 'Label',
  },
  component: TextField,
  title: 'Components/TextField',
} satisfies Meta<typeof TextField>

type Story = StoryObj<typeof meta>

const Default: Story = {}

// The resting label, which no populated story can show.
const Empty: Story = {
  args: {
    defaultValue: '',
  },
}

// The label held small at the top whatever the field holds.
const FixedLabel: Story = {
  args: {
    defaultValue: '',
    floatingLabel: false,
  },
}

const WithDescription: Story = {
  args: {
    description: 'Supporting line',
  },
}

// Its own story because the error state is three changes at once — the
// underline, the label, and the message that replaces the description.
const WithError: Story = {
  args: {
    defaultValue: '',
    description: 'Supporting line',
    error: 'Enter a value.',
  },
}

const Numeric: Story = {
  args: {
    defaultValue: '01234.56',
    numeric: true,
  },
}

// A negative value under a right-to-left locale. The value runs left to
// right, so the minus stays before the digits, and still sits at the line's
// start, its right edge. Pinned to Arabic through `globals`, which the locale
// toolbar cannot override.
const NumericRightToLeft: Story = {
  args: {
    defaultValue: '-01234.56',
    numeric: true,
  },
  globals: { locale: 'ar-EG' },
}

const Outlined: Story = {
  args: {
    variant: 'outlined',
  },
}

const OutlinedEmpty: Story = {
  args: {
    defaultValue: '',
    variant: 'outlined',
  },
}

// A leading icon, and a trailing one that is a control: an icon button that
// clears the field and hands focus back to the input.
const WithIcons: Story = {
  args: {
    leadingIcon: LEADING_ICON,
  },
  render: (args) => <ClearableField {...args} />,
}

// The clear button pressed: the field is empty, the button gone, and focus
// on the input. A check rather than a state to look at, since what it leaves
// is Empty's field focused, so it is kept out of the sidebar, the Overview
// page and Chromatic. It is a story because the button is the stories' own.
const Cleared: Story = {
  args: {
    leadingIcon: LEADING_ICON,
  },
  parameters: { chromatic: { disableSnapshot: true } },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Clear' }))
    const input = canvas.getByRole('textbox', { name: 'Label' })
    await expect(input).toHaveValue('')
    await expect(input).toHaveFocus()
    await expect(canvas.queryByRole('button')).toBeNull()
  },
  render: (args) => <ClearableField {...args} />,
  tags: ['!autodocs', '!dev'],
}

// A search input, which the browser would otherwise decorate with a clear
// button of its own, beside the trailing one.
const Search: Story = {
  args: {
    leadingIcon: LEADING_ICON,
    type: 'search',
  },
  render: (args) => <ClearableField {...args} />,
}

const WithPrefixAndSuffix: Story = {
  args: {
    prefix: 'Prefix',
    suffix: 'Suffix',
  },
}

const WithCharacterCount: Story = {
  args: {
    characterCount: true,
    description: 'Supporting line',
    maxLength: 20,
  },
}

const Disabled: Story = {
  args: {
    isDisabled: true,
  },
}

// A label is one line of the box, as the value is. One with no room ends in an
// ellipsis where the column does, before a trailing icon when there is one, and
// an outlined box opens its notch only as far as the label goes.
const LongLabels: Story = {
  render: () => (
    <div {...stylex.props(styles.columns)}>
      <TextField defaultValue="" label={LONG_LABEL} />
      <ClearableField defaultValue="Value" label={LONG_LABEL} />
      <TextField defaultValue="" label={LONG_LABEL} variant="outlined" />
      <ClearableField
        defaultValue="Value"
        label={LONG_LABEL}
        variant="outlined"
      />
    </div>
  ),
}

export {
  Cleared,
  Default,
  Disabled,
  Empty,
  FixedLabel,
  LongLabels,
  Numeric,
  NumericRightToLeft,
  Outlined,
  OutlinedEmpty,
  Search,
  WithCharacterCount,
  WithDescription,
  WithError,
  WithIcons,
  WithPrefixAndSuffix,
}

export default meta
