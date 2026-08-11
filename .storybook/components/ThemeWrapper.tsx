'use client'

import type { ReactNode } from 'react'

import * as stylex from '@stylexjs/stylex'
import { useEffect } from 'react'

import {
  colors,
  colorsDarkTheme,
  colorsLightTheme,
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
  canvas: {
    backgroundColor: colors.surface,
    boxSizing: 'border-box',
    minHeight: '100vh',
    padding: '1rem',
  },
})

type ThemeWrapperProps = {
  children: ReactNode
  isDark: boolean
}

// Our tokens default to the OS-level prefers-color-scheme media query, which a
// toolbar toggle can't override on its own. Applying a createTheme class pins
// every variable to a concrete value, so the media query stops being consulted
// — and both directions need that, not just dark, or picking "light" against a
// dark OS preference would silently fall through to the media query anyway.
//
// isDark comes from the `theme` global (see preview.tsx), which is what lets
// Chromatic capture the same story in both themes.
function ThemeWrapper({ children, isDark }: ThemeWrapperProps) {
  const theme = isDark ? colorsDarkTheme : colorsLightTheme
  const themeClassName = stylex.props(theme).className ?? ''

  // The same theme, copied onto <body>. Portalled content — Sheet's panel and
  // scrim, and anything else that renders through a portal — is appended to
  // <body>, outside the div below, so the theme class never reaches it. It
  // then falls through to the tokens' own prefers-color-scheme default and
  // renders in the machine's OS theme rather than the one the toolbar asked
  // for, which would make both Chromatic modes capture the same thing.
  useEffect(() => {
    const classNames = themeClassName.split(' ').filter(Boolean)
    document.body.classList.add(...classNames)

    return () => {
      document.body.classList.remove(...classNames)
    }
  }, [themeClassName])

  return (
    <>
      <style>{'.sb-show-main.sb-main-padded { padding: 0; }'}</style>
      <div {...stylex.props(theme, styles.canvas)}>{children}</div>
    </>
  )
}

export default ThemeWrapper
