import type { SyntheticEvent } from 'react'

import { useCallback, useState } from 'react'

type ImageLoadingStatus = 'error' | 'loaded' | 'loading'

interface Loaded {
  /** The resource the browser chose and loaded, out of a `srcSet` too. */
  shown: string
  /** The `src` it loaded for. */
  src: string
}

/**
 * Whether the picture at `src` can be shown yet, from what the component's
 * own `<img>` reports. The image is rendered from the start and hidden until
 * it loads, so the browser fetches it as it would any image — `loading`,
 * `srcSet` and `sizes` all apply, which a detached preloader started on
 * mount left them no part in — and hand `onLoad` and `onError` to that
 * element. A component keeps its fallback until the picture is ready and
 * brings it back if the picture fails, so the browser's broken-image glyph
 * is never what shows.
 *
 * `previous` is the picture last loaded, while a new `src` is still loading,
 * so the component can keep showing it rather than drop back to the fallback
 * for as long as the new one takes — a theme swapping one logo for another
 * flashed the initial between them. It is the resource the browser actually
 * loaded, which is cached, so an element showing it needs no `srcSet`.
 *
 * No `src` counts as a failure, since the outcome is the same: the fallback
 * shows. Outcomes are remembered against the `src` they came for, so a
 * change of `src` reads as loading rather than as the old outcome.
 */
function useImageLoadingStatus(src: string | undefined) {
  const [loaded, setLoaded] = useState<Loaded | null>(null)
  const [failed, setFailed] = useState<null | string>(null)

  // Read off the element rather than closed over, so the one pair of
  // handlers serves whichever `src` the element carries when it settles.
  const onLoad = useCallback((event: SyntheticEvent<HTMLImageElement>) => {
    const image = event.currentTarget
    const from = image.getAttribute('src')
    if (from !== null) {
      setLoaded({
        shown: image.currentSrc === '' ? from : image.currentSrc,
        src: from,
      })
    }
  }, [])
  const onError = useCallback((event: SyntheticEvent<HTMLImageElement>) => {
    const from = event.currentTarget.getAttribute('src')
    if (from !== null) {
      setFailed(from)
    }
  }, [])

  let status: ImageLoadingStatus = 'loading'
  if (src === undefined || failed === src) {
    status = 'error'
  } else if (loaded?.src === src) {
    status = 'loaded'
  }

  return {
    onError,
    onLoad,
    previous: status === 'loading' ? loaded?.shown : undefined,
    status,
  }
}

export type { ImageLoadingStatus }

export { useImageLoadingStatus }
