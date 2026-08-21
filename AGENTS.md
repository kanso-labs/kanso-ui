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

`getComputedStyle` is only trustworthy in those files because `vitest.setup.ts`
fetches StyleX's stylesheet before the first test in each of them. Under the dev
server the plugin serves that stylesheet from a virtual endpoint, putting a
`<link>` to it in the document and a runtime module that re-fetches it whenever
a newly transformed module contributes rules — and a spec's modules are
transformed only once its page has loaded, so the rules for the component under
test arrive over that refresh rather than with the document. A read that landed
first described an unstyled element, which is what made assertions on colours,
sizes and widths fail under CI's parallel load and pass when a file ran on its
own. One fetch per file, once collection has transformed everything the file
imports, is what makes those rules present rather than imminent. Do not swap it
for a wait.

### Sample copy

kanso-ui is a general-purpose library, so the text inside stories, tests, and
code comments must stay domain-neutral. Nothing may read as though it came from
one particular product, and no wording may be lifted from a consuming app's
screens.

Use placeholder copy that names the slot it fills: `Headline`,
`Supporting line`, `First item` / `Second item` / `Third item`, `Label`. Where a
value has to be numeric to show a typographic property such as tabular figures,
use plain sequence numbers (`01`, `02`, `03`), which carry no units. Person
names should be neutral and recognisably placeholder — `Ada Lovelace`,
`Grace Hopper`. Comments describing a story should name the component's own
behaviour rather than the app feature it was drawn from.

The same applies to new components: write their stories and tests with generic
copy from the start rather than porting text over from wherever the design
originated.

That rule covers what the placeholder text may say. How copy is written — the
sentence case, the imperative CTAs, the things to avoid — lives in
`src/tokens/design.tokens.json`, under `$extensions` → `voice`, alongside the
visual tokens, so it reaches anything handed the token file on its own. Both
apply to a new component's stories, and neither is a subset of the other.

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

`main` is published to GitHub Pages at <https://kanso-ui.kansolabs.org/>, which
is the copy to link someone who only wants to look. It lags a local server by
however long the deploy takes and never shows uncommitted work, so it is not a
substitute for running one while developing.

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

## Conventions

Shared with the other `kanso-labs` repositories:

- **Keys in JSON and YAML are ordered by name.** Files whose order carries
  meaning are exempt: workflows, where step order is execution order;
  changelogs, which are chronological; and `package.json`, where the npm
  ecosystem expects `name` and `version` first.
- **A workflow's filename is the kebab-case of its `name:` field.** Reusable
  workflows, meaning those triggered only by `workflow_call`, take a leading
  underscore.
- **Job names and step names are imperative verb phrases.** Job ids, step ids,
  and matrix keys are exempt.
- **Actions are pinned to exact release tags**, never a moving major or `@main`.
  Renovate opens the bump pull requests.
- **Dependency versions are pinned exactly.** Every `dependencies`,
  `devDependencies`, and `optionalDependencies` entry is a bare version,
  `19.2.8`, never `^19.2.8`, `~19.2.8`, `>=19.2.8`, `*`, `19.x`, or an `||`
  union. Renovate opens those bumps too. `peerDependencies` are the deliberate
  exception: they state what the consumer's own installed copy must satisfy —
  which is why `react` is pinned in `devDependencies` and a range in
  `peerDependencies` — so ranges are correct there and stay.
- **`.tool-versions` pins a fully-specified version on every line**,
  `nodejs 24.19.0`, never `nodejs 24` or `nodejs lts`. Installing under a
  version that disagrees with it is the lockfile hazard described under
  "Commands" above.

The formatter is not shared: **oxfmt formats this repository**, not Prettier, so
the command is `npm run format` and the check runs inside `npm run lint`. The
mechanics are in the bullets below.

Specific to this repository:

- Each component lives in `src/components/<name>/` as `index.tsx` with a
  colocated `index.stories.tsx`, and an `index.test.tsx` alongside it once there
  is behaviour worth pinning. Every component needs stories, since they are both
  its documentation and its render smoke test.
- Public API is exported from `src/index.ts`.
- Styling uses StyleX (`stylex.create` / `stylex.props`) — no CSS files or
  inline `style` objects.
- Commit messages and pull request titles must follow Conventional Commits — see
  "Commits and pull requests" below, since which of the two reaches `main` is
  not what you would guess.
- Staged `.ts`/`.tsx` files are linted (oxlint, then ESLint) and formatted
  (oxfmt) automatically on commit via a husky pre-commit hook running
  lint-staged (config in `.lintstagedrc.json`). Staged `.json`, `.md`, `.yaml`,
  and `.yml` files are formatted (oxfmt) wherever they live, since
  `npm run lint` ends in `oxfmt --check` over the whole repo. oxlint and ESLint
  are absent from that entry because neither reads those formats.
