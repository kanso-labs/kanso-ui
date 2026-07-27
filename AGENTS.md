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

## Testing

Vitest runs every `*.stories.tsx` in headless Chromium via
`@storybook/addon-vitest`. A story without a `play` function still counts as a
smoke test that the component renders, and a `play` function turns that story
into an interaction test.

### Coverage

Pull requests report coverage but nothing gates on it, so there are no
thresholds to satisfy. Stories and generated tokens are excluded, leaving the
percentage to reflect real source only.

Branch coverage cannot reach 100%. The React Compiler synthesizes memoization
branches that no test can exercise, and attributes them to source lines holding
no conditional. Treat an uncovered branch with no matching source conditional as
an artifact rather than a gap to close.

## Previewing

There is no demo app — Storybook is the runtime surface. To see a component
render, start the dev server and open its story. Claude Code's browser preview
is preconfigured in `.claude/launch.json`; other agents can just run
`npm run storybook`.

## Layout and conventions

- Each component lives in `src/components/<name>/` as `index.tsx` with a
  colocated `index.stories.tsx`. Stories double as the test suite (via
  `@storybook/addon-vitest`), so every component needs stories.
- Public API is exported from `src/index.ts`.
- Styling uses StyleX (`stylex.create` / `stylex.props`) — no CSS files or
  inline `style` objects.
- Commit messages must follow Conventional Commits; commitlint enforces this via
  a husky hook, and release-please derives versions from commit types.
- Staged `.ts`/`.tsx` files are linted (oxlint, then ESLint) and formatted
  (oxfmt) automatically on commit via a husky pre-commit hook running
  lint-staged (config in `.lintstagedrc.json`).
