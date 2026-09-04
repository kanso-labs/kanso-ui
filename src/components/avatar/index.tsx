import * as stylex from '@stylexjs/stylex'

import type { RenderComponentProps } from '../../render/useRender'

import { useImageLoadingStatus } from '../../hooks/useImageLoadingStatus'
import { useRender } from '../../render/useRender'
import { mergeStyles } from '../../styles/merge'
import { colors, radii, typography } from '../../tokens/design.tokens.stylex'

// Tones are container/on-container pairs rather than one colour each, so the
// initials are always a role's own foreground and can't end up unreadable on
// a tint they were never paired with. Which tone a given person gets is the
// consuming app's decision — the design cycles colours per person, and that
// cycle belongs where the list of people is, not in this component.
//
// Sizes carry their own type size but not their own weight or family: the
// label face at medium weight holds across all three, so a large avatar is
// bigger initials rather than differently-styled ones.
const styles = stylex.create({
  base: {
    alignItems: 'center',
    borderRadius: radii.full,
    boxSizing: 'border-box',
    display: 'inline-flex',
    flexShrink: 0,
    fontFamily: typography.labelLargeFont,
    fontWeight: typography.weightMedium,
    justifyContent: 'center',
    // Clips the photo to the circle, so an image of any aspect ratio can be
    // handed over without the call site having to crop it first.
    overflow: 'hidden',
    userSelect: 'none',
  },
  image: {
    blockSize: '100%',
    inlineSize: '100%',
    // Fills the circle instead of letterboxing, which is what makes a
    // non-square photo usable here at all.
    objectFit: 'cover',
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

function Avatar({
  name,
  render,
  size = 'md',
  src,
  tone = 'primary',
  ...props
}: AvatarProps) {
  // The photo is shown only once it has loaded, and the initials stay until
  // then and come back if it fails — see useImageLoadingStatus.
  const status = useImageLoadingStatus(src)

  // role/aria-label rather than letting the initials be read: "AL" is not
  // what anyone means to announce. Marking the root as an image also makes
  // its contents presentational, so the photo and the initials can't be
  // announced a second time underneath the name. A span rather than an
  // <img>, which is void: this element's whole job is to hold the initials
  // shown when there is no photo, or none has loaded yet.
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
          initialsFrom(name)
        ),
      ...mergeStyles(
        stylex.props(styles.base, styles[size], styles[tone]),
        props,
      ),
    },
    render,
  })
}

// First letter of the first and last word, which handles both "Ada" and "Ada
// Lovelace" without a separate prop for how many to take. Array.from rather
// than indexing, so a name starting outside the Basic Multilingual Plane
// yields its whole first character instead of half a surrogate pair.
function initialsFrom(name: string) {
  const words = name.split(/\s+/u).filter(Boolean)
  if (words.length === 0) {
    return ''
  }
  const first = Array.from(words[0] ?? '')[0] ?? ''
  const last = words.length > 1 ? (Array.from(words.at(-1) ?? '')[0] ?? '') : ''
  return `${first}${last}`.toLocaleUpperCase()
}

export type { AvatarProps }

export default Avatar
