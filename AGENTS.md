# AGENTS.md

Guidance for AI coding agents working in this repo.

## What this is

kanso-ui is a React component library built on [Base UI](https://base-ui.com)
primitives, styled with [StyleX](https://stylexjs.com), and compiled with the
React Compiler. Components are developed and documented in Storybook.

## Commands

| Task       | Command             | Notes                                                          |
| ---------- | ------------------- | -------------------------------------------------------------- |
| Dev server | `npm run storybook` | Storybook at http://localhost:6006 (`npm run dev` is an alias) |
| Test       | `npm test`          | Vitest running story-based tests in headless Chromium          |
| Lint       | `npm run lint`      | ESLint (includes Prettier formatting checks)                   |
| Build      | `npm run build`     | Type-checks (`tsc -b`) then builds ESM + CJS into `dist/`      |

Tests require Playwright browsers; `npm install` installs them via the `prepare`
script.

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
