import type { StorybookConfig } from '@storybook/react-vite'
import type { InlineConfig } from 'vite'

import { withoutVitePlugins } from '@storybook/builder-vite'

const config: StorybookConfig = {
  addons: [
    '@chromatic-com/storybook',
    '@storybook/addon-docs',
    '@storybook/addon-a11y',
    '@storybook/addon-vitest',
    'storybook-dark-mode',
  ],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  stories: ['../src/**/*.mdx', '../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
  async viteFinal(config: InlineConfig) {
    return {
      ...config,
      plugins: await withoutVitePlugins(config.plugins, ['node-externals']),
    }
  },
}

export default config
