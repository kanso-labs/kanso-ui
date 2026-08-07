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
