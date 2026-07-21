import styleDictionaryRolldown from '@kanso-labs/unplugin-style-dictionary/rolldown'
import babel from '@rolldown/plugin-babel'
import stylexRolldown from '@stylexjs/unplugin/rolldown'
import { reactCompilerPreset } from '@vitejs/plugin-react'
import { copyFileSync, mkdirSync } from 'node:fs'
import { defineConfig } from 'tsdown'

import {
  registerFormats,
  styleDictionaryConfig,
} from './scripts/build-tokens.mjs'

export default defineConfig({
  dts: true,
  entry: 'src/index.ts',
  format: {
    cjs: { outDir: 'dist/cjs' },
    esm: { outDir: 'dist' },
  },
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
  ],
  sourcemap: true,
  tsconfig: 'tsconfig.lib.json',
  unbundle: true,
})
