// Scaffolds a component: `npm run component:new -- <name>`, with the name in
// kebab-case (`date-field`) or PascalCase (`DateField`).
//
// A component here is one directory and four entries elsewhere, and the
// entries are what get forgotten — both exact-name barrel tests, the styling
// test and the barrel itself each have to name it, and a component missing
// from any of them fails a test the author has to go and find. This writes
// the directory with its three stubs and all four entries in one go, then
// runs the linters' fixers over what it touched so the import order and the
// formatting come out the way a commit would leave them.
//
// The one thing it cannot do is place the component in
// `src/theming/showcase.tsx`, which is a judgement about which section it
// belongs to; it prints the reminder instead. See AGENTS.md, "Previewing".

import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(fileURLToPath(new URL('.', import.meta.url)), '..')
const COMPONENTS = join(ROOT, 'src', 'components')

/** @typedef {{ component: string; directory: string }} Name */

// `date-field` and `DateField` are the same name written two ways; the
// directory takes the first form and every identifier the second.
/**
 * @param {string | undefined} input
 * @returns {Name}
 */
function parseName(input) {
  if (input === undefined || input === '') {
    throw new Error('usage: npm run component:new -- <name>')
  }
  const words = input
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean)
  if (words.length === 0) {
    throw new Error(`"${input}" has no letters or digits to make a name from`)
  }
  const directory = words.join('-')
  const component = words
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join('')
  return { component, directory }
}

// The three files a component starts from. The component renders a plain
// element through `useRender` and merges the call site's styling, which is
// what `styling.test.tsx` checks the moment the entry lands, and the story
// and test are the shape every component's take.
/**
 * @param {Name} name
 * @returns {Record<string, string>}
 */
function stubs({ component, directory }) {
  const props = `${component}Props`
  const lower = component.charAt(0).toLowerCase() + component.slice(1)

  const index = `import * as stylex from '@stylexjs/stylex'

import type { RenderComponentProps } from '../../render/useRender'

import { useRender } from '../../render/useRender'
import { mergeStyles } from '../../styles/merge'

// Scaffolded by scripts/new-component.mjs. Replace the element, the styles
// and this comment with the component's own: name its Material Design spec
// page and the measurements, type roles and colour roles taken from it, or
// the nearest component's where it has no page. See AGENTS.md.
const styles = stylex.create({
  base: {
    boxSizing: 'border-box',
  },
})

type ${props} = RenderComponentProps<'div'>

/**
 * A placeholder until ${component} is written. It renders a \`<div>\` and
 * takes the call site's \`className\` and \`style\`.
 */
function ${component}({ render, ...props }: ${props}) {
  return useRender({
    defaultTagName: 'div',
    props: {
      ...props,
      ...mergeStyles(stylex.props(styles.base), props),
    },
    render,
  })
}

export type { ${props} }

export default ${component}
`

  const stories = `import type { Meta, StoryObj } from '@storybook/react-vite'

import * as stylex from '@stylexjs/stylex'

import ${component} from '.'
import { spacing } from '../../tokens/design.tokens.stylex'
import Separator from '../separator'
import Text from '../text'

// See avatar/index.stories.tsx for why the overview is built from the
// library's own components, why its sections are divided by a rule, and why
// the headings go through Text's \`render\`.
// oxlint-disable-next-line jsx-a11y/heading-has-content -- filled by useRender
const HEADING_1 = <h1 />
// oxlint-disable-next-line jsx-a11y/heading-has-content -- filled by useRender
const HEADING_2 = <h2 />
const PARAGRAPH = <p />

const styles = stylex.create({
  header: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.xs,
  },
  intro: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.xxs,
  },
  page: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.xl,
    marginInline: 'auto',
    maxInlineSize: '960px',
    padding: spacing.xl,
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.lg,
  },
})

const meta = {
  args: {
    children: 'Label',
  },
  component: ${component},
  title: 'Components/${component}',
} satisfies Meta<typeof ${component}>

type Story = StoryObj<typeof meta>

const Overview: Story = {
  render: () => (
    <div {...stylex.props(styles.page)}>
      <header {...stylex.props(styles.header)}>
        <Text render={HEADING_1} variant="displaySmall">
          ${component}
        </Text>
        <Text render={PARAGRAPH} tone="muted" variant="bodyLarge">
          Supporting line describing what the component is for.
        </Text>
      </header>

      <Separator />

      <section {...stylex.props(styles.section)}>
        <div {...stylex.props(styles.intro)}>
          <Text render={HEADING_2} variant="titleLarge">
            Headline
          </Text>
          <Text render={PARAGRAPH} tone="muted" variant="bodyMedium">
            Supporting line describing the state shown below.
          </Text>
        </div>
        <${component}>Label</${component}>
      </section>
    </div>
  ),
}

const Default: Story = {}

export { Default, Overview }

export default meta
`

  const test = `import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import ${component} from '.'

// Hoisted so it is one stable element per render rather than a fresh one,
// which is what react-perf's no-jsx-as-prop is after.
const LIST_ITEM = <li />

function setup(props: Partial<Parameters<typeof ${component}>[0]> = {}) {
  const view = render(
    <${component} data-testid="${lower}" {...props}>
      Label
    </${component}>,
  )
  return { ...view, ${lower}: view.getByTestId('${lower}') }
}

describe('${directory.replaceAll('-', ' ')}', () => {
  describe('structure', () => {
    it('renders an element carrying its children', () => {
      const { ${lower} } = setup()
      expect(${lower}.tagName).toBe('DIV')
      expect(${lower}.textContent).toBe('Label')
    })

    it('renders as another element when given one', () => {
      const { ${lower} } = setup({ render: LIST_ITEM })
      expect(${lower}.tagName).toBe('LI')
    })

    it('passes attributes through to the element', () => {
      const { ${lower} } = setup({ id: 'first' })
      expect(${lower}.id).toBe('first')
    })
  })
})
`

  return {
    'index.stories.tsx': stories,
    'index.test.tsx': test,
    'index.tsx': index,
  }
}

