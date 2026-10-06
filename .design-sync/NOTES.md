# Design sync notes

Gotchas a sync of kanso-ui to claude.ai/design has met, one per bullet:
symptom -> root cause -> fix. `[GENERAL]` applies beyond one component.

- [GENERAL] Every story that styles its own layout crashed at load ->
  `stylex.create` only works once StyleX's compiler rewrites it, and the
  converter compiles stories with plain esbuild -> `.design-sync/overrides/story-imports.mjs`
  adds `@stylexjs/unplugin/esbuild` to story compiles, with the package
  build's options (`dev: false`, `useCSSLayers`, lightningcss excluding
  `DirSelector`) and `runtimeInjection: true`, so each preview injects its own
  story styles and designs get only `dist/styles.css`. Class and variable
  names hash as the package build hashes them (same module resolution, same
  root), so a story's `colors.surface` is the variable the bundle defines.
- [GENERAL] Every component threw "(0, import_compiler_runtimeN.c) is not a
  function" when a design rendered it from `window.KansoLabsKansoUi`, while
  every preview card rendered -> two faults hid each other. kanso's dist is
  built with the React Compiler, and the converter's React shim maps
  `react/compiler-runtime` onto `window.React`, which carries the runtime as
  `__COMPILER_RUNTIME.c`, not `c`. And the previews never used the bundle:
  the story-imports rule that sends a story's component imports to the global
  matches `Button/index.tsx` but not kanso's kebab-case folders
  (`color-swatch/index.tsx`), so every preview bundled its own source copy,
  which the StyleX plugin compiles without the React Compiler. Those copies
  were also wrong in their own way: their runtime-injected rules are
  unlayered, so they beat the shipped, layered `_ds_bundle.css`, and they
  carry none of the token media queries, so Sheet's `BottomSheet` at 375px
  drew a 400px side sheet where storybook draws the bottom sheet -> the fork
  also maps kebab-case folders to their export, and sends `src/date`,
  `src/layout`, `src/react-aria` and `src/drag/hooks` (re-exports of what the
  root exports) to the global; `cfg.extraEntries` adds
  `.design-sync/react-compiler-runtime.mjs`, which points `React.c` at
  `React.__COMPILER_RUNTIME.c` before anything renders, and `./dist/date.js`,
  so designs and stories get `CalendarDate`, `parseDate` and the rest of
  `@internationalized/date` from the bundle's own copy. Both are converter
  gaps worth reporting upstream. `.design-sync/check-conventions.mjs` renders
  the header's example straight from the global, so it catches this class.
- [GENERAL] `! preview decorator bundle failed: Could not resolve "virtual:stylex:runtime"`
  -> `.storybook/components/StyleXLoader` imports the StyleX dev server's
  virtual module, and `ThemeWrapper` calls `stylex.create` -> previews run
  without the decorators, deliberately: the tokens default to the
  `prefers-color-scheme` light values the capture uses, which is what
  ThemeWrapper's light theme pins. What differs is framing - storybook paints
  `colors.surface` behind every story and pads it 1rem, previews sit on white -
  so grade the component, not the canvas tint.
- [GENERAL] A tall story (most `Overview`s) looks cut off in the compare
  sheet -> `compare.mjs` photographs the storybook story's whole root but
  only the preview's 900x700 viewport -> grade from a full-height preview
  shot: `node .design-sync/tallshot.mjs <Name>:<Story>` writes
  `ds-bundle/_screenshots/tall/<Name>__<Story>.png`. It takes one argument
  per component, `A:Overview B:Overview`; `A:Overview,B:Overview` shoots a
  story of A named B. It freezes the clock at 2030-01-15T12:00:00Z and
  settles animations, as compare does, or a date component outlines the real
  today and a load-more ring is caught mid-spin.
