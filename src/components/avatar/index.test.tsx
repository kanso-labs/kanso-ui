import * as stylex from '@stylexjs/stylex'
import { render, waitFor } from '@testing-library/react'
import { I18nProvider } from 'react-aria-components'
import { describe, expect, it } from 'vitest'

import Avatar from '.'
import { colors } from '../../tokens/design.tokens.stylex'

// Compared against elements styled straight from the tokens rather than hex
// literals, so the assertions pin which pair a tone reaches for without also
// pinning what that pair currently resolves to.
const probeStyles = stylex.create({
  primaryPair: {
    backgroundColor: colors.primaryContainer,
    color: colors.onPrimaryContainer,
  },
  tertiaryPair: {
    backgroundColor: colors.tertiaryContainer,
    color: colors.onTertiaryContainer,
  },
})

// A 1x1 gif, inline so the load resolves without touching the network.
const PHOTO =
  'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'

// Never answered, so its load is still in flight when the case reads it.
const PENDING = 'https://example.invalid/pending.png'

// Well-formed as a URL and not as an image, so the browser reports an error.
const NOT_AN_IMAGE = 'data:image/gif;base64,AAAA'

const IMG_PROPS = {
  loading: 'eager',
  referrerPolicy: 'no-referrer',
  sizes: '40px',
  srcSet: `${PHOTO} 1x`,
} as const

/** The photo the avatar renders: the first image inside it. */
function photoIn(container: HTMLElement) {
  const photo = container.querySelector('img')
  if (photo === null) {
    throw new Error('expected the avatar to render its photo')
  }
  return photo
}

function setup(props: Partial<Parameters<typeof Avatar>[0]> = {}) {
  const view = render(<Avatar name="Ada Lovelace" {...props} />)
  return { ...view, avatar: view.getByRole('img') }
}

