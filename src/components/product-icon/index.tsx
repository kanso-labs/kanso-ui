'use client'

import type { RenderComponentProps } from '../../render/useRender'

import Mark from '../../mark'

// The counterpart to Avatar: Avatar stands for a person, this stands for
// everything else — an application, a service, a brand. It is drawn as a
// rounded square with the mark letterboxed, and its tone tints the fallback
// rather than the square. The header of `src/mark/styles.ts` says why on all
// three counts.
//
// The box, the sizes, the tones, the mark's loading and the labelling are the
// mark's in `src/mark`, which Avatar draws a person through as well. No
// Material Design page draws a product mark, so its sizes are Avatar's — 36,
// 40 and 56 — which is what lets a mark and a person fill the same slot.

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

/**
 * A small square mark identifying something that is not a person — an
 * application, a service, a brand. Reach for Avatar when it is a person.
 *
 * The mark is letterboxed rather than cropped, so a logo of any aspect ratio
 * can be handed over as it was drawn.
 */
function ProductIcon({
  size = 'md',
  tone = 'primary',
  ...props
}: ProductIconProps) {
  return <Mark {...props} kind="thing" size={size} tone={tone} />
}

export type { ProductIconProps }

export default ProductIcon