- [GENERAL] Stories rewrap and shift between the two panels -> the
  converter's `?story=` page pads 24px where storybook pads 16px (held
  byte-identical to what verdicts were minted on, so not a knob): the
  preview's content box is 16px narrower and sits at a constant (+8, +8)
  offset, so prose wraps a word earlier, a component that fills its
  container is 16px shorter, a separator rule ends 16px sooner, and a
  fixed-width row of 805-820px wraps in the preview only -> framing; list
  where a small count of differing pixels sits before naming its cause; prove the component by diffing storybook (x, y)
  against preview (x+8, y+8), with dx -8 for right-aligned content, or by
  re-shooting the preview 916px wide, which gives it storybook's content box.
  A breakpoint cannot be proved that way, since that window is 16px wider:
  shoot both at the same window width with storybook's 16px padding forced
  onto the preview (`page.addStyleTag({ content: 'body{padding:16px
  !important}' })`) and diff at (0, 0); ListDetail, SupportingPane, Container
  and AppBar matched at every width from 375px to 1920px that way. Forcing
  storybook's canvas colour as well (`#fef7ff`) is the strongest proof there
  is: scrims, shadows and faded states then diff clean too, and every story
  of the overlays and the solo set read 0px over 24 levels against
  storybook at (0, 0). A capture that differs from an earlier one can be
  antialiasing noise at rounded corners, flipping by 1-2 levels from one
  capture to the next (TextArea and TokenField `Outlined`, SegmentedButton
  `MultipleSelection`): bound the differing pixels and recapture a few times
  before calling it a regression, and sort pixels over 8 into edges and flat
  fills, since only a flat fill can show a token that moved. A CDP font
  report names system faces for visually hidden labels and text-character
  icons, so scope it to visible text.
  `node .design-sync/pairdiff.mjs <Name>` does the first for every story of
  a component, at the four offsets a story lands at: in-flow content moves
  (+8, +8), centred content (0, +8), and an overlay fixed to the viewport not
  at all, while its in-flow trigger still moves. 0 differing pixels is an
  identical render. A popover docked under a trigger near the left edge is
  clamped to React Aria's 12px container padding, so it and its trigger move
  apart: diff the two regions separately before reading a large count as a
  defect. `--threshold 8` asks whether a token moved, since the canvas tint
  moves a channel by 8 at most; the default 24 forgives antialiasing.
- [GENERAL] `[REFERENCE_STALE?]` on a scoped compare after a converter or
  config rebuild -> only the bundle moved, not the DS source the reference
  renders -> benign when `git log -1 -- src` and `git status -- src .storybook`
  show nothing newer than `.design-sync/sb-reference`; rebuild the reference
  (then rerun `inject-sb-fonts.mjs`) only when they do.
- [GENERAL] A surface, or any faded or disabled story, reads greyer in
  storybook and more purple in the preview -> only the canvas differs,
  (254,247,255) against white, and opacity blends a faded component over it
  -> sample pixels before suspecting a token: load each raw PNG as a data URL
  onto an OffscreenCanvas and compare `getImageData` values, or take the
  per-channel mean and standard deviation of storybook minus preview over a
  region; a deviation near 0 is the tint alone.
