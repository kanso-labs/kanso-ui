import { describe, expect, it } from 'vitest'

import tsconfig from '../tsconfig.json'
import nodeConfig from '../tsconfig.node.json?raw'
import testConfig from '../tsconfig.test.json?raw'

// `npm run lint` does not type-check, so `tsc -b` is the only thing that reads
// these files — and it reads a file only if some referenced project's `include`
// reaches it. A file in no project is checked by nothing and says nothing about
// it, which is the failure this pins: not a wrong type, but no type-checking at
// all.
describe('what tsc -b type-checks', () => {
  it('builds every project, since an unreferenced one is never read', () => {
    expect(tsconfig.references.map((reference) => reference.path)).toEqual([
      './tsconfig.lib.json',
      './tsconfig.node.json',
      './tsconfig.test.json',
    ])
  })

  it('covers tsdown.config.ts, whose options nothing validates at runtime', () => {
    // A mistyped key there is dropped in silence. `dts` misspelt emits no
    // dist/index.d.ts, leaves the exports map pointing at a file that is not
    // there, and breaks every TypeScript consumer — while `files: ["dist"]`
    // publishes anyway and no job fails. Membership of a program is what makes
    // that a build error instead.
    expect(nodeConfig).toContain('"tsdown.config.ts"')
  })

  it('covers vitest.setup.ts, which every spec in the suite runs through', () => {
    // It reads `document` and `fetch`, so it needs the DOM lib the node project
    // does not carry — which is why it has a project of its own rather than a
    // line in one of the other two.
    expect(testConfig).toContain('"vitest.setup.ts"')
  })
})
