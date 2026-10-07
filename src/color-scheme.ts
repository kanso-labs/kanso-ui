import * as stylex from '@stylexjs/stylex'

import {
  colorDefaultsDarkTheme,
  colorDefaultsLightTheme,
  tokenScope,
} from './tokens/design.tokens.stylex'

// The library's tokens resolve once, on `:root`, and follow the reader's OS
// through `prefers-color-scheme` unless something says otherwise. These are
// the classes that say otherwise, for a page that cannot or would rather not
// render `ThemeScope`: `themeScope` resolves every token again on the element
// it lands on, and each `colorScheme` class does that and pins the scheme
// too. All three were generated for Storybook first, where the Theme control
// uses the scheme pair; nothing in the package named them, so an app with a
// switch of its own had to restate every colour token under its own
// selector, twice — dark for a light OS, light for a dark one.
//
// A server module like the entry, since it is three strings.

/**
 * The class that lets an element theme what is inside it. A `--kui-*`
 * override declared on that element, or on one around it, reaches every
 * component rendered inside, where on any element but `<html>` it would
 * otherwise reach none — the tokens resolve on `:root` and are inherited from
 * there already resolved. The scheme is inherited from around it, so a scope
 * inside a dark page stays dark.
 *
 * Overlays are portalled to the body, outside the element, so they keep the
 * page's tokens; `ThemeScope` is the same class with a portal container of
 * its own, which takes them along.
 */
const themeScope = stylex.props(tokenScope).className ?? ''

/**
 * The classes that pin the library's colours to its light or its dark
 * scheme, whatever the reader's OS asks for — for an app with a theme switch
 * of its own. Put one on the `<html>` element, where overlays portalled to
 * the body still sit inside it; with neither there, the colours follow the
 * OS as they always have. Each is also a {@link themeScope}, so either on a
 * smaller element pins and scopes the subtree under it.
 *
 * Shaped as an object of class names, one per scheme. Each name is several
 * classes separated by spaces, so add them with `className` rather than
 * `classList.add`, which takes one class per argument.
 *
 * A `--kui-color-*` override still applies under either, declared on the
 * same element or above it.
 */
const colorScheme = {
  dark: stylex.props(tokenScope, colorDefaultsDarkTheme).className ?? '',
  light: stylex.props(tokenScope, colorDefaultsLightTheme).className ?? '',
}

export { colorScheme, themeScope }