- [GENERAL] DateField's and TimeField's en-GB fields read `9/15/2026` and
  `9:30 AM` in the preview where storybook reads `15/09/2026` and `9:30`, and
  List's `Virtualized` rendered all 200 rows where storybook windows 14 ->
  those stories import `I18nProvider`, `Virtualizer`, `ListLayout` and
  `useListData` from the bare `react-aria-components`, which the fork leaves
  in node_modules, so each preview bundled a second React Aria whose contexts
  the bundle's components never read -> `cfg.storyImports.shim:
  ["/node_modules/react-aria-components/"]` sends those imports to the global,
  which exports every name the stories take from it. Type-only imports
  (Calendar's `DateValue`) are erased, so only those four story files ever
  bundled a second copy. The decorators carry no `I18nProvider`, so every
  other story renders the capture browser's en-US on both sides. A locale
  story's text is worth stating, not only diffing: CDP's
  `DOM.querySelectorAll('[role="spinbutton"]')` on both pages lists each
  segment, which also catches both sides falling back to the same wrong
  locale.
- [GENERAL] Fan-out subagents clobbered each other's helper scripts -> they
  share the session's scratchpad -> give each batch a named subfolder. The
  Bash tool's shell is zsh, which does not word-split an unquoted parameter,
  so a loop over space-separated names wants `bash -c` or `${=name}`, and a
  word starting with `=` is read as a command path, so quote separators. A thin
  line can read dark in a downscaled sheet, so sample a colour before calling
  it a delta.
- [GENERAL] Every story rendered in the type stacks' system fallbacks, on
  both sides of the compare, so the sheets matched while every design would
  have had the wrong type -> kanso's stacks name Roboto Serif, Roboto Flex and
  Roboto Mono first but the package ships no `@font-face`, and the validator
  never flags it because it drops `var()` fallback lists before checking ->
  `cfg.extraFonts` ships `.design-sync/fonts/roboto.css`: Fontsource's Latin
  variable cuts, the ones Daily serves, under the family names the stacks use
  rather than Fontsource's "... Variable" names (OFL-1.1, licence beside each
  file). The reference Storybook loads no fonts either, so
  `node .design-sync/inject-sb-fonts.mjs` writes the same faces into
  `sb-reference/iframe.html`; run it after every rebuild of the reference, or
  every story grades against fallbacks again. The compare images cannot tell
  two fonts of one width apart, so confirm a face with `document.fonts` (each
  family `loaded`) or CDP's `CSS.getPlatformFontsForNode` on both pages,
  scoping storybook's selectors to `#storybook-root`, since `iframe.html`
  holds hidden markup whose `h1` and `p` match first, and reading the
  element itself on both pages rather than one sample per family, which
  dedupes a family away on one side.
- Select, TextArea, TextField, Tooltip: their stories import `CloseGlyph` and
  `SearchGlyph` from `../../glyphs`, which the package keeps private, so each
  preview bundles its own copy -> plain SVG components with no hooks, drawn
  identically on both sides -> nothing to do.

- Build lines that are expected, triaged: `[TITLE_UNMAPPED]` drops the 10
  storybook titles that are documentation and theme demos rather than
  components (Gettingstarted, Sharedelements, Tokens and the theme names);
  `[DOCS_UNMAPPED]` names Avatar, Currency and Text, which carry no component
  JSDoc for `gen-docs.mjs` to turn into a doc, so they keep the converter's
  generated one; and the preview decorator bundle failure above.
  `runtimeFontPrefixes: ["Iowan Old Style"]` treats macOS's bundled serif,
  second in the brand stack behind the shipped Roboto Serif, as a system font,
  as validate already treats Georgia.

- `.design-sync/` sits outside the repo's linters and formatter (oxlint,
  ESLint and oxfmt ignore it, and its own `.lintstagedrc.json` gives the
  pre-commit hook nothing to run) -> the fork's exact bytes are part of the
  grade contract, so a reformat would re-key every grade, and the generated
  docs and the converter's own conventions are not the library's. The same
  ignore lists skip `ds-bundle/` and `.ds-sync/`, the sync's local outputs,
  which ESLint would otherwise walk.

## Re-sync risks

- **Converter gaps this sync works around.** The React Compiler runtime
  (`.design-sync/react-compiler-runtime.mjs`) and the kebab-case redirect in
  the `story-imports.mjs` fork both make up for the converter. After a skill
  update, check whether it maps `react/compiler-runtime` to
  `__COMPILER_RUNTIME` and matches kebab-case folders itself; if so, drop
  the workaround rather than doubling it.
- **Stories outside the grade record.** Compare captures six stories a
  component, so TextField's 7 last stories, List's 5, TextArea's 4,
  Select's and ListBox's 3, ComboBox's and ChipGroup's 2, and NumberField's,
  TokenField's, Checkbox's, Switch's and SegmentedButton's 1 were checked by
  hand on both sides, identical, but carry no verdict (ProgressIndicator's
  `WithValue` sits in its grade file as `"basis": "hand-checked"`).
  `--max-stories 13` brings them in.
- **Sheet's bottom sheet.** Storybook's `mobile1` viewport applies only in
  its manager, so compare's 900px renders the side sheet for `BottomSheet`
  and `LongBody` on both sides. The bottom sheet was checked by hand at
  375px, identical, and nothing re-checks it.
