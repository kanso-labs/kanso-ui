import * as stylex from '@stylexjs/stylex'

import { colors } from '../tokens/design.tokens.stylex'

// The focus ring, drawn once. Eighteen components spelled the same four
// declarations out, which made a change to the ring eighteen edits with
// nothing failing if one were missed.
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
// each of those already carries a comment saying why:
//
// - A different colour, because the surface underneath is not the default
//   one: Snackbar's action and close, and Chip's remove.
// - A negative offset, drawing the ring inside the element rather than
//   around it: DropZone, NumberField, Table, a Tab, and the shared row.
// - An offset of its own, sized to what the ring surrounds: the colour
//   thumb at 4px, the swatch at 6px, Chip's remove at 1px.
// - A base of `outlineStyle: 'none'` that a separate style turns solid,
//   which is a different mechanism rather than a different value: the slider
//   thumb, the colour swatch picker, and the shared colour styles.
const focus = stylex.create({
  ring: {
    outlineColor: colors.primary,
    outlineOffset: '2px',
    outlineStyle: { ':focus-visible': 'solid', default: 'none' },
    outlineWidth: '2px',
  },
  ringVisible: {
    outlineColor: colors.primary,
    outlineOffset: '2px',
    outlineStyle: 'solid',
    outlineWidth: '2px',
  },
})

export { focus }
