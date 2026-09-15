import * as stylex from '@stylexjs/stylex'

import {
  colors,
  media,
  spacing,
  stateLayerOpacity,
} from '../tokens/design.tokens.stylex'
import { focus } from './focus'
import { iconButton } from './icon-button'

// What a date picker and a date range picker draw in common: the line the
// segments and the trigger share, the trigger itself, and the surface the
// calendar opens on. Both put the same three on screen, and the breakpoint
// swap below is why they are here rather than written twice — a docked
// picker and a range picker that disagreed about where the modal sits would
// be two bugs rather than one.
//
// In `src/styles` rather than a `src/picker` of its own, since this is
// styles more than one component draws, which is what that directory holds.
// Geometry belonging to one picker alone stays with that picker.

const picker = stylex.create({
  // The segments and the trigger on one line, which is what makes them read
  // as a single field. A range puts two segment groups and a dash on that
  // line, so what separates them is the dash rather than the gap alone.
  group: {
    alignItems: 'center',
    boxSizing: 'border-box',
    display: 'flex',
    gap: spacing.sm,
    inlineSize: '100%',
    outlineStyle: 'none',
  },
  // The calendar's surface. Docked to the field above the breakpoint; below
  // it, centred in the viewport with room around it, which is what the
  // page's modal picker is.
  popover: {
    insetBlockStart: { default: 'auto', [media.belowMedium]: '50%' },
    insetInlineStart: { default: 'auto', [media.belowMedium]: '50%' },
    maxInlineSize: {
      default: 'none',
      [media.belowMedium]: 'calc(100vw - 32px)',
    },
    position: { default: 'absolute', [media.belowMedium]: 'fixed' },
    transform: {
      default: 'none',
      [media.belowMedium]: 'translate(-50%, -50%)',
    },
  },
  // The disabled trigger takes the same 38% the segments beside it take, so
  // one disabled field fades as a whole. StyleX replaces a property whole,
  // which is what lets this drop the hover and pressed branches rather than
  // having to restate each as `transparent`.
  triggerDisabled: {
    backgroundColor: 'transparent',
    color: `color-mix(in srgb, ${colors.onSurface} calc(${stateLayerOpacity.disabledContent} * 100%), transparent)`,
    cursor: 'default',
  },
  triggerGlyph: {
    blockSize: '24px',
    inlineSize: '24px',
  },
})

// The trigger's classes, from React Aria's own render state. A picker's
// trigger is disabled by the field around it rather than by a prop of its
// own, so the fade comes off the state React Aria hands the className.
function triggerClassName(state: { isDisabled: boolean }) {
  return (
    stylex.props(
      iconButton.chrome,
      focus.ring,
      state.isDisabled && picker.triggerDisabled,
    ).className ?? ''
  )
}

export { picker, triggerClassName }
