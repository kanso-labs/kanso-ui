import { codecovRollupPlugin } from '@codecov/rollup-plugin'
import styleDictionaryRolldown from '@kanso-labs/unplugin-style-dictionary/rolldown'
import babel from '@rolldown/plugin-babel'
import stylexRolldown from '@stylexjs/unplugin/rolldown'
import { reactCompilerPreset } from '@vitejs/plugin-react'
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  renameSync,
  rmdirSync,
} from 'node:fs'
import { defineConfig } from 'tsdown'

import {
  registerFormats,
  styleDictionaryConfig,
} from './scripts/build-tokens.mjs'

let writtenOutput = false

export default defineConfig({
  // src/index.ts imports './styles.css' for its side effect, and the point of
  // that import is to survive into dist/index.js. Never bundling it is what
  // keeps it there: rolldown then passes the specifier through untouched
  // instead of resolving it, which spares the build both tsdown's css-guard
  // (it fails outright on a CSS module unless @tsdown/css is installed) and
  // any asset hashing that would rewrite the specifier away from the
  // ./styles.css the exports map publishes. The file the specifier names is
  // written by the `emit-stylex-css` plugin below.
  deps: { neverBundle: [/^\.\/styles\.css$/] },
  dts: true,
  // Two entries, not one. `./date` is published as a subpath of its own so a
  // consumer with no date component never pulls `@internationalized/date` in,
  // and a second entry is what gives that subpath a file to point at.
  entry: ['src/index.ts', 'src/date.ts'],
  format: ['esm'],
  platform: 'neutral',
  plugins: [
    styleDictionaryRolldown({
      config: () => {
        registerFormats()
        return styleDictionaryConfig
      },
    }),
    stylexRolldown({
      dev: false,
      runtimeInjection: false,
      useCSSLayers: true,
    }),
    // The threshold is `all_errors` rather than the default. Left to itself
    // the compiler skips a function it cannot compile and says nothing, so a
    // component stops being memoised on an edit nobody reads as a performance
    // change — which is how most of this library came to be shipping
    // unmemoised under a Babel major the compiler does not support, for as
    // long as it took someone to read the built output. The pin in
    // package.json is what put it back, and this is what would have said so.
    //
    // Both errors this tree has hit sit below `critical_errors`: an
    // expression the compiler cannot reorder yet, and a memoisation it
    // declines to preserve. Only `all_errors` sees either, which makes it
    // the only setting that would have caught them.
    babel({
      presets: [reactCompilerPreset({ panicThreshold: 'all_errors' })],
    }),
    // design.tokens.css (the public CSS-custom-property override contract —
    // see build-tokens.mjs) is written straight to src/tokens/ by Style
    // Dictionary, not through rolldown's module graph, so nothing else
    // copies it into the published package. writeBundle fires once per
    // output format (esm, cjs); copying to the same dist/tokens.css both
    // times is redundant but harmless, and simpler than detecting "first
    // format wins".
    {
      name: 'copy-tokens-css',
      writeBundle() {
        mkdirSync('dist', { recursive: true })
        copyFileSync('src/tokens/design.tokens.css', 'dist/tokens.css')
      },
    },
    // The StyleX plugin compiles every rule the library uses into one
    // stylesheet, but it is written for application bundles: it looks for a
    // CSS asset already in the graph to append the rules to, and with none
    // there it falls back to writing dist/assets/stylex.css, which nothing
    // imports and no exports entry points at. That is what 0.8.0 published —
    // 38KB of compiled CSS in the tarball that no consumer could reach, so
    // every component rendered unstyled.
    //
    // Moving it to dist/styles.css is what makes the `import './styles.css'`
    // in src/index.ts resolve in the published package, and what the
    // `./styles.css` entry in the exports map points at.
    //
    // closeBundle rather than writeBundle: rollup runs writeBundle hooks in
    // parallel, so ours could read the file before the StyleX plugin's own
    // writeBundle had finished writing it. closeBundle is only reached once
    // every writeBundle has settled.
    //
    // The check speaks only for a build that got as far as writing its
    // output. closeBundle is reached whether or not that happened, so a run
    // that failed earlier — a transform the React Compiler refused, under the
    // panic threshold above — arrives here with no assets at all, and an
    // unconditional check would bury the compiler's own error under one
    // about CSS that is not what went wrong. writtenOutput is what tells the
    // two apart.
    {
      closeBundle() {
        if (!writtenOutput) {
          return
        }

        const compiled = 'dist/assets/stylex.css'

        if (!existsSync(compiled)) {
          throw new Error(
            `${compiled} is missing, so dist/styles.css would not be written and every component would render unstyled. The StyleX plugin writes that file from its own writeBundle hook; check that it still runs and still names the file that way.`,
          )
        }

        renameSync(compiled, 'dist/styles.css')

        if (readdirSync('dist/assets').length === 0) {
          rmdirSync('dist/assets')
        }
      },
      name: 'emit-stylex-css',
      writeBundle() {
        writtenOutput = true
      },
    },
    // Last, as Codecov's own instructions ask. Codecov's rollup plugin rather
    // than its Vite one, because tsdown is what builds the published package —
    // vite.config.ts here configures Storybook and Vitest, whose output nobody
    // installs. tsdown drives rolldown, whose plugin API is rollup's.
    //
    // `enableBundleAnalysis` is what keeps a local `npm run build` inert: the
    // token is an organisation secret, so it is undefined everywhere but CI,
    // and the plugin then neither writes its stats file nor uploads anything.
    //
    // It reports the compiled stylesheet as `assets/stylex.css`, the name it
    // has while this runs, rather than the `styles.css` a consumer imports.
    // Its hook is writeBundle and the rename above happens in closeBundle,
    // which rollup only reaches once every writeBundle has settled — so there
    // is no ordering that gives it the later name. The bytes are the same
    // either way, which is what the analysis is measuring.
    //
    // The stats file it writes lands in dist/, which `files` in package.json
    // publishes wholesale — the plugin deletes it again once the upload
    // returns, which is what keeps it out of the tarball.
    codecovRollupPlugin({
      bundleName: 'kanso-ui',
      enableBundleAnalysis: process.env.CODECOV_TOKEN !== undefined,
      uploadToken: process.env.CODECOV_TOKEN,
    }),
  ],
  sourcemap: true,
  tsconfig: 'tsconfig.lib.json',
  unbundle: true,
})
