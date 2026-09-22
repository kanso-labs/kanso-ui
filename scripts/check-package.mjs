#!/usr/bin/env node
// Checks the three things about the built package that publint cannot see.
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
// shipped. Three separate pieces keep it there — see "How the compiled CSS
// reaches a consumer" in AGENTS.md — and nothing failed the build when it
// went missing.
//
// The third is the right-to-left mirroring in dist/styles.css. lightningcss
// rewrites `:dir(rtl)` into a list of `:lang()` selectors for any target
// without `:dir()`, which matches on a reader's language rather than their
// writing direction, and the build turns that rewrite off in
// tsdown.config.ts. The tests read the dev server's stylesheet rather than
// this one, so this is the only place the build's half is checked.

import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'

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

if (failures.length > 0) {
  console.error(`\n${failures.length} check(s) failed:\n`)
  for (const failure of failures) {
    console.error(`  - ${failure}`)
  }
  process.exit(1)
}

console.log('\nAll good!')
