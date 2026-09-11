import { describe, expect, it } from 'vitest'

import packageJson from '../package.json'
import * as date from './date'

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

  it('keeps the date package off the main entry', async () => {
    const main = await import('./index')

    // A consumer with no date component pays nothing for it, which is the
    // whole reason this is a subpath rather than more of the main entry.
    expect(main).not.toHaveProperty('CalendarDate')
    expect(main).not.toHaveProperty('getLocalTimeZone')
  })

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
