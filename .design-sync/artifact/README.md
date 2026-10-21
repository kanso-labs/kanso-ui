# The design system artifact

The Kanso UI design system is published as a Claude Design System artifact,
<https://claude.ai/artifact/TJSpYMBeBEMx1agnDVuZdv>, and **that artifact is the
design system's source of truth**: its tokens and their usage notes, the type
styles and families, the brand book, the cover, and each component's guidelines
and live preview. A person changes the design system there, in its page.

The tokens both libraries build from are
[kanso-ui-core](https://github.com/kanso-labs/kanso-ui-core)'s
`src/tokens/design.tokens.json`, and the code that draws the components is this
repository's. The sync therefore has two halves, one per repository.
kanso-ui-core's `.design-sync/artifact/` is the tokens': it brings a token or a
usage note edited in the artifact into a pull request there, and builds the
artifact's `tokens.json`. This directory is the rest — the bundle, the fonts,
the types, and each component's preview and guidelines — and it holds the step
that publishes both.

A daily routine, "Kanso UI design system sync", runs both in one session
shortly after release-please's 09:00 UTC run, kanso-ui-core's half first, and
any session asked to sync the artifact by hand follows the same steps.

## What lives where

| Artifact path under `project/`                                                | Owned by       | Written by                                      |
| ----------------------------------------------------------------------------- | -------------- | ----------------------------------------------- |
| `tokens.json`                                                                 | the artifact   | kanso-ui-core's `tokens.mjs`, merging both sides |
| `fonts/*`, `components/bundle.js`, `bundle.css`, `index.d.ts`, `lib/*.js`     | the repository | `build.mjs`, from `dist/`                       |
| `README.md`, `components/Cover/preview.html`                                  | the artifact   | a person in the page, or a sync session by hand |
| `components/<Name>/preview.html`, `components/<Name>/README.md`               | the artifact   | a person in the page, or a sync session by hand |
| `design-system.json`                                                          | the artifact   | read right before every publish, sent last      |

`tokens.json`'s `meta` names the commit of each repository the artifact was
last synced from, under `refs`: `kanso-labs/kanso-ui-core`'s is what a token
pull merges against, and `kanso-labs/kanso-ui`'s is what step 3 below diffs
from. A file with no `refs` was written before the tokens moved, and its
`meta.ref` is then a kanso-ui commit.

## The scripts

- `build.mjs <dir>` writes every file this repository owns into
  `<dir>/project/`. It reads `dist/`, so run `npm run build` first.
- `render.mjs <dir> [<Name> … | all]` renders previews from `<dir>/project/`
  in light and dark the way the page frames them, prints what is wrong with
  each, and writes screenshots to `<dir>/shots/` to look at. A preview passes
  with no errors, no fallback face, and content no taller than its marker's
  `height`. It reads `<dir>/project/tokens.json`, which kanso-ui-core's half
  writes.

The component list is not kept anywhere: it is every `src/components/<dir>`
with an `index.tsx`, named in PascalCase, which is the name the barrel exports.

## The sync

Work in a scratch directory outside both repositories, `<dir>` below, with a
checkout of kanso-labs/kanso-ui-core beside this one. Read artifact files with
the Artifact tool's `read` and a `path`; never from a cached copy.

1. **Run kanso-ui-core's half**, in its `.design-sync/artifact/README.md`. It
   reads the artifact's `tokens.json` into `<dir>/tokens.json`, opens or
   updates its pull request, and writes the new `<dir>/project/tokens.json`,
   reading the component list from this checkout at `origin/main`.
2. **Build what this repository owns.** At `origin/main`,
   `npm run build && node .design-sync/artifact/build.mjs <dir>`.
3. **Bring this repository's changes into the artifact.** Diff
   `git diff <sha> HEAD -- src README.md ':!src/**/*.test.*' ':!src/**/*.testing.ts' ':!src/**/*.stories.*'`,
   `<sha>` being `meta.refs['kanso-labs/kanso-ui']` in `<dir>/tokens.json`, the
   file the artifact served. That is all of `src` rather than `src/components`
   alone, because the shared internals beside it — `src/button`, `src/field`,
   `src/row` and the rest — change every component that draws them:
   `aria-busy` reached `Button` and `IconButton` through `src/button` alone.
   For each component whose props, states or behaviour changed, read its
   `preview.html` and `README.md` from the artifact, update them, and add a new
   component's pair, its marker's `group` one of the groups the others use. A
   removed component's pair is sent as `null`. Update the brand book where the
   change reaches it — theming, the global's contents, a token family. Copy each
   file you change, and every other authored file, into `<dir>/project/` and run
   `node .design-sync/artifact/render.mjs <dir> <Name> …` on the previews you
   touched; look at both screenshots of each.
   - An edit to the brand book or to a component's guidelines that asks for a
     change in the code — a new rule, a different default — becomes an issue
     here naming the artifact edit. Prose that changes nothing in the code
     stays in the artifact.
4. **Publish.** One Artifact `publish` to the artifact's url with `root` `<dir>`,
   `files` naming only the paths whose bytes differ from what the artifact
   serves, `tokens.json` among them, and `project/components/index.d.ts` sent
   with `contentType` `text/plain`. Read `project/design-system.json` again
   right before, set its `lastChange` to
   `{ by: "Rodrigo", at: <now>, via: "GitHub · kanso-labs/kanso-ui-core@<sha> · kanso-labs/kanso-ui@<sha>", note: <one line> }`,
   keep every other key, and send it as the call's `file_path`, last. More than
   255 paths go in several calls, the index in the last.

A run that finds nothing to pull, nothing new in kanso-ui-core's `tokens.json`
and nothing changed here since `meta.refs` publishes nothing.
