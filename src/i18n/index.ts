import {
  LocalizedStringDictionary,
  LocalizedStringFormatter,
} from '@internationalized/string'
import { useLocale } from 'react-aria-components'

import { MESSAGES } from './messages'

// The words the library writes itself, in the locale React Aria's
// I18nProvider sets — the same locale every other name a control announces is
// written in. Each one stands behind a prop that names it otherwise:
// `pendingLabel`, a LoadMore's `label`, `copyLabel` and `copiedLabel`, and
// `characterLimitLabel`.

type LibraryMessages = {
  /** The limit on a field's length, in words, for a count of characters. */
  characterLimit: (count: number) => string
  copied: string
  copy: string
  loading: string
  loadingMore: string
}

const dictionary = new LocalizedStringDictionary(MESSAGES)

// One set per locale an app renders in, built the first time a component asks
// for it. Every string but the limit is fixed for its locale, so the set holds
// them already formatted rather than formatting them on each render.
const cache = new Map<string, LibraryMessages>()

function messagesFor(locale: string): LibraryMessages {
  const cached = cache.get(locale)
  if (cached !== undefined) {
    return cached
  }

  const formatter = new LocalizedStringFormatter(locale, dictionary)
  const numbers = new Intl.NumberFormat(locale)
  const rules = new Intl.PluralRules(locale)
  const messages = {
    characterLimit: (count: number) =>
      formatter.format('characterLimit', {
        count: numbers.format(count),
        rule: rules.select(count),
      }),
    copied: formatter.format('copied'),
    copy: formatter.format('copy'),
    loading: formatter.format('loading'),
    loadingMore: formatter.format('loadingMore'),
  }
  cache.set(locale, messages)
  return messages
}

/** The library's own words, in the I18nProvider's locale. */
function useMessages(): LibraryMessages {
  return messagesFor(useLocale().locale)
}

export type { LibraryMessages }

export { messagesFor, useMessages }
