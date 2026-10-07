'use client'

import * as stylex from '@stylexjs/stylex'
import { useCallback, useState } from 'react'
import { UNSAFE_PortalProvider as PortalProvider } from 'react-aria/PortalProvider'

import type { RenderComponentProps } from './render/useRender'

import { useRender } from './render/useRender'
import { mergeStyles } from './styles/merge'
import {
  colorDefaultsDarkTheme,
  colorDefaultsLightTheme,
  tokenScope,
} from './tokens/design.tokens.stylex'

// The component form of `themeScope` and `colorScheme` in ./color-scheme.ts:
// the same classes, on an element of its own, plus the one thing a class
// cannot do — take the overlays along.
//
// React Aria portals every overlay to the end of `<body>` unless a portal
// provider names another container, so a popover, a sheet, a tooltip or a
// toast opened inside a themed element renders outside it, and keeps the
// tokens of the page. The container here is the scope's own last child,
// which is what makes the overlays inherit whatever the scope inherits: its
// scheme, and the `--kui-*` overrides declared on it or on any element around
// it. A container appended to the body and given the scope's classes would
// carry the classes alone, losing every override declared above the scope.
//
// `display: contents` keeps that container out of the layout, so a scope
// that is a grid or a flex container gains no item and no gap from it. React
// Aria positions an overlay against the overlay's own containing block rather
// than the container's box, so a container with no box of its own changes
// nothing about where a popover lands.
const styles = stylex.create({
  container: {
    boxSizing: 'border-box',
    display: 'contents',
  },
  root: {
    boxSizing: 'border-box',
  },
})

const schemes = {
  dark: colorDefaultsDarkTheme,
  light: colorDefaultsLightTheme,
}

type ThemeScopeProps = RenderComponentProps<'div'> & {
  /**
   * Pins the scope to the library's light or dark scheme, whatever the
   * reader's OS asks for. Left unset, the scope keeps the scheme around it:
   * the one an enclosing scope or the `<html>` element pins, or the OS's.
   */
  scheme?: 'dark' | 'light' | undefined
}

/**
 * Themes what is inside it, overlays included.
 *
 * A `--kui-*` override declared on the scope — through `className` or
 * `style` — or on any element around it reaches every component inside,
 * where on any element but `<html>` it would otherwise reach none, since the
 * tokens resolve once on `:root`. Popovers, sheets, tooltips and toasts
 * opened inside portal into the scope rather than into the body, so they
 * follow it too. The rest of the page keeps its own tokens.
 *
 * ```tsx
 * // .accent { --kui-color-primary: #7d5260; }
 * <ThemeScope className="accent" scheme="dark">
 *   <Select label="Label">…</Select>
 * </ThemeScope>
 * ```
 *
 * Because the overlays render inside the scope, an ancestor that confines
 * its descendants confines them too: a `transform` or a `filter` makes a
 * sheet's fixed scrim cover that ancestor rather than the viewport, and
 * `overflow: hidden` with a position clips a popover. Put the scope around
 * such an element rather than inside it.
 *
 * `render` swaps the element, for a scope that should be a `<main>`, a
 * `<section>`, or the `<body>` itself.
 */
function ThemeScope({ children, render, scheme, ...props }: ThemeScopeProps) {
  // State rather than a ref, so the overlays render again once the container
  // exists. React Aria renders an overlay nowhere while `getContainer` hands
  // back nothing, and one open on the scope's first render would otherwise
  // stay that way.
  const [container, setContainer] = useState<HTMLDivElement | null>(null)
  const getContainer = useCallback(() => container, [container])

  return useRender({
    defaultTagName: 'div',
    props: {
      ...props,
      ...mergeStyles(
        stylex.props(
          styles.root,
          tokenScope,
          scheme !== undefined && schemes[scheme],
        ),
        props,
      ),
      children: (
        <>
          <PortalProvider getContainer={getContainer}>
            {children}
          </PortalProvider>
          <div {...stylex.props(styles.container)} ref={setContainer} />
        </>
      ),
    },
    render,
  })
}

export type { ThemeScopeProps }

export { ThemeScope }
