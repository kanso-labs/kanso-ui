import type { PopoverRenderProps } from 'react-aria-components'

import * as stylex from '@stylexjs/stylex'

import {
  colors,
  motion,
  radii,
  shadows,
  spacing,
} from '../tokens/design.tokens.stylex'

// Windows High Contrast and the rest of the forced-colours modes. Spelled
// here rather than imported, for the reason src/field/styles.ts records: the
// StyleX compiler resolves a constant across files only out of a `.stylex.ts`
// module, and the generated one holds design tokens rather than queries.
const FORCED_COLORS = '@media (forced-colors: active)'

// What every overlay shares, drawn once. Popover's anchored surface and its
// entry, Sheet's scrim, and the element that carries the dialog role inside
// each of them; the coverage plan brings a dozen more overlays — Menu, Select,
// ComboBox, Tooltip, the date pickers, Dialog — and each would otherwise have
// written the same surface and the same scrim a second time. Geometry stays
// with the component: how wide a popover is, which edge a sheet is pinned to,
// where a dialog sits, are each overlay's own decision.
//
// Every one of these is portalled to the end of the body, which is why each
// component takes a `container` prop and documents the same caveat: an app
// that scopes its StyleX theme to a subtree has to point the portal inside it,
// or the surface renders outside the theme and falls back to the tokens'
// `prefers-color-scheme` default.
//
// Entry only, and no exit animation, for the same reason in every overlay:
// React Aria keeps a closing surface mounted only while an animation is
// running on it, and a popover in particular is dismissed far more often than
// it is closed deliberately — usually by pressing something else, where a
// lingering surface is in the way of whatever the press was for.

// The scrim settles before the panel it sits behind arrives: shorter than
// any panel's entry, so the two do not finish together.
const fadeIn = stylex.keyframes({
  from: { opacity: 0 },
  to: { opacity: 1 },
})

// An anchored surface grows from the edge it is anchored by rather than from
// its own centre, which is what makes it read as coming out of the trigger.
// The origin is a separate style, chosen from the placement React Aria
// reports, so the same keyframes serve all four sides.
const scaleIn = stylex.keyframes({
  from: { opacity: 0, transform: 'scale(0.95)' },
  to: { opacity: 1, transform: 'scale(1)' },
})

