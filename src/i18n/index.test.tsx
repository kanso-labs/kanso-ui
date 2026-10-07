import type { ReactElement } from 'react'

import { act, render } from '@testing-library/react'
import { I18nProvider } from 'react-aria-components'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { messagesFor } from '.'
import Button from '../components/button'
import CopyField from '../components/copy-field'
import IconButton from '../components/icon-button'
import List from '../components/list'
import TextField from '../components/text-field'
import { MESSAGES } from './messages'

// The locales React Aria ships its own tables in, as it names them. The
// library's table carries one entry for each, so a page React Aria localises
// is not left with the library's words in English beside its own.
const REACT_ARIA_LOCALES = [
  'ar-AE',
  'bg-BG',
  'cs-CZ',
  'da-DK',
  'de-DE',
  'el-GR',
  'en-US',
  'es-ES',
  'et-EE',
  'fi-FI',
  'fr-FR',
  'he-IL',
  'hr-HR',
  'hu-HU',
  'it-IT',
  'ja-JP',
  'ko-KR',
  'lt-LT',
  'lv-LV',
  'nb-NO',
  'nl-NL',
  'pl-PL',
  'pt-BR',
  'pt-PT',
  'ro-RO',
  'ru-RU',
  'sk-SK',
  'sl-SI',
  'sr-SP',
  'sv-SE',
  'tr-TR',
  'uk-UA',
  'zh-CN',
  'zh-TW',
]

// Counts that between them land on every plural rule the table's locales
// have: zero, one and two, a few, many, the rest, and a fraction.
const COUNTS = [0, 1, 2, 3, 5, 11, 21, 22, 100, 1.5, 1_000_000]

function inFrench(element: ReactElement) {
  return render(<I18nProvider locale="fr-FR">{element}</I18nProvider>)
}

// The entries a language writes exactly as English does, because the word it
// uses is the English one: Brazilian Portuguese calls a slide a "slide", and
// most languages confirm a time picker with "OK".
// Anything else equal to English is a message nobody translated.
const SAME_AS_ENGLISH = new Set([
  'bg-BG confirm',
  'cs-CZ confirm',
  'da-DK confirm',
  'de-DE confirm',
  'el-GR confirm',
  'et-EE confirm',
  'fi-FI confirm',
  'fr-FR confirm',
  'hu-HU confirm',
  'it-IT confirm',
  'ja-JP confirm',
  'nb-NO confirm',
  'nl-NL confirm',
  'pl-PL confirm',
  'pt-BR confirm',
  'pt-BR slide',
  'pt-PT confirm',
  'ro-RO confirm',
  'sk-SK confirm',
  'sv-SE confirm',
])

describe("the library's own words", () => {
  describe('the table', () => {
    it('has an entry for every locale React Aria ships', () => {
      expect(new Set(Object.keys(MESSAGES))).toEqual(
        new Set(REACT_ARIA_LOCALES),
      )
    })

    // English left in place of a translation would read as a message that
    // was never written, so each entry has to say something else.
    it.each(REACT_ARIA_LOCALES.filter((locale) => locale !== 'en-US'))(
      'writes every message in its own words, in %s',
      (locale) => {
        const english = messagesFor('en-US')
        const messages = messagesFor(locale)

        for (const key of [
          'back',
          'cancel',
          'carousel',
          'confirm',
          'copied',
          'copy',
          'enterTime',
          'loading',
          'loadingMore',
          'nextSlide',
          'previousSlide',
          'selectTime',
          'slide',
        ] as const) {
          expect(messages[key]).not.toBe('')
          expect(
            SAME_AS_ENGLISH.has(`${locale} ${key}`) ||
              messages[key] !== english[key],
          ).toBe(true)
        }
        expect(messages.slideLabel(2, 6)).not.toContain('undefined')
        expect(messages.slideLabel(2, 6)).not.toBe(english.slideLabel(2, 6))
        for (const count of COUNTS) {
          const limit = messages.characterLimit(count)
          expect(limit).not.toBe('')
          expect(limit).not.toContain('undefined')
          expect(limit).not.toBe(english.characterLimit(count))
        }
      },
    )

    it('falls back from a region to its language, and then to English', () => {
      expect(messagesFor('fr-CA').copy).toBe('Copier')
      expect(messagesFor('xx-XX').copy).toBe('Copy')
    })

    it('writes the limit in the count it is given', () => {
      expect(messagesFor('en-US').characterLimit(1)).toBe('Up to 1 character')
      expect(messagesFor('en-US').characterLimit(1200)).toBe(
        'Up to 1,200 characters',
      )
      expect(messagesFor('ru-RU').characterLimit(3)).toBe('Не более 3 символов')
    })
  })

  describe("in the I18nProvider's locale", () => {
    let original: PropertyDescriptor | undefined

    beforeEach(() => {
      original = Object.getOwnPropertyDescriptor(navigator, 'clipboard')
      Object.defineProperty(navigator, 'clipboard', {
        configurable: true,
        value: {
          writeText: vi.fn<(text: string) => Promise<void>>(async () => {}),
        },
      })
    })

    afterEach(() => {
      if (original === undefined) {
        // @ts-expect-error -- removing a property the platform normally owns
        delete navigator.clipboard
      } else {
        Object.defineProperty(navigator, 'clipboard', original)
      }
    })

    // React Aria points a pending button's name at its progress bar as well,
    // so an English ring left a French button named half in English.
    it('names the pending ring of an IconButton and a Button', () => {
      const icon = inFrench(
        <IconButton aria-label="Ajouter" isPending>
          <svg />
        </IconButton>,
      )
      expect(
        icon.getByRole('progressbar', { name: 'Chargement' }),
      ).not.toBeNull()
      expect(
        icon.getByRole('button', { name: 'Ajouter Chargement' }),
      ).not.toBeNull()
      icon.unmount()

      const button = inFrench(<Button isPending>Label</Button>)
      expect(
        button.getByRole('progressbar', { name: 'Chargement' }),
      ).not.toBeNull()
    })

    it('names the loading-more row of a collection', () => {
      const view = inFrench(
        <List aria-label="Label">
          <List.Item id="first">First item</List.Item>
          <List.LoadMore isLoading />
        </List>,
      )
      expect(
        view.getByRole('progressbar', { name: 'Chargement de la suite' }),
      ).not.toBeNull()
    })

    it('labels the copy button and announces the copy', async () => {
      const view = inFrench(<CopyField value="Value" />)
      const button = view.getByRole('button', { name: 'Copier' })

      await act(async () => {
        button.click()
        await Promise.resolve()
      })

      expect(view.getByRole('status').textContent).toBe('Copié')
    })

    it('says the character limit, singular for one', () => {
      const twenty = inFrench(<TextField label="Label" maxLength={20} />)
      expect(twenty.getByText('Jusqu’à 20 caractères')).not.toBeNull()
      twenty.unmount()

      const one = inFrench(<TextField label="Label" maxLength={1} />)
      expect(one.getByText('Jusqu’à 1 caractère')).not.toBeNull()
    })

    it("still takes the call site's own words over the table's", () => {
      const view = inFrench(
        <IconButton aria-label="Ajouter" isPending pendingLabel="Patientez">
          <svg />
        </IconButton>,
      )
      expect(
        view.getByRole('progressbar', { name: 'Patientez' }),
      ).not.toBeNull()
    })
  })
})
