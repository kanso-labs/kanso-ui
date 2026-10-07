import * as stylex from '@stylexjs/stylex'

import { colors, radii, typography } from '../tokens/design.tokens.stylex'

// The box Avatar and ProductIcon draw in, shared so a person and a thing stay
// the same three sizes in the same five tones, and so either can fill a
// leading slot without moving what sits beside it. They differ in the two
// ways that matter for a mark rather than a face, and those are the keys a
// kind picks between in `./index.tsx`.
//
// A person is a circle with the photo cropped to fill it; a thing is a
// rounded square with its mark letterboxed. A logo is drawn to its own
// bounding box, so a circle crops the corners it was composed with, and
// cropping a face loses nothing anyone minds where cropping a wordmark loses
// the word. The cost of `contain` is letterboxing — a wide mark leaves space
// above and below — and that is the right trade for a mark whose whole job
// is to be recognised.
//
// That cost is also why a thing's tone tints the fallback rather than the
// root. A mark letterboxed into the square does not cover it, and neither
// does one drawn with transparency, so a tint on the root showed as a
// coloured box around every logo that was not an opaque square. On the
// fallback it is seen exactly when it is meant to be: while there is no
// mark, or none has loaded. A photo covers the whole circle, so a person's
// tone stays on the root.
//
// Tones are container/on-container pairs rather than one colour each, so the
// initials are always a role's own foreground and can't end up unreadable on
// a tint they were never paired with.
//
// Sizes carry their own type size but not their own weight or family: the
// label face at medium weight holds across all three, so a large mark is
// bigger initials rather than differently-styled ones.
//
// The three are the library's own rather than a spec page's — no Material
// Design page gives a measurement for one in text; the lists page draws its
// leading elements in a diagram and tabulates only their padding. So they are
// stated against the scale the library already has. `md` is 40dp, which is
// Button's and IconButton's own `md` height, so a mark and a control line up
// in a row. `lg` is 56dp. `sm` is 36dp, between the 32dp a chip and an `xs`
// control take and that 40dp default, for a row that wants a person smaller
// than the button beside them.
const markStyles = stylex.create({
  base: {
    alignItems: 'center',
    boxSizing: 'border-box',
    display: 'inline-flex',
    flexShrink: 0,
    fontFamily: typography.labelLargeFont,
    fontWeight: typography.weightMedium,
    justifyContent: 'center',
    // Clips the image to the shape, so one of any aspect ratio can be handed
    // over without the call site having to crop it first.
    overflow: 'hidden',
    userSelect: 'none',
  },
  circle: {
    borderRadius: radii.circle,
  },
  contain: {
    objectFit: 'contain',
  },
  // Fills the circle instead of letterboxing, which is what makes a
  // non-square photo usable here at all.
  cover: {
    objectFit: 'cover',
  },
  fallback: {
    alignItems: 'center',
    // Fills the root so the tint is the whole square rather than a box behind
    // the glyph, which is what it looked like when the root carried it.
    blockSize: '100%',
    display: 'flex',
    inlineSize: '100%',
    justifyContent: 'center',
  },
  image: {
    blockSize: '100%',
    inlineSize: '100%',
  },
  lg: {
    blockSize: '56px',
    fontSize: typography.bodyLargeSize,
    inlineSize: '56px',
  },
  md: {
    blockSize: '40px',
    fontSize: typography.labelLargeSize,
    inlineSize: '40px',
  },
  negative: {
    backgroundColor: colors.negativeContainer,
    color: colors.onNegativeContainer,
  },
  positive: {
    backgroundColor: colors.positiveContainer,
    color: colors.onPositiveContainer,
  },
  primary: {
    backgroundColor: colors.primaryContainer,
    color: colors.onPrimaryContainer,
  },
  secondary: {
    backgroundColor: colors.secondaryContainer,
    color: colors.onSecondaryContainer,
  },
  sm: {
    blockSize: '36px',
    fontSize: typography.labelMediumSize,
    inlineSize: '36px',
  },
  square: {
    borderRadius: radii.sm,
  },
  tertiary: {
    backgroundColor: colors.tertiaryContainer,
    color: colors.onTertiaryContainer,
  },
})

type MarkSize = 'lg' | 'md' | 'sm'

type MarkTone = 'negative' | 'positive' | 'primary' | 'secondary' | 'tertiary'

export type { MarkSize, MarkTone }

export { markStyles }
