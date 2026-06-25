import eslintJs from '@eslint/js'
import eslintPluginPerfectionist from 'eslint-plugin-perfectionist'
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended'
import eslintPluginReactHooks from 'eslint-plugin-react-hooks'
import eslintPluginReactRefresh from 'eslint-plugin-react-refresh'
import eslintPluginStorybook from 'eslint-plugin-storybook'
import globals from 'globals'
import typescriptEslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist', 'storybook-static']),
  {
    ...eslintJs.configs.recommended,
    files: ['**/*.{ts,tsx}'],
  },
  ...typescriptEslint.configs.recommended.map((config) => ({
    ...config,
    files: ['**/*.{ts,tsx}'],
  })),
  {
    ...eslintPluginPerfectionist.configs['recommended-natural'],
    files: ['**/*.{ts,tsx}'],
  },
  {
    ...eslintPluginReactHooks.configs.flat.recommended,
    files: ['**/*.{ts,tsx}'],
  },
  {
    ...eslintPluginReactRefresh.configs.vite,
    files: ['**/*.{ts,tsx}'],
  },
  {
    ...eslintPluginPrettierRecommended,
    files: ['**/*.{ts,tsx}'],
  },
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
  },
  {
    ...eslintPluginStorybook.configs['flat/recommended'],
    files: ['**/*.stories.tsx'],
  },
])
