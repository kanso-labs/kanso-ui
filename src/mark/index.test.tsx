import type { ReactElement } from 'react'

import { act, waitFor } from '@testing-library/react'
import { hydrateRoot } from 'react-dom/client'
import { renderToString } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import Avatar from '../components/avatar'
import ProductIcon from '../components/product-icon'

// A 1x1 gif, inline so the load resolves without touching the network.
const GIF =
  'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'

// Well-formed as a URL and not as an image, so the browser reports an error
// rather than a network failure.
const NOT_AN_IMAGE = 'data:image/gif;base64,AAAA'

/**
 * Puts the server's markup for `element` in the document, waits until its
 * image has settled there — before React has attached a handler to it, as a
 * picture served with the page does — and only then hydrates it.
 */
async function hydrateAfterImageSettles(element: ReactElement) {
  const host = document.createElement('div')
  host.innerHTML = renderToString(element)
  document.body.append(host)

  const image = host.querySelector('img')
  if (image === null) {
    throw new Error('expected the server to render the image')
  }
  await waitFor(() => {
    expect(image.complete).toBe(true)
  })

  let root: ReturnType<typeof hydrateRoot> | undefined
  act(() => {
    root = hydrateRoot(host, element)
  })

  return {
    host,
    image,
    unmount() {
      act(() => {
        root?.unmount()
      })
      host.remove()
    },
  }
}

// A server-rendered page starts fetching its images before its script has
// run, so a small or cached picture has loaded by the time React hydrates.
// Its load event has gone by then, and a mark waiting on `onLoad` kept the
// picture hidden for good behind the initials.
describe('a mark hydrated over a settled image', () => {
  it.each([
    ['Avatar', <Avatar key="avatar" name="Ada Lovelace" src={GIF} />],
    ['ProductIcon', <ProductIcon key="icon" name="First item" src={GIF} />],
  ])('shows the picture in %s', async (_, element) => {
    const view = await hydrateAfterImageSettles(element)

    try {
      await waitFor(() => {
        expect(getComputedStyle(view.image).opacity).toBe('1')
      })
      expect(view.host.textContent).toBe('')
    } finally {
      view.unmount()
    }
  })

  it.each([
    [
      'Avatar',
      <Avatar key="avatar" name="Ada Lovelace" src={NOT_AN_IMAGE} />,
      'AL',
    ],
    [
      'ProductIcon',
      <ProductIcon key="icon" name="First item" src={NOT_AN_IMAGE} />,
      'F',
    ],
  ])(
    'keeps the initials in %s for a picture that failed',
    async (_, element, initials) => {
      const view = await hydrateAfterImageSettles(element)

      try {
        await waitFor(() => {
          expect(view.host.querySelector('img')).toBeNull()
        })
        expect(view.host.textContent).toBe(initials)
      } finally {
        view.unmount()
      }
    },
  )
})
