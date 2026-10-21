'use client'

import type { KuiTheme } from '@kanso-labs/kanso-ui-core'

import * as stylex from '@stylexjs/stylex'
import { useCallback, useMemo, useState } from 'react'
import { UNSAFE_PortalProvider as PortalProvider } from 'react-aria/PortalProvider'

import type { RenderComponentProps } from './render/useRender'

import { mergeRefs } from './render/ref'
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
// It is appended to the scope's element once that element is in the document,
// rather than rendered as one of its children. A rendered `<div>` was a child
// of whatever the scope rendered as, so a scope rendered as a `<p>` drew
// React's nesting error and a hydration warning, and the server's markup held
// a `<div>` inside it. Appended, it is in neither React's tree nor the
// server's markup, and it is there before anything can open into it.
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
   * reader's OS asks for. A pinned scope paints its own surface and text in
   * that scheme and sets `color-scheme` for the native controls inside, so
   * it reads on any page. Left unset, the scope paints nothing and keeps the
   * scheme around it: the one an enclosing scope or the `<html>` element
   * pins, or the OS's.
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

// The container made for each scope's element. A ref attaches again whenever
// the call site hands a ref of a new identity, and a new container each time
// would move every open overlay into it, which remounts them. So the one an
// element already holds is kept as it is — not even appended again, since
// moving a node blurs whatever inside it has focus — and a new one is made
// only for a new element, as when `render` changes the tag. React removes an
// old element with its container in it, and the map lets both go.
const containers = new WeakMap<Element, HTMLDivElement>()

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
 */
function ThemeScope({
  children,
  render,
  scheme,
  theme,
  ...props
}: ThemeScopeProps) {
  // State rather than a ref, so the overlays render again once the container
  // exists. React Aria renders an overlay nowhere while `getContainer` hands
  // back nothing, and one open on the scope's first render would otherwise
  // stay that way.
  const [container, setContainer] = useState<HTMLDivElement | null>(null)
  const getContainer = useCallback(() => container, [container])

  const attach = useCallback((scope: HTMLDivElement | null) => {
    if (scope === null) {
      return
    }
    let made = containers.get(scope)
    if (made === undefined) {
      made = scope.ownerDocument.createElement('div')
      made.className = containerClassName
      scope.append(made)
      containers.set(scope, made)
    }
    setContainer(made)
  }, [])
  // The call site's ref lands on the same element. Read off `props` rather
  // than destructured, as `useRender` reads it, so the compiler sees a prop
  // holding still rather than a ref read during render.
  const ref = useMemo(
    () => mergeRefs(attach, props.ref ?? undefined),
    [attach, props.ref],
  )

  return useRender({
    defaultTagName: 'div',
    props: {
      ...props,
      ref,
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
        <PortalProvider getContainer={getContainer}>{children}</PortalProvider>
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
