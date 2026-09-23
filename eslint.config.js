import eslintJs from '@eslint/js'
import eslintPluginOxlint from 'eslint-plugin-oxlint'
import eslintPluginPerfectionist from 'eslint-plugin-perfectionist'
import eslintPluginReactHooks from 'eslint-plugin-react-hooks'
import eslintPluginReactRefresh from 'eslint-plugin-react-refresh'
import eslintPluginStorybook from 'eslint-plugin-storybook'
import globals from 'globals'
import typescriptEslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  // `.claude/worktrees/` holds per-session checkouts of this repository, so
  // without this ESLint lints every other branch alongside the current one.
  // It is gitignored, but flat config does not read .gitignore the way oxlint
  // and oxfmt do, so it has to be named here.
  globalIgnores(['.claude', 'dist', 'storybook-static']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      eslintJs.configs.recommended,
      typescriptEslint.configs.recommended,
      eslintPluginPerfectionist.configs['recommended-natural'],
      eslintPluginReactHooks.configs.flat.recommended,
      eslintPluginReactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    rules: {
      // A type from React is imported by name rather than read off the
      // `React` namespace @types/react declares globally. The global
      // type-checks with no import at all, so a file could depend on React's
      // types without saying so anywhere a reader or a tool would look.
      'no-restricted-syntax': [
        'error',
        {
          message:
            "Import the type from 'react' by name rather than reading it off the global React namespace.",
          selector: "TSQualifiedName[left.name='React']",
        },
      ],
    },
  },
  {
    files: ['**/*.stories.tsx'],
    extends: [eslintPluginStorybook.configs['flat/recommended']],
  },
  ...eslintPluginOxlint.buildFromOxlintConfigFile('./.oxlintrc.json'),
])
