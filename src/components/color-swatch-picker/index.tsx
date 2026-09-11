import type { ReactNode } from 'react'
import type {
  ColorSwatchPickerItemProps as RACColorSwatchPickerItemProps,
  ColorSwatchPickerProps as RACColorSwatchPickerProps,
} from 'react-aria-components'

import * as stylex from '@stylexjs/stylex'
import {
  ColorSwatchPicker as RACColorSwatchPicker,
  ColorSwatchPickerItem as RACColorSwatchPickerItem,
} from 'react-aria-components'

import { mergeStatefulStyles } from '../../styles/merge'
import {
  colors,
  radii,
  spacing,
  stateLayerOpacity,
} from '../../tokens/design.tokens.stylex'
import ColorSwatch from '../color-swatch'

// A row of colours to choose one from. React Aria makes it a listbox of
// swatches, so it is a selection control rather than a palette: arrow keys
// move between colours and one of them is selected.
//
// The design carries no page for this either, so what an item looks like
// when it is chosen is the library's own. Three choices, each with its
// reason.
//
// **Selection is a ring around the swatch, not a mark on it.** A tick drawn
// over a colour has to be readable against every colour in the row, which no
// single ink is; a ring sits outside the swatch and needs only to read
// against the surface behind it.
//
// **The ring is the primary role, and offset.** It is the same weight and
// colour the focus ring takes elsewhere, one step out from the swatch so the
// colour stays whole — a ring drawn on the swatch would eat two pixels of
// the thing being chosen.
//
// **Focus and selection are drawn at different offsets.** A focused
// selected swatch would otherwise paint one ring over the other and lose
// whichever came second, so the focus ring sits outside the selection one.

const styles = stylex.create({
  // The item a swatch sits in. It carries no colour of its own — the rings
  // are all it draws.
  item: {
    borderRadius: radii.xs,
    boxSizing: 'border-box',
    cursor: 'pointer',
    display: 'inline-flex',
    outlineColor: colors.primary,
    outlineOffset: '2px',
    outlineStyle: 'none',
    outlineWidth: '2px',
  },
  itemDisabled: {
    cursor: 'default',
    opacity: stateLayerOpacity.disabledContent,
  },
  // Outside the selection ring, so a swatch that is both keeps both.
  itemFocused: {
    outlineColor: colors.primary,
    outlineOffset: '6px',
    outlineStyle: 'solid',
  },
  itemSelected: {
    outlineOffset: '2px',
    outlineStyle: 'solid',
  },
  // Wraps, so a long palette becomes rows rather than a scrollbar.
  picker: {
    boxSizing: 'border-box',
    display: 'flex',
    flexWrap: 'wrap',
    gap: spacing.sm,
    outlineStyle: 'none',
  },
})

type ColorSwatchPickerItemProps = Omit<
  RACColorSwatchPickerItemProps,
  'children' | 'className' | 'style'
> & {
  /** What the item draws. A `ColorSwatch` with no `color` of its own by default. */
  children?: ReactNode
  /** A function may compute the class from the item's render state. */
  className?: RACColorSwatchPickerItemProps['className']
  /** A function may compute the style from the item's render state. */
  style?: RACColorSwatchPickerItemProps['style']
}

type ColorSwatchPickerProps = Omit<
  RACColorSwatchPickerProps,
  'className' | 'style'
> & {
  /** A function may compute the class from the picker's render state. */
  className?: RACColorSwatchPickerProps['className']
  /** A function may compute the style from the picker's render state. */
  style?: RACColorSwatchPickerProps['style']
}

/**
 * A row of colours to choose one from, drawn as swatches. The value is React
 * Aria's — pass `value` with `onChange` to control it, or `defaultValue` —
 * as a CSS colour string or a `Color` from `parseColor`, which this package
 * re-exports.
 *
 * ```tsx
 * <ColorSwatchPicker defaultValue="#6750A4">
 *   <ColorSwatchPicker.Item color="#6750A4" />
 *   <ColorSwatchPicker.Item color="#625B71" />
 * </ColorSwatchPicker>
 * ```
 *
 * It is a listbox, so arrow keys move between colours and the chosen one
 * carries a ring. Name it with `aria-label` or `aria-labelledby`; React Aria
 * calls it "Color swatches" otherwise.
 *
 * The call site's `className` and `style` land on the picker, which is the
 * element a layout positions.
 */
function ColorSwatchPicker(props: ColorSwatchPickerProps) {
  return (
    <RACColorSwatchPicker
      {...props}
      {...mergeStatefulStyles(stylex.props(styles.picker), props)}
    />
  )
}

/**
 * One swatch in a {@link ColorSwatchPicker}. Renders a `ColorSwatch` of its
 * own `color` unless given different children.
 */
function ColorSwatchPickerItem({
  children,
  ...props
}: ColorSwatchPickerItemProps) {
  return (
    <RACColorSwatchPickerItem {...props} className={itemClassName}>
      {children ?? <ColorSwatch />}
    </RACColorSwatchPickerItem>
  )
}

// The item's classes, from React Aria's render state. StyleX cannot target
// `[data-selected]` on the element it is styling, so the state comes from
// what React Aria hands the className.
//
// The order matters. `focused` is applied after `selected`, and StyleX
// replaces a property whole, so a swatch that is both takes the focus ring's
// outer offset — which is what keeps the two rings from landing on each
// other. `disabled` is last, so it takes the cursor with it.
function itemClassName(state: {
  isDisabled: boolean
  isFocusVisible: boolean
  isSelected: boolean
}) {
  return (
    stylex.props(
      styles.item,
      state.isSelected && styles.itemSelected,
      state.isFocusVisible && styles.itemFocused,
      state.isDisabled && styles.itemDisabled,
    ).className ?? ''
  )
}

ColorSwatchPicker.Item = ColorSwatchPickerItem

export type { ColorSwatchPickerItemProps, ColorSwatchPickerProps }

export default ColorSwatchPicker
