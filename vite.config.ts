/// <reference types="vitest/config" />

import styleDictionary from '@kanso-labs/unplugin-style-dictionary'
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin'
import stylex from '@stylexjs/unplugin'
import react from '@vitejs/plugin-react'
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
    react({ compiler: true }),
  ],
  test: {
    coverage: {
      exclude: [
        'src/**/*.stories.tsx',
        'src/**/*.test.{ts,tsx}',
        'src/tokens/**',
      ],
      include: ['src/**/*.{ts,tsx}'],
      provider: 'v8',
      reporter: ['text', 'cobertura'],
    },
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
      // Runs in the same browser as the storybook project on purpose. Under
      // `environment: 'node'` these files get a different transform pipeline,
      // so sources shared with that project are instrumented twice with
      // mismatched statement maps and the merged coverage totals go wrong.
      {
        extends: true,
        optimizeDeps: {
          include: ['@testing-library/dom', '@testing-library/react'],
        },
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
            // storybookTest sets this for the other project; without it a
            // failure here writes a stray PNG into src/.
            screenshotFailures: false,
          },
          include: ['src/**/*.test.{ts,tsx}'],
          name: 'unit',
          setupFiles: [path.join(dirname, 'vitest.setup.ts')],
        },
      },
    ],
    // How long Vitest waits for teardown before force-exiting. Browser mode
    // never finishes closing here — every run ends "close timed out after
    // 10000ms", and the hanging-process reporter shows file handles the
    // provider leaves open — so the full timeout elapses every time.
    //
    // That wait is dead time rather than work: results are printed and the
    // exit code is decided before it starts, which a deliberately failing test
    // confirms by still exiting non-zero at this value. At the 10s default it
    // was most of a tenth of every CI run.
    //
    // This also bounds afterAll hooks. The only teardown here is
    // afterEach(cleanup), so a second is ample — raise it before adding a
    // genuinely slow one.
    teardownTimeout: 1000,
  },
})
