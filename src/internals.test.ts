import { describe, expect, it } from 'vitest'

// A shared internal keeps its styles in a `styles.ts` beside its `index.tsx`,
// and every one of them records the same reason: the `.tsx` exports components
// alone, which is what keeps fast refresh working for it. `src/field/root.ts`
// says it in those words, and so do row, calendar, segments, indicator, drag
// and chip.
//
// The rule was followed everywhere except the largest style block in the
// repository, which sat in `src/field/index.tsx` between its header comment
// and the components it served. Nothing exempted it, and nothing failed
// either — `react-refresh/only-export-components` reads exports, and that
// block was a module-local constant rather than an exported one.
//
// What is asserted is that no entry defines styles, not that every one has a
// styles.ts: src/glyphs draws icons and has no styles at all, so a file there
// would be empty. Read as source rather than as modules, since where a
// declaration is written is not something a runtime import can see.
const INTERNAL_ENTRIES = import.meta.glob('./*/index.tsx', {
  eager: true,
  import: 'default',
  query: '?raw',
})

// src/components is the public surface rather than a shared internal, and
// src/tokens is generated. Neither is one of the directories this covers.
const EXCLUDED = new Set(['./components/index.tsx', './tokens/index.tsx'])

const ENTRIES = Object.entries(INTERNAL_ENTRIES).filter(
  ([path]) => !EXCLUDED.has(path),
)

describe('the shared internals', () => {
  it('has some to check', () => {
    // A glob that matched nothing would make every case below pass over an
    // empty list.
    expect(ENTRIES.length).toBeGreaterThan(0)
  })

  it.each(ENTRIES)('keeps styles out of %s', (_path, source) => {
    expect(source).not.toContain('stylex.create(')
  })
})
