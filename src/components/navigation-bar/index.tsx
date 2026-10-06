'use client'

import type { RefAttributes } from 'react'

import * as stylex from '@stylexjs/stylex'
import { useMemo } from 'react'

import type { NavigationItemProps } from '../../navigation'
import type { RenderComponentProps } from '../../render/useRender'

import { NavigationItem } from '../../navigation'
import { NavigationContext } from '../../navigation/context'
import { useRender } from '../../render/useRender'
import { mergeStyles } from '../../styles/merge'
import { colors, media, spacing } from '../../tokens/design.tokens.stylex'

// The navigation bar page's flexible bar: three to five destinations across
// the bottom of a compact window, on the surface container, 64dp tall. Below
// the medium breakpoint each destination is vertical and the destinations
// share the bar's width equally; at it and above, each is the page's
// horizontal pill, as wide as what it holds, and the group sits centred with
// the spare width at the bar's ends. The destinations are `src/navigation`'s,
// shared with NavigationRail, which holds the two forms' values.
//
// The 8dp between two horizontal pills is the library's own. The page puts
// each pill in an item of a fixed width it does not give, and with no space
// at all the pills met edge to edge.
//
// The bar is a `<nav>`, and a page usually has more than one navigation
// landmark, so name it with `aria-label`.

const styles = stylex.create({
  bar: {
    alignItems: 'center',
    backgroundColor: colors.surfaceContainer,
    blockSize: '64px',
    boxSizing: 'border-box',
    display: 'flex',
    gap: { default: 0, [media.medium]: spacing.sm },
    inlineSize: '100%',
    justifyContent: 'center',
  },
})

type NavigationBarProps = RenderComponentProps<'nav'> & {
  /**
   * The route of the current destination, matched against each
   * destination's `href`. The match carries `aria-current="page"` and the
   * active indicator.
   */
  selectedRoute?: string
}

/**
 * The bar of three to five top-level destinations a compact window keeps at
 * its bottom edge. Each destination is a link, so it routes through React
 * Aria's `RouterProvider` when the app has one.
 *
 * ```tsx
 * <NavigationBar aria-label="Label" selectedRoute="/first">
 *   <NavigationBar.Item href="/first" icon={<FirstIcon />}>
 *     First item
 *   </NavigationBar.Item>
 *   <NavigationBar.Item href="/second" icon={<SecondIcon />}>
 *     Second item
 *   </NavigationBar.Item>
 *   <NavigationBar.Item href="/third" icon={<ThirdIcon />}>
 *     Third item
 *   </NavigationBar.Item>
 * </NavigationBar>
 * ```
 *
 * The call site's `className` and `style` land on the `<nav>`.
 */
function NavigationBar({
  render,
  selectedRoute,
  ...props
}: NavigationBarProps) {
  const context = useMemo(
    () => ({ form: 'bar' as const, selectedRoute }),
    [selectedRoute],
  )
  const bar = useRender({
    defaultTagName: 'nav',
    props: {
      ...props,
      ...mergeStyles(stylex.props(styles.bar), props),
    },
    render,
  })

  return <NavigationContext value={context}>{bar}</NavigationContext>
}

/**
 * One destination of a navigation bar — an icon, a label and, when it is the
 * current one, the active indicator. See `NavigationBar`.
 *
 * Defined here rather than re-exported from `src/navigation`: a re-export
 * let the build hand the package entry that module directly, past this
 * module's client directive, and a server component importing it got the
 * component itself rather than a reference to a client one.
 */
function NavigationBarItem(
  props: NavigationItemProps & RefAttributes<HTMLAnchorElement>,
) {
  return <NavigationItem {...props} />
}

NavigationBar.Item = NavigationBarItem

export type {
  NavigationItemProps as NavigationBarItemProps,
  NavigationBarProps,
}

export { NavigationBarItem }

export default NavigationBar
