import * as stylex from '@stylexjs/stylex'
import { useLocale } from 'react-aria-components'

import type { RenderComponentProps } from '../render/useRender'
import type { MarkSize, MarkTone } from './styles'

import { useImageLoadingStatus } from '../hooks/useImageLoadingStatus'
import { useRender } from '../render/useRender'
import { mergeStyles } from '../styles/merge'
import { initialOfThing, initialsOfPerson } from './initials'
import { markStyles } from './styles'

// What each kind of mark is drawn as. The header of `./styles` says why the
// two differ where they do; everything not in this table is the same for
// both.
const KINDS = {
  person: {
    fit: markStyles.cover,
    initials: initialsOfPerson,
    shape: markStyles.circle,
    tintsFallback: false,
  },
  thing: {
    fit: markStyles.contain,
    initials: initialOfThing,
    shape: markStyles.square,
    tintsFallback: true,
  },
} as const

type MarkProps = Omit<RenderComponentProps<'span'>, 'children'> & {
  /** A person, which Avatar draws, or anything else, which ProductIcon does. */
  kind: keyof typeof KINDS
  /** Supplies both the fallback's initials and the accessible name. */
  name: string
  size: MarkSize
  /** An image to show in place of the initials once it has loaded. */
  src?: string
  tone: MarkTone
}

/**
 * The small identity mark Avatar and ProductIcon both render: an image once
 * it has loaded, initials until then or if it fails, named for whoever or
 * whatever it stands for. Shared rather than written into each, so a fix to
 * one reaches both. Not a component of the library's own and not exported
 * from the package; see `src/chip` for the same arrangement around a chip's
 * pill.
 */
function Mark({ kind, name, render, size, src, tone, ...props }: MarkProps) {
  const { fit, initials, shape, tintsFallback } = KINDS[kind]
  // The image is shown only once it has loaded, and the initials stay until
  // then and come back if it fails — see useImageLoadingStatus.
  const status = useImageLoadingStatus(src)
  const { locale } = useLocale()
  const fallback = initials(name, locale)

  // role/aria-label rather than letting the initials be read: "AL" is not
  // what anyone means to announce. Marking the root as an image also makes
  // its contents presentational, so the image and the initials can't be
  // announced a second time underneath the name. A span rather than an
  // <img>, which is void: this element's whole job is to hold the initials
  // shown when there is no image, or none has loaded yet.
  //
  // A blank name — one still loading, say — names nothing, so the mark is
  // then a plain element rather than an image with no name, which a screen
  // reader reads as a bare "image". Its empty initials, or its image with an
  // empty alt, leave it nothing to announce.
  const named = name.trim() !== ''

  let children
  if (status === 'loaded') {
    children = <img alt="" src={src} {...stylex.props(markStyles.image, fit)} />
  } else if (tintsFallback) {
    children = (
      <span {...stylex.props(markStyles.fallback, markStyles[tone])}>
        {fallback}
      </span>
    )
  } else {
    children = fallback
  }

  return useRender({
    defaultTagName: 'span',
    props: {
      ...(named ? { 'aria-label': name, role: 'img' } : {}),
      ...props,
      children,
      ...mergeStyles(
        stylex.props(
          markStyles.base,
          shape,
          markStyles[size],
          !tintsFallback && markStyles[tone],
        ),
        props,
      ),
    },
    render,
  })
}

export default Mark