- `CHANGELOG.md` is exempt from formatting, via `ignorePatterns` in
  `.oxfmtrc.json`. `release-please` writes it, in a style oxfmt disagrees with —
  `*` bullets rather than `-`, and one long line per entry against a
  `proseWrap: always` at 80 columns. Since the file is regenerated from the
  commit history on every release, formatting it only holds until the next
  release PR, at which point `Lint` fails again on a branch nobody hand-edits.
  Exempting it is what makes that stop recurring, so reformat the changelog only
  by teaching `release-please` to emit a different style, never by hand.

## Workflows and checks

**A job name becomes a check name**, so renaming a job edits the merge gate
rather than the label on it. Ruleset `18125383` ("Default") requires four
contexts that workflows post — `Build`, `Lint`, `Test`, and
`Run visual regression tests` — and it matches them by exact string. A job
renamed without the ruleset renamed alongside it stops reporting the context the
ruleset still waits on, so every open pull request sits on a check nothing will
ever post, which reads as a hang rather than a failure. Keep the two in sync in
one change. The ruleset is editable and a clearer job name is worth having, so
this is not a rule against renaming — it is a rule against renaming only one
half, and against forgetting the pull requests already open, which run the
workflow files from their own branches and so keep reporting the old name until
they are refreshed.

Two further required contexts, `Storybook Publish` and `UI Tests`, are posted by
Chromatic as commit statuses rather than by any workflow. Grepping
`.github/workflows` for either turns up nothing, and that absence is expected
rather than evidence something was deleted — nothing in those files affects
them.

**`Deploy Storybook` depends on repository settings no file here holds.** Pages
must have its source set to "GitHub Actions" under Settings → Pages, and
`actions/deploy-pages` fails the run outright while it is set to a branch
instead. The custom domain — `kanso-ui.kansolabs.org` — is a second such
setting, and it is the one that decides the published URL. The root `CNAME` file
is left over from the branch-based build that preceded this workflow: with Pages
building from a branch, that file is how the domain is declared, but an Actions
deployment reads the domain from the Pages configuration and never sees the
file, since it is not part of `storybook-static`. Deleting it therefore changes
nothing today, and re-picking a branch source in the UI would rewrite it anyway
— leave it be.

The build needs no `base`. Storybook's output references every asset relatively,
and the manager derives the preview iframe's URL from its own pathname rather
than from the origin, so the same artifact serves correctly from the domain root
and from a project subpath. That is what makes dropping the custom domain a
settings change rather than a rebuild.

The workflow runs on `main` only, so neither of its jobs posts a pull request
check and neither belongs in the ruleset above — the site follows what has
already merged rather than gating what reaches it. Chromatic publishes its own
Storybook per commit, which is what the `Storybook Publish` context reports on;
the two are independent, and the Pages copy is the one at a stable URL.

