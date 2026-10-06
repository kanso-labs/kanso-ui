#!/usr/bin/env node
// Checks the built package's public types against the reports in etc/, or
// rewrites the reports with --local.
//
// src/index.test.ts pins which names the package exports, and nothing pinned
// what their types say. A prop narrowed from an array to a tuple is a compile
// error for a consumer passing an array, and it read as a one-line change to
// a .d.ts nobody opens in review. A report is API Extractor's reading of an
// entry's declarations, one file per entry that has types of its own, so the
// same change reaches review as a diff of etc/*.api.md instead.
//
// `npm run package:check` ends on this, without --local, and fails when a
// report no longer matches dist/, printing the difference. `npm run
// api:update` passes --local, which rewrites the reports to match. That is
// the step that makes a change to a public type a decision rather than a
// side effect, and the pull request says what it means for a consumer.
//
// Both read dist/, so build first. Every message API Extractor raises goes
// into the report rather than the console, apart from the two this library
// has no use for — release tags and TSDoc's tag vocabulary — which is what
// keeps the check failing on a changed report alone. See etc/api-extractor.json.

import { Extractor, ExtractorConfig } from '@microsoft/api-extractor'

const local = process.argv.includes('--local')

// One per entry with declarations of its own. The two stylesheet subpaths
// share dist/stylesheet.d.ts, which declares nothing a consumer imports.
const configs = ['etc/api-extractor.json', 'etc/api-extractor.date.json']

let failed = false
for (const path of configs) {
  const result = Extractor.invoke(ExtractorConfig.loadFileAndPrepare(path), {
    localBuild: local,
    printApiReportDiff: !local,
  })
  failed ||= !result.succeeded
}

if (failed && !local) {
  console.error(
    '\nThe public types no longer match etc/*.api.md. If the change is meant,' +
      ' run `npm run api:update`, commit the reports, and say in the pull' +
      ' request what changed for a consumer.',
  )
}

if (failed) {
  process.exitCode = 1
}
