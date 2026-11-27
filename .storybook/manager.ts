import { addons } from 'storybook/manager-api'
import { create } from 'storybook/theming'

// The Kanso Labs logo in the sidebar, from kanso-labs/brand, copied unmodified
// into ./public with the favicons, which Storybook picks up from `staticDirs`
// on its own. The manager follows the visitor's scheme as Storybook's default
// theme does, read once as it loads, and takes the reversed lockup when dark.
const dark = window.matchMedia('(prefers-color-scheme: dark)').matches

addons.setConfig({
  theme: create({
    base: dark ? 'dark' : 'light',
    brandImage: dark
      ? './kanso-horizontal-reversed.svg'
      : './kanso-horizontal.svg',
    brandTarget: '_self',
    brandTitle: 'Kanso UI',
    brandUrl: 'https://kansolabs.org',
  }),
})
