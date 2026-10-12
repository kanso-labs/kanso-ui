import { render, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { useImageLoadingStatus } from './useImageLoadingStatus'

// A 1x1 gif, inline so the load resolves without touching the network.
const GIF =
  'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'

// The same picture under another `src`, so a change of source can be read
// settling.
const OTHER_GIF = `${GIF}#other`

// Well-formed as a URL and not as an image, so the browser reports an error
// rather than a network failure.
const NOT_AN_IMAGE = 'data:image/gif;base64,AAAA'

// Never answered, so a load of it is still in flight when the case reads it.
const PENDING = 'https://example.invalid/pending.png'

// What a component does with the hook: renders the image with its handlers,
// and reads back the outcome and the picture to keep showing.
function Probe({ src }: { src?: string }) {
  const { onError, onLoad, previous, status } = useImageLoadingStatus(src)
  return (
    <>
      <output>{status}</output>
      <span data-testid="previous">{previous ?? ''}</span>
      {src === undefined ? null : (
        <img alt="" key={src} onError={onError} onLoad={onLoad} src={src} />
      )}
    </>
  )
}

describe('useImageLoadingStatus', () => {
  it('reports a picture once its own element has loaded it', async () => {
    const view = render(<Probe src={GIF} />)
    expect(view.getByRole('status').textContent).toBe('loading')

    await waitFor(() => {
      expect(view.getByRole('status').textContent).toBe('loaded')
    })
  })

  it('reports a picture that fails', async () => {
    const view = render(<Probe src={NOT_AN_IMAGE} />)

    await waitFor(() => {
      expect(view.getByRole('status').textContent).toBe('error')
    })
  })

  // The outcome is the same as a failure: the fallback shows.
  it('counts no src as a failure', () => {
    const view = render(<Probe />)
    expect(view.getByRole('status').textContent).toBe('error')
  })

  // A new source reads as loading rather than as the old outcome, and the
  // picture that loaded last is what to keep showing until it settles.
  it('hands back the picture last loaded while a new one loads', async () => {
    const view = render(<Probe src={GIF} />)
    await waitFor(() => {
      expect(view.getByRole('status').textContent).toBe('loaded')
    })

    view.rerender(<Probe src={PENDING} />)

    expect(view.getByRole('status').textContent).toBe('loading')
    expect(view.getByTestId('previous').textContent).toBe(GIF)
  })

  it('lets the previous picture go once the new one has loaded', async () => {
    const view = render(<Probe src={GIF} />)
    await waitFor(() => {
      expect(view.getByRole('status').textContent).toBe('loaded')
    })

    view.rerender(<Probe src={OTHER_GIF} />)

    await waitFor(() => {
      expect(view.getByRole('status').textContent).toBe('loaded')
    })
    expect(view.getByTestId('previous').textContent).toBe('')
  })

  // A new source that fails is shown as the failure it is, not hidden
  // behind the picture before it.
  it('lets the previous picture go once the new one fails', async () => {
    const view = render(<Probe src={GIF} />)
    await waitFor(() => {
      expect(view.getByRole('status').textContent).toBe('loaded')
    })

    view.rerender(<Probe src={NOT_AN_IMAGE} />)

    await waitFor(() => {
      expect(view.getByRole('status').textContent).toBe('error')
    })
    expect(view.getByTestId('previous').textContent).toBe('')
  })

  it('reads a source loaded before as loaded again on return', async () => {
    const view = render(<Probe src={GIF} />)
    await waitFor(() => {
      expect(view.getByRole('status').textContent).toBe('loaded')
    })

    view.rerender(<Probe src={PENDING} />)
    view.rerender(<Probe src={GIF} />)

    expect(view.getByRole('status').textContent).toBe('loaded')
  })
})
