import type { Meta, StoryObj } from '@storybook/react-vite'

import * as stylex from '@stylexjs/stylex'

import TextField from '.'
import { CloseGlyph, SearchGlyph } from '../../glyphs'
import { spacing } from '../../tokens/design.tokens.stylex'

const styles = stylex.create({
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
const TRAILING_ICON = <CloseGlyph {...stylex.props(styles.icon)} />

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

const WithIcons: Story = {
  args: {
    leadingIcon: LEADING_ICON,
    trailingIcon: TRAILING_ICON,
  },
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
      <TextField
        defaultValue="Value"
        label={LONG_LABEL}
        trailingIcon={TRAILING_ICON}
      />
      <TextField defaultValue="" label={LONG_LABEL} variant="outlined" />
      <TextField
        defaultValue="Value"
        label={LONG_LABEL}
        trailingIcon={TRAILING_ICON}
        variant="outlined"
      />
    </div>
  ),
}

export {
  Default,
  Disabled,
  Empty,
  FixedLabel,
  LongLabels,
  Numeric,
  Outlined,
  OutlinedEmpty,
  WithCharacterCount,
  WithDescription,
  WithError,
  WithIcons,
  WithPrefixAndSuffix,
}

export default meta
