import type { PopoverRenderProps } from 'react-aria-components'

import * as stylex from '@stylexjs/stylex'

import {
  colors,
  motion,
  radii,
  shadows,
  spacing,
} from '../tokens/design.tokens.stylex'

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
    animationDuration: motion.durationShort3,
    animationName: scaleIn,
    // Decelerating, so the surface arrives quickly and settles.
    animationTimingFunction: motion.easingEmphasizedDecelerate,
    backgroundColor: colors.surfaceContainer,
    borderRadius: radii.md,
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
    outlineColor: colors.primary,
    outlineOffset: '2px',
    outlineStyle: { ':focus-visible': 'solid', default: 'none' },
    outlineWidth: '2px',
  },
  // M3's scrim is the scrim role at 32%, not a colour of its own.
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

/**
 * The origin an anchored surface grows from, for the placement React Aria
 * reports through its render state. `null`, before the surface has been
 * placed, grows from the top as `bottom` does.
 */
function popupOrigin(placement: PopoverRenderProps['placement']) {
  return origins[placement ?? 'bottom']
}

export { overlay, popupOrigin }
