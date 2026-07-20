import styleDictionaryRolldown from '@kanso-labs/unplugin-style-dictionary/rolldown'
import babel from '@rolldown/plugin-babel'
import stylexRolldown from '@stylexjs/unplugin/rolldown'
import { reactCompilerPreset } from '@vitejs/plugin-react'
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
  ],
  sourcemap: true,
  tsconfig: 'tsconfig.lib.json',
  unbundle: true,
})
