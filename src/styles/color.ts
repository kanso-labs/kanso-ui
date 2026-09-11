import type { ColorThumbRenderProps } from 'react-aria-components'

import * as stylex from '@stylexjs/stylex'

import { colors, motion, radii, shadows } from '../tokens/design.tokens.stylex'

// The handle a colour slider and a colour area share. React Aria places it —
// along one axis on a slider, along two in an area — and fills it with the
// colour at that point, so everything here is the ring around that fill.
//
// In `src/styles` rather than a directory of its own, since it is a style
// more than one component draws, which is what that directory holds.
//
// Two things about it are worth knowing.
//
// **It is ringed rather than filled, because its fill is the value.** The
// ring is what has to read — against every colour the track or the plane
// runs through — so it is a surface-coloured ring with a hairline outside
// it, which works on a light ground and a dark one alike.
//
// **`dragging` is applied after `focused`.** StyleX replaces a property
// whole, so a handle being dragged takes the lifted shadow rather than
// keeping the resting ring under it.

const colorThumb = stylex.create({
  thumb: {
    blockSize: '20px',
    borderRadius: radii.full,
    boxShadow: `0 0 0 2px ${colors.surface}, 0 0 0 3px ${colors.outline}`,
    boxSizing: 'border-box',
    cursor: 'grab',
    inlineSize: '20px',
    // A slider moves the handle along one axis and leaves the other, so this
    // is what centres it across the strip. An area sets both axes inline,
    // where it wins over a class, so carrying this costs it nothing.
    insetBlockStart: '50%',
    outlineColor: colors.primary,
    outlineOffset: '4px',
    outlineStyle: 'none',
    outlineWidth: '2px',
    transitionDuration: motion.durationShort2,
    transitionProperty: 'box-shadow',
    transitionTimingFunction: motion.easingStandard,
  },
  thumbDisabled: {
    cursor: 'not-allowed',
  },
  thumbDragging: {
    boxShadow: `0 0 0 2px ${colors.surface}, 0 0 0 3px ${colors.outline}, ${shadows.elevation2}`,
    cursor: 'grabbing',
  },
  thumbFocused: {
    outlineStyle: 'solid',
  },
})

// The handle's classes, from React Aria's render state. StyleX cannot target
// `[data-dragging]` on the element it is styling, so the state comes from
// what React Aria hands the className.
function thumbClassName(state: ColorThumbRenderProps) {
  return (
    stylex.props(
      colorThumb.thumb,
      state.isFocusVisible && colorThumb.thumbFocused,
      state.isDragging && colorThumb.thumbDragging,
      state.isDisabled && colorThumb.thumbDisabled,
    ).className ?? ''
  )
}

export { colorThumb, thumbClassName }
