'use client'

import type { ReactNode, RefAttributes } from 'react'

import * as stylex from '@stylexjs/stylex'
import { useMemo } from 'react'

import type { NavigationItemProps } from '../../navigation'
import type { RenderComponentProps } from '../../render/useRender'

import { NavigationItem } from '../../navigation'
import { NavigationContext } from '../../navigation/context'
import { useRender } from '../../render/useRender'
import { mergeStyles } from '../../styles/merge'
import { colors, spacing } from '../../tokens/design.tokens.stylex'

// The navigation rail page's rail, in both its forms: collapsed, a 96dp
// column of vertical destinations down the leading edge of a medium or wider
// window, and expanded, between 220dp and 360dp with each destination the
// page's 56dp horizontal pill. The expanded rail is what the page has
// replace the navigation drawer, so an app's top-level destinations reach
// every window size between this and NavigationBar. Both forms are on the
// surface role, with the first destination 44dp from the top, or 8dp under
// a header when the rail has one — a menu button that expands it, say. The
// destinations are `src/navigation`'s, shared with NavigationBar, which holds
// their values.
//
// The rail is a `<nav>`, and a page usually has more than one navigation
// landmark, so name it with `aria-label`.

const styles = stylex.create({
  collapsed: {
    gap: spacing.xs,
    inlineSize: '96px',
  },
  // The page's 20dp either side of the pills, which falls between two steps
  // of the spacing scale and so is written out.
  expanded: {
    inlineSize: 'fit-content',
    maxInlineSize: '360px',
    minInlineSize: '220px',
    paddingInline: '20px',
  },
  // What the rail draws above its destinations, 8dp clear of the first:
  // 4dp of its own here, and the collapsed rail's 4dp gap the rest.
  header: {
    alignItems: 'center',
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    marginBlockEnd: spacing.xs,
    paddingBlockStart: spacing.xl,
  },
  // The expanded rail has no gap between destinations, so its header keeps
  // the whole 8dp.
  headerExpanded: {
    alignItems: 'flex-start',
    marginBlockEnd: spacing.sm,
  },
  // With no header the destinations start the pages' 44dp down.
  headless: {
    paddingBlockStart: '44px',
  },
  rail: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    blockSize: '100%',
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    paddingBlockEnd: spacing.xl,
  },
})

type NavigationRailProps = RenderComponentProps<'nav'> & {
  /**
   * What the rail draws above its destinations: a menu button that expands
   * it, or a floating action button.
   */
  header?: ReactNode
  /**
   * Whether the rail is in its expanded form, each destination a pill with
   * its label beside the icon, rather than collapsed with the label under it.
   * @default false
   */
  isExpanded?: boolean
  /**
   * The route of the current destination, matched against each
   * destination's `href`. The match carries `aria-current="page"` and the
   * active indicator.
   */
  selectedRoute?: string
}

/**
 * The column of top-level destinations a medium or wider window keeps at its
 * leading edge, collapsed or, with `isExpanded`, expanded. Each destination
 * is a link, so it routes through React Aria's `RouterProvider` when the app
 * has one.
 *
 * ```tsx
 * <NavigationRail aria-label="Label" selectedRoute="/first">
 *   <NavigationRail.Item href="/first" icon={<FirstIcon />}>
 *     First item
 *   </NavigationRail.Item>
 *   <NavigationRail.Item href="/second" icon={<SecondIcon />}>
 *     Second item
 *   </NavigationRail.Item>
 * </NavigationRail>
 * ```
 *
 * The call site's `className` and `style` land on the `<nav>`.
 */
function NavigationRail({
  children,
  header,
  isExpanded = false,
  render,
  selectedRoute,
  ...props
}: NavigationRailProps) {
  const context = useMemo(
    () => ({
      form: isExpanded ? ('expanded' as const) : ('collapsed' as const),
      selectedRoute,
    }),
    [isExpanded, selectedRoute],
  )
  const rail = useRender({
    defaultTagName: 'nav',
    props: {
      ...props,
      ...mergeStyles(
        stylex.props(
          styles.rail,
          isExpanded ? styles.expanded : styles.collapsed,
          header === undefined && styles.headless,
        ),
        props,
      ),
      children: (
        <>
          {header === undefined ? null : (
            <div
              {...stylex.props(
                styles.header,
                isExpanded && styles.headerExpanded,
              )}
            >
              {header}
            </div>
          )}
          {children}
        </>
      ),
    },
    render,
  })

  return <NavigationContext value={context}>{rail}</NavigationContext>
}

/**
 * One destination of a navigation rail — an icon, a label and, when it is the
 * current one, the active indicator. See `NavigationRail`.
 *
 * Defined here rather than re-exported from `src/navigation`: a re-export
 * let the build hand the package entry that module directly, past this
 * module's client directive, and a server component importing it got the
 * component itself rather than a reference to a client one.
 */
function NavigationRailItem(
  props: NavigationItemProps & RefAttributes<HTMLAnchorElement>,
) {
  return <NavigationItem {...props} />
}

NavigationRail.Item = NavigationRailItem

export type {
  NavigationItemProps as NavigationRailItemProps,
  NavigationRailProps,
}

export { NavigationRailItem }

export default NavigationRail
