import type { Preview } from '@storybook/react-vite'

import React from 'react'

import { demoThemes } from '../src/theming/themes'
import StyleXLoader from './components/StyleXLoader'
import ThemeWrapper from './components/ThemeWrapper'
import { allModes } from './modes'

const preview: Preview = {
  decorators: [
    (Story, context) => {
      // Globals arrive untyped, and the value reaches a `string` prop rather
      // than only an equality check, so it is narrowed here instead of cast.
      const theme =
        typeof context.globals.theme === 'string'
          ? context.globals.theme
          : 'light'

      return (
        <>
          <StyleXLoader />
          <ThemeWrapper name={theme}>
            <Story />
          </ThemeWrapper>
        </>
      )
    },
  ],
  // The theme is a global rather than addon state so that Chromatic's modes
  // can set it — an addon holding the value privately is invisible to them.
  globalTypes: {
    theme: {
      description: 'Colour theme the story canvas renders in',
      toolbar: {
        dynamicTitle: true,
        // The library's own two, then the demo schemes the Theming page is
        // built from. Listing those here rather than only on that page is
        // what lets any component's story be read in one of them, which is
        // the question a scheme actually has to answer.
        items: [
          { icon: 'sun', title: 'Light', value: 'light' },
          { icon: 'moon', title: 'Dark', value: 'dark' },
          ...Object.entries(demoThemes).map(([value, { label }]) => ({
            icon: 'paintbrush' as const,
            title: label,
            value,
          })),
        ],
        title: 'Theme',
      },
    },
  },
  // A fixed default rather than one seeded from prefers-color-scheme. The
  // preference is not reliably applied by the time this module evaluates, so
  // reading it here decides the theme by a race; it also leaks the CI
  // machine's appearance into the a11y checks the Vitest run performs. Both
  // themes are captured either way — this only picks which one opens first.
  initialGlobals: {
    theme: 'light',
  },
  parameters: {
    a11y: {
      // 'todo' - show a11y violations in the test UI only
      // 'error' - fail CI on a11y violations
      // 'off' - skip a11y checks entirely
      test: 'error',
    },
    // Project-level, so every story is captured in both themes. A component or
    // story can narrow this with its own `chromatic.modes`, including
    // `{ dark: { disable: true } }` to opt one back out.
    chromatic: {
      modes: {
        dark: allModes.dark,
        light: allModes.light,
      },
    },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    options: {
      // Introduction first overall, Overview first within each component, and
      // everything else left where it already was. Returning 0 is what does
      // that last part: the default order is the order stories are exported
      // in, and lint sorts those named exports alphabetically, so there is
      // nothing to re-sort here — only the two entries that should lead
      // rather than land where their name puts them.
      //
      // Without the Introduction clause that page lands *last*: the glob walks
      // src/components and src/tokens before the files sitting at the root of
      // src, so file order puts the one page meant to be read first at the
      // bottom of the sidebar. Hoisting it here rather than renaming the file
      // into place is what keeps that independent of how the glob happens to
      // traverse.
      //
      // 'Introduction' is spelled out rather than read from a shared constant
      // for the reason in the next paragraph: this function is eval()d with
      // nothing else in scope, so a reference to anything outside it throws
      // there and takes the story index down with it.
      //
      // Deliberately untyped, and it has to stay that way. Storybook does not
      // import this function — the indexer reads preview.tsx as text, cuts out
      // the storySort expression, and eval()s it as plain JavaScript, so a
      // parameter annotation is a syntax error there and takes the whole story
      // index down with it. Nothing type-checks this file either way: neither
      // tsconfig includes .storybook, and nothing under src imports it.
      /* oxlint-disable typescript/no-unsafe-member-access -- untyped by necessity, see above */
      storySort: (a, b) => {
        if (a.title !== b.title) {
          if (a.title === 'Introduction') {
            return -1
          }
          return b.title === 'Introduction' ? 1 : 0
        }
        if (a.name === 'Overview') {
          return -1
        }
        return b.name === 'Overview' ? 1 : 0
      },
      /* oxlint-enable typescript/no-unsafe-member-access */
    },
  },
}

export default preview
