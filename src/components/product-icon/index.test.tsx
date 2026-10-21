import * as stylex from '@stylexjs/stylex'
import { render, waitFor } from '@testing-library/react'
import { I18nProvider } from 'react-aria-components'
import { describe, expect, it } from 'vitest'

import ProductIcon from '.'
import { typography } from '../../tokens/design.tokens.stylex'
import Avatar from '../avatar'

// A 2:1 PNG, so `contain` and `cover` resolve to visibly different geometry
// and the assertions below cannot both pass. Inline rather than fetched: a
// real request would make these tests depend on the dev server serving a
// fixture, and the fallback is swapped out only once the image has loaded.
const WIDE_MARK =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAAABCAYAAAD0In+KAAAAFElEQVR4nGP8z8Dwn4GBgYERRIAAI7YCCXhOjT8AAAAASUVORK5CYII='

// The face the initials are set in, read off a probe drawn in it.
const probeStyles = stylex.create({
  titleMediumFace: {
    fontFamily: typography.titleMediumFont,
    fontWeight: typography.titleMediumWeight,
  },
})

// Type unlike any the initial takes, set around the icon, so a property the
// mark leaves unset reads as this rather than as the page's default.
const AROUND = {
  fontFamily: 'monospace',
  fontSize: '30px',
  fontWeight: 900,
  letterSpacing: '3px',
  lineHeight: '50px',
} as const

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

  // A theme swapping one logo for another used to show the tinted initial
  // for as long as the new logo took to load. The logo before stays until
  // the new one has, with no initial behind or between them.
  it('keeps the mark before while a new one loads', async () => {
    const view = render(<ProductIcon name="First item" src={WIDE_MARK} />)
    await waitFor(() => {
      const image = view.container.querySelector('img')
      expect(image === null ? null : getComputedStyle(image).opacity).toBe('1')
    })

    view.rerender(
      <ProductIcon
        name="First item"
        src="https://example.invalid/pending.png"
      />,
    )

    expect(view.container.querySelectorAll('img')).toHaveLength(2)
    expect(
      getComputedStyle(view.container.querySelectorAll('img')[0]).opacity,
    ).toBe('1')
    expect(iconIn(view.container).textContent).toBe('')
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

  // The type Avatar's initials take at each size, since the two share the
  // mark: title medium at `md`, the role Material Design's list tokens give a
  // 40dp leading avatar's label.
  it.each([
    ['sm', '14px', '20px', '0.1px'],
    ['md', '16px', '24px', '0.15px'],
    // A tracking of 0 reads as `normal`; one left unset would read 3px.
    ['lg', '22px', '28px', 'normal'],
  ] as const)(
    'sets the initial at %s in %s on %s, letter-spacing %s',
    (size, fontSize, lineHeight, letterSpacing) => {
      const probe = render(
        <span
          data-testid="face"
          {...stylex.props(probeStyles.titleMediumFace)}
        />,
      )
      const face = getComputedStyle(probe.getByTestId('face'))
      const expected = {
        fontFamily: face.fontFamily,
        fontWeight: face.fontWeight,
      }
      probe.unmount()

      const view = render(
        <div style={AROUND}>
          <ProductIcon name="Label" size={size} />
        </div>,
      )
      const initial = view.getByText('L')
      const computed = getComputedStyle(initial)

      expect(computed.fontSize).toBe(fontSize)
      expect(computed.lineHeight).toBe(lineHeight)
      expect(computed.letterSpacing).toBe(letterSpacing)
      expect(computed.fontFamily).toBe(expected.fontFamily)
      expect(computed.fontWeight).toBe(expected.fontWeight)
    },
  )

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

  // The initial is a grapheme, what a reader sees as one character, rather
  // than a code point, which drops an accent written as a combining mark and
  // cuts a flag or a joined emoji in half. And it is one grapheme after
  // upper-casing too, which turns "ß" into "SS".
  it.each([
    ['an accent written as a combining mark', 'e\u0301clair', 'E\u0301'],
    ['a flag', '\u{1F1E7}\u{1F1F7} label', '\u{1F1E7}\u{1F1F7}'],
    [
      'a joined emoji',
      '\u{1F468}\u200D\u{1F469}\u200D\u{1F467} label',
      '\u{1F468}\u200D\u{1F469}\u200D\u{1F467}',
    ],
    ['a letter that upper-cases to two', '\u00DFeta', 'S'],
  ])('keeps %s whole, as one grapheme', (_case, name, initial) => {
    const view = render(<ProductIcon name={name} />)

    expect(iconIn(view.container).textContent).toBe(initial)
  })

  it("upper-cases in the I18nProvider's locale", () => {
    const view = render(
      <I18nProvider locale="tr-TR">
        <ProductIcon name="ilk" />
      </I18nProvider>,
    )

    expect(iconIn(view.container).textContent).toBe('\u0130')
  })

  // A name can open with punctuation that stands for nothing — the @ of a
  // handle, the # of a channel, a bracket — and the initial is the first
  // letter after it.
  it.each([
    ['@first', 'F'],
    ['#second', 'S'],
    ['(third) item', 'T'],
    ['"fourth"', 'F'],
  ])('passes over the punctuation that opens %s', (name, initial) => {
    const view = render(<ProductIcon name={name} />)

    expect(iconIn(view.container).textContent).toBe(initial)
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

  // Beside the name of what it identifies, the mark announced the name a
  // second time. Decorative, it is hidden whole and still drawn.
  it('is hidden from assistive technology while decorative', () => {
    const view = render(<ProductIcon decorative name="First item" />)
    const icon = view.container.firstElementChild

    expect(view.queryByRole('img')).toBeNull()
    expect(icon?.hasAttribute('role')).toBe(false)
    expect(icon?.hasAttribute('aria-label')).toBe(false)
    expect(icon?.getAttribute('aria-hidden')).toBe('true')
    expect(icon?.textContent).toBe('F')
  })

  // A blank name names nothing. Announced as an image, the icon would be one
  // with no name, which a screen reader reads as a bare "image" and an
  // accessibility audit fails; left as a plain element, its empty initial or
  // its mark, drawn with an empty alt, give it nothing to read.
  it('is not announced at all while the name is blank', () => {
    for (const name of ['', '   ']) {
      const view = render(<ProductIcon name={name} />)

      expect(view.queryByRole('img')).toBeNull()
      expect(iconIn(view.container).hasAttribute('aria-label')).toBe(false)
      view.unmount()
    }
  })

  // The mark is drawn with an empty alt, so once it loads it does not become
  // the image the root stopped being.
  it('is not announced once a mark loads under a blank name', async () => {
    const view = render(<ProductIcon name="   " src={WIDE_MARK} />)
    await waitFor(() => {
      if (!view.container.querySelector('img')) {
        throw new Error('image has not rendered yet')
      }
    })

    expect(view.queryByRole('img')).toBeNull()
  })

  it('forwards arbitrary props', () => {
    const view = render(
      <ProductIcon data-testid="mark" id="mark-id" name="Label" />,
    )

    expect(view.getByTestId('mark').id).toBe('mark-id')
  })
})
