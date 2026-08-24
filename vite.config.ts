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
    // How long Vitest waits for teardown before force-exiting. The full
    // timeout elapses on every run, because a referenced timer outlives the
    // suite: @stylexjs/unplugin's Vite plugin starts a 150ms setInterval in
    // configureServer, then registers the matching clearInterval on the
    // "close" event of server.httpServer. Vitest runs Vite in middleware
    // mode, where httpServer is null, so the optional chaining skips that
    // registration and the interval is never cleared. There is one per Vite
    // server, which is three here.
    //
    // Nothing in this file can reach that closure, so the length of the wait
    // is the only part we control. It is dead time rather than work: results
    // are printed and the exit code is decided before the timer starts, which
    // a deliberately failing test confirms by still exiting non-zero at this
    // value. At the 10s default it was most of a tenth of every CI run.
    //
    // This also bounds afterAll hooks. The only teardown here is
    // afterEach(cleanup), so a second is ample — raise it before adding a
    // genuinely slow one. Delete the setting once the plugin clears its
    // interval in middleware mode, rather than restoring the default while
    // the leak is still there.
    // TEMP BISECT: setting removed to test whether it causes the CI failure.
  },
})
