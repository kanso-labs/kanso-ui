import { render, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { useImageLoadingStatus } from './useImageLoadingStatus'

// A 1x1 gif, inline so the load resolves without touching the network.
const GIF =
  'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'

// Well-formed as a URL and not as an image, so the browser reports an error
// rather than a network failure.
const NOT_AN_IMAGE = 'data:image/gif;base64,AAAA'

function Probe({ src }: { src?: string }) {
  return <output>{useImageLoadingStatus(src)}</output>
}

describe('useImageLoadingStatus', () => {
  it('reports a picture once it has loaded', async () => {
    const view = render(<Probe src={GIF} />)

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

  it('follows a change of src', async () => {
    const view = render(<Probe src={NOT_AN_IMAGE} />)
    await waitFor(() => {
      expect(view.getByRole('status').textContent).toBe('error')
    })

    view.rerender(<Probe src={GIF} />)
    await waitFor(() => {
      expect(view.getByRole('status').textContent).toBe('loaded')
    })
  })
})