/**
 * @param {string} path
 * @returns {string}
 */
function read(path) {
  return readFileSync(path, 'utf8')
}

// Inserts `line` into a run of lines that are sorted the way a module
// namespace lists its keys — by code unit, uppercase before lowercase — so
// the exact-name lists stay in the order `Object.keys` reports.
/**
 * @param {string} text
 * @param {{ after: string; before: string; line: string }} options
 * @returns {string}
 */
function insertSorted(text, { after, before, line }) {
  const start = text.indexOf(after)
  if (start === -1) {
    throw new Error(`could not find ${JSON.stringify(after)}`)
  }
  const from = start + after.length
  const end = text.indexOf(before, from)
  if (end === -1) {
    throw new Error(`could not find ${JSON.stringify(before)}`)
  }
  const lines = text.slice(from, end).split('\n')
  const key = line.trim()
  let at = lines.findIndex(
    (existing) => existing.trim() !== '' && existing.trim() > key,
  )
  if (at === -1) {
    at = lines.length - 1
  }
  lines.splice(at, 0, line)
  return text.slice(0, from) + lines.join('\n') + text.slice(end)
}

// Inserts `block` after the last block whose first line contains `marker`.
/**
 * @param {string} text
 * @param {string} marker
 * @param {string} block
 * @returns {string}
 */
function insertAfterLast(text, marker, block) {
  const start = text.lastIndexOf(marker)
  if (start === -1) {
    throw new Error(`could not find ${JSON.stringify(marker)}`)
  }
  const end = text.indexOf('\n  })\n', start)
  if (end === -1) {
    throw new Error(
      `could not find the end of the block at ${JSON.stringify(marker)}`,
    )
  }
  const cut = end + '\n  })\n'.length
  return `${text.slice(0, cut)}\n${block}${text.slice(cut)}`
}

// The directory an export line points at: `./x` from `from './x'`.
/**
 * @param {string} line
 * @returns {string}
 */
function directoryOf(line) {
  return line.slice(line.indexOf("from './") + "from './".length, -1)
}

/**
 * @param {Name} name
 * @returns {string}
 */
function addToBarrel({ component, directory }) {
  const path = join(COMPONENTS, 'index.ts')
  const text = read(path)
  const entry = `export type { ${component}Props } from './${directory}'\nexport { default as ${component} } from './${directory}'\n`
  // The barrel is sorted by path. Placed before the first export whose path
  // sorts after this one, or at the end.
  const lines = text.split('\n')
  const nextDirectory = lines
    .filter((line) => line.startsWith('export { default as '))
    .map(directoryOf)
    .find((existing) => existing > directory)
  // Inserted before that directory's first line, its type export, since the
  // types come first and a component may export several of them.
  const at =
    nextDirectory === undefined
      ? lines.length - 1
      : lines.findIndex(
          (line) =>
            line.startsWith('export ') && directoryOf(line) === nextDirectory,
        )
  lines.splice(at, 0, ...entry.trimEnd().split('\n'))
  writeFileSync(path, lines.join('\n'))
  return path
}

