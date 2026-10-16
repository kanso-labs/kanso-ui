# The design system artifact

The Kanso UI design system is published as a Claude Design System artifact,
<https://claude.ai/artifact/TJSpYMBeBEMx1agnDVuZdv>, and **that artifact is the
design system's source of truth**: its tokens and their usage notes, the type
styles and families, the brand book, the cover, and each component's guidelines
and live preview. A person changes the design system there, in its page.

The code that draws the components is this repository's, and so is
`src/tokens/design.tokens.json`, the copy of the tokens every package builds
from: kanso-ui's StyleX token modules and `tokens.css`, and the
`@kanso-labs/kanso-ui/tokens.json` export that react-native-kanso-ui reads. An
edit made in the artifact therefore reaches both libraries the same way, through
a pull request here, a release, and the dependency bump that follows it in the
native repository.

This directory is what keeps the two in step. A daily routine, "Kanso UI design
system sync", runs the procedure below shortly after release-please's 09:00 UTC
run, and any session asked to sync the artifact by hand follows the same steps.

## What lives where

| Artifact path under `project/`                                                | Owned by       | Written by                                     |
| ----------------------------------------------------------------------------- | -------------- | ---------------------------------------------- |
| `tokens.json`                                                                 | the artifact   | `tokens.mjs`, merging both sides (see below)   |
| `fonts/*`, `components/bundle.js`, `bundle.css`, `index.d.ts`, `lib/*.js`     | the repository | `build.mjs`, from `dist/`                      |
| `README.md`, `components/Cover/preview.html`                                  | the artifact   | a person in the page, or a sync session by hand |
| `components/<Name>/preview.html`, `components/<Name>/README.md`               | the artifact   | a person in the page, or a sync session by hand |
| `design-system.json`                                                          | the artifact   | read right before every publish, sent last     |

`notes.json` here holds the usage notes the artifact shows beside each token,
type style and token family, because `design.tokens.json` has no place for
them. It is part of the token source as far as a sync is concerned: a usage note
edited in the artifact comes back into this file.

## The scripts

- `tokens.mjs build <out.json> --ref main@<sha>` writes the artifact's
  `tokens.json` from `design.tokens.json` and `notes.json`.
- `tokens.mjs pull <artifact tokens.json>` applies the artifact's edits since
  the commit its `meta.ref` names, and only those, to `design.tokens.json` and
  `notes.json`, then reruns `npm run tokens:build`. It prints what it changed,
  what also changed in the repository since then (`clashes`, where the artifact
  wins), and what has no place in the token file (`unmapped`), such as a colour
  added in the page or a role pointed at a raw hex value instead of a palette
  tone. A field the artifact left as it was is the repository's to keep.
- `tokens.mjs check` proves the two directions agree: a pull of an unedited
  build changes nothing, one edit of every kind lands where it should, and a
  repository edit the artifact never touched survives a pull. Run it after
  changing either direction.
- `build.mjs <dir> --ref main@<sha>` writes every repository-owned file into
  `<dir>/project/`. It reads `dist/`, so run `npm run build` first.
- `render.mjs <dir> [<Name> … | all]` renders previews from `<dir>/project/`
  in light and dark the way the page frames them, prints what is wrong with
  each, and writes screenshots to `<dir>/shots/` to look at. A preview passes
  with no errors, no fallback face, and content no taller than its marker's
  `height`.

The component list is not kept anywhere: it is every `src/components/<dir>`
with an `index.tsx`, named in PascalCase, which is the name the barrel exports.

## The sync

Work in a scratch directory outside the repository, `<dir>` below. Read
artifact files with the Artifact tool's `read` and a `path`; never from a cached
copy.

1. **Read the artifact.** `project/design-system.json` and
   `project/tokens.json`. The sha in `tokens.json`'s `meta.ref` is the commit the
   artifact was last synced from.
2. **Bring the artifact's edits into the repository.** On the branch
   `design-sync/artifact` reset to `origin/main`, run
   `node .design-sync/artifact/tokens.mjs pull <dir>/tokens.json`.
   - If it changed anything, commit it, run `npm run lint`, `npm run build`
     and `npm test`, and open a pull request from that branch, or push to the
     one already open from it. Title it as the Conventional Commit for what
     changed — `fix(tokens): …` for an adjusted value, `feat(tokens): …` for a
     new one — with the `kind:` label AGENTS.md reads off its type (`kind:fix`
     for a `fix`), `area:foundations`, the `v1.0.0` milestone, and the before
     and after screenshots AGENTS.md asks of any change to what a component
     renders. List the `clashes` and the `unmapped` entries in its body, the
     second as what a person has to decide.
   - An edit to the brand book or to a component's guidelines that asks for a
     change in the code — a new rule, a different default — becomes an issue
     here naming the artifact edit. Prose that changes nothing in the code
     stays in the artifact.
3. **Build what the repository owns.** On the same branch, which is now
   `origin/main` with the artifact's edits applied,
   `npm run build && node .design-sync/artifact/build.mjs <dir> --ref main@<sha>`,
   `<sha>` being `origin/main`'s. Its `tokens.json` carries the repository's
   changes, keeps every artifact edit not yet released, and moves `meta.ref` to
   this commit. A later pull then finds the same unreleased edits again, which
   keeps the pull request from step 2 current until it merges.
4. **Bring the repository's changes into the artifact.** Diff
   `git diff <meta.ref sha> HEAD -- src README.md ':!src/**/*.test.*' ':!src/**/*.testing.ts' ':!src/**/*.stories.*'`.
   That is all of `src` rather than `src/components` alone, because the shared
   internals beside it — `src/button`, `src/field`, `src/row` and the rest —
   change every component that draws them: `aria-busy` reached `Button` and
   `IconButton` through `src/button` alone.
   For each component whose props, states or behaviour changed, read its
   `preview.html` and `README.md` from the artifact, update them, and add a new
   component's pair, its marker's `group` one of the groups the others use. A
   removed component's pair is sent as `null`. Update the brand book where the
   change reaches it — theming, the global's contents, a token family. Copy each
   file you change, and every other authored file, into `<dir>/project/` and run
   `node .design-sync/artifact/render.mjs <dir> <Name> …` on the previews you
   touched; look at both screenshots of each.
5. **Publish.** One Artifact `publish` to the artifact's url with `root` `<dir>`,
   `files` naming only the paths whose bytes differ from what the artifact
   serves, `project/components/index.d.ts` sent with `contentType`
   `text/plain`. Read `project/design-system.json` again right before, set its
   `lastChange` to `{ by: "Rodrigo", at: <now>, via: "GitHub · kanso-labs/kanso-ui@<sha>", note: <one line> }`,
   keep every other key, and send it as the call's `file_path`, last. More than
   255 paths go in several calls, the index in the last.

A run that finds nothing to pull and nothing changed since `meta.ref` publishes
nothing.
