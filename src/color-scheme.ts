import * as stylex from '@stylexjs/stylex'

import {
  colorsDarkTheme,
  colorsLightTheme,
} from './tokens/design.tokens.stylex'

// The library's colours follow the reader's OS through `prefers-color-scheme`
// unless something says otherwise, and these are what say otherwise. Both
// classes have always been generated and shipped in the stylesheet, for
// Storybook's Theme control; nothing in the package named them, so an app
// with a switch of its own had to restate every colour token under its own
// selector, twice — dark for a light OS, light for a dark one.
//
// A server module like the entry, since it is two strings.

/**
 * The classes that pin the library's colours to its light or its dark
 * scheme, whatever the reader's OS asks for — for an app with a theme switch
 * of its own. Put one on the `<html>` element, where overlays portalled to
 * the body still sit inside it; with neither there, the colours follow the
 * OS as they always have.
 *
 * Shaped as next-themes takes its class names:
 *
 * ```tsx
 * import { ThemeProvider } from 'next-themes'
 * import { colorScheme } from '@kanso-labs/kanso-ui'
 *
 * <ThemeProvider attribute="class" value={colorScheme}>
 *   {children}
 * </ThemeProvider>
 * ```
 *
 * A `--kui-color-*` override still applies under either, declared on the
 * same element or above it.
 */
const colorScheme = {
  dark: stylex.props(colorsDarkTheme).className ?? '',
  light: stylex.props(colorsLightTheme).className ?? '',
}

export { colorScheme }
