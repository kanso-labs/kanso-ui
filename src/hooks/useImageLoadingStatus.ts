import { useEffect, useState } from 'react'

type ImageLoadingStatus = 'error' | 'loaded' | 'loading'

interface Settled {
  src: string
  status: 'error' | 'loaded'
}

/**
 * Whether an image at `src` can be shown yet. It is loaded off-screen first,
 * so a component can keep its fallback in place until the picture is ready
 * and bring the fallback back if the picture fails — an `<img>` swapped in
 * as soon as `src` is known would show the browser's broken-image glyph in
 * between.
 *
 * No `src` counts as a failure, since the outcome is the same: the fallback
 * shows. What settled is remembered against the `src` it settled for, so a
 * change of `src` reads as loading again rather than as the old outcome.
 */
function useImageLoadingStatus(src: string | undefined): ImageLoadingStatus {
  const [settled, setSettled] = useState<null | Settled>(null)

  useEffect(() => {
    if (src === undefined) {
      return undefined
    }

    let mounted = true
    const settle = (status: Settled['status']) => () => {
      if (mounted) {
        setSettled({ src, status })
      }
    }

    const image = new window.Image()
    image.addEventListener('load', settle('loaded'), { once: true })
    image.addEventListener('error', settle('error'), { once: true })
    image.src = src

    return () => {
      mounted = false
    }
  }, [src])

  if (src === undefined) {
    return 'error'
  }
  return settled?.src === src ? settled.status : 'loading'
}

export type { ImageLoadingStatus }

export { useImageLoadingStatus }
