import { describe, expect, it } from 'vitest'

import packageJson from '../package.json'
import * as date from './date'

// The main entry and the three barrels it re-exports, as source rather than as
// modules — the same `?raw` glob `internals.test.ts` reads a module's text
// with.
//
// Read rather than imported because `import('./index')` resolves the whole
// library: three `export *` statements pull every component module and its
// StyleX transform through the dev server. Inside a test body that wait is
// billed to the test's own timeout, and it measured 1262ms with this file
// running alone against 7721ms under a full `npm test` — half the 15s budget
// on a run that passed, and an intermittent timeout on the runs that did not.
// Where a re-export is written is not something the wait bought anyway.
//
// Four files is the whole surface rather than a sample of it. `src/index.ts`
// is three `export *` statements, they are the only ones in the library
// besides `date.ts`'s own, and each of the three barrels they name re-exports
// by name — so nothing reaches the entry without being written in one of these
// four.
const ENTRY_SOURCES = import.meta.glob(
  ['./index.ts', './components/index.ts', './layout.ts', './react-aria.ts'],
  {
    eager: true,
    import: 'default',
    query: '?raw',
  },
)

const ENTRIES = Object.entries(ENTRY_SOURCES)

describe('the ./date subpath', () => {
  it('is published beside the main entry', () => {
    expect(packageJson.exports['./date']).toEqual({
      default: './dist/date.js',
      types: './dist/date.d.ts',
    })
  })

  it('resolves under require() too, which is what `default` buys', () => {
    // The same point the main entry's own comment makes: under a `default`
    // condition Node resolves the ESM file for a `require()` as well and
    // serves it through `require(esm)`. Under `import` alone the same call
    // fails outright with ERR_PACKAGE_PATH_NOT_EXPORTED, which silently drops
    // every CommonJS consumer. The suite runs in a browser and cannot call
    // `require`, so what is pinned is the condition that decides it.
    const entry = packageJson.exports['./date']

    expect(Object.keys(entry)).not.toContain('import')
    expect(Object.keys(entry)).not.toContain('require')
    expect(entry).toHaveProperty('default')
  })

  it('pins the dependency exactly, as every other one is', () => {
    expect(packageJson.dependencies['@internationalized/date']).toMatch(
      /^\d+\.\d+\.\d+$/,
    )
  })

  it('reads the four entries it checks', () => {
    // Four literal paths rather than a pattern, so the count is exact. A glob
    // that matched nothing would make the case below pass over an empty list,
    // the way `internals.test.ts` guards its own, and one path renamed out
    // from under it would leave that entry unchecked with nothing to say so.
    expect(ENTRIES).toHaveLength(4)
  })

  it.each(ENTRIES)(
    'keeps the date package off the main entry, in %s',
    (_path, source) => {
      // A consumer with no date component pays nothing for it, which is the
      // whole reason this is a subpath rather than more of the main entry.
      //
      // The whole specifier is barred rather than one spelling of reaching
      // for it: an `import` of either on the entry's path has no reason to
      // exist, and a type re-exported here would sit beside the subpath the
      // README sends a reader to rather than through it.
      //
      // What a source read cannot do is describe the resolved namespace, and
      // that is pinned already: `src/index.test.ts`, `exposes exactly the
      // documented public API`, asserts the entry's keys against the exact
      // list, from a file that imports the barrel at the top rather than
      // inside a case.
      expect(source).not.toContain("from './date'")
      expect(source).not.toContain("from '@internationalized/date'")
    },
  )

  it('re-exports what a date component is given', () => {
    // Not an inventory of the package — that would go stale on every bump.
    // These are the four a call site reaches for to build a value at all.
    expect(typeof date.CalendarDate).toBe('function')
    expect(typeof date.getLocalTimeZone).toBe('function')
    expect(typeof date.parseDate).toBe('function')
    expect(typeof date.today).toBe('function')
  })

  it('hands back a value React Aria would accept', () => {
    const value = new date.CalendarDate(2026, 9, 11)

    expect(value.year).toBe(2026)
    expect(value.month).toBe(9)
    expect(value.day).toBe(11)
    expect(date.parseDate('2026-09-11').compare(value)).toBe(0)
  })
})
