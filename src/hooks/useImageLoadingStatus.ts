import type { SyntheticEvent } from 'react'

import { useCallback, useState } from 'react'

type ImageLoadingStatus = 'error' | 'loaded' | 'loading'

interface Loaded {
  /** The resource the browser chose and loaded, out of a `srcSet` too. */
  shown: string
  /** The `src` it loaded for. */
  src: string
}

/** Settles an image whose natural width cannot tell a load from a failure. */
async function settleOnDecode(
  image: HTMLImageElement,
  onLoaded: (image: HTMLImageElement) => void,
  onFailed: (image: HTMLImageElement) => void,
) {
  try {
    await image.decode()
  } catch {
    onFailed(image)
    return
  }
  onLoaded(image)
}

/**
 * Whether the picture at `src` can be shown yet, from what the component's
 * own `<img>` reports. The image is rendered from the start and hidden until
 * it loads, so the browser fetches it as it would any image — `loading`,
 * `srcSet` and `sizes` all apply, which a detached preloader started on
 * mount left them no part in — and hand `onLoad`, `onError` and `ref` to
 * that element, the last for a picture that settled before the other two
 * were attached. A component keeps its fallback until the picture is ready
 * and brings it back if the picture fails, so the browser's broken-image
 * glyph is never what shows.
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

  // Read off the element rather than closed over, so the one set of
  // handlers serves whichever `src` the element carries when it settles.
  const settleLoaded = useCallback((image: HTMLImageElement) => {
    const from = image.getAttribute('src')
    if (from !== null) {
      setLoaded({
        shown: image.currentSrc === '' ? from : image.currentSrc,
        src: from,
      })
    }
  }, [])
  const settleFailed = useCallback((image: HTMLImageElement) => {
    const from = image.getAttribute('src')
    if (from !== null) {
      setFailed(from)
    }
  }, [])
  const onLoad = useCallback(
    (event: SyntheticEvent<HTMLImageElement>) => {
      settleLoaded(event.currentTarget)
    },
    [settleLoaded],
  )
  const onError = useCallback(
    (event: SyntheticEvent<HTMLImageElement>) => {
      settleFailed(event.currentTarget)
    },
    [settleFailed],
  )

  // An image can settle before React is listening for it. A server-rendered
  // page fetches its images before its script runs, so a small or cached
  // picture has loaded, or failed, by the time React hydrates the element
  // and attaches `onLoad` and `onError` — and the event they wait for has
  // already gone. The ref reads the outcome off the element instead.
  // `complete` is also true of a broken image, and a loaded one has a
  // natural width, so that answers it, except for an SVG with no intrinsic
  // size: Firefox gives one a natural width of 0. `decode()` resolves for a
  // picture that loaded and rejects for one that failed, which settles
  // those. An image still loading is left to its handlers.
  const ref = useCallback(
    (image: HTMLImageElement | null) => {
      if (image === null || !image.complete) {
        return
      }
      if (image.naturalWidth > 0) {
        settleLoaded(image)
        return
      }
      void settleOnDecode(image, settleLoaded, settleFailed)
    },
    [settleFailed, settleLoaded],
  )

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
    ref,
    status,
  }
}

export type { ImageLoadingStatus }

export { useImageLoadingStatus }
