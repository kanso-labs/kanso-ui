import { describe, expect, it } from 'vitest'

import * as components from '.'

// The stories and tests render the React Compiler's output rather than the
// source as written, since vite.config.ts compiles with the Babel preset
// tsdown builds the package with. A compiled component opens by taking its
// memo cache, `const $ = _c(n)`, and a function's own text is the code the
// page received — so this reads it there, where a config that stopped
// compiling would otherwise leave every story and test checking code no
// consumer runs, with nothing failing.
const COMPILED = /\bconst \$ = _c\d*\(\d+\)/u

// A class is no component, though it is a function too: Snackbar.Queue is
// the queue a snackbar reads, and the compiler leaves it as written.
const isComponent = (name: string, value: unknown): value is () => unknown =>
  /^[A-Z]/u.test(name) &&
  typeof value === 'function' &&
  !String(value).startsWith('class ')

/** Every component the barrel exports, and every part hung on one. */
const RENDERED: [string, () => unknown][] = []

for (const [name, value] of Object.entries(components)) {
  if (isComponent(name, value)) {
    RENDERED.push([name, value])
    for (const [part, member] of Object.entries(value)) {
      if (isComponent(part, member)) {
        RENDERED.push([`${name}.${part}`, member])
      }
    }
  }
}

describe('the React Compiler', () => {
  it('has components to check', () => {
    // A filter that matched nothing would make every case below pass over
    // an empty list.
    expect(RENDERED.length).toBeGreaterThan(100)
  })

  it.each(RENDERED)('compiled %s', (_name, component) => {
    expect(String(component)).toMatch(COMPILED)
  })
})
