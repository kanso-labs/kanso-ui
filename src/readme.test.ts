import { describe, expect, it } from 'vitest'

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

const readme = Object.values(READMES)[0] ?? ''
const surface = Object.values(ENTRIES).join('\n')

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
