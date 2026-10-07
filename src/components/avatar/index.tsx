'use client'

import type { RenderComponentProps } from '../../render/useRender'

import Mark from '../../mark'

// A person, drawn as a circle with the photo cropped to fill it. The box, the
// sizes, the tones, the photo's loading and the labelling are the mark's in
// `src/mark`, which ProductIcon draws a thing through as well, so a person
// and a thing fill the same slot.
//
// Which tone a given person gets is the consuming app's decision — the design
// cycles colours per person, and that cycle belongs where the list of people
// is, not in this component.

type AvatarProps = Omit<RenderComponentProps<'span'>, 'children'> & {
  /**
   * The person this represents. Supplies both the initials and the accessible
   * name, so a screen reader announces who it is rather than reading two
   * letters aloud.
   */
  name: string
  /**
   * Diameter: `sm` 36px, `md` 40px, `lg` 56px.
   * @default 'md'
   */
  size?: 'lg' | 'md' | 'sm'
  /**
   * A photo to show in place of the initials. The initials stay until it has
   * loaded, and come back if it fails.
   */
  src?: string
  /**
   * Which container/on-container colour pair to tint with.
   * @default 'primary'
   */
  tone?: 'negative' | 'positive' | 'primary' | 'secondary' | 'tertiary'
}

/**
 * A person, as a circle holding their photo or, until it loads or when there
 * is none, their initials. `name` is both where the initials come from and
 * what a screen reader announces, so it is required even with a photo.
 *
 * ```tsx
 * <Avatar name="Ada Lovelace" src={photo} size="lg" />
 * ```
 *
 * Reach for ProductIcon when what is drawn is not a person; the two share
 * their sizes, so either fills the same slot in a row or a card.
 *
 * The call site's `className` and `style` land on the circle.
 */
function Avatar({ size = 'md', tone = 'primary', ...props }: AvatarProps) {
  return <Mark {...props} kind="person" size={size} tone={tone} />
}

export type { AvatarProps }

export default Avatar
