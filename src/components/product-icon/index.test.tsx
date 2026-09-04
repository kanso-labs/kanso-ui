import { render, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import ProductIcon from '.'
import Avatar from '../avatar'

// A 2:1 PNG, so `contain` and `cover` resolve to visibly different geometry
// and the assertions below cannot both pass. Inline rather than fetched: a
// real request would make these tests depend on the dev server serving a
// fixture, and the fallback is swapped out only once the image has loaded.
const WIDE_MARK =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAAABCAYAAAD0In+KAAAAFElEQVR4nGP8z8Dwn4GBgYERRIAAI7YCCXhOjT8AAAAASUVORK5CYII='

/** The rendered element, narrowed so a failure to render fails here. */
function iconIn(container: HTMLElement) {
  const root = container.firstElementChild
  if (!(root instanceof HTMLElement)) {
    throw new Error('expected the product icon to render an element')
  }
  return root
}

describe('shape', () => {
  // The first of the two things that separate this from Avatar. A logo is
  // drawn to its own bounding box, so a circle would crop the corners it was
  // composed with.
  it('is a rounded square rather than a circle', () => {
    const view = render(<ProductIcon name="First item" />)
    const computed = getComputedStyle(iconIn(view.container))

    expect(computed.borderRadius).not.toBe('0px')
    expect(computed.borderRadius).not.toBe('9999px')
  })

  it('is square at every size', () => {
    for (const size of ['sm', 'md', 'lg'] as const) {
      const view = render(<ProductIcon name="First item" size={size} />)
      const computed = getComputedStyle(iconIn(view.container))

      expect(computed.width).toBe(computed.height)
      view.unmount()
    }
  })

  // Interchangeable with Avatar in a leading slot, which only holds if the
  // two agree on what each size means.
  it('matches Avatar size for size', () => {
    for (const size of ['sm', 'md', 'lg'] as const) {
      const icon = render(<ProductIcon name="First item" size={size} />)
      const iconBox = getComputedStyle(iconIn(icon.container)).width
      icon.unmount()

      const avatar = render(<Avatar name="Ada Lovelace" size={size} />)
      const avatarBox = getComputedStyle(iconIn(avatar.container)).width
      avatar.unmount()

      expect(iconBox).toBe(avatarBox)
    }
  })
})

describe('the mark', () => {
  // The second thing that separates this from Avatar, and the one with teeth:
  // cropping a face to fill a circle loses nothing anyone minds, but cropping
  // a wordmark loses the word.
  it('letterboxes the mark rather than cropping it', async () => {
    const view = render(<ProductIcon name="First item" src={WIDE_MARK} />)
    const image = await waitFor(() => {
      const found = view.container.querySelector('img')
      if (!found) {
        throw new Error('image has not rendered yet')
      }
      return found
    })

    expect(getComputedStyle(image).objectFit).toBe('contain')
  })

  it('crops where Avatar does, so the two are genuinely different', async () => {
    const view = render(<Avatar name="Ada Lovelace" src={WIDE_MARK} />)
    const image = await waitFor(() => {
      const found = view.container.querySelector('img')
      if (!found) {
        throw new Error('image has not rendered yet')
      }
      return found
    })

    expect(getComputedStyle(image).objectFit).toBe('cover')
  })

  it('renders no image at all without a src', () => {
    const view = render(<ProductIcon name="First item" />)

    expect(view.container.querySelector('img')).toBeNull()
  })

  // The tint belongs to the fallback, not to the square. A mark is letterboxed
  // into that square and may be drawn with transparency, so a tone on the root
  // showed as a coloured box around every logo that was not an opaque square.
  it('puts nothing behind a loaded mark', async () => {
    const view = render(<ProductIcon name="First item" src={WIDE_MARK} />)
    await waitFor(() => {
      if (!view.container.querySelector('img')) {
        throw new Error('image has not rendered yet')
      }
    })

    const background = getComputedStyle(iconIn(view.container)).backgroundColor

    expect(background).toBe('rgba(0, 0, 0, 0)')
  })
})

describe('the fallback', () => {
  // One letter, where Avatar takes two. "Second item" is not a first and last
  // name, so initialising both words would announce a pair of initials for
  // something that was never two names.
  it('falls back to a single initial', () => {
    const view = render(<ProductIcon name="Second item" />)

    expect(iconIn(view.container).textContent).toBe('S')
  })

  it('takes fewer initials than Avatar does from the same string', () => {
    const icon = render(<ProductIcon name="Second item" />)
    const iconText = iconIn(icon.container).textContent
    icon.unmount()

    const avatar = render(<Avatar name="Second item" />)
    const avatarText = iconIn(avatar.container).textContent

    expect(iconText).toBe('S')
    expect(avatarText).toBe('SI')
  })

  it('uppercases a lowercase name', () => {
    const view = render(<ProductIcon name="first item" />)

    expect(iconIn(view.container).textContent).toBe('F')
  })

  // Array.from rather than indexing, so a name starting outside the Basic
  // Multilingual Plane yields its whole first character rather than half a
  // surrogate pair.
  it('keeps an astral first character whole', () => {
    const view = render(<ProductIcon name="𝒜 label" />)

    expect(iconIn(view.container).textContent).toBe('𝒜')
  })

  it('renders nothing for a blank name', () => {
    const view = render(<ProductIcon name="   " />)

    expect(iconIn(view.container).textContent).toBe('')
  })

  // The other half of the pair above: the tone still has to be visible in the
  // one state it is for, or moving it off the root would have removed it.
  it('carries the tone while there is no mark', () => {
    const view = render(<ProductIcon name="First item" />)
    const fallback = iconIn(view.container).firstElementChild

    if (!(fallback instanceof HTMLElement)) {
      throw new Error('expected the fallback to render an element')
    }

    expect(getComputedStyle(fallback).backgroundColor).not.toBe(
      'rgba(0, 0, 0, 0)',
    )
  })
})

describe('accessibility', () => {
  // The name is announced, not the letter: "B" is not what anyone means.
  it('announces the name rather than the initial', () => {
    const view = render(<ProductIcon name="First item" />)

    expect(view.getByRole('img', { name: 'First item' })).toBeInTheDocument()
  })

  it('forwards arbitrary props', () => {
    const view = render(
      <ProductIcon data-testid="mark" id="mark-id" name="Label" />,
    )

    expect(view.getByTestId('mark').id).toBe('mark-id')
  })
})
