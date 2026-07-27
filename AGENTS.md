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

Stories are documentation, and Chromatic snapshots each one, so keep them to
states a consumer would want to look at. Exhaustive behavioural permutations
belong in a `*.test.tsx`, where they cost neither a sidebar entry nor a
snapshot.

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

Leave at least one test on real timers and real animations, since stubbing both
proves the state machine but not that the two work together.

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
  lint-staged (config in `.lintstagedrc.json`).
