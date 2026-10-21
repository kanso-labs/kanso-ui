'use client'

import type { KuiTheme } from '@kanso-labs/kanso-ui-core'

import * as stylex from '@stylexjs/stylex'
import { useCallback, useState } from 'react'
import { UNSAFE_PortalProvider as PortalProvider } from 'react-aria/PortalProvider'
import { useIsSSR } from 'react-aria/SSRProvider'

import type { RenderComponentProps } from './render/useRender'

import { useRender } from './render/useRender'
import { mergeStyles } from './styles/merge'
import { pinnedScheme } from './styles/scheme'
import {
  colorDefaultsDarkTheme,
  colorDefaultsLightTheme,
  tokenScope,
} from './tokens/design.tokens.stylex'

// The component form of `themeScope` and `colorScheme` in ./color-scheme.ts:
// the same classes, on an element of its own, plus the one thing a class
// cannot do — take the overlays along. A pinned scheme paints the scope's
// surface and sets its `color-scheme` too; see src/styles/scheme.ts.
//
// React Aria portals every overlay to the end of `<body>` unless a portal
// provider names another container, so a popover, a sheet, a tooltip or a
// toast opened inside a themed element renders outside it, and keeps the
// tokens of the page. The container here is inside the scope's own element,
// which is what makes the overlays inherit whatever the scope inherits: its
// scheme, and the `--kui-*` overrides declared on it or on any element around
// it. A container appended to the body and given the scope's classes would
// carry the classes alone, losing every override declared above the scope.
//
// It is appended to the scope's element rather than rendered as one of its
// children. A rendered `<div>` was a child of whatever the scope rendered as,
// so a scope rendered as a `<p>` drew React's nesting error and a hydration
// warning, and the server's markup held a `<div>` inside it. Appended, it is
// in neither React's tree nor the server's markup.
//
// It has to be in place before anything inside the scope runs a layout
// effect, which is earlier than the scope's own ref: React attaches an
// element's ref once everything inside it has run its layout effects. An
// overlay open on the scope's first render reads its own element in one of
// those effects, once — React Aria decides there whether a popover is a
// dialog, and hides or makes inert the page behind a modal — so an overlay
// mounted a render late, or into a container not yet in the document, gets
// those wrong for as long as it stays open: a hover popover kept a second,
// unnamed dialog role around its own, and a sheet left the page behind it
// reachable. So the container is made on the first render and handed out
// from it, and a `<template>` rendered ahead of the children appends it,
// since its ref attaches before anything after it runs an effect. The
// template then removes itself, so the call site's children keep their
// places for `:first-child` and `:nth-child`. React never inserts anything
// before it and only ever removes it along with the scope's element, so
// nothing reaches for it once it is gone.
//
// Nothing is handed out while the page hydrates, as React Aria hands out
// nothing then either: the server rendered no overlay, so a portal would be
// a mismatch. One open from the start renders once hydration is over, as it
// would outside a scope.
//
// `display: contents` keeps that container out of the layout, so a scope
// that is a grid or a flex container gains no item and no gap from it. React
// Aria positions an overlay against the overlay's own containing block rather
// than the container's box, so a container with no box of its own changes
// nothing about where a popover lands. It is still an element, so a selector
// that counts the scope's children counts it; the description below says
// what that changes for a call site.
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
   * reader's OS asks for. A pinned scope paints its own surface and text in
   * that scheme and sets `color-scheme` for the native controls inside, so
   * it reads on any page. Left unset, the scope paints nothing and keeps the
   * scheme around it: the one an enclosing scope or a `colorScheme` class
   * pins, on the `<html>` element or nearer, or else the OS's.
   */
  scheme?: 'dark' | 'light' | undefined
  /**
   * `--kui-*` overrides for everything inside, as a map of the custom
   * properties `tokens.css` lists to CSS values. The scope declares them on
   * its own element, as an override in `style` would be, with `style` winning
   * where the two set the same property.
   *
   * The values hold for both schemes. To give light and dark a value each,
   * keep two maps and hand the scope the one for the scheme in use.
   */
  theme?: KuiTheme | undefined
}