describe('avatar', () => {
  describe('initials', () => {
    it('takes the first letter of the first and last name', () => {
      const { avatar } = setup()
      expect(avatar.textContent).toBe('AL')
    })

    it('takes one letter from a single-word name', () => {
      const { avatar } = setup({ name: 'Ada' })
      expect(avatar.textContent).toBe('A')
    })

    it('skips the middle of a longer name', () => {
      const { avatar } = setup({ name: 'Ada  King   Lovelace' })
      expect(avatar.textContent).toBe('AL')
    })

    // Found through the container rather than as an image, since a blank
    // name is not announced as one — see "accessibility" below.
    it('renders nothing for a name that is only whitespace', () => {
      const view = render(<Avatar name="   " />)
      expect(view.container.firstElementChild?.textContent).toBe('')
    })

    // Indexing a string with [0] would split the surrogate pair and render a
    // replacement character, so this fails on the obvious implementation.
    it('keeps a first character from outside the Basic Multilingual Plane whole', () => {
      const { avatar } = setup({ name: '𝒜da 𝓁ovelace' })
      expect(avatar.textContent).toBe('𝒜𝓁')
    })

    it('uppercases initials that were given in lower case', () => {
      const { avatar } = setup({ name: 'ada lovelace' })
      expect(avatar.textContent).toBe('AL')
    })

    // A character is a grapheme rather than a code point. Each of these is
    // several code points drawn as one: an accent written as a combining
    // mark, a joined emoji, and an Indic conjunct.
    it.each([
      ['A\u0301da Lovelace', 'A\u0301L'],
      ['\u{1F469}\u200D\u{1F4BB} Lovelace', '\u{1F469}\u200D\u{1F4BB}L'],
      [
        '\u0915\u094D\u0937\u092E\u093E \u0936\u0930\u094D\u092E\u093E',
        '\u0915\u094D\u0937\u0936',
      ],
    ])('keeps a character drawn as one whole, in %s', (name, initials) => {
      const { avatar } = setup({ name })
      expect(avatar.textContent).toBe(initials)
    })

    // A display name carries more than the name: a title before it, a
    // suffix after it, an aside in brackets, punctuation around a word.
    // None of it is an initial.
    it.each([
      ['Ada Lovelace (she/her)', 'AL'],
      ['(Ada) Lovelace', 'AL'],
      ['"Ada" Lovelace', 'AL'],
      ['Dr. Ada Lovelace', 'AL'],
      ['Ada Lovelace Jr.', 'AL'],
      ['Ada Lovelace, Jr.', 'AL'],
      ['Ada Lovelace III', 'AL'],
      ['Ada Lovelace 3rd', 'AL'],
      ['A. B. Lovelace', 'AL'],
    ])('initialises %s as %s', (name, initials) => {
      const { avatar } = setup({ name })
      expect(avatar.textContent).toBe(initials)
    })

    // Upper-casing can lengthen a letter — "ß" is "SS" — and two initials
    // stay two.
    it('keeps to two initials when a letter upper-cases to two', () => {
      const { avatar } = setup({ name: '\u00DFen M\u00FCller' })
      expect(avatar.textContent).toBe('SM')
    })

    // Arabic letters join to the next, so two initials side by side shaped
    // into one connected word. A zero-width non-joiner between them keeps
    // them two letters, and only where the script joins.
    it('keeps two initials in a joining script apart', () => {
      const view = render(
        <I18nProvider locale="ar-EG">
          <Avatar name={'\u0645\u062D\u0645\u062F \u0639\u0644\u064A'} />
        </I18nProvider>,
      )
      expect(view.getByRole('img').textContent).toBe('\u0645\u200C\u0639')
      view.unmount()

      expect(setup().avatar.textContent).toBe('AL')
    })

    // Turkish upper-cases a dotted "i" to "İ" where English gives "I", so
    // the case only passes in the provider's locale.
    it("upper-cases in the I18nProvider's locale", () => {
      const view = render(
        <I18nProvider locale="tr-TR">
          <Avatar name="ilk son" />
        </I18nProvider>,
      )
      expect(view.getByRole('img').textContent).toBe('\u0130S')
    })
  })

  describe('accessibility', () => {
    // getByRole's name option runs Testing Library's own accessible-name
    // computation, so this asserts what assistive technology would actually
    // announce rather than that a particular attribute happens to be set.
    it('announces the person rather than their initials', () => {
      const view = render(<Avatar name="Ada Lovelace" />)
      expect(view.getByRole('img', { name: 'Ada Lovelace' })).toBe(
        view.getByRole('img'),
      )
    })

    // The initials are visible to sighted users but must not be what gets
    // read out — role="img" on the root is what makes its contents
    // presentational, and without it "AL" would be announced too.
    it('keeps the initials visible without letting them name the avatar', () => {
      const view = render(<Avatar name="Ada Lovelace" />)
      expect(view.getByRole('img').textContent).toBe('AL')
      expect(view.queryByRole('img', { name: 'AL' })).toBeNull()
    })

    // Beside the name it stands for — a row whose headline is the person —
    // an avatar announced the name a second time. Decorative, it is hidden
    // whole, so its initials are not read as bare letters either, and still
    // drawn.
    it('is hidden from assistive technology while decorative', () => {
      const view = render(<Avatar decorative name="Ada Lovelace" />)
      const avatar = view.container.firstElementChild

      expect(view.queryByRole('img')).toBeNull()
      expect(avatar?.hasAttribute('role')).toBe(false)
      expect(avatar?.hasAttribute('aria-label')).toBe(false)
      expect(avatar?.getAttribute('aria-hidden')).toBe('true')
      expect(avatar?.textContent).toBe('AL')
    })

    // A blank name has no initials to take, and drew an empty disc. It
    // draws the anonymous person instead — decoration, so still unnamed.
    it('draws the anonymous person for a blank name, announcing nothing', () => {
      for (const name of ['', '   ']) {
        const view = render(<Avatar name={name} />)
        const avatar = view.container.firstElementChild
        const glyph = avatar?.querySelector('svg')

        expect(glyph?.getAttribute('aria-hidden')).toBe('true')
        expect(avatar?.hasAttribute('role')).toBe(false)
        expect(avatar?.hasAttribute('aria-label')).toBe(false)
        view.unmount()
      }
    })

    // A loading skeleton wants the plain disc.
    it('leaves the disc empty for a blank name when asked', () => {
      const view = render(<Avatar name="" showPersonIcon={false} />)
      expect(view.container.firstElementChild?.childElementCount).toBe(0)
    })

    // A name with initials draws them, never the glyph.
    it('draws no glyph for a name with initials', () => {
      const view = render(<Avatar name="Ada Lovelace" />)
      expect(view.container.querySelector('svg')).toBeNull()
    })

    // A blank name names nothing. Announced as an image, the avatar would be
    // one with no name, which a screen reader reads as a bare "image" and an
    // accessibility audit fails; left as a plain element, its empty initials
    // or its photo, drawn with an empty alt, give it nothing to read.
    it('is not announced at all while the name is blank', () => {
      for (const name of ['', '   ']) {
        const view = render(<Avatar name={name} />)
        const avatar = view.container.firstElementChild

        expect(view.queryByRole('img')).toBeNull()
        expect(avatar?.hasAttribute('aria-label')).toBe(false)
        view.unmount()
      }
    })
  })

  describe('appearance', () => {
    it('renders each size at its own diameter', () => {
      const sizes = [
        ['sm', '36px'],
        ['md', '40px'],
        ['lg', '56px'],
      ] as const

      for (const [size, diameter] of sizes) {
        const { avatar, unmount } = setup({ size })
        const computed = getComputedStyle(avatar)
        expect(computed.width).toBe(diameter)
        expect(computed.height).toBe(diameter)
        unmount()
      }
    })

    it('tints with the container and on-container pair of its tone', () => {
      const probe = render(
        <div>
          <div
            data-testid="primary"
            {...stylex.props(probeStyles.primaryPair)}
          />
          <div
            data-testid="tertiary"
            {...stylex.props(probeStyles.tertiaryPair)}
          />
        </div>,
      )
      const primary = getComputedStyle(probe.getByTestId('primary'))
      const expected = {
        primaryBackground: primary.backgroundColor,
        primaryColor: primary.color,
        tertiaryBackground: getComputedStyle(probe.getByTestId('tertiary'))
          .backgroundColor,
      }
      probe.unmount()

      const { avatar, unmount } = setup()
      const actual = getComputedStyle(avatar)
      expect(actual.backgroundColor).toBe(expected.primaryBackground)
      expect(actual.color).toBe(expected.primaryColor)
      unmount()

      // A second tone, so the assertion above is pinning the tone rather than
      // a colour every avatar happens to share.
      const { avatar: tertiary } = setup({ tone: 'tertiary' })
      expect(getComputedStyle(tertiary).backgroundColor).toBe(
        expected.tertiaryBackground,
      )
      expect(expected.tertiaryBackground).not.toBe(expected.primaryBackground)
    })
  })

  describe('photo', () => {
    it('renders no image element when given no src', () => {
      const view = render(<Avatar name="Ada Lovelace" />)
      expect(view.container.querySelector('img')).toBeNull()
    })

    // The photo is the real element from the first render, so the browser
    // fetches it as it would any image: lazily, which a detached preloader
    // started on mount never allowed. It is hidden, over the initials, until
    // it has loaded.
    it('renders the photo lazily from the start, hidden until it loads', async () => {
      const view = render(<Avatar name="Ada Lovelace" src={PHOTO} />)
      const photo = photoIn(view.container)

      expect(photo.getAttribute('loading')).toBe('lazy')
      expect(photo.getAttribute('decoding')).toBe('async')
      expect(getComputedStyle(photo).opacity).toBe('0')
      expect(view.container.firstElementChild?.textContent).toBe('AL')

      await waitFor(() => {
        expect(getComputedStyle(photoIn(view.container)).opacity).toBe('1')
      })
      expect(view.container.firstElementChild?.textContent).toBe('')
    })

    it('hands the image attributes it is given to the photo', () => {
      const view = render(
        <Avatar imgProps={IMG_PROPS} name="Ada Lovelace" src={PHOTO} />,
      )
      const photo = photoIn(view.container)

      expect(photo.getAttribute('srcset')).toBe(IMG_PROPS.srcSet)
      expect(photo.getAttribute('sizes')).toBe(IMG_PROPS.sizes)
      expect(photo.getAttribute('referrerpolicy')).toBe('no-referrer')
      expect(photo.getAttribute('loading')).toBe('eager')
    })

    // A new photo used to drop the avatar back to its initials for as long as
    // it took to load. The one before stays until it has, and the initials
    // come back only if the new one fails.
    it('keeps the photo before while a new one loads', async () => {
      const view = render(<Avatar name="Ada Lovelace" src={PHOTO} />)
      await waitFor(() => {
        expect(getComputedStyle(photoIn(view.container)).opacity).toBe('1')
      })

      view.rerender(<Avatar name="Ada Lovelace" src={PENDING} />)
      const photos = [...view.container.querySelectorAll('img')]

      expect(photos.map((photo) => photo.getAttribute('src'))).toStrictEqual([
        PHOTO,
        PENDING,
      ])
      expect(getComputedStyle(photos[0]).opacity).toBe('1')
      expect(view.container.firstElementChild?.textContent).toBe('')

      view.rerender(<Avatar name="Ada Lovelace" src={NOT_AN_IMAGE} />)
      await waitFor(() => {
        expect(view.container.querySelector('img')).toBeNull()
      })
      expect(view.container.firstElementChild?.textContent).toBe('AL')
    })
  })
})
