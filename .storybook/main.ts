import type { StorybookConfig } from '@storybook/react-vite'

const config: StorybookConfig = {
  addons: [
    '@chromatic-com/storybook',
    '@storybook/addon-docs',
    '@storybook/addon-a11y',
    '@storybook/addon-vitest',
  ],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  stories: ['../src/**/*.mdx', '../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
  typescript: {
    reactDocgen: 'react-docgen-typescript',
    reactDocgenTypescriptOptions: {
      // The plugin decides what to transform with Vite's filter, which
      // matches inside dot directories, but builds the set of files it will
      // document with `glob`, which does not — so every `.tsx` under
      // `.storybook` passed the first and failed the second, and the dev
      // server warned that each was "not included in the active TypeScript
      // project". Adding the directory to that project does not help, since
      // the glob still never sees it. Nothing here is a documented component,
      // so excluding it costs no Controls table and drops the warning. The
      // default is the first entry; setting the option replaces it rather
      // than extends it.
      exclude: ['**/*.stories.tsx', '**/.storybook/**'],
      // Without this, a string-literal union is reported as one `other` whose
      // value is the type's source text, and Storybook falls back to the JSON
      // object editor — so choosing a variant means typing it, quotes and all.
      // On, each member is extracted separately, the prop arrives as an `enum`,
      // and the Controls panel infers a select. It also sidesteps the type
      // being rendered through ts.typeToString, which truncates past 160
      // characters — Text's 15-step scale came through as "... 4 more ...".
      shouldExtractLiteralValuesFromEnum: true,
      // `undefined` is what an optional prop already is, so listing it as a
      // choice adds an option that does nothing the reset button doesn't.
      shouldRemoveUndefinedFromOptional: true,
      tsconfigPath: 'tsconfig.lib.json',
    },
  },
}

export default config
