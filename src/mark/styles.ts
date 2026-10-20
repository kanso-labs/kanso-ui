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
// `md` is the leading avatar of Material Design's lists page: 40dp, with its
// initials in the role the list tokens give that avatar's label,
// `ItemLeadingAvatarLabelFont`, which is title medium — 16 on 24, with 0.15 of
// tracking. 40dp is also Button's and IconButton's own `md` height, so a mark
// and a control line up in a row.
//
// The other two sizes are the library's own, since the lists page gives only
// the 40dp case. `lg` is 56dp. `sm` is 36dp, between the 32dp a chip and an
// `xs` control take and that 40dp default, for a row that wants a person
// smaller than the button beside them. Each sets its initials in the role
// whose size is the same two fifths of its diameter as title medium is of
// 40dp: label large's 14 in 36dp, and title large's 22 in 56dp. They take that
// role's size, line height and tracking, and keep title medium's family and
// weight, so a large mark is bigger initials rather than differently styled
// ones — title large is set in the brand face at regular weight, which would
// draw the same person's initials in another face at one size.
//
// Every size sets its line height and tracking as well as its size, so
// nothing about the initials is inherited from what the mark sits in.
// Windows High Contrast and the rest of the forced-colours modes. Spelled
// here rather than imported, for the reason src/field/styles.ts records: the
// StyleX compiler resolves a constant across files only out of a `.stylex.ts`
// module, and the generated one holds design tokens rather than queries.
const FORCED_COLORS = '@media (forced-colors: active)'

const markStyles = stylex.create({
  // A border under forced colours, which paints the tone's fill in the
  // page's own `Canvas` and left the initials floating with no circle or
  // square around them. Inside the box, since it is border-box, so the mark
  // keeps its size.
  base: {
    alignItems: 'center',
    borderColor: { default: null, [FORCED_COLORS]: 'CanvasText' },
    borderStyle: { default: null, [FORCED_COLORS]: 'solid' },
    borderWidth: { default: null, [FORCED_COLORS]: '1px' },
    boxSizing: 'border-box',
    display: 'inline-flex',
    flexShrink: 0,
    fontFamily: typography.titleMediumFont,
    fontWeight: typography.titleMediumWeight,
    justifyContent: 'center',
    // Clips the image to the shape, so one of any aspect ratio can be handed
    // over without the call site having to crop it first.
    overflow: 'hidden',
    // What the pictures are laid over the initials against.
    position: 'relative',
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
  // Laid over the initials and over the picture before it, filling the
  // mark, so a new picture can load in place without moving anything.
  image: {
    blockSize: '100%',
    boxSizing: 'border-box',
    inlineSize: '100%',
    insetBlockStart: 0,
    insetInlineStart: 0,
    position: 'absolute',
  },
  // Loading: present, so the browser fetches it as it would any image in
  // the viewport, and invisible until it has loaded.
  imagePending: {
    opacity: 0,
  },
  lg: {
    blockSize: '56px',
    fontSize: typography.titleLargeSize,
    inlineSize: '56px',
    letterSpacing: typography.titleLargeTracking,
    lineHeight: typography.titleLargeLineHeight,
  },
  md: {
    blockSize: '40px',
    fontSize: typography.titleMediumSize,
    inlineSize: '40px',
    letterSpacing: typography.titleMediumTracking,
    lineHeight: typography.titleMediumLineHeight,
  },
  negative: {
    backgroundColor: colors.negativeContainer,
    color: colors.onNegativeContainer,
  },
  // The anonymous person, at three fifths of the disc: 24dp in the 40dp
  // avatar, as Material Design draws its placeholder, and the same share of
  // the other two sizes. Its fill is the text colour, so the tone's
  // on-container role, which follows a scheme.
  personGlyph: {
    blockSize: '60%',
    inlineSize: '60%',
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
    fontSize: typography.labelLargeSize,
    inlineSize: '36px',
    letterSpacing: typography.labelLargeTracking,
    lineHeight: typography.labelLargeLineHeight,
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
