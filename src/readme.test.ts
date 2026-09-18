import { describe, expect, it } from 'vitest'

import * as tokens from './tokens/design.tokens.stylex'

// The README as text, so the names its prose spells out can be checked
// against what the package actually exports — the same `?raw` glob
// `internals.test.ts` uses to read a module's source rather than import it.
const READMES = import.meta.glob('../README.md', {
  eager: true,
  import: 'default',
  query: '?raw',
})

const ENTRIES = import.meta.glob(
  ['./components/index.ts', './layout.ts', './react-aria.ts', './date.ts'],
  {
    eager: true,
    import: 'default',
    query: '?raw',
  },
)

// The package's own entry and the Getting started page, as text. Both
// documents tell a StyleX consumer which token objects `createTheme` would
// take and that none of them is exported yet — two claims about this source
// rather than about prose, so they are checked against it.
//
// The tokens module is read by importing it instead. A `?raw` glob of a
// `.stylex.ts` file answers with what the StyleX plugin made of it rather
// than with the file, so a group added to it never reached a text search —
// which is the one drift this is here to catch.
const SOURCES = import.meta.glob(
  ['./index.ts', './getting-started.stories.tsx'],
  {
    eager: true,
    import: 'default',
    query: '?raw',
  },
)

const readme = Object.values(READMES)[0] ?? ''
const surface = Object.values(ENTRIES).join('\n')

function sourceFor(name: string) {
  const found = Object.entries(SOURCES).find(([path]) => path.endsWith(name))
  if (found === undefined) {
    throw new Error(`expected to read ${name}`)
  }
  return found[1]
}

const barrel = sourceFor('index.ts')
const gettingStarted = sourceFor('getting-started.stories.tsx')

// Every var group the tokens module declares. `createTheme` overrides these
// and nothing else, so the `defineConsts` groups are correctly absent from
// what the two documents list — and so are the two themes the module builds
// from `colors`.
//
// Told apart by what they hold: `defineVars` compiles its keys to custom
// property references, where a const group keeps the literals it was given
// and a theme is a class name. `some` rather than `every`, because StyleX
// adds one key of its own to a var group — a class name it identifies the
// group by — which an `every` would trip over for all seven.
const TOKEN_GROUPS = Object.entries(tokens)
  .filter(([, group]) =>
    Object.values(group).some(
      (value) => typeof value === 'string' && value.startsWith('var(--'),
    ),
  )
  .map(([name]) => name)

// Backticked identifiers alone: prose spells plenty in backticks that is not
// an export — a file path, a CSS property, a prop name — so this keeps to
// what looks like an exported binding and leans on the allowlist below for
// the rest.
function namesIn(section: string) {
  return [...new Set(section.match(/`([A-Za-z_$][\w$]*)`/gu) ?? [])].map(
    (match) => match.slice(1, -1),
  )
}

// The section listing what an app reaches for around the components, down to
// the next heading. The names in it are the ones a reader will try to import.
function sectionOf(heading: string) {
  const start = readme.indexOf(heading)
  if (start === -1) {
    throw new Error(`expected the README to carry a ${heading} section`)
  }
  const rest = readme.slice(start + heading.length)
  const end = rest.indexOf('\n### ')

  return end === -1 ? rest : rest.slice(0, end)
}

// Named in that section but not exports of this package: props, options and
// the packages themselves.
const NOT_EXPORTS = new Set([
  'className',
  'collapsed',
  'headingSize',
  'href',
  'layoutOptions',
  'listRow',
  'menuRow',
  'render',
  'rowSize',
  'scrolled',
  'slot',
  'style',
  'tableRow',
  'value',
])

describe('the README', () => {
  it('reads at all, with the entries beside it', () => {
    // Empty strings would make every `every` below vacuously true.
    expect(readme.length).toBeGreaterThan(0)
    expect(surface.length).toBeGreaterThan(0)
  })

  // The date subpath exists so a consumer does not install a second copy of
  // `@internationalized/date`, whose classes would not be the ones the date
  // components accept. A reader who never hears about it installs that copy.
  it('tells a reader where the date values come from', () => {
    const section = sectionOf('### Date values')

    expect(section).toContain('@kanso-labs/kanso-ui/date')
    expect(section).toContain(
      '**Do not install `@internationalized/date` alongside this package.**',
    )
  })

  // Both documents send a StyleX consumer to `createTheme`, which needs the
  // var groups it overrides. Naming them is only useful while the list is the
  // whole list, and the advice around it is only honest while none of them is
  // exported — so this pins both halves rather than the sentence.
  describe('what it says about theming with StyleX', () => {
    it('finds the var groups to check the documents against', () => {
      // An empty list would make every `toContain` below vacuous.
      expect(TOKEN_GROUPS.length).toBeGreaterThan(0)
    })

    it.each([
      ['the README', () => sectionOf('### For StyleX consumers')],
      ['the Getting started page', () => gettingStarted],
    ])('names every var group in %s', (_label, read) => {
      const text = read()

      expect(TOKEN_GROUPS.filter((name) => !text.includes(name))).toEqual([])
    })

    // The claim both documents make. They send a reader to `--kui-*` instead
    // of an import, which is advice that turns wrong the day the barrel picks
    // the tokens up.
    it('is right that none of them is exported', () => {
      expect(barrel).not.toContain('./tokens')
    })

    it('points a reader at the route that does work', () => {
      expect(sectionOf('### For StyleX consumers')).toContain('public API')
      expect(gettingStarted).toContain('--kui-*')
    })
  })

  it.each([['### React Aria utilities'], ['### Date values']])(
    'names only real exports in %s',
    (heading) => {
      const unknown = namesIn(sectionOf(heading)).filter(
        (name) => !NOT_EXPORTS.has(name) && !surface.includes(name),
      )

      expect(unknown).toEqual([])
    },
  )
})
