'use client'

import type { DemoTheme } from '@kanso-labs/kanso-ui-core/themes'
import type { ReactNode } from 'react'

import { demoThemes } from '@kanso-labs/kanso-ui-core/themes'
import * as stylex from '@stylexjs/stylex'

import { ThemeScope } from '../../src/theme-scope'
import {
  colorDefaultsDarkTheme,
  colorDefaultsLightTheme,
  colors,
  typography,
} from '../../src/tokens/design.tokens.stylex'

const styles = stylex.create({
  // Storybook's preview canvas has no background of its own — plain white
  // regardless of theme — unless a story builds its own page shell (only
  // Foundations/Tokens does). Painting colors.surface here, once, gives
  // every story a themed canvas without each one having to opt in.
  //
  // <body> itself carries a 1rem gutter via Storybook's own .sb-main-padded
  // class, outside this div, so it can never pick up colors.surface — the
  // global override below zeroes that out and the padding here replaces it,
  // so the surface color reaches the true edge of the canvas.
  //
  // The text on it takes on surface and the body face for the same reason: a
  // story whose text sits outside a `Text`, such as a link of the inherit
  // tone, would otherwise be black on a dark surface and set in the browser's
  // serif. The size and line height stay the browser's, which is what a
  // component inheriting them meets on a page that sets neither.
  canvas: {
    backgroundColor: colors.surface,
    boxSizing: 'border-box',
    color: colors.onSurface,
    fontFamily: typography.bodyLargeFont,
    padding: '1rem',
  },
  // A story on its own fills the canvas, so the surface reaches the bottom of
  // the frame. A story drawn inline on an Overview page takes its own height
  // instead: there the viewport is the whole page, and filling it would give
  // every story on the page a screen of its own.
  fill: {
    minHeight: '100vh',
  },
})

type ThemeWrapperProps = {
  children: ReactNode
  /** Grow to the viewport's height. False for a story on an Overview page. */
  fill: boolean
  /** 'light', 'dark', or a key of `demoThemes` — whatever the `theme` global says. */
  name: string
}

// Keyed by plain string rather than by the names it actually holds, so the
// `theme` global — an arbitrary string as far as this file knows — can be
// looked up without an assertion narrowing it back down.
const DEMO_THEMES: Readonly<Partial<Record<string, DemoTheme>>> = demoThemes

// Every story renders inside a `ThemeScope`, the component a consumer themes
// the library with, so the canvas is themed the way an app is. The scope
// declares every token again on its own element and portals the overlays
// into itself, which is what takes Sheet's panel and scrim, menus, popovers,
// tooltips and toasts along: rendered to the end of <body> instead, they
// would keep the page's tokens and draw in the machine's OS theme rather
// than the one the toolbar asked for, and both Chromatic modes would capture
// the same thing.
//
// A demo scheme is kanso-ui-core's `--kui-*` map, handed to the scope's
// `theme` prop as a consumer would hand one. It states every colour, so the
// colour defaults are never consulted under it. The library's own two take
// the class pinning those defaults instead, and both directions need it, not
// just dark: our tokens default to the OS-level prefers-color-scheme media
// query, which a toolbar toggle can't override on its own, so picking "light"
// against a dark OS preference would otherwise fall through to the media
// query. The class rather than the scope's `scheme` prop, which would also
// set the text colour and `color-scheme` on every story.
//
// `name` comes from the `theme` global (see preview.tsx), which is what lets
// Chromatic capture the same story in both themes and what lets a story pin
// one of the demo schemes for itself.
function ThemeWrapper({ children, fill, name }: ThemeWrapperProps) {
  const demo = DEMO_THEMES[name]

  return (
    <>
      <style>{'.sb-show-main.sb-main-padded { padding: 0; }'}</style>
      <ThemeScope
        {...stylex.props(
          demo === undefined &&
            (name === 'dark'
              ? colorDefaultsDarkTheme
              : colorDefaultsLightTheme),
          styles.canvas,
          fill && styles.fill,
        )}
        theme={demo?.theme}
      >
        {children}
      </ThemeScope>
    </>
  )
}

export default ThemeWrapper
