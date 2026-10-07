// What a mark shows while it has no image: two initials for a person, one for
// anything else. Beside the mark rather than inside `./index.tsx`, which
// exports components alone so fast refresh keeps working for it.

/**
 * One letter, where a person takes two. A person has a first name and a last
 * name to initialise; a thing usually has neither, so the same rule applied
 * to "Second Item" would produce "SI" — a pair of initials for something that
 * was never two words in that sense. Array.from rather than indexing, so a
 * name starting outside the Basic Multilingual Plane yields its whole first
 * character instead of half a surrogate pair.
 */
function initialOfThing(name: string) {
  const trimmed = name.trim()
  return (Array.from(trimmed)[0] ?? '').toLocaleUpperCase()
}

/**
 * The first character of the first and last word, which handles both "Ada"
 * and "Ada Lovelace" without a separate prop for how many to take.
 *
 * A character is a grapheme, what a reader sees as one, rather than a code
 * point: a code point drops an accent written as a combining mark, splits an
 * Indic conjunct and cuts a flag or a joined emoji in half. And it is
 * upper-cased in the reader's locale, which is what turns a Turkish "i" into
 * "İ" rather than "I".
 */
function initialsOfPerson(name: string, locale: string) {
  const words = name.split(/\s+/u).filter(Boolean)
  if (words.length === 0) {
    return ''
  }
  const first = firstGrapheme(words[0] ?? '', locale)
  const last = words.length > 1 ? firstGrapheme(words.at(-1) ?? '', locale) : ''
  return `${first}${last}`.toLocaleUpperCase(locale)
}

const segmenters = new Map<string, Intl.Segmenter>()

function firstGrapheme(word: string, locale: string) {
  let segmenter = segmenters.get(locale)
  if (segmenter === undefined) {
    segmenter = new Intl.Segmenter(locale, { granularity: 'grapheme' })
    segmenters.set(locale, segmenter)
  }
  for (const { segment } of segmenter.segment(word)) {
    return segment
  }
  return ''
}

export { initialOfThing, initialsOfPerson }
