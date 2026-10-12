'use client'

import type { ImgHTMLAttributes } from 'react'

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

type AvatarProps = {
  /**
   * Hides the avatar from assistive technology, for one beside the person's
   * name — a row whose headline is the name, a byline — where it would
   * otherwise announce the name a second time. `name` still supplies the
   * initials, and is not announced.
   * @default false
   */
  decorative?: boolean
  /**
   * Attributes for the picture's own `<img>`: a `srcSet` and `sizes` for a
   * screen's density, a `referrerPolicy` or `crossOrigin` for where it is
   * served from, a `fetchPriority`, or `loading` and `decoding`, which are
   * `lazy` and `async` unless given.
   */
  imgProps?: Pick<
    ImgHTMLAttributes<HTMLImageElement>,
    | 'crossOrigin'
    | 'decoding'
    | 'fetchPriority'
    | 'loading'
    | 'referrerPolicy'
    | 'sizes'
    | 'srcSet'
  >
  /**
   * The person this represents. Supplies both the initials and the accessible
   * name, so a screen reader announces who it is rather than reading two
   * letters aloud.
   *
   * A display name, as a reader would see it written: the initials are its
   * first and last words. A title before the name ("Dr."), a generational
   * suffix after it ("Jr.", "III") and an aside in brackets at its end
   * ("(she/her)") are passed over, as is punctuation a word opens with. A
   * name written without spaces between its words, as Japanese and Chinese
   * names are, is one word, and takes one initial.
   */
  name: string
  /**
   * Whether an avatar with no initials to take, for a blank `name`, draws
   * Material Design's anonymous person. `false` leaves the tinted disc empty,
   * for a loading skeleton.
   * @default true
   */
  showPersonIcon?: boolean
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
} & Omit<RenderComponentProps<'span'>, 'children'>

/**
 * A person, as a circle holding their photo or, until it loads or when there
 * is none, their initials. `name` is both where the initials come from and
 * what a screen reader announces, so it is required even with a photo.
 *
 * ```tsx
 * <Avatar name="Ada Lovelace" src={photo} size="lg" />
 * ```
 *
 * When the person's name is already written next to the avatar, mark it
 * `decorative`, so a screen reader reads the name once.
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
