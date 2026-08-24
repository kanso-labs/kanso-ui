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
  entry: 'src/index.ts',
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
    babel({
      presets: [reactCompilerPreset()],
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
    {
      closeBundle() {
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
    },
  ],
  sourcemap: true,
  tsconfig: 'tsconfig.lib.json',
  unbundle: true,
})
