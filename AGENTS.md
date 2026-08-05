# AGENTS.md

Guidance for AI coding agents working in this repo.

## What this is

kanso-ui is a React component library built on [Base UI](https://base-ui.com)
primitives, styled with [StyleX](https://stylexjs.com), and compiled with the
React Compiler. Components are developed and documented in Storybook.

## Commands

| Task       | Command                 | Notes                                                            |
| ---------- | ----------------------- | ---------------------------------------------------------------- |
| Dev server | `npm run storybook`     | Storybook at http://localhost:6006 (`npm run dev` is an alias)   |
| Test       | `npm test`              | Vitest in headless Chromium                                      |
| Coverage   | `npm run test:coverage` | Same suite with v8 coverage; writes Cobertura XML to `coverage/` |
| Lint       | `npm run lint`          | oxlint, then ESLint, then oxfmt formatting check                 |
| Build      | `npm run build`         | Type-checks (`tsc -b`) then builds ESM + CJS into `dist/`        |

Tests require Playwright browsers; `npm install` installs them via the `prepare`
script.

**`npm run lint` does not type-check.** It passes on code that `tsc -b` rejects,
and CI runs a separate Build job that will fail on those errors. Run
`npm run build` before pushing, not just lint and tests.

**Install with the Node version in `.tool-versions`.** CI resolves it from that
file, and an older npm silently drops the platform entries the lockfile carries
for Linux builds. If `node --version` disagrees, prefix the command:
`mise exec node@<version> -- npm install`.

## Testing

Vitest runs two projects, both in headless Chromium (see `vite.config.ts`):

- **`storybook`** — every `*.stories.tsx`, via `@storybook/addon-vitest`. A
  story without a `play` function still counts as a smoke test that the
  component renders.
- **`unit`** — every `*.test.{ts,tsx}`, using Testing Library.

Stories are documentation, and Chromatic snapshots each one **twice** — once per
mode in `.storybook/modes.ts`, currently light and dark — so keep them to states
a consumer would want to look at. Exhaustive behavioural permutations belong in
a `*.test.tsx`, where they cost neither a sidebar entry nor a snapshot.

Each mode carries its own baseline, keyed on the mode's name, so a visual change
has to be accepted in both themes. A story that is genuinely theme-independent
can opt one out with
`parameters: { chromatic: { modes: { dark: { disable: true } } } }`.

A story can be made to cost neither too, for the rare check that has to run as a
story (see "Controlling time" below). `tags: ['!dev']` subtracts the tag the
sidebar filters on while leaving `test`, so it still runs; Chromatic reads the
index rather than the sidebar and so needs
`parameters.chromatic.disableSnapshot` separately. `Pressed` in
`src/components/button/index.stories.tsx` uses both. Reach for this only when a
story is the only place a check can live — it is not a way to keep ordinary
behavioural tests out of `*.test.tsx`.

Keep the `unit` project in the browser. Under `environment: 'node'` those files
get a different transform pipeline, so sources shared with the `storybook`
project are instrumented twice with mismatched statement maps and the merged
coverage totals come out wrong.

### Controlling time

Do not wait in real time for a component's own timers. An assertion can land
exactly when a timer fires, which fails intermittently and is then usually
"fixed" by lengthening a sleep rather than by removing the race.

Use fake timers, and advance them inside `act` so React flushes what they
trigger. Where the code under test reads `currentTime` from the Web Animations
API, that alone is not enough: animations run on the document timeline, which
fake timers do not drive, so the value stays at zero and any branch behind
"enough time has passed" becomes unreachable. Stub `Element.prototype.animate`
with a stand-in whose `currentTime` follows the fake clock. `useRipple` needs
both, and `src/components/button/index.test.tsx` shows the pattern.

Leave at least one check on real timers and real animations, since stubbing both
proves the state machine but not that the two work together. Prefer a story's
`play` function for it, as `Pressed` in
`src/components/button/index.stories.tsx` does. Stories run under `npm test`
exactly as tests do, but they are also the only thing Storybook's own Testing
widget can execute — it starts Vitest filtered to the `storybook` project alone,
so a `*.test.tsx` never counts toward the percentage that widget reports.
Putting the unmocked pass in a story is the one way to have it count in both
places instead of being written twice.

### Writing interaction tests

- Assert against observable DOM, such as the class StyleX generates for a state,
  rather than reaching for React internals.
- Prove a new assertion can fail before trusting it. `[].every()` is `true`, so
  a helper built on an empty class list reports a state that never happened.
- React derives `onPointerLeave` and `onPointerEnter` from the bubbling
  `pointerout` and `pointerover` events. Dispatching a raw `pointerleave` does
  nothing, because it does not bubble and React never listens for it.

### Coverage

Pull requests report coverage but nothing gates on it, so there are no
thresholds to satisfy. Stories, tests, and generated tokens are excluded,
leaving the percentage to reflect real source only.

`npm run test:coverage` is the number, and it is the one CI uploads. Storybook's
Testing widget reports a much lower one — around 80% against the ~99% that
command prints — and the gap is not a gap. The widget starts Vitest filtered to
the `storybook` project, so only stories run, but `coverage.include` still spans
all of `src`, which leaves everything covered by a `*.test.tsx` counting against
it. `useRipple` is most of that difference. Neither half is configurable: the
project filter is hardcoded in `@storybook/addon-vitest`, and even within that
project it only runs specs the story index has entries for, so a `*.test.tsx`
can never run there. Raising the widget's number means writing a story, which is
worth doing only when the check belongs in one anyway — do not port tests into
stories to move it.

Branch coverage cannot reach 100%. The React Compiler synthesizes memoization
branches that no test can exercise, and attributes them to source lines holding
no conditional. Treat an uncovered branch with no matching source conditional as
an artifact rather than a gap to close.

Barrel files always report 100% because re-exports compile to bindings with no
executable statements, so the figure is structural rather than earned and no
test moves it. What guards them is `src/index.test.ts` and
`src/components/index.test.ts`, which assert the exported names exactly.

Running the suite as an agent hides files at 100% from the printed table, so a
file missing from that output is covered rather than absent. The uploaded report
always carries every file.

## Previewing

There is no demo app — Storybook is the runtime surface. To see a component
render, start the dev server and open its story. Claude Code's browser preview
is preconfigured in `.claude/launch.json`; other agents can just run
`npm run storybook`.

The port is 6006 unless `PORT` says otherwise, which is what lets two agents
preview the repo at once — `.claude/launch.json` sets `autoPort`, so a second
session is handed a free port instead of failing to bind. Read the port off the
URL the preview reports rather than assuming 6006.

The toolbar's Theme control sets the `theme` global, which is what the decorator
in `.storybook/preview.tsx` reads to pick a StyleX theme. It defaults to light
rather than following the OS, because `prefers-color-scheme` is not reliably
applied by the time the preview module evaluates. A story can be opened straight
into one theme with `&globals=theme:dark` on the URL — that is also the
mechanism Chromatic's modes use.

## Layout and conventions

- Each component lives in `src/components/<name>/` as `index.tsx` with a
  colocated `index.stories.tsx`, and an `index.test.tsx` alongside it once there
  is behaviour worth pinning. Every component needs stories, since they are both
  its documentation and its render smoke test.
- Public API is exported from `src/index.ts`.
- Styling uses StyleX (`stylex.create` / `stylex.props`) — no CSS files or
  inline `style` objects.
- Commit messages must follow Conventional Commits; commitlint enforces this via
  a husky hook, and release-please derives versions from commit types.
- Staged `.ts`/`.tsx` files are linted (oxlint, then ESLint) and formatted
  (oxfmt) automatically on commit via a husky pre-commit hook running
  lint-staged (config in `.lintstagedrc.json`). Staged `.json`, `.md`, `.yaml`,
  and `.yml` files are formatted (oxfmt) wherever they live, since
  `npm run lint` ends in `oxfmt --check` over the whole repo. oxlint and ESLint
  are absent from that entry because neither reads those formats.
