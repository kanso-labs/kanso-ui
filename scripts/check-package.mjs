#!/usr/bin/env node
// Checks the seven things about the built package that publint and attw
// cannot see.
//
// publint reads package.json and the packed file list, so it catches an
// exports target pointing at a file that is not there. It never opens an
// emitted module or stylesheet and never asks Node to resolve anything, which
// leaves three failures it reports as "All good!".
//
// The first is the exports map's `default` condition. It is what lets a
// require() reach this ESM-only package at all: under `import` instead, the
// same call fails with ERR_PACKAGE_PATH_NOT_EXPORTED and every CommonJS
// consumer is silently dropped. Measured — rewriting `default` to `import`
// on both entries still gives publint "All good!".
//
// The second is the `./styles.css` side-effect import in dist/index.js. That
// import is what carries the library's compiled rules into a consumer's
// bundle; without it every component renders unstyled, which is what 0.8.0
// shipped. Four separate pieces keep it there — see "How the compiled CSS
// reaches a consumer" in AGENTS.md — and nothing failed the build when it
// went missing.
//
// The third is the right-to-left mirroring in dist/styles.css. lightningcss
// rewrites `:dir(rtl)` into a list of `:lang()` selectors for any target
// without `:dir()`, which matches on a reader's language rather than their
// writing direction, and the build turns that rewrite off in
// tsdown.config.ts. The tests read the dev server's stylesheet rather than
// this one, so this is the only place the build's half is checked.
//
// The fourth is the name of the cascade layer the library's rules land in,
// which an app with layered CSS of its own orders the library by — see
// tsdown.config.ts.
//
// The sixth is the published types under TypeScript 6's defaults, which turn
// `noUncheckedSideEffectImports` on. attw reports whether each entry resolves
// to a declaration; it does not compile a consumer, and a declaration that
// imports a stylesheet is what TS2882 is about. So the types are read for
// that import, and a consumer with no `*.css` declaration of its own is
// compiled against them with `skipLibCheck` off — see scripts/consumer-types.
//
// The fifth is the client boundary a server component meets. Every component
// module has to open with "use client" in dist, not only in src, since that is
// the file a consumer's bundler reads — and rolldown warns that it may not
// keep a module's directive, a warning the build suppresses on the strength of
// this check. The other side matters as much: the entry and the modules it
// reaches without crossing that line run on the server, so none of them may
// import React or React Aria, which a server bundle cannot evaluate.
//
// The seventh is whether that import outlives an app's production build. A
// bundler honouring `sideEffects` follows a named import through the entry's
// re-exports to the module defining it, and drops the entry, stylesheet import
// and all, unless the field names the entry as having side effects. The
// import is still in dist/index.js when that happens, so the second check
// passes; only bundling a consumer shows it.
//
// The eighth is what the package takes from @kanso-labs/kanso-ui-core, a
// devDependency no consumer installs. tokens.css and tokens.json are copied
// from it and have to arrive as they are, since the override contract is the
// stylesheet's text; and no emitted module or declaration may still import
// the package, which a consumer's bundler or compiler would fail to find —
// `KuiTheme` is re-exported from it, so its declaration has to be written into
// dist rather than referenced.

import { spawnSync } from 'node:child_process'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import { build } from 'vite'

const require = createRequire(import.meta.url)

/** @type {string[]} */
const failures = []

/**
 * @param {string} description
 * @param {() => void} assertion
 */
function check(description, assertion) {
  try {
    assertion()
    console.log(`  ok    ${description}`)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    failures.push(`${description}\n          ${message}`)
    console.log(`  FAIL  ${description}`)
  }
}

/**
 * @param {string} specifier
 * @param {string} expected
 */
function resolvesTo(specifier, expected) {
  const resolved = require.resolve(specifier).replaceAll('\\', '/')

  if (!resolved.endsWith(expected)) {
    throw new Error(
      `resolved to ${resolved}, expected it to end with ${expected}`,
    )
  }
}

console.log('Checking what publint cannot see...')

// Resolution alone, because plain Node cannot evaluate the main entry: it
// imports ./styles.css, and Node has no loader for CSS. A consumer reaches it
// through a bundler that does. What is under test here is which file the
// exports map hands back for a require(), which is what `default` decides.
check('the main entry resolves under require()', () => {
  resolvesTo('@kanso-labs/kanso-ui', '/dist/index.js')
})

check('the ./date subpath resolves under require()', () => {
  resolvesTo('@kanso-labs/kanso-ui/date', '/dist/date.js')
})

