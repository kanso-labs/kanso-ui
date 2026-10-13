import { describe, expect, it } from 'vitest'

import css from './design.tokens.css?raw'

// The generated type as text. A glob rather than a `?raw` import, which the
// linter would resolve to the module itself and find no default export in.
const [theme = ''] = Object.values(
  import.meta.glob<string>('./theme.ts', {
    eager: true,
    import: 'default',
    query: '?raw',
  }),
)

/** The custom properties a source names, in the order it names them. */
function propertiesIn(source: string, pattern: RegExp) {
  return [...source.matchAll(pattern)].map((match) => match[1])
}

// `KuiTheme` and `tokens.css` are both the override contract, one as a type
// and one as a stylesheet, and both are generated. What holds them together
// is that scripts/build-tokens.mjs writes them from the same entries, so this
// is what fails when a group reaches one and not the other.
describe('KuiTheme', () => {
  it('names every property tokens.css declares, and nothing else', () => {
    const root = css.slice(css.indexOf(':root {'), css.indexOf('}'))
    const declared = propertiesIn(root, /^\s*(--kui-[\w-]+):/gmu)
    const typed = propertiesIn(theme, /^\s*readonly '(--kui-[\w-]+)'\?:/gmu)

    expect(declared).toHaveLength(190)
    expect(typed).toHaveLength(declared.length)
    expect(new Set(typed)).toEqual(new Set(declared))
  })
})
