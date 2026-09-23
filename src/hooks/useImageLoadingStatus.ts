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

    const onLoad = () => {
      setSettled({ src, status: 'loaded' })
    }
    const onError = () => {
      setSettled({ src, status: 'error' })
    }

    const image = new window.Image()
    image.addEventListener('load', onLoad, { once: true })
    image.addEventListener('error', onError, { once: true })
    image.src = src

    // A load `src` has moved on from, or one the component went before, is
    // stopped rather than left to run. Taking the listeners off is what keeps
    // it from reporting an outcome nobody asked for, and lets the image go
    // once nothing else holds it; removing its source aborts the fetch. That
    // is the source removed rather than set empty, which would also abort it
    // but queue an `error` event on the way.
    return () => {
      image.removeEventListener('load', onLoad)
      image.removeEventListener('error', onError)
      image.removeAttribute('src')
    }
  }, [src])

  if (src === undefined) {
    return 'error'
  }
  return settled?.src === src ? settled.status : 'loading'
}

export type { ImageLoadingStatus }

export { useImageLoadingStatus }