// The container's class, the one thing it carries: it is made with
// `createElement`, which takes no props.
const containerClassName = stylex.props(styles.container).className ?? ''

/** The overlays' container, or nothing where there is no document. */
function makeContainer() {
  if (typeof document === 'undefined') {
    return null
  }
  const made = document.createElement('div')
  made.className = containerClassName
  return made
}

/**
 * Themes what is inside it, overlays included.
 *
 * A `--kui-*` override declared on the scope — through `theme`, `className`
 * or `style` — or on any element around it reaches every component inside,
 * where on any element but `<html>` it would otherwise reach none, since the
 * tokens resolve once on `:root`. Popovers, sheets, tooltips and toasts
 * opened inside portal into the scope rather than into the body, so they
 * follow it too. The rest of the page keeps its own tokens.
 *
 * ```tsx
 * const accent: KuiTheme = { '--kui-color-primary': '#7d5260' }
 *
 * <ThemeScope scheme="dark" theme={accent}>
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
 * `<section>`, an `<article>`, or the `<body>` itself — any element that
 * takes flow content, as a `<div>` does. The overlays' container is a
 * `<div>` added inside the scope's element, so an element whose content is
 * restricted — a list, whose children have to be list items, a paragraph,
 * or a part of a table — is not a scope: put the scope around it instead.
 *
 * That container comes after whatever the scope renders, and it has no box,
 * so layout never sees it, but selectors do. Inside the scope the last
 * element the call site rendered is not `:last-child` and is counted wrong
 * by `:nth-last-child()`, a lone child is not `:only-child`, and a scope
 * with nothing in it is not `:empty`. Key a rule like that on something of
 * the call site's own, such as a class, or put the scope around the element
 * whose children it counts.
 *
 * What reaches a scope from around it is the scheme and the `--kui-*`
 * properties. It resolves every token again from those two, so a theme
 * applied around it in any other way stops at its edge.
 */
function ThemeScope({
  children,
  render,
  scheme,
  theme,
  ...props
}: ThemeScopeProps) {
  // One container for the scope's life. A new element, as when `render`
  // changes the tag, has the same one moved into it rather than a new one
  // made, which would remount every open overlay.
  const [container] = useState(makeContainer)
  const isSSR = useIsSSR()
  const getContainer = useCallback(
    () => (isSSR ? null : container),
    [container, isSSR],
  )

  // The scope's element is the template's parent. A template met again —
  // React hands the ref over again when it changes, and twice under strict
  // mode — has already left it, and finds no parent. The container is
  // appended only where it is not already, since moving a node blurs
  // whatever inside it has focus.
  const place = useCallback(
    (marker: HTMLTemplateElement | null) => {
      const scope = marker?.parentElement ?? null
      if (marker === null || scope === null || container === null) {
        return
      }
      if (container.parentElement !== scope) {
        scope.append(container)
      }
      marker.remove()
    },
    [container],
  )

  return useRender({
    defaultTagName: 'div',
    props: {
      ...props,
      ...mergeStyles(
        stylex.props(
          styles.root,
          tokenScope,
          scheme !== undefined && schemes[scheme],
          scheme !== undefined && pinnedScheme[scheme],
        ),
        theme === undefined
          ? props
          : { ...props, style: { ...theme, ...props.style } },
      ),
      children: (
        <>
          {!isSSR && <template ref={place} />}
          <PortalProvider getContainer={getContainer}>
            {children}
          </PortalProvider>
        </>
      ),
    },
    render,
  })
}

// kanso-ui-core's, re-exported. The package is a devDependency, so the build
// writes the type's declaration into dist rather than an import of it, and
// scripts/check-package.mjs fails a declaration that still names the package.
export type { KuiTheme } from '@kanso-labs/kanso-ui-core'
export type { ThemeScopeProps }

export { ThemeScope }