const overlay = stylex.create({
  fromBottom: { transformOrigin: 'bottom center' },
  fromLeft: { transformOrigin: 'left center' },
  fromRight: { transformOrigin: 'right center' },
  fromTop: { transformOrigin: 'top center' },
  // The element with the dialog role inside a modal panel. It fills the panel
  // and lays the panel's parts out as a column, and shows no ring of its own
  // when React Aria focuses it, since the scrim already marks the panel out.
  modalDialog: {
    blockSize: '100%',
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    outlineStyle: 'none',
  },
  // The anchored surface itself, without its padding: a menu's items run to
  // its edges where a popover's content is inset, so each consumer adds its
  // own. React Aria measures the room between the anchor and the edge of the
  // viewport and sets it as the max height inline, so the surface scrolls
  // rather than running off the screen.
  popup: {
    // Reduced motion zeroes the duration, which lands the surface in its
    // settled state with the scale never drawn. What it cannot do is swap the
    // keyframes for a fade, which is the kinder answer and the one a sheet
    // and a dialog would want more than this does: StyleX rejects the same
    // at-rule twice in one property, so an `animationName` already keyed
    // the breakpoint — as theirs are — has nowhere to put the preference,
    // and keyed flat the preference loses, since StyleX sorts a width query
    // into a later layer than this one. Four overlays answering the
    // preference the same way is worth more than this one answering it
    // better, and the scrim behind a sheet or a dialog still fades, so the
    // arrival is not silent. A popup needs less: it opens under the thing
    // that was just pressed.
    animationDuration: {
      '@media (prefers-reduced-motion: reduce)': '0s',
      default: motion.durationShort3,
    },
    animationName: scaleIn,
    // Decelerating, so the surface arrives quickly and settles.
    animationTimingFunction: motion.easingEmphasizedDecelerate,
    backgroundColor: colors.surfaceContainer,
    // What the surface's edge becomes under forced colours, where the
    // `boxShadow` below is gone. That mode drops box shadows outright and
    // paints the fill in `Canvas`, the colour it paints the page in, so the
    // surface would be the page's own colour laid over the page with nothing
    // at its edge — a menu's items running straight into whatever the page
    // draws behind them. A border is a property the mode keeps, and a
    // `CanvasText` one is how the browser draws the edge of its own popover
    // and dialog. Inside the size rather than around it, since the surface is
    // `border-box`, so a select's list stays the width of its field. None of
    // it is drawn while forced colours are off.
    borderColor: { default: null, [FORCED_COLORS]: 'CanvasText' },
    borderRadius: radii.md,
    borderStyle: { default: null, [FORCED_COLORS]: 'solid' },
    borderWidth: { default: null, [FORCED_COLORS]: '1px' },
    boxShadow: shadows.elevation2,
    boxSizing: 'border-box',
    color: colors.onSurface,
    overflowY: 'auto',
  },
  // The element with the dialog role inside an anchored surface. React Aria
  // focuses the dialog itself when nothing inside it takes focus, so it is a
  // focusable element and needs a ring for the case where a keyboard put it
  // there — the same treatment Tabs gives its panel.
  popupDialog: {
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.sm,
  },
  // Material Design's scrim is the scrim role at 32%, not a colour of its own.
  //
  // The one animation here that keeps its duration under reduced motion, and
  // deliberately: a cross-fade moves nothing, and `popup` above is already
  // leaning on this one still playing — with every panel arriving instantly,
  // the ground darkening is the whole of what says an overlay opened. Left to
  // follow the rest, the four overlays would appear with no cue at all.
  scrim: {
    animationDuration: motion.durationShort2,
    animationName: fadeIn,
    animationTimingFunction: motion.easingStandard,
    backgroundColor: `color-mix(in srgb, ${colors.scrim} 32%, transparent)`,
    inset: 0,
    position: 'fixed',
  },
})

// Which side the surface opened on, and the origin its entry grows from.
// Keyed on the placement React Aria reports rather than the one asked for,
// since the surface flips to the opposite side when there is no room on its
// own; `center` is the placement React Aria reports for an anchor it could
// not place beside, and grows from the top like the default.
const origins = {
  bottom: overlay.fromTop,
  center: overlay.fromTop,
  left: overlay.fromRight,
  right: overlay.fromLeft,
  top: overlay.fromBottom,
}

/** Where along that side it lines up with the anchor. */
type OverlayAlign = 'center' | 'end' | 'start'

/** Which side of the anchor a surface opens on. */
type OverlaySide = 'bottom' | 'left' | 'right' | 'top'

/**
 * React Aria's placement, from the side and the alignment a call site names.
 * Its own vocabulary pairs a side with `top`/`bottom` on the inline sides and
 * `start`/`end` on the block ones; a call site should not have to know which
 * of the two it is asking for, so this maps one onto the other.
 *
 * Shared by every anchored overlay rather than kept in one, since which side
 * a surface opens on is the same question for a popover and a menu.
 */
function placementOf(side: OverlaySide, align: OverlayAlign) {
  if (align === 'center') {
    return side
  }
  if (side === 'top' || side === 'bottom') {
    return `${side} ${align}` as const
  }
  return `${side} ${align === 'start' ? 'top' : 'bottom'}` as const
}

/**
 * The origin an anchored surface grows from, for the placement React Aria
 * reports through its render state. `null`, before the surface has been
 * placed, grows from the top as `bottom` does.
 */
function popupOrigin(placement: PopoverRenderProps['placement']) {
  return origins[placement ?? 'bottom']
}

export type { OverlayAlign, OverlaySide }

export { overlay, placementOf, popupOrigin }
