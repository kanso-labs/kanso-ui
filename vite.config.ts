/// <reference types="vitest/config" />

import babel from '@rolldown/plugin-babel'
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin'
import stylex from '@stylexjs/unplugin'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import { playwright } from '@vitest/browser-playwright'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import rollupPluginNodeExternals from 'rollup-plugin-node-externals'
import { defineConfig } from 'vite'

const dirname =
  typeof __dirname !== 'undefined'
    ? __dirname
    : path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  build: {
    lib: {
      entry: path.join(dirname, 'src/index.ts'),
    },
    rolldownOptions: {
      output: [
        {
          dir: 'dist/cjs',
          entryFileNames: '[name].cjs',
          exports: 'auto',
          format: 'cjs',
          preserveModules: true,
          preserveModulesRoot: 'src',
        },
        {
          dir: 'dist',
          entryFileNames: '[name].js',
          format: 'es',
          preserveModules: true,
          preserveModulesRoot: 'src',
        },
      ],
    },
    sourcemap: true,
  },
  optimizeDeps: {
    include: ['@testing-library/dom'],
  },
  plugins: [
    stylex.vite({
      dev: process.env.NODE_ENV === 'development',
      runtimeInjection: false,
      useCSSLayers: true,
    }),
    react(),
    babel({
      presets: [reactCompilerPreset()],
    }),
    rollupPluginNodeExternals(),
  ],
  test: {
    projects: [
      {
        extends: true,
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
