import type { PopoverRenderProps } from 'react-aria-components'

import * as stylex from '@stylexjs/stylex'

import {
  colors,
  media,
  radii,
  shadows,
  spacing,
} from '../tokens/design.tokens.stylex'
import { focus } from './focus'
import { iconButton } from './icon-button'
import { overlay } from './overlay'

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

// The scrim a picker's surface casts below the breakpoint, as a spread shadow
// added to its elevation — see `popover`.
const SCRIM = `0 0 0 100vmax color-mix(in srgb, ${colors.scrim} 32%, transparent)`

const picker = stylex.create({
  // The date pickers' surface, over `popover`: the page's docked container,
  // surface container high at the large corner and level 3, which is the
  // modal picker's level too. It is the calendar's own fill and corner, so
  // the calendar inside it draws no second edge. Over the menu surface and
  // 12dp corner `popover` takes, the popover clipped the calendar at the
  // smaller corner and left a wedge of the other surface between the two
  // arcs at each one. The colour picker keeps `popover` as it is.
  datePopover: {
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: radii.lg,
    boxShadow: {
      default: shadows.elevation3,
      [media.belowMedium]: `${shadows.elevation3}, ${SCRIM}`,
    },
  },
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
  // it, centred in the window with room around it and over a scrim, which is
  // what the page's modal picker is — the date pickers page puts the picker
  // in a dialog on a compact window, and the dialogs page draws a dialog over
  // the scrim role at the 32% Sheet and Dialog paint.
  //
  // **React Aria places the surface with inline styles**, `position`, `left`,
  // `top` and `max-height` from where the field sits, and an inline style
  // beats any class. Below the breakpoint the four edges, the position and
  // the height cap therefore take `!important`, which is the one thing that
  // outranks them; above it this says nothing about any of them and React
  // Aria's placement stands. Pinned to every edge and given `margin: auto`,
  // a surface as wide and tall as its content sits in the middle whichever
  // way the text runs.
  //
  // Centring with a transform instead is how this used to be written, and
  // it could not work. React Aria sets no transform, so the class's
  // `translate(-50%, -50%)` applied on top of the anchored position and threw
  // the surface half its own size up and to the left, mostly off the screen;
  // and the entry animation drives `transform` itself, so for its length the
  // translate was replaced and the surface jumped when it ended.
  //
  // **The scrim is a shadow the surface casts, not an element of its own.**
  // React Aria already draws the full-window box a scrim would be — the
  // underlay that takes a press outside and closes the picker — but with an
  // inline style and no class, so nothing here can paint it. A fixed box
  // inside the surface would sit in the surface's own stacking context,
  // where even a negative `z-index` paints over the surface's fill, and the
  // entry animation's scale would place it against the surface while it ran.
  // A spread shadow is drawn outside the surface's own edge and no further
  // in, so it dims the page and leaves the surface whole. It fades in with
  // the surface and goes when the surface does, since no overlay here
  // animates out, and it takes no press, which is right: the underlay
  // beneath it already does.
  //
  // `100vmax` is the window's longer side, which is as far as any edge of the
  // window can be from any edge of the surface. Forced colours drops it, as
  // it drops the surface's own elevation.
  popover: {
    blockSize: { default: null, [media.belowMedium]: 'fit-content' },
    boxShadow: {
      default: shadows.elevation2,
      [media.belowMedium]: `${shadows.elevation2}, ${SCRIM}`,
    },
    inlineSize: { default: null, [media.belowMedium]: 'fit-content' },
    insetBlockEnd: { default: null, [media.belowMedium]: '0 !important' },
    insetBlockStart: { default: null, [media.belowMedium]: '0 !important' },
    insetInlineEnd: { default: null, [media.belowMedium]: '0 !important' },
    insetInlineStart: { default: null, [media.belowMedium]: '0 !important' },
    margin: { default: null, [media.belowMedium]: 'auto' },
    maxBlockSize: {
      default: null,
      [media.belowMedium]: `calc(100dvh - 2 * ${spacing.lg}) !important`,
    },
    maxInlineSize: {
      default: 'none',
      [media.belowMedium]: `calc(100vw - 2 * ${spacing.lg})`,
    },
    position: { default: null, [media.belowMedium]: 'fixed !important' },
  },
  triggerGlyph: {
    blockSize: '24px',
    inlineSize: '24px',
  },
})

// The origin the surface grows from, for the placement React Aria reports.
// Docked, it is the edge the surface is anchored by, as `popupOrigin` in
// overlay.ts gives every anchored overlay, and the two maps agree side for
// side. Below the breakpoint it is the surface's own centre, since there it
// sits in the middle of the window anchored to nothing. A map of its own
// rather than `popupOrigin` with a reset after it: StyleX resolves a property
// whole, so a later `transformOrigin` keyed on the breakpoint alone would
// drop the docked origin rather than add to it.
const origins = stylex.create({
  bottom: {
    transformOrigin: { default: 'top center', [media.belowMedium]: 'center' },
  },
  left: {
    transformOrigin: { default: 'right center', [media.belowMedium]: 'center' },
  },
  right: {
    transformOrigin: { default: 'left center', [media.belowMedium]: 'center' },
  },
  top: {
    transformOrigin: {
      default: 'bottom center',
      [media.belowMedium]: 'center',
    },
  },
})

// The date pickers' surface, the same with the calendar's fill and corner.
function datePopoverClassName(state: PopoverRenderProps) {
  return (
    stylex.props(
      overlay.popup,
      picker.popover,
      picker.datePopover,
      originOf(state.placement),
    ).className ?? ''
  )
}

function originOf(placement: PopoverRenderProps['placement']) {
  return placement === null || placement === 'center'
    ? origins.bottom
    : origins[placement]
}

// The colour picker's surface, from React Aria's render state.
function popoverClassName(state: PopoverRenderProps) {
  return (
    stylex.props(overlay.popup, picker.popover, originOf(state.placement))
      .className ?? ''
  )
}

// The trigger's classes, from React Aria's own render state. A picker's
// trigger is disabled by the field around it rather than by a prop of its
// own, so the fade comes off the state React Aria hands the className. It is
// the same 38% the segments beside it take, so one disabled field fades as a
// whole.
function triggerClassName(state: {
  isDisabled: boolean
  isHovered: boolean
  isPressed: boolean
}) {
  return (
    stylex.props(
      iconButton.chrome,
      focus.ring,
      state.isHovered && iconButton.chromeHovered,
      state.isPressed && iconButton.chromePressed,
      state.isDisabled && iconButton.chromeDisabled,
    ).className ?? ''
  )
}

export { datePopoverClassName, picker, popoverClassName, triggerClassName }
