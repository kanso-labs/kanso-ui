import { describe, expect, it } from 'vitest'

// Every source file's own text, and the set of files that exist. A comment
// pointing at a sibling is the cheapest cross-reference in the repository and
// the easiest to leave behind: `src/layout.ts` named `src/layout.test.ts` for
// as long as that file has been a `.tsx`, and nothing said so.
//
// The `.stylex.ts` tokens module reads back as whatever the StyleX plugin
// made of it rather than as the file, which costs this nothing — a path it
// fails to see is one fewer checked, never a failure invented.
const SOURCES = import.meta.glob(['./**/*.ts', './**/*.tsx'], {
  eager: true,
  import: 'default',
  query: '?raw',
})

const FILES = import.meta.glob([
  './**/*.ts',
  './**/*.tsx',
  './**/*.css',
  './**/*.json',
])

// Glob keys are relative to this file's directory; a comment writes the path
// from the repository root.
const EXISTING = new Set(Object.keys(FILES).map((key) => `src/${key.slice(2)}`))

// A path with an extension, so `src/row` and `src/field` — which name a
// directory rather than a file — are left alone.
const REFERENCE = /\bsrc\/[A-Za-z0-9_./-]+\.(?:css|json|mjs|tsx?)\b/gu

function referencesIn(text: string) {
  return [...new Set(text.match(REFERENCE) ?? [])]
}

// Insertion order, which the glob makes deterministic, so a failure names
// the same path in the same place on every run.
const REFERENCED = [
  ...new Set(Object.values(SOURCES).flatMap((text) => referencesIn(text))),
]

describe('the paths comments point at', () => {
  it('finds some to check', () => {
    // Empty lists would make both cases below vacuous.
    expect(REFERENCED.length).toBeGreaterThan(0)
    expect(EXISTING.size).toBeGreaterThan(0)
  })

  it('all resolve to a file that exists', () => {
    expect(REFERENCED.filter((path) => !EXISTING.has(path))).toEqual([])
  })
})
