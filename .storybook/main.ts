import type { StorybookConfig } from '@storybook/react-vite'

// Where React Aria declares the props its components take: its own packages,
// and the `@react-types` ones they share.
const REACT_ARIA_PACKAGES =
  /\/node_modules\/(?:@react-aria|@react-stately|@react-types|react-aria|react-aria-components|react-stately)\//

// The interfaces React Aria declares the DOM's own attributes and events in,
// `dir` and `lang` and every `onMouseDown` and `onDragStart`, which each of its
// components accepts and none of the library's documents.
const GLOBAL_DOM_PROPS = new Set(['GlobalDOMAttributes', 'GlobalDOMEvents'])

const config: StorybookConfig = {
  addons: [
    '@chromatic-com/storybook',
    '@storybook/addon-docs',
    '@storybook/addon-a11y',
    '@storybook/addon-vitest',
  ],
  docs: {
    // The page autodocs writes for each component is its overview — the
    // description, the usage example, the props and every story — so it
    // takes that name rather than Storybook's own "Docs". A story exported
    // as `Overview` would now share the page's id,
    // `components-<name>--overview`, and the index keeps the page and drops
    // the story without a word — see AGENTS.md.
    defaultName: 'Overview',
  },
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
      // The default filter drops every prop declared under node_modules, and
      // that is where React Aria declares the props a component here takes
      // through `Omit` or `Pick` of its own: `isDisabled`, `onPress`, `value`,
      // `minValue`, `selectionMode`, `isOpen` and the rest. A table then
      // listed only the library's own few props, and Controls could drive
      // none of the others, since Storybook drops an arg with no argType.
      // This keeps React Aria's packages and still drops React's: the
      // `@types/react` handlers and attributes a plain element takes, and
      // the global DOM attributes and events React Aria declares on every
      // component, which would add a hundred rows to a table and document
      // nothing the library does.
      propFilter: (prop) => {
        const file = prop.parent?.fileName
        if (file === undefined || !file.includes('/node_modules/')) return true
        return (
          REACT_ARIA_PACKAGES.test(file) &&
          !GLOBAL_DOM_PROPS.has(prop.parent?.name ?? '')
        )
      },
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
