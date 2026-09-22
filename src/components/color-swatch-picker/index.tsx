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
//
// **Hover and press are a ring too, in the slot selection would take.** Every
// other interactive element here answers the pointer with a state layer, but
// a state layer is a fill and a swatch's fill is the colour being chosen:
// behind it the tint is hidden, over it the tint changes the colour. So an
// unselected swatch under the pointer takes a ring at the selection ring's
// offset, drawn in the outline roles rather than primary so it cannot be read
// as chosen — outline variant while a pointer is over it, and outline while a
// touch or a pen holds it. Those are the only presses anyone sees: React Aria
// chooses a swatch the moment a mouse or a key presses it, and on release for
// a touch, so that press is the one a reader waits through before the swatch
// is theirs. Under forced colours both roles become one system colour, so the
// ring turns dashed there, where the selection ring stays solid.

const FORCED_COLORS = '@media (forced-colors: active)'

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
  // An unselected swatch under the pointer. See the fourth choice above.
  itemHovered: {
    outlineColor: colors.outlineVariant,
    outlineOffset: '2px',
    outlineStyle: { default: 'solid', [FORCED_COLORS]: 'dashed' },
  },
  // The same ring, a step stronger, while a touch or a pen holds the swatch
  // and it is not yet chosen.
  itemPressed: {
    outlineColor: colors.outline,
    outlineOffset: '2px',
    outlineStyle: { default: 'solid', [FORCED_COLORS]: 'dashed' },
  },
  // Primary is stated again rather than left to `item`, since the hover
  // styles set a colour of their own and come before this one.
  itemSelected: {
    outlineColor: colors.primary,
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
    <RACColorSwatchPickerItem
      {...props}
      {...mergeStatefulStyles(itemStyles, props)}
    >
      {children ?? <ColorSwatch />}
    </RACColorSwatchPickerItem>
  )
}

// The item's styles, from React Aria's render state. StyleX cannot target
// `[data-selected]` on the element it is styling, so the state comes from
// what React Aria hands the className.
//
// The order matters. `focused` is applied after `selected`, and StyleX
// replaces a property whole, so a swatch that is both takes the focus ring's
// outer offset — which is what keeps the two rings from landing on each
// other. The hover and press rings come before both, so a chosen or focused
// swatch keeps the ring that says so. `disabled` is last, so it takes the
// cursor with it; React Aria reports neither hover nor press on one.
function itemStyles(state: {
  isDisabled: boolean
  isFocusVisible: boolean
  isHovered: boolean
  isPressed: boolean
  isSelected: boolean
}) {
  return stylex.props(
    styles.item,
    state.isHovered && styles.itemHovered,
    state.isPressed && styles.itemPressed,
    state.isSelected && styles.itemSelected,
    state.isFocusVisible && styles.itemFocused,
    state.isDisabled && styles.itemDisabled,
  )
}

ColorSwatchPicker.Item = ColorSwatchPickerItem

export type { ColorSwatchPickerItemProps, ColorSwatchPickerProps }

export default ColorSwatchPicker
