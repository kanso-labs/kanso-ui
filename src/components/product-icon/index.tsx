import * as stylex from '@stylexjs/stylex'

import type { RenderComponentProps } from '../../render/useRender'

import { useImageLoadingStatus } from '../../hooks/useImageLoadingStatus'
import { useRender } from '../../render/useRender'
import { mergeStyles } from '../../styles/merge'
import { colors, radii, typography } from '../../tokens/design.tokens.stylex'

// The counterpart to Avatar: Avatar stands for a person, this stands for
// everything else — an application, a service, a brand. The two are the same
// three sizes so either can fill a leading slot without moving what sits
// beside it, and they differ in the two ways that matter for a mark rather
// than a face.
//
// A rounded square rather than a circle. A logo is drawn to its own bounding
// box, and a circle crops the corners it was composed with.
//
// `contain` rather than `cover`. Cropping a face to fill a circle loses
// nothing anyone minds; cropping a wordmark loses the word. The cost is
// letterboxing — a wide mark leaves space above and below — and that is the
// right trade for a mark whose whole job is to be recognised.
//
// That cost is also why `tone` tints the fallback rather than the root. A mark
// letterboxed into the square does not cover it, and neither does one drawn
// with transparency, so a tint on the root showed as a coloured box around
// every logo that was not an opaque square. On the fallback it is seen exactly
// when it is meant to be: while there is no mark, or none has loaded.
const styles = stylex.create({
  base: {
    alignItems: 'center',
    borderRadius: radii.sm,
    boxSizing: 'border-box',
    display: 'inline-flex',
    flexShrink: 0,
    fontFamily: typography.labelLargeFont,
    fontWeight: typography.weightMedium,
    justifyContent: 'center',
    // Clips the mark to the rounded corners, the same reason Card does it.
    overflow: 'hidden',
    userSelect: 'none',
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
    objectFit: 'contain',
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
  tertiary: {
    backgroundColor: colors.tertiaryContainer,
    color: colors.onTertiaryContainer,
  },
})

type ProductIconProps = Omit<RenderComponentProps<'span'>, 'children'> & {
  /**
   * What this identifies. Supplies both the fallback initial and the
   * accessible name, so a screen reader announces the thing rather than
   * reading a letter aloud.
   */
  name: string
  /**
   * Edge length: `sm` 36px, `md` 40px, `lg` 56px. The same three Avatar uses,
   * so the two are interchangeable wherever one leads a row or a card.
   * @default 'md'
   */
  size?: 'lg' | 'md' | 'sm'
  /**
   * The mark to show in place of the initial. The initial stays until it has
   * loaded, and comes back if it fails.
   */
  src?: string
  /**
   * Which container/on-container colour pair to tint the fallback with. It is
   * the fallback's own background, so it is gone once `src` has loaded rather
   * than sitting behind the mark.
   * @default 'primary'
   */
  tone?: 'negative' | 'positive' | 'primary' | 'secondary' | 'tertiary'
}

// One letter, where Avatar takes two. A person has a first name and a last
// name to initialise; a thing usually has neither, so the same rule applied
// to "Second Item" would produce "SI" — a pair of initials for something that
// was never two words in that sense. Array.from rather than indexing, so a
// name starting outside the Basic Multilingual Plane yields its whole first
// character instead of half a surrogate pair.
function initialFrom(name: string) {
  const trimmed = name.trim()
  return (Array.from(trimmed)[0] ?? '').toLocaleUpperCase()
}

/**
 * A small square mark identifying something that is not a person — an
 * application, a service, a brand. Reach for Avatar when it is a person.
 *
 * The mark is letterboxed rather than cropped, so a logo of any aspect ratio
 * can be handed over as it was drawn.
 */
function ProductIcon({
  name,
  render,
  size = 'md',
  src,
  tone = 'primary',
  ...props
}: ProductIconProps) {
  // The mark is shown only once it has loaded, and the letter stays until
  // then and comes back if it fails — see useImageLoadingStatus.
  const status = useImageLoadingStatus(src)

  // role/aria-label rather than letting the fallback letter be read: "B" is
  // not what anyone means to announce. Marking the root as an image also
  // makes its contents presentational, so neither the mark nor the letter
  // is announced a second time underneath the name. A span rather than an
  // <img>, which is void: this element's whole job is to hold the letter
  // shown when there is no mark, or none has loaded yet.
  return useRender({
    defaultTagName: 'span',
    props: {
      'aria-label': name,
      role: 'img',
      ...props,
      children:
        status === 'loaded' ? (
          <img alt="" src={src} {...stylex.props(styles.image)} />
        ) : (
          <span {...stylex.props(styles.fallback, styles[tone])}>
            {initialFrom(name)}
          </span>
        ),
      ...mergeStyles(stylex.props(styles.base, styles[size]), props),
    },
    render,
  })
}

export type { ProductIconProps }

export default ProductIcon
