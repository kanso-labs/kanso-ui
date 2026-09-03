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
})
