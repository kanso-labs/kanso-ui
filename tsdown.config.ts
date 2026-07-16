import babel from '@rolldown/plugin-babel'
import stylexRolldown from '@stylexjs/unplugin/rolldown'
import { reactCompilerPreset } from '@vitejs/plugin-react'
import { defineConfig } from 'tsdown'

export default defineConfig({
  dts: true,
  entry: 'src/index.ts',
  format: {
    cjs: { outDir: 'dist/cjs' },
    esm: { outDir: 'dist' },
  },
  platform: 'neutral',
  plugins: [
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
