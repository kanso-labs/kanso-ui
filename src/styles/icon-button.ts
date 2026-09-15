import * as stylex from '@stylexjs/stylex'

import {
  colors,
  radii,
  stateLayerOpacity,
} from '../tokens/design.tokens.stylex'

// The icon buttons page's 40dp square and its state layer, drawn directly on
// a button rather than through the `IconButton` component.
//
// Two places need that, and both said so in the same words while keeping
// their own copy: a picker's trigger and the chevrons that move a calendar's
// month. Neither can reach for `IconButton`, because React Aria carries each
// of them on its own `Button` — the trigger through a picker's context, the
// chevrons through a calendar's slots — so the chrome has to be drawn onto
// the element React Aria renders.
//
// What each keeps is what it does not share. A calendar's chevron sits in a
// 48dp column, so it adds the 4dp either side; a picker's trigger takes a
// fade when the field around it is disabled.
//
// This is deliberately narrow. Five other buttons in the library draw a bare
// icon — a tree's caret, a navigation tree's, a combo box's toggle, a chip's
// remove and `IconButton` itself — and each differs in size, content colour,
// state-layer semantics or focus-ring offset, with a comment recording why.
// At most eleven of these seventeen declarations survive into any of them, so
// composing this and overriding the rest would hide those decisions rather
// than record them.
const iconButton = stylex.create({
  chrome: {
    alignItems: 'center',
    backgroundColor: {
      ':active': `color-mix(in srgb, ${colors.onSurfaceVariant} calc(${stateLayerOpacity.pressed} * 100%), transparent)`,
      ':hover': `color-mix(in srgb, ${colors.onSurfaceVariant} calc(${stateLayerOpacity.hover} * 100%), transparent)`,
      default: 'transparent',
    },
    blockSize: '40px',
    borderRadius: radii.full,
    borderWidth: 0,
    boxSizing: 'border-box',
    color: colors.onSurfaceVariant,
    cursor: 'pointer',
    display: 'flex',
    flexShrink: 0,
    inlineSize: '40px',
    justifyContent: 'center',
    padding: 0,
  },
})

export { iconButton }
