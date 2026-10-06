'use client'

import type { ReactNode, RefAttributes } from 'react'
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
// **Focus and selection are drawn by different properties.** An element has
// one outline, so with both drawn in it the second replaced the first, and a
// keyboard arrowing onto the chosen colour saw a swatch that looked
// unchosen. The focus ring is the item's outline, 6px out; the selection
// ring is a border on a box laid 2px around the swatch, inside it. Both are
// properties forced colours keep, which a box shadow is not.
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
  // are all it draws: focus as its outline, and selection, hover and press
  // as the border of the box after it, 2px wide with 2px clear of the
  // swatch. That box draws nothing at rest, by style rather than by a
  // transparent colour, which forced colours would paint in.
  //
  // The box's corner follows the swatch's 4px further out, as an outline's
  // does, and stays square where a scheme squares the swatch: `min()` adds
  // nothing to a corner of 0.
  item: {
    '::after': {
      borderRadius: `calc(${radii.xs} + min(${radii.xs}, 4px))`,
      borderStyle: 'none',
      borderWidth: '2px',
      boxSizing: 'border-box',
      content: '""',
      inset: '-4px',
      pointerEvents: 'none',
      position: 'absolute',
    },
    borderRadius: radii.xs,
    boxSizing: 'border-box',
    cursor: 'pointer',
    display: 'inline-flex',
    outlineStyle: 'none',
    position: 'relative',
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
    outlineWidth: '2px',
  },
  // An unselected swatch under the pointer. See the fourth choice above.
  itemHovered: {
    '::after': {
      borderColor: colors.outlineVariant,
      borderStyle: { default: 'solid', [FORCED_COLORS]: 'dashed' },
    },
  },
  // The same ring, a step stronger, while a touch or a pen holds the swatch
  // and it is not yet chosen.
  itemPressed: {
    '::after': {
      borderColor: colors.outline,
      borderStyle: { default: 'solid', [FORCED_COLORS]: 'dashed' },
    },
  },
  // Applied after the hover and press rings, which draw on the same border,
  // so a chosen swatch keeps the ring that says so.
  itemSelected: {
    '::after': {
      borderColor: colors.primary,
      borderStyle: 'solid',
    },
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
function ColorSwatchPicker(
  props: ColorSwatchPickerProps & RefAttributes<HTMLDivElement>,
) {
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
// The order matters where two styles draw on one property. The hover and
// press rings come before `selected`, which draws on the same border, so a
// chosen swatch keeps the ring that says so. `focused` draws on the outline,
// which nothing else touches, so a swatch that is chosen and focused keeps
// both. `disabled` is last, so it takes the cursor with it; React Aria
// reports neither hover nor press on one.
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
