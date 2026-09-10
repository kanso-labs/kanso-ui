import * as stylex from '@stylexjs/stylex'

import {
  colors,
  motion,
  radii,
  spacing,
  stateLayerOpacity,
  typography,
} from '../tokens/design.tokens.stylex'

// The pill the chips page draws, shared by the two components that draw one:
// Chip, which is a toggle on its own, and ChipGroup's chip, which is one of a
// set that can also be removed. The measurements and roles are the page's
// filter chip — a 32dp container with an 8dp corner and 16dp of inline
// padding, an outline variant border while unselected, the secondary
// container pair once selected.
//
// Each state composites an on-colour over its own container at the
// interaction state's opacity rather than swapping in a separate hover
// colour. `calc(<opacity> * 100%)` turns the token's unitless 0-1 ratio into
// the percentage `color-mix()` takes, and it is inlined at each property
// because @stylexjs/babel-plugin only statically recognises expressions
// written directly as property values.
//
// The selected chip drops its border rather than recolouring it: it has a
// container of its own to define its edge, and a border on top of that reads
// as a second, competing outline.
//
// Disabled is applied from render state rather than from `:disabled`. Chip is
// a button and would match the pseudo-class; a chip in a group is React
// Aria's `Tag`, which is a div and never will. One mechanism serves both, and
// StyleX replaces a property whole, so the disabled styles take the hover and
// pressed branches of whichever state they are applied over.
//
// Apart from any component so a chip in a group and a chip on its own cannot
// drift; see `src/row` for the same arrangement around a list's row.

const chipStyles = stylex.create({
  base: {
    alignItems: 'center',
    blockSize: '32px',
    borderRadius: radii.sm,
    borderStyle: 'solid',
    borderWidth: '1px',
    boxSizing: 'border-box',
    cursor: 'pointer',
    display: 'inline-flex',
    flexShrink: 0,
    fontFamily: typography.labelLargeFont,
    fontSize: typography.labelLargeSize,
    fontWeight: typography.labelLargeWeight,
    gap: spacing.sm,
    letterSpacing: typography.labelLargeTracking,
    lineHeight: typography.labelLargeLineHeight,
    outlineColor: colors.primary,
    outlineOffset: '2px',
    outlineStyle: { ':focus-visible': 'solid', default: 'none' },
    outlineWidth: '2px',
    paddingBlock: 0,
    paddingInline: spacing.lg,
    transitionDuration: motion.durationShort2,
    transitionProperty: 'background-color, border-color, color',
    transitionTimingFunction: motion.easingStandard,
  },
  // The content role at 38%, which every disabled chip takes whichever
  // container it is on.
  disabled: {
    color: `color-mix(in srgb, ${colors.onSurface} calc(${stateLayerOpacity.disabledContent} * 100%), ${colors.surface})`,
    cursor: 'not-allowed',
  },
  // The two containers a disabled chip can be on: the selected one flattens
  // to the surface at 12%, the unselected one keeps its outline at the same.
  disabledSelected: {
    backgroundColor: `color-mix(in srgb, ${colors.onSurface} calc(${stateLayerOpacity.disabledContainer} * 100%), ${colors.surface})`,
  },
  disabledUnselected: {
    backgroundColor: 'transparent',
    borderColor: `color-mix(in srgb, ${colors.onSurface} calc(${stateLayerOpacity.disabledContainer} * 100%), transparent)`,
  },
  // The trailing close target the page draws on an input chip: an 18dp glyph
  // in the content role, in a target of its own so a press on it removes the
  // chip rather than toggling it.
  remove: {
    alignItems: 'center',
    backgroundColor: {
      ':active': `color-mix(in srgb, currentColor calc(${stateLayerOpacity.pressed} * 100%), transparent)`,
      ':hover': `color-mix(in srgb, currentColor calc(${stateLayerOpacity.hover} * 100%), transparent)`,
      default: 'transparent',
    },
    blockSize: '18px',
    borderRadius: radii.full,
    borderWidth: 0,
    boxSizing: 'border-box',
    color: 'inherit',
    cursor: 'pointer',
    display: 'inline-flex',
    flexShrink: 0,
    inlineSize: '18px',
    justifyContent: 'center',
    // The page's 8dp between the label and the close target is the chip's own
    // gap; what is trimmed here is the chip's inline padding, which the page
    // draws at 8 on the side the close target is on rather than 16.
    marginInlineEnd: `calc(-1 * ${spacing.sm})`,
    // The chip around it already shows a ring, and a second one inside it
    // would be two focus treatments for one focus.
    outlineColor: 'currentColor',
    outlineOffset: '1px',
    outlineStyle: { ':focus-visible': 'solid', default: 'none' },
    outlineWidth: '2px',
    padding: 0,
  },
  removeGlyph: {
    blockSize: '18px',
    inlineSize: '18px',
  },
  selected: {
    backgroundColor: {
      ':active': `color-mix(in srgb, ${colors.onSecondaryContainer} calc(${stateLayerOpacity.pressed} * 100%), ${colors.secondaryContainer})`,
      ':hover': `color-mix(in srgb, ${colors.onSecondaryContainer} calc(${stateLayerOpacity.hover} * 100%), ${colors.secondaryContainer})`,
      default: colors.secondaryContainer,
    },
    borderColor: 'transparent',
    color: colors.onSecondaryContainer,
  },
  unselected: {
    backgroundColor: {
      ':active': `color-mix(in srgb, ${colors.onSurface} calc(${stateLayerOpacity.pressed} * 100%), transparent)`,
      ':hover': `color-mix(in srgb, ${colors.onSurface} calc(${stateLayerOpacity.hover} * 100%), transparent)`,
      default: 'transparent',
    },
    borderColor: colors.outlineVariant,
    color: colors.onSurfaceVariant,
  },
})

export { chipStyles }