// ./date carries no stylesheet import, so it is the one entry a bare Node
// require() can run start to finish — which is what proves require(esm)
// genuinely works here rather than merely resolving.
check('the ./date subpath evaluates under require()', () => {
  /** @type {unknown} */
  const entry = require('@kanso-labs/kanso-ui/date')

  if (typeof entry !== 'object' || entry === null) {
    throw new Error(`required the module and got ${typeof entry} back`)
  }

  if (Object.keys(entry).length === 0) {
    throw new Error('required the module and got no exports back')
  }
})

check('dist/index.js still imports ./styles.css', () => {
  // Located from this file rather than the working directory, so the check
  // runs the same from anywhere — and deliberately not through the exports
  // map, so a broken map fails the resolution checks above and this one keeps
  // reporting only on what it is actually about.
  const source = readFileSync(
    new URL('../dist/index.js', import.meta.url),
    'utf8',
  )

  if (!source.includes('./styles.css')) {
    throw new Error(
      'the side-effect import is gone, so a consumer gets no compiled rules',
    )
  }
})

// A module importing one component by name, bundled as an app's production
// build bundles it, with nothing else on the page to pull the stylesheet in.
// It is served from a plugin rather than a file, and reaches the package by
// its own name, so the bundler reads this package.json's `sideEffects` as it
// would read the installed copy's.
const CONSUMER = '\0consumer'

/** @returns {Promise<string[]>} the names of the files the bundle emits */
async function bundleConsumer() {
  const result = await build({
    build: { rolldownOptions: { input: 'consumer' }, write: false },
    configFile: false,
    logLevel: 'silent',
    plugins: [
      {
        load: (id) =>
          id === CONSUMER
            ? "import { Button } from '@kanso-labs/kanso-ui'\nglobalThis.Button = Button\n"
            : null,
        name: 'consumer',
        resolveId: (id) => (id === 'consumer' ? CONSUMER : null),
      },
    ],
    root: fileURLToPath(new URL('..', import.meta.url)),
  })

  if (!Array.isArray(result) && !('output' in result)) {
    throw new TypeError('the build started a watcher rather than bundling')
  }

  return (Array.isArray(result) ? result : [result]).flatMap((bundle) =>
    bundle.output.map((file) => file.fileName),
  )
}

const consumerBundle = await bundleConsumer().catch(
  /** @param {unknown} error */
  (error) => (error instanceof Error ? error : new Error(String(error))),
)

check("a consumer's production bundle keeps the stylesheet", () => {
  if (consumerBundle instanceof Error) {
    throw consumerBundle
  }

  if (!consumerBundle.some((name) => name.endsWith('.js'))) {
    throw new Error('the bundle holds no JavaScript, so this proves nothing')
  }

  if (!consumerBundle.some((name) => name.endsWith('.css'))) {
    throw new Error(
      'the bundle holds no stylesheet: the entry was dropped, and its ./styles.css import with it',
    )
  }
})

check('dist/styles.css mirrors on dir rather than on lang', () => {
  const css = readFileSync(
    new URL('../dist/styles.css', import.meta.url),
    'utf8',
  )

  if (!css.includes(':dir(rtl)')) {
    throw new Error(
      'no :dir(rtl) rule survived the build, so nothing mirrors under dir="rtl"',
    )
  }
})

