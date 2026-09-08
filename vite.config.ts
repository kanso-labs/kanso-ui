/// <reference types="vitest/config" />

import styleDictionary from '@kanso-labs/unplugin-style-dictionary'
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin'
import stylex from '@stylexjs/unplugin'
import react from '@vitejs/plugin-react'
import { playwright } from '@vitest/browser-playwright'
import path from 'node:path'
import { defineConfig } from 'vite'

import {
  registerFormats,
  styleDictionaryConfig,
} from './scripts/build-tokens.mjs'

export default defineConfig(({ command }) => ({
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
      // The dev server answers `/virtual:stylex.css` from whatever modules
      // the plugin has transformed so far. The `media` queries the pane
      // layouts and Sheet key their styles on are `defineConsts`, which
      // compile into each consumer as a `var(--hash)` placeholder that is
      // only substituted once the tokens module's own rules are in the
      // plugin's store — and on a cold start that module, the largest the
      // plugin handles, lands last. An answer assembled in between holds
      // `var(--x){.x.x{…}}`, which lightningcss rejects as an empty
      // selector: the request fails with `Internal server error: Invalid
      // empty selector`, Vite puts its error overlay into every open iframe,
      // and the a11y check then fails every story on the page. "Testing" in
      // AGENTS.md says which runs that lands on.
      //
      // errorRecovery has lightningcss drop what it cannot parse instead, so
      // an intermediate answer is incomplete rather than an error, and the
      // plugin's runtime refetches the stylesheet as soon as the tokens land
      // — the path every late rule already reaches the page by. Dev server
      // only, which is `serve` for Vitest and Storybook alike: a build's
      // stylesheet is final and has to parse.
      lightningcssOptions:
        command === 'serve' ? { errorRecovery: true } : undefined,
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
        // Storybook material rather than library source, like the generated
        // tokens beside it: the demo schemes are `createTheme` calls with
        // nothing to execute, so counting them would only report 100% for a
        // file no test could ever move.
        'src/theming/**',
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
            configDir: path.join(import.meta.dirname, '.storybook'),
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
          setupFiles: [path.join(import.meta.dirname, 'vitest.setup.ts')],
        },
      },
    ],
  },
}))
