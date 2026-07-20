'use client'

import type { ReactNode } from 'react'

import * as stylex from '@stylexjs/stylex'
import { useDarkMode } from 'storybook-dark-mode'

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
}

// Our tokens default to the OS-level prefers-color-scheme media query, which
// a manual UI toggle can't override on its own — the storybook-dark-mode
// toolbar button only flips a class on <body> that nothing in the compiled
// CSS reads. useDarkMode() always resolves to a concrete true/false (it
// seeds itself from the OS preference, then tracks whatever the user
// explicitly picks), so once Storybook has an opinion it should always win —
// both directions need forcing, not just dark, or picking "light" against a
// dark OS preference would silently fall through to the media query anyway.
function ThemeWrapper({ children }: ThemeWrapperProps) {
  const isDark = useDarkMode()
  const theme = isDark ? colorsDarkTheme : colorsLightTheme

  return (
    <>
      <style>{'.sb-show-main.sb-main-padded { padding: 0; }'}</style>
      <div {...stylex.props(theme, styles.canvas)}>{children}</div>
    </>
  )
}

export default ThemeWrapper
