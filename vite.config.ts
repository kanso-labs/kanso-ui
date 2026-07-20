/// <reference types="vitest/config" />

import styleDictionary from '@kanso-labs/unplugin-style-dictionary'
import babel from '@rolldown/plugin-babel'
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin'
import stylex from '@stylexjs/unplugin'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import { playwright } from '@vitest/browser-playwright'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'

import {
  registerFormats,
  styleDictionaryConfig,
} from './scripts/build-tokens.mjs'

const dirname =
  typeof __dirname !== 'undefined'
    ? __dirname
    : path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [
    // @kanso-labs/unplugin-style-dictionary@^0.2.1+ only — 0.2.0's
    // watchChange had no filtering, so it reacted to design.tokens.stylex.ts
    // regenerating (real components import it, putting it in the module
    // graph) and rebuilt forever under storybook dev. Fixed upstream in
    // kanso-labs/unplugin-style-dictionary#30; do not downgrade below 0.2.1.
    styleDictionary.vite({
      config: () => {
        registerFormats()
        return styleDictionaryConfig
      },
    }),
    stylex.vite({
      dev: process.env.NODE_ENV === 'development',
      runtimeInjection: false,
      useCSSLayers: true,
    }),
    react(),
    babel({
      presets: [reactCompilerPreset()],
    }),
  ],
  test: {
    projects: [
      {
        extends: true,
        optimizeDeps: {
          include: ['@testing-library/dom', '@testing-library/jest-dom'],
        },
        plugins: [
          storybookTest({
            configDir: path.join(dirname, '.storybook'),
          }),
        ],
        test: {
          browser: {
            enabled: true,
            headless: true,
            instances: [
              {
                browser: 'chromium',
              },
            ],
            provider: playwright({}),
          },
          name: 'storybook',
        },
      },
    ],
  },
})