- **Names the shim relies on.** `storyImports.shim` sends every story import
  of `react-aria-components` to the global, which works while the global
  exports each name a story takes from it. A story importing a React Aria
  name kanso does not re-export would render it undefined; validate's render
  check catches that as a crashed cell.
- **Generated inputs.** `.design-sync/docs/` is generated from `dist`'s JSDoc
  by `gen-docs.mjs`, which `buildCmd` runs, and committed so a converter-only
  run still finds it; regenerate it whenever `dist` changes. The reference
  storybook needs `inject-sb-fonts.mjs` after every rebuild.
- **Prop docs end at 120 characters.** The converter cuts every prop's JSDoc
  in `<Name>.d.ts` and the usage doc's Props; lifting that would mean forking
  a converter module, which re-keys every grade.
- **Toolchain.** Node 24.21.0 through mise, `@stylexjs/unplugin` 0.19.1 with
  the package build's options; a StyleX upgrade that rehashes class names
  would make story styles miss the bundle's variables.
- ProgressIndicator: `[GRID_OVERFLOW]` on `Overview` once Roboto Flex
  replaced the narrower fallback -> the story is wider than a grid cell ->
  `overrides.ProgressIndicator.cardMode: "column"`. ListDetail and
  SupportingPane overflowed the same way.
- [GENERAL] A control drew truncated in its grid card ("First i…") while
  validate passed it -> a control capped at its container's width shrinks
  with an ellipsis instead of overflowing, which validate's overflow check
  cannot see -> `cardMode: "column"` (SegmentedButton, and ComboBox's
  multi-select field); render each grid card 728px wide, the product pane's
  width, and look for leaf text whose `scrollWidth` exceeds its
  `clientWidth`. Column cards also suit inputs whose Overview is far taller
  than wide (TextField, TextArea, NumberField, SearchField, CopyField, Form),
  a table that squeezes rather than overflows (Table), and ListBox, whose
  fixed 320px surfaces lose their right corners to a 328px cell, 4px under
  validate's tolerance.
- Feed, ProductIcon: every mark draws as a black bar, in storybook too -> the
  stories `encodeURIComponent` an SVG whose fills are already written
  `%23394b47`, so the colour arrives as an invalid paint -> the stories'
  fixture, worth fixing upstream; nothing to do here. ListBox `Empty` sets
  its "Nothing to show" in the browser's default serif on both sides for the
  same kind of reason: its story style sets no font. So do Link's bare
  `Label` samples: Link sets no typeface of its own and inherits Times from a
  page with none, which is why the conventions header has designs set
  `--kui-typography-font-family-plain` on the page root.
- [GENERAL] A handle or knob drawn in the surface colour (Switch's disabled
  handle) vanishes on storybook's canvas and shows as a pale disc on the
  preview's white -> the canvas tint again -> sample both before suspecting a
  token.
- [GENERAL] A story whose look comes from its `play` function differs
  however faithful the component is -> storybook is captured after `play`
  runs, and previews never run it -> `overrides.<Name>.skip`, never a state
  faked in a `.tsx`: Button `Pressed`, CopyField `Copied`, TokenField
  `Typed`, Popover and Sheet `OpensAndCloses` (interaction tests, tagged
  `!dev`), and Menu `Submenu` and ComboBox `Open` (documented open states).
  Replaying the click in the preview gave storybook's pixels for the last
  two, so the components are intact. Dialog's `AlertDialog` has a `play` too,
  but it only asserts that Escape leaves the dialog open, so its settled frame
  is the same and it needs no skip. To find new ones, grep
  `"(^|[^a-zA-Z])play[:(]"` with `-nE` over
  `src/components/*/index.stories.tsx`; a bare `play:` also matches every
  StyleX `display:`.
- Separator: `Inset` and `MiddleInset` draw an empty frame in storybook and
  the preview alike -> the stories' `Framed` decorator is a row flex box, in
  which an inset rule's `inline-size: auto` collapses to nothing -> skipped,
  so the card shows no blank frames; `Overview` shows both insets. Worth
  fixing in the stories upstream.
