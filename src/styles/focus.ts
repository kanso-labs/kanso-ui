import * as stylex from '@stylexjs/stylex'

import { colors } from '../tokens/design.tokens.stylex'

// The focus ring, drawn once. Eighteen components spelled the same four
// declarations out, which made a change to the ring eighteen edits with
// nothing failing if one were missed.
//
// It is Material Design's focus indicator: 3dp thick, in the secondary role,
// 2dp outside the element it marks.
//
// Only these two forms are shared, and the difference is who decides the
// element has focus. `ring` lets the browser decide, through
// `:focus-visible`, which is what a natively focusable element wants.
// `ringVisible` is always solid, for a component that computes focus from
// React Aria's render state and applies this style only when that state says
// so — a checkbox, radio or switch, where the ring belongs on the drawn
// control rather than on the input that actually holds focus.
//
// What deliberately stays with its component is every ring that differs, and
// each of those already carries a comment saying why. Each still draws the
// 3dp width, apart from the one bullet below that is about the width, and
// the secondary role wherever its reason leaves the colour free:
//
// - A different colour, because the surface underneath is not the default
//   one: Snackbar's action and close, and Chip's remove.
// - A different colour, because the spec gives the component its own focus
//   indicator: Card, in secondary or on surface by variant.
// - A negative offset of the ring's own width, drawing it inside the element
//   rather than around it, flush with its edge: DropZone, NumberField,
//   Table, a Tab and its panel, the shared row, an empty collection, the
//   body of a Dialog or a Sheet while it scrolls, and a bottom sheet's drag
//   handle. Snackbar's is further in, at 4px.
// - An offset of its own, sized to what the ring surrounds: the colour
//   thumb at 4px, the swatch at 6px, Chip's remove at 1px.
// - A lighter width, 2px, for a ring that has to read as a different mark
//   from a heavier one beside it once forced colours take both their
//   colours: the swatch, whose selection ring is 3px.
// - A base of `outlineStyle: 'none'` that a separate style turns solid,
//   which is a different mechanism rather than a different value: the slider
//   thumb and the shared colour styles.
// - An `outlineStyle` keyed on a breakpoint, for a ring that moves from one
//   element to another as the window widens: a navigation bar's destination.
// - Drawn by the element around the one holding focus, keyed on `:has()`,
//   for a focused element whose own edge is not the boundary a reader sees:
//   a Popover's dialog, inset inside its panel.
//
// The field chrome's box and SearchField's bar draw no ring outside forced
// colours, and that is not a departure from this one. Their input holds
// focus, and what marks it is the text field page's own focused state — the
// active indicator, drawn as a shadow inside the box under `:focus-within` —
// which follows that page's thickness and its primary role rather than the
// focus indicator's. Under forced colours, where the shadow is gone, each
// draws an outline at this ring's width and offset instead.
const focus = stylex.create({
  ring: {
    outlineColor: colors.secondary,
    outlineOffset: '2px',
    outlineStyle: { ':focus-visible': 'solid', default: 'none' },
    outlineWidth: '3px',
  },
  ringVisible: {
    outlineColor: colors.secondary,
    outlineOffset: '2px',
    outlineStyle: 'solid',
    outlineWidth: '3px',
  },
})

export { focus }
