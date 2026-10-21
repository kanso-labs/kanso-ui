import css from '@kanso-labs/kanso-ui-core/tokens.css?raw'
import { describe, expect, it } from 'vitest'

// The generated StyleX theme as text. A glob rather than a `?raw` import,
// which the linter would resolve to the module itself and find no default
// export in.
const [theme = ''] = Object.values(
  import.meta.glob<string>('./design.tokens.stylex.ts', {
    eager: true,
    import: 'default',
    query: '?raw',
  }),
)

/** The custom properties a source names, once each. */
function propertiesIn(source: string, pattern: RegExp) {
  return new Set([...source.matchAll(pattern)].map((match) => match[1]))
}

// `tokens.css` and `KuiTheme` are kanso-ui-core's, which holds the two to each
// other. What is generated here is the StyleX theme every component reads, and
// each of its values falls back through one of those properties — so a token
// the package adds and scripts/build-tokens.mjs never maps, or one it maps
// under a name the stylesheet does not declare, is a property a consumer can
// set and no component reads.
describe('the StyleX theme', () => {
  it('reads every property tokens.css declares, and nothing else', () => {
    const root = css.slice(css.indexOf(':root {'), css.indexOf('}'))
    const declared = propertiesIn(root, /^\s*(--kui-[\w-]+):/gmu)
    const read = propertiesIn(theme, /var\((--kui-[\w-]+),/gu)

    expect(declared.size).toBe(190)
    expect(read).toEqual(declared)
  })
})
