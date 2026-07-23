import * as stylex from '@stylexjs/stylex'

import { stateLayerOpacity } from '../tokens/design.tokens.stylex'

const FORCED_COLORS = '@media (forced-colors: active)'

// Growth and opacity are two independent mechanisms. Growth (width/height/
// transform) is driven imperatively via the Web Animations API in
// useRipple, decoupled from press/release timing so it always plays out
// over a fixed duration. Opacity is what this file owns — toggled by the
// `pressed` class — with a fast fade-in and a slower fade-out, so a quick
// tap still reads as a deliberate, visible ripple rather than a flicker.
//
// The gradient's soft edge (a currentColor disc fading to transparent over
// its outer 30-35%, capped at 70px) replaces a hard-edged circle so the
// ripple blends into the surface rather than looking like a solid dot.
//
// `closest-side` + a plain circular box means no `border-radius` is needed
// on the ripple itself — the gradient's own shape reads as a circle.
const styles = stylex.create({
  press: {
    backgroundImage: `radial-gradient(closest-side, currentColor max(calc(100% - 70px), 65%), transparent 100%)`,
    left: 0,
    opacity: 0,
    position: 'absolute',
    top: 0,
    transformOrigin: 'center',
    transitionDuration: '375ms',
    transitionProperty: 'opacity',
    transitionTimingFunction: 'linear',
  },
  pressed: {
    opacity: stateLayerOpacity.pressed,
    transitionDuration: '105ms',
  },
  // Fills and clips to the host via `inset: 0` + `border-radius: inherit`,
  // so the host only needs to be a positioning context (`position:
  // relative`) — no other setup required.
  surface: {
    borderRadius: 'inherit',
    display: { default: 'block', [FORCED_COLORS]: 'none' },
    inset: 0,
    overflow: 'hidden',
    pointerEvents: 'none',
    position: 'absolute',
  },
})

export { styles as rippleStyles }
