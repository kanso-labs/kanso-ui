import * as stylex from '@stylexjs/stylex'
import { render, waitFor } from '@testing-library/react'
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

    it('renders nothing for a name that is only whitespace', () => {
      const { avatar } = setup({ name: '   ' })
      expect(avatar.textContent).toBe('')
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

    it('renders the photo once it has loaded, keeping the initials until then', async () => {
      // A 1x1 gif, inline so the load resolves without touching the network.
      const src =
        'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'
      const view = render(<Avatar name="Ada Lovelace" src={src} />)

      expect(view.getByRole('img', { name: 'Ada Lovelace' })).not.toBeNull()
      await waitFor(() => {
        expect(view.container.querySelector('img')?.getAttribute('src')).toBe(
          src,
        )
      })
    })
  })
})
