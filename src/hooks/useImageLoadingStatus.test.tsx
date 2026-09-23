import type { MockInstance } from 'vitest'

import { render, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { useImageLoadingStatus } from './useImageLoadingStatus'

// A 1x1 gif, inline so the load resolves without touching the network.
const GIF =
  'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'

// Well-formed as a URL and not as an image, so the browser reports an error
// rather than a network failure.
const NOT_AN_IMAGE = 'data:image/gif;base64,AAAA'

// Never answered, so a load of it is still in flight when the case moves on.
const PENDING = 'https://example.invalid/pending.png'

interface Captured {
  add: MockInstance
  element: HTMLImageElement
  remove: MockInstance
}

// The images the hook creates, each a real element with its listeners
// watched, so a case can read what the hook left on one it was done with.
function captureImages() {
  const images: Captured[] = []
  vi.spyOn(window, 'Image').mockImplementation(function () {
    const element = document.createElement('img')
    images.push({
      add: vi.spyOn(element, 'addEventListener'),
      element,
      remove: vi.spyOn(element, 'removeEventListener'),
    })
    return element
  })
  return images
}

// Every listener the hook added to an image, and every one it took off, as
// type and function, so the two can be compared.
function listeners(image: Captured) {
  return {
    added: pairs(image.add.mock.calls),
    removed: pairs(image.remove.mock.calls),
  }
}

function pairs(calls: unknown[][]) {
  return calls.map(([type, listener]) => [type, listener])
}

function Probe({ src }: { src?: string }) {
  return <output>{useImageLoadingStatus(src)}</output>
}

describe('useImageLoadingStatus', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

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

  // A load the component no longer wants is stopped rather than left to run:
  // its listeners are taken off, so nothing holds the image once the hook
  // lets go of it, and its source is cleared, which aborts the fetch.
  it('stops a load in flight when the component goes', () => {
    const images = captureImages()
    const view = render(<Probe src={PENDING} />)
    view.unmount()

    const [image] = images
    expect(image).toBeDefined()
    const { added, removed } = listeners(image)
    expect(added).toHaveLength(2)
    expect(removed).toEqual(added)
    expect(image.element.hasAttribute('src')).toBe(false)
  })

  it('stops a load in flight when src moves on, and follows the new one', async () => {
    const images = captureImages()
    const view = render(<Probe src={PENDING} />)
    view.rerender(<Probe src={GIF} />)

    const [first, second] = images
    const { added, removed } = listeners(first)
    expect(removed).toEqual(added)
    expect(first.element.hasAttribute('src')).toBe(false)
    expect(second.element.getAttribute('src')).toBe(GIF)
    await waitFor(() => {
      expect(view.getByRole('status').textContent).toBe('loaded')
    })
  })
})
