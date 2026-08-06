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
// None of the three timings below is a motion token, and that is deliberate
// rather than an oversight predating them. The fade pair is the asymmetry
// the paragraph above describes: 105ms in against 375ms out, hand-tuned as
// a ratio to each other, and neither lands on the scale (105ms is near
// durationShort1's 100ms; 375ms sits between durationMedium3 and
// durationLong1). Snapping either to its nearest token would flatten a
// tuned asymmetry into two arbitrary values, and adding tokens to fit would
// make a scale that documents itself as three bands of three describe this
// component instead. `linear` is likewise not on the easing scale, and
// belongs off it — a fade to and from a state layer wants no acceleration,
// which is why every curve in the token set is the wrong answer here.
//
// These three are now the only ripple timings off the scale. Everything
// useRipple drives from JS is a token, read through src/tokens/values
// because element.animate() and setTimeout both reject the StyleX form.
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
