import { describe, expect, it } from 'vitest'

// Where the package's client boundary falls. Every component module is a
// client module — the React Compiler's runtime and React Aria both need the
// client, so a server component renders a component only across this line —
// while the entry, the layout constants and the date utilities stay server
// modules a server component can import and use. See "Server components" in
// the README.
//
// Read as source, since a directive is a property of where it is written, not
// of anything a runtime import can see. scripts/check-package.mjs checks the
// same line in the built package, where the directive has to survive a build.
//
// Each glob spells its options out, since Vite reads them where they are
// written and a shared constant is not something it can see.
const CLIENT = Object.entries({
  ...import.meta.glob<string>('./components/*/index.tsx', {
    eager: true,
    import: 'default',
    query: '?raw',
  }),
  ...import.meta.glob<string>(
    ['./react-aria.ts', './drag/hooks.tsx', './theme-scope.tsx'],
    {
      eager: true,
      import: 'default',
      query: '?raw',
    },
  ),
})

const SERVER = Object.entries(
  import.meta.glob<string>(
    ['./index.ts', './components/index.ts', './layout.ts', './date.ts'],
    { eager: true, import: 'default', query: '?raw' },
  ),
)

/**
 * The module's first statement: its source with the comments and blank lines
 * before it taken off, which is where a directive has to sit to count as one.
 */
function firstStatement(source: string) {
  return source
    .replaceAll(/^(?:\s*\/\/[^\n]*\n|\s*\/\*[\s\S]*?\*\/\s*|\s+)*/gu, '')
    .split('\n', 1)[0]
}

describe('the client boundary', () => {
  it('has modules on both sides of it to check', () => {
    // A glob that matched nothing would make every case below pass over an
    // empty list.
    expect(CLIENT.length).toBeGreaterThan(60)
    expect(SERVER).toHaveLength(4)
  })

  it.each(CLIENT)('opens %s with the client directive', (_path, source) => {
    expect(firstStatement(source)).toBe("'use client'")
  })

  // The entry re-exports components rather than defining any, so it stays a
  // server module, and what it hands a server component for each component
  // is a reference to the client module rather than the module itself.
  it.each(SERVER)('leaves %s a server module', (_path, source) => {
    expect(source).not.toContain('use client')
  })
})
