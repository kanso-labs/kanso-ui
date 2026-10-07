import type { Meta, StoryObj } from '@storybook/react-vite'

import * as stylex from '@stylexjs/stylex'

import TextArea from '.'
import { CloseGlyph, SearchGlyph } from '../../glyphs'

const THREE_LINES = 'First line.\nSecond line.\nThird line.'
const FIVE_LINES = `${THREE_LINES}\nFourth line.\nFifth line.`

const styles = stylex.create({
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

const meta = {
  args: {
    defaultValue: THREE_LINES,
    label: 'Label',
  },
  component: TextArea,
  title: 'Components/TextArea',
} satisfies Meta<typeof TextArea>

type Story = StoryObj<typeof meta>

const Default: Story = {}

const Empty: Story = {
  args: {
    defaultValue: '',
  },
}

const FixedRows: Story = {
  args: {
    autosize: false,
    defaultValue: FIVE_LINES,
  },
}

const WithDescription: Story = {
  args: {
    description: 'Supporting line',
  },
}

const WithError: Story = {
  args: {
    error: 'Enter a value.',
  },
}

const Disabled: Story = {
  args: {
    isDisabled: true,
  },
}

const Outlined: Story = {
  args: {
    variant: 'outlined',
  },
}

const WithCharacterCount: Story = {
  args: {
    characterCount: true,
    maxLength: 200,
  },
}

const WithIcons: Story = {
  args: {
    leadingIcon: LEADING_ICON,
    trailingIcon: TRAILING_ICON,
  },
}

export {
  Default,
  Disabled,
  Empty,
  FixedRows,
  Outlined,
  WithCharacterCount,
  WithDescription,
  WithError,
  WithIcons,
}

export default meta