/**
 * @param {Name} name
 * @returns {string}
 */
function addToComponentsTest({ component, directory }) {
  const path = join(COMPONENTS, 'index.test.ts')
  let text = read(path)
  text = text.replace(
    "import * as components from '.'\n",
    `import type { ${component}Props } from './${directory}'\n\nimport * as components from '.'\nimport ${component}Default from './${directory}'\n`,
  )
  text = insertSorted(text, {
    after: 'expect(Object.keys(components)).toEqual([\n',
    before: '    ])',
    line: `      '${component}',`,
  })
  text = insertAfterLast(
    text,
    ' as the same reference as its own module',
    `  it('re-exports ${component} as the same reference as its own module', () => {\n    expect(components.${component}).toBe(${component}Default)\n  })\n`,
  )
  text = insertAfterLast(
    text,
    'Props type',
    `  it('re-exports the ${component}Props type', () => {\n    const props: ${component}Props = { children: 'test' }\n    expect(props.children).toBe('test')\n  })\n`,
  )
  writeFileSync(path, text)
  return path
}

/**
 * @param {Name} name
 * @returns {string}
 */
function addToEntryTest({ component }) {
  const path = join(ROOT, 'src', 'index.test.ts')
  let text = read(path)
  text = insertSorted(text, {
    after: 'import {\n',
    before: "} from './components'",
    line: `  ${component} as Components${component},`,
  })
  text = insertSorted(text, {
    after: 'expect(Object.keys(publicApi)).toEqual([\n',
    before: '    ])',
    line: `      '${component}',`,
  })
  text = insertAfterLast(
    text,
    ' as the same reference as the components barrel',
    `  it('forwards ${component} as the same reference as the components barrel', () => {\n    expect(publicApi.${component}).toBe(Components${component})\n  })\n`,
  )
  writeFileSync(path, text)
  return path
}

// The name a `CASES` entry in styling.test.tsx carries, which is what the
// list is sorted by.
/**
 * @param {string} entry
 * @returns {string}
 */
function caseNameOf(entry) {
  return /name: '([^']+)'/.exec(entry)?.[1] ?? ''
}

/**
 * @param {Name} name
 * @returns {string}
 */
function addToStylingTest({ component }) {
  const path = join(COMPONENTS, 'styling.test.tsx')
  let text = read(path)
  text = insertSorted(text, {
    after: 'import {\n',
    before: "} from '.'",
    line: `  ${component},`,
  })
  const marker =
    'const CASES: ReadonlyArray<{ element: ReactElement; name: string }> = [\n'
  const start = text.indexOf(marker) + marker.length
  const end = text.indexOf('\n]\n', start)
  const entries = text
    .slice(start, end)
    .split(/\n(?=  \{)/)
    .map((entry) => entry.trimEnd())
  const entry = `  { element: <${component} {...PROBE}>Label</${component}>, name: '${component}' },`
  let at = entries.findIndex((existing) => caseNameOf(existing) > component)
  if (at === -1) {
    at = entries.length
  }
  entries.splice(at, 0, entry)
  text = `${text.slice(0, start)}${entries.join('\n')}${text.slice(end)}`
  writeFileSync(path, text)
  return path
}

function main() {
  const name = parseName(process.argv[2])
  const directory = join(COMPONENTS, name.directory)
  if (existsSync(directory)) {
    throw new Error(`src/components/${name.directory} already exists`)
  }

  mkdirSync(directory)
  const written = []
  for (const [file, content] of Object.entries(stubs(name))) {
    const path = join(directory, file)
    writeFileSync(path, content)
    written.push(path)
  }
  written.push(
    addToBarrel(name),
    addToComponentsTest(name),
    addToEntryTest(name),
    addToStylingTest(name),
  )

  // The fixers, so what was written lands the way the pre-commit hook would
  // leave it: imports in order, the exact-name lists as they were found.
  for (const fixer of [['eslint', '--fix'], ['oxfmt']]) {
    spawnSync('npx', [...fixer, ...written], { cwd: ROOT, stdio: 'ignore' })
  }

  const relative = written.map((path) => path.slice(ROOT.length + 1))
  console.log(
    `Scaffolded ${name.component}:\n${relative.map((path) => `  ${path}`).join('\n')}`,
  )
  console.log(
    `\nStill yours:\n  place ${name.component} in its section of src/theming/showcase.tsx\n  replace the stub with the component, naming its Material Design spec page in the comment\n  give it stories for the states a consumer looks at, and a test per behaviour`,
  )
}

main()
