// What a mark shows while it has no image: two initials for a person, one for
// anything else. Beside the mark rather than inside `./index.tsx`, which
// exports components alone so fast refresh keeps working for it.
//
// Both take the same rule for which character stands for a word, in
// `initialOf`, and both work in graphemes — what a reader sees as one
// character — in the reader's locale. A code point drops an accent written
// as a combining mark, splits an Indic conjunct and cuts a flag or a joined
// emoji in half; upper-casing without the locale turns a Turkish "i" into
// "I" rather than "İ".

// What a word's initial can be: a letter, a number, or a picture — an emoji,
// or a flag, which is a pair of regional indicators. A word opening with
// anything else — a bracket, a quote, the @ of a handle, the # of a channel
// — is initialised by the first of these inside it.
const INITIAL = /^[\p{L}\p{N}\p{Extended_Pictographic}\p{Regional_Indicator}]/u

// The scripts whose letters join to the next one. Two initials in one of
// them, written side by side, shape into a single connected word rather than
// two letters, so a zero-width non-joiner goes between them.
const JOINING =
  /^[\p{Script=Arabic}\p{Script=Syriac}\p{Script=Mongolian}\p{Script=Nko}\p{Script=Adlam}\p{Script=Mandaic}\p{Script=Manichaean}\p{Script=Psalter_Pahlavi}\p{Script=Hanifi_Rohingya}\p{Script=Sogdian}\p{Script=Old_Uyghur}]/u

const ZERO_WIDTH_NON_JOINER = '‌'

// A title before a name — "Dr.", "Mrs.", "Prof." — which is not one of its
// words. Two letters at least, so a first initial written "J." is kept.
const TITLE = /^\p{L}{2,4}\.$/u

// A generational suffix after a name — "Jr.", "Sr", "III", "3rd" — which is
// not its last word either. The numerals are the generational ones only, so
// a surname that reads as a numeral, "Xi" say, is kept.
const SUFFIX = /^(?:jr|sr|ii|iii|iv|\d+(?:st|nd|rd|th))\.?,?$/iu

// Something said about the name rather than part of it, in brackets at its
// end: "(she/her)", "[away]".
const TRAILING_ASIDE = /\s*[([{][^)\]}]*[)\]}]\s*$/u

const segmenters = new Map<string, Intl.Segmenter>()

function graphemesOf(text: string, locale: string) {
  let segmenter = segmenters.get(locale)
  if (segmenter === undefined) {
    segmenter = new Intl.Segmenter(locale, { granularity: 'grapheme' })
    segmenters.set(locale, segmenter)
  }
  return Array.from(segmenter.segment(text), ({ segment }) => segment)
}

/**
 * The character that stands for `word`: its first grapheme that is a letter,
 * a number or a picture, or its first grapheme where it has none of those,
 * so something always shows. Upper-cased in the locale, and then one
 * grapheme of that, since upper-casing can lengthen it: "ß" is "SS".
 */
function initialOf(word: string, locale: string) {
  const graphemes = graphemesOf(word, locale)
  const chosen =
    graphemes.find((grapheme) => INITIAL.test(grapheme)) ??
    graphemes.at(0) ??
    ''
  return graphemesOf(chosen.toLocaleUpperCase(locale), locale).at(0) ?? ''
}

/**
 * One letter, where a person takes two. A person has a first name and a last
 * name to initialise; a thing usually has neither, so the same rule applied
 * to "Second Item" would produce "SI" — a pair of initials for something that
 * was never two words in that sense.
 */
function initialOfThing(name: string, locale: string) {
  return initialOf(name.trim(), locale)
}

/**
 * The initials of the first and the last word, which handles both "Ada" and
 * "Ada Lovelace" without a separate prop for how many to take. What a
 * display name carries around the name itself is left out first: a title
 * before it, a generational suffix after it, and an aside in brackets at its
 * end. A name written without spaces between its words — Japanese, Chinese —
 * is one word to this, and takes one initial.
 */
function initialsOfPerson(name: string, locale: string) {
  let words = name.replace(TRAILING_ASIDE, '').split(/\s+/u).filter(Boolean)
  if (words.length > 1 && TITLE.test(words[0] ?? '')) {
    words = words.slice(1)
  }
  if (words.length > 1 && SUFFIX.test(words.at(-1) ?? '')) {
    words = words.slice(0, -1)
  }
  if (words.length === 0) {
    return ''
  }
  const first = initialOf(words[0] ?? '', locale)
  if (words.length === 1) {
    return first
  }
  const last = initialOf(words.at(-1) ?? '', locale)
  const between =
    JOINING.test(first) && JOINING.test(last) ? ZERO_WIDTH_NON_JOINER : ''
  return `${first}${between}${last}`
}

export { initialOfThing, initialsOfPerson }