// The layer an app orders the library by. Its name is a public contract:
// the README tells a Tailwind v4 app to declare `@layer theme, base, kanso,
// components, utilities`, and every rule outside it would sit in a layer of
// its own that app never named.
check('dist/styles.css puts every rule in the kanso layer', () => {
  const css = readFileSync(
    new URL('../dist/styles.css', import.meta.url),
    'utf8',
  )
  const layers = [...css.matchAll(/@layer\s+([^{;]+)/gu)].flatMap((match) =>
    match[1].split(',').map((name) => name.trim()),
  )

  if (!layers.includes('kanso.priority1')) {
    throw new Error(
      'no kanso.priority1 layer, so the library has no name to order by',
    )
  }

  const unnamed = layers.filter((name) => !name.startsWith('kanso.'))

  if (unnamed.length > 0) {
    throw new Error(`layers outside kanso: ${[...new Set(unnamed)].join(', ')}`)
  }
})

const DIST = new URL('../dist/', import.meta.url)

/** @param {string} path */
function distSource(path) {
  return readFileSync(new URL(path, DIST), 'utf8')
}

/** @param {string} path */
function isClientModule(path) {
  return /^"use client";?\n/u.test(distSource(path))
}

check('every client module opens with "use client" in dist', () => {
  const components = readdirSync(new URL('components/', DIST))
    .map((name) => `components/${name}/index.js`)
    .filter((path) => existsSync(new URL(path, DIST)))

  if (components.length < 60) {
    throw new Error(
      `found ${components.length} component modules, expected every one`,
    )
  }

  const missing = [
    ...components,
    'react-aria.js',
    'drag/hooks.js',
    'theme-scope.js',
  ].filter((path) => !isClientModule(path))

  if (missing.length > 0) {
    throw new Error(`no directive at the top of ${missing.join(', ')}`)
  }
})

// What a server component's bundle evaluates when it imports the package: the
// entries, and every module they reach without crossing into a client one.
// A client module is a reference on that side, so the walk stops at it.
const CLIENT_ONLY =
  /^(?:react|react-dom|react-aria|react-aria-components|react-stately|client-only|@react-aria\/|@react-stately\/)(?:\/|$)/u

check('the server side of the entries imports no client code', () => {
  const reached = new Set()
  /** @type {string[]} */
  const offending = []
  const queue = ['index.js', 'date.js']

  for (let path = queue.shift(); path !== undefined; path = queue.shift()) {
    if (reached.has(path) || isClientModule(path)) {
      continue
    }

    reached.add(path)

    const specifiers = [
      ...distSource(path).matchAll(/(?:from|import)\s*"([^"]+)"/gu),
    ].map((match) => match[1])

    for (const specifier of specifiers) {
      if (specifier.startsWith('.')) {
        if (specifier.endsWith('.js')) {
          queue.push(
            new URL(specifier, new URL(path, DIST)).href.slice(
              DIST.href.length,
            ),
          )
        }
      } else if (CLIENT_ONLY.test(specifier)) {
        offending.push(`${path} imports ${specifier}`)
      }
    }
  }

  if (!reached.has('layout.js')) {
    throw new Error('the walk never reached layout.js, so it proves nothing')
  }

  if (offending.length > 0) {
    throw new Error(offending.join('; '))
  }
})

// The constants a virtualized collection is laid out with are the one thing
// in the entry a server component needs as a value rather than a reference,
// and they live in a module plain Node can run.
check('collectionSizes is a value a server can read', () => {
  /** @type {unknown} */
  const layout = require('../dist/layout.js')
  const sizes =
    typeof layout === 'object' && layout !== null && 'collectionSizes' in layout
      ? layout.collectionSizes
      : undefined

  if (
    typeof sizes !== 'object' ||
    sizes === null ||
    !('listRow' in sizes) ||
    typeof sizes.listRow !== 'number'
  ) {
    throw new TypeError('dist/layout.js did not hand back collectionSizes')
  }
})

check('no published declaration imports a stylesheet', () => {
  const declarations = readdirSync(DIST, { recursive: true })
    .map(String)
    .filter((path) => path.endsWith('.d.ts'))
  const importing = declarations.filter((path) =>
    /^\s*import\s*["'][^"']+\.css["']/mu.test(distSource(path)),
  )

  if (declarations.length === 0) {
    throw new Error('found no declarations in dist, so this proves nothing')
  }

  if (importing.length > 0) {
    throw new Error(`a stylesheet import in ${importing.join(', ')}`)
  }
})

check('a consumer type-checks under TypeScript 6 defaults', () => {
  const result = spawnSync(
    process.execPath,
    [
      require.resolve('typescript/bin/tsc'),
      '-p',
      new URL('consumer-types/tsconfig.json', import.meta.url).pathname,
    ],
    { encoding: 'utf8' },
  )

  if (result.status !== 0) {
    throw new Error(result.stdout.trim() || result.stderr.trim())
  }
})

check("dist/tokens.css and dist/tokens.json are kanso-ui-core's", () => {
  for (const name of ['tokens.css', 'tokens.json']) {
    const published = readFileSync(new URL(name, DIST))
    const source = readFileSync(
      require.resolve(`@kanso-labs/kanso-ui-core/${name}`),
    )

    if (!published.equals(source)) {
      throw new Error(`dist/${name} differs from the package's ${name}`)
    }
  }
})

check('nothing in dist imports @kanso-labs/kanso-ui-core', () => {
  const importing = readdirSync(DIST, { recursive: true })
    .map(String)
    .filter((file) => /\.(?:d\.ts|js)$/u.test(file))
    .filter((file) =>
      /(?:from|import\(?)\s*['"]@kanso-labs\/kanso-ui-core[/'"]/u.test(
        readFileSync(new URL(file, DIST), 'utf8'),
      ),
    )

  if (importing.length > 0) {
    throw new Error(`an import of the package in ${importing.join(', ')}`)
  }
})

if (failures.length > 0) {
  console.error(`\n${failures.length} check(s) failed:\n`)
  for (const failure of failures) {
    console.error(`  - ${failure}`)
  }
  process.exit(1)
}

console.log('\nAll good!')