**Most of CI is shared, not configured here.**
[`kanso-labs/github-actions`](https://github.com/kanso-labs/github-actions)
holds it, pinned by exact tag, and Renovate opens the bump pull requests:

- `actions/setup-node` installs the pinned Node, restores the npm cache and runs
  `npm ci`. It replaced four copies of the same four steps. Pass
  `ignore-scripts: true` in any job that does not need Playwright's browsers.
- `actions/lint-workflows` runs actionlint. It is a **step of `Lint`**, not a
  job — `Lint` is a context the ruleset requires, and a new job would be a new
  name nothing requires, free to fail without stopping anything. It runs before
  the install so a broken workflow fails in seconds.
- `_release-please.yaml` proposes the releases. What stays in
  `release-please.yaml` here is the trigger, the concurrency group, the
  permissions and the secrets.
- `_publish-npm.yaml` publishes once a release is cut — to npmjs.com over
  trusted publishing, then the same tarball to GitHub Packages, the second only
  if the first succeeded. It replaced the four steps that job used to spell out,
  and its `ignore-scripts` default of `true` is what keeps `prepare` from
  downloading Playwright's browsers a second time during the publish itself —
  where failing to fetch one would abort a release that has already been tagged.
  Its two jobs want different scopes, so `release-please.yaml` here grants the
  union: `id-token: write` for npm's OIDC exchange, `packages: write` for GitHub
  Packages, which has no trusted publishing and authenticates with
  `GITHUB_TOKEN`. Only the npm half is attested.
- `_renovate-command.yaml` answers `@renovate rebase` on a dependency pull
  request, through `renovate-command.yaml` here. Only the copy on `main` ever
  runs: `issue_comment` is a repository-level event, so a change to that file
  cannot be tested from a branch.

**actionlint is a release behind GitHub, and `.github/actionlint.yaml` is how
that is handled.** It carries its own list of valid permission scopes, so
`code-quality: write` in `test.yaml` — which `actions/upload-code-coverage`
requires — reads as an unknown scope. The suppression is scoped to that one file
rather than passed as a global `-ignore`, so the rule keeps running everywhere
else, and it should be deleted once the pinned actionlint knows the scope.

**`Build`, `Lint` and `Test` run on pushes to `main` as well as on pull
requests**, so `main` is re-verified after a merge rather than taken on trust.
The `pull_request` trigger is deliberately unscoped: adding `branches: [main]`
would match the sibling repositories, but a pull request opened against any
other base would then post none of the contexts the ruleset requires, which
reads as a hang rather than a failure.

**`Chromatic` is grouped per ref, and cancels only off `main`.** On a branch the
newest commit is the one the pull request is gated on, so a run for an older
commit is answering a question nobody is asking. On `main` each build advances
the baseline every later comparison is made against, so cancelling one silently
leaves the next pull request diffed against an older snapshot.

**Dependencies come from Renovate**, through the org-wide runner in
[`kanso-labs/renovate`](https://github.com/kanso-labs/renovate) rather than an
installed app. This repository is listed in that runner's `config.js`, and
`.github/renovate.json` holds only what is specific to it. Dependabot was
removed; do not add `.github/dependabot.yml` back, or the two will open
competing pull requests for the same upgrades.

**Renovate commits are typed `deps:`, and that is what makes them release.**
release-please computes a patch bump for any commit that is not a `feat` or a
breaking change, but it only opens a release pull request when the notes it
generates are non-empty — a release whose every commit falls in a hidden
changelog section is skipped as "No user facing commits found". Renovate's own
default, `chore(deps):`, lands in exactly such a section, so an upgrade never
cut a release of its own — it shipped only when a feature happened to land
beside it, and a run of nothing but upgrades published nothing at all.
`.github/renovate.json` therefore sets `semanticCommits: enabled`,
`semanticCommitType: deps` and `semanticCommitScope: null`, and
`release-please-config.json` spells out `changelog-sections` with `deps` visible
under a `Dependencies` heading. The three move together: the section list
replaces release-please's defaults wholesale, so a type missing from it is
invisible rather than merely unstyled, and `deps` with no matching section would
put the upgrades back where they started.

**`semanticCommitType` sits in a `packageRule`, and that is the whole fix.** It
was a top-level key at first and did nothing at all. `config:recommended`
extends `:semanticPrefixFixDepsChoreOthers`, which sets the type through
`packageRules` — `matchPackageNames: ["*"]` to `chore`, plus a narrower
`dependencies` to `fix` — and `packageRules` beat top-level config. So Renovate
went on writing `chore:` while the setting sat there looking correct, and only
production dependencies released at all.

`deps` is not one of the Conventional Commits types, so `.commitlintrc.json`
extends the `type-enum` rule from `@commitlint/config-conventional` to admit it
alongside the standard eleven. A plain `chore:` still publishes nothing, which
is the point — housekeeping should not cut a release.

The names themselves follow five rules:

1. A workflow's filename is the kebab-case of its `name:` field, with the
   `.yaml` extension. `name: Release Please` lives in `release-please.yaml`. The
   extension is `.yaml` across every `kanso-labs` repository; GitHub accepts
   both, and `.github/dependabot.yml` was the one file that could not follow,
   which stopped mattering when it was deleted.
2. A reusable workflow — one triggered only by `workflow_call` — takes a leading
   underscore, so entry points and building blocks separate visually in the
   folder listing. `_build-application.yaml`. There are none here yet; the rule
   is for when there are.
3. A job name is an imperative verb phrase, with any matrix values appended.
4. A step name is an imperative verb phrase in sentence case, with no trailing
   punctuation.
5. Job ids, step ids, and matrix keys are exempt, since renaming them means
   updating every `needs.*` and `steps.*` reference for no visible benefit.

## Commits and pull requests

**The pull request title is the one that has to be right.** Pull requests are
squash-merged, and the repo is set to take the PR title as the squashed commit's
subject with an empty body. So the PR title — not any commit message on the
branch — becomes the single commit on `main`, and it is what `release-please`
parses to pick the next version and write the changelog line. Branch commit
messages are discarded by the squash and never reach history.

Write both as Conventional Commits anyway. The branch messages are what a
reviewer reads while the PR is open, and `feat(sheet): add Sheet component` as
the title is what a released changelog is made of.

## Traps

**`npm run lint` does not type-check.** It passes on code that `tsc -b` rejects,
and CI runs a separate Build job that will fail on those errors. Run
`npm run build` before pushing, not just lint and tests.

**Re-enabling merge commits duplicates every changelog entry.** They are
disabled at the repo level, and turning them back on reintroduces a bug worth
knowing about. GitHub was configured to put the PR title in the merge commit's
_body_, so every PR produced two conventional commits on `main` — the merge
commit and the branch commit it brought with it — and `release-please` counted
both. The 0.1.0 changelog carries 22 duplicated entries from that period, every
one of them a merge-plus-branch pair. Rebase merging stays available and is
safe: it adds no merge commit, so a PR whose individual commits each deserve a
changelog line can use it.

**Nothing enforces the commit conventions automatically.** `@commitlint/cli` and
a `.commitlintrc.json` are both installed, but no `commit-msg` hook invokes them
and no workflow does either — `.husky/` holds only `pre-commit`, which runs
lint-staged. A malformed type therefore reaches `main` unnoticed and lands in
the changelog. Until that is wired up, the PR title is on the author to get
right. `unplugin-style-dictionary` has the same gap, with not even a
`pre-commit` hook.
