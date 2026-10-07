import {
  LocalizedStringDictionary,
  LocalizedStringFormatter,
} from '@internationalized/string'
import { useLocale } from 'react-aria-components'

import { MESSAGES } from './messages'

// The words the library writes itself, in the locale React Aria's
// I18nProvider sets — the same locale every other name a control announces is
// written in. Each one stands behind a prop that names it otherwise:
// `pendingLabel`, a LoadMore's `label`, `copyLabel` and `copiedLabel`,
// `characterLimitLabel`, and the time picker's `cancelLabel`, `confirmLabel`,
// `selectTimeLabel` and `enterTimeLabel`.

type LibraryMessages = {
  /** What a search view's back button is called. */
  back: string
  /** The time picker's action that closes it and keeps the time it had. */
  cancel: string
  /** What a carousel calls itself, as its role description. */
  carousel: string
  /** The limit on a field's length, in words, for a count of characters. */
  characterLimit: (count: number) => string
  /** The time picker's action that closes it and keeps the time picked. */
  confirm: string
  copied: string
  copy: string
  /** The time picker's headline while it takes a time typed. */
  enterTime: string
  loading: string
  loadingMore: string
  /** What a carousel's next button is called. */
  nextSlide: string
  /** What a carousel's previous button is called. */
  previousSlide: string
  /** The time picker's headline while it shows the dial. */
  selectTime: string
  /** What a carousel calls one of its slides, as its role description. */
  slide: string
  /** A slide's name: which of how many it is, as "2 of 6". */
  slideLabel: (index: number, count: number) => string
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
    back: formatter.format('back'),
    cancel: formatter.format('cancel'),
    carousel: formatter.format('carousel'),
    characterLimit: (count: number) =>
      formatter.format('characterLimit', {
        count: numbers.format(count),
        rule: rules.select(count),
      }),
    confirm: formatter.format('confirm'),
    copied: formatter.format('copied'),
    copy: formatter.format('copy'),
    enterTime: formatter.format('enterTime'),
    loading: formatter.format('loading'),
    loadingMore: formatter.format('loadingMore'),
    nextSlide: formatter.format('nextSlide'),
    previousSlide: formatter.format('previousSlide'),
    selectTime: formatter.format('selectTime'),
    slide: formatter.format('slide'),
    slideLabel: (index: number, count: number) =>
      formatter.format('slideLabel', {
        count: numbers.format(count),
        index: numbers.format(index),
      }),
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
