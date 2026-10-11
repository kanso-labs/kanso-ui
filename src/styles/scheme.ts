import * as stylex from '@stylexjs/stylex'

import { colors } from '../tokens/design.tokens.stylex'

// What pinning a scheme does beside the colour theme that pins the tokens:
// the element paints its own surface and text in that scheme, and tells the
// browser the scheme, which is what native controls, scrollbars, autofill
// and spellcheck follow — they read `color-scheme` rather than any token.
//
// A theme pins the tokens alone. A pinned dark scope on a light page left
// its own background transparent and its text the page's, so a `Text`
// inside drew the dark scheme's on surface over the light page, 1.23:1, and
// an `<input>` inside stayed white with black text.
//
// Surface and on surface rather than background and on background: the two
// pairs hold the same colours in both of the library's schemes, and surface
// is the pair Material Design draws content on. Shared by `ThemeScope` and
// the `colorScheme` classes in src/color-scheme.ts, which are the same
// classes in two forms; an unpinned scope applies neither, so it paints
// nothing and inherits the scheme around it.
const pinnedScheme = stylex.create({
  dark: {
    backgroundColor: colors.surface,
    color: colors.onSurface,
    colorScheme: 'dark',
  },
  light: {
    backgroundColor: colors.surface,
    color: colors.onSurface,
    colorScheme: 'light',
  },
})

export { pinnedScheme }
