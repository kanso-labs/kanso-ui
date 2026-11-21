'use client'

import type { ReactNode, RefAttributes } from 'react'

import * as stylex from '@stylexjs/stylex'
import { use, useMemo } from 'react'

import type { NavigationItemProps } from '../../navigation'
import type { RenderComponentProps } from '../../render/useRender'
import type { FabProps } from '../fab'

import { NavigationItem, NavigationList } from '../../navigation'
import { NavigationContext } from '../../navigation/context'
import { hasContent } from '../../render/content'
import { useRender } from '../../render/useRender'
import { mergeStyles } from '../../styles/merge'
import { colors, spacing } from '../../tokens/design.tokens.stylex'
import Fab from '../fab'

// The navigation rail page's rail, in both its forms: collapsed, a 96dp
// column of vertical destinations down the leading edge of a medium or wider
// window, and expanded, between 220dp and 360dp with each destination the
// page's 56dp horizontal pill. The expanded rail is what the page has
// replace the navigation drawer, so an app's top-level destinations reach
// every window size between this and NavigationBar. Both forms are on the
// surface role, with their contents 44dp from the top: the first destination,
// or a header when the rail has one — a menu button that expands it, say —
// with the first destination 40dp under it. The destinations are
// `src/navigation`'s, shared with NavigationBar, which holds their values.
//
// A collapsed destination's label stays on one line in the 88dp under its
// indicator, about thirteen characters of label medium. A longer one is cut
// short with an ellipsis and shows its full text in the browser's tooltip on
// hover — see `src/navigation`. Once the reader has enlarged their text, by
// a text-only zoom or a minimum font size, the label takes further lines
// instead and its destination grows to hold them, since that text no longer
// fits the lengths around it — see src/hooks/useEnlargedText.ts. The expanded
// rail's labels sit beside their icons, with the rest of the rail's 360dp at
// most.
//
// The rail can hold the screen's FAB, where Material Design's rail puts it:
// above the destinations, under the header when there is one, with the first
// destination the page's 40dp under the FAB rather than under the header. The
// header keeps whatever else stands there, such as a menu button or a mark,
// 4dp above the FAB, the collapsed rail's gap between destinations.
// `NavigationRail.Fab` is the 56dp FAB, taking its form from the rail's: the
// icon alone in the collapsed rail, named by its label, and the extended FAB,
// icon and label, in the expanded one, at the pills' leading edge so its icon
// sits over theirs. It keeps the FAB's level 3 shadow. It sits outside the
// list of destinations and before it, so a screen reader reaches it first.
//
// The rail is a `<nav>`, and a page usually has more than one navigation
// landmark, so name it with `aria-label`.

// Windows High Contrast and the rest of the forced-colours modes. Spelled
// here rather than imported, for the reason src/field/styles.ts records.
const FORCED_COLORS = '@media (forced-colors: active)'

// How far a destination's focus ring reaches past it: the 2dp offset and
// the 3dp ring, and 3dp more under forced colours, where the ring is twice
// as heavy — see `ringWeight` in src/navigation/styles.ts. The destinations
// scroll, and a scroll container clips what overflows it, so the block they
// scroll in is padded by this much and pulled back out by as much, which
// leaves every destination where it was and every ring whole.
const RING_REACH = { default: '5px', [FORCED_COLORS]: '8px' }
const RING_PULL = { default: '-5px', [FORCED_COLORS]: '-8px' }

const styles = stylex.create({
  collapsed: {
    gap: spacing.xs,
    inlineSize: '96px',
  },
  // The destinations, in a list of their own between the header and the
  // rail's foot. A rail shorter than its destinations scrolls them here,
  // rather than painting them past its surface and off the window, and the
  // header stays where it is above them, outside the list.
  destinations: {
    alignItems: 'center',
    alignSelf: 'stretch',
    boxSizing: 'border-box',
    display: 'flex',
    flexBasis: 'auto',
    flexDirection: 'column',
    flexGrow: 1,
    flexShrink: 1,
    marginBlock: RING_PULL,
    marginInline: RING_PULL,
    minBlockSize: 0,
    overflowY: 'auto',
    paddingBlock: RING_REACH,
    paddingInline: RING_REACH,
  },
  // The page's 20dp either side of the pills, which falls between two steps
  // of the spacing scale and so is written out.
  expanded: {
    inlineSize: 'fit-content',
    maxInlineSize: '360px',
    minInlineSize: '220px',
    paddingInline: '20px',
  },
  // The rail's FAB, centred in the collapsed rail, with the first
  // destination the page's 40dp under it, as under a header.
  fab: {
    alignItems: 'center',
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    marginBlockEnd: `calc(${spacing.xxxl} - ${spacing.xs})`,
  },
  // The expanded rail's FAB, at the pills' leading edge: the extended FAB's
  // 16dp before its icon puts that icon over the pills' icons, 16dp into
  // each pill. The expanded rail has no gap between destinations, so it
  // keeps the whole 40dp.
  fabExpanded: {
    alignItems: 'flex-start',
    alignSelf: 'stretch',
    marginBlockEnd: spacing.xxxl,
  },
  // What the rail draws above its destinations, the page's 40dp clear of the
  // first: the collapsed rail's 4dp gap, and the rest of its own here.
  header: {
    alignItems: 'center',
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    marginBlockEnd: `calc(${spacing.xxxl} - ${spacing.xs})`,
  },
  // A header over a FAB sits 4dp above it, the collapsed rail's gap between
  // destinations, in either form: the collapsed rail's gap alone, and the
  // same 4dp as a margin in the expanded rail, which has no gap.
  headerAboveFab: {
    marginBlockEnd: 0,
  },
  headerAboveFabExpanded: {
    marginBlockEnd: spacing.xs,
  },
  // The expanded rail has no gap between destinations, so its header keeps
  // the whole 40dp.
  //
  // It spans the rail, so what it holds starts at the leading edge where the
  // pills do rather than in the middle, and 8dp in from there: a 40dp icon
  // button centres its 24dp icon, and 8dp puts that icon under the pills'
  // icons, 16dp into each pill.
  headerExpanded: {
    alignItems: 'flex-start',
    alignSelf: 'stretch',
    marginBlockEnd: spacing.xxxl,
    paddingInlineStart: spacing.sm,
  },
  // The page's 44dp above the contents, header or not, which falls between
  // two steps of the spacing scale and so is written out.
  //
  // It keeps its width whatever sits beside it: in a row with a wide page,
  // a flex item's default shrink took the collapsed rail from 96dp to 85.
  rail: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    blockSize: '100%',
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    flexShrink: 0,
    paddingBlockEnd: spacing.xl,
    paddingBlockStart: '44px',
  },
})

type NavigationRailFabProps = Omit<FabProps, 'label' | 'size'> &
  RefAttributes<HTMLAnchorElement | HTMLButtonElement> & {
    /**
     * What the FAB does, in words: drawn beside the icon in the expanded rail,
     * and the FAB's name in the collapsed one, where the icon stands alone.
     */
    label: string
  }

type NavigationRailProps = RenderComponentProps<'nav'> & {
  /**
   * The screen's floating action button, a `NavigationRail.Fab`, drawn above
   * the destinations and under the header: its icon alone in the collapsed
   * rail, and the extended FAB in the expanded one.
   */
  fab?: ReactNode
  /**
   * What the rail draws above its destinations and its FAB: a menu button
   * that expands it, or a mark.
   */
  header?: ReactNode
  /**
   * Whether the rail is in its expanded form, each destination a pill with
   * its label beside the icon, rather than collapsed with the label under it.
   * @default false
   */
  isExpanded?: boolean
  /**
   * The route of the current destination, matched exactly against each
   * destination's `href`. The match carries `aria-current="page"` and the
   * active indicator. For a route nested under a destination, which no
   * `href` matches whole, mark that destination with its own `isCurrent`.
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
  fab,
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
  // A slot handed `false` or `null`, as `fab={isWide && <Fab />}` hands it,
  // holds nothing, and the header keeps its own 40dp.
  const hasFab = hasContent(fab)
  const rail = useRender({
    defaultTagName: 'nav',
    props: {
      ...props,
      ...mergeStyles(
        stylex.props(
          styles.rail,
          isExpanded ? styles.expanded : styles.collapsed,
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
                hasFab &&
                  (isExpanded
                    ? styles.headerAboveFabExpanded
                    : styles.headerAboveFab),
              )}
            >
              {header}
            </div>
          )}
          {hasFab ? (
            <div
              {...stylex.props(styles.fab, isExpanded && styles.fabExpanded)}
            >
              {fab}
            </div>
          ) : null}
          <NavigationList layout={styles.destinations}>
            {children}
          </NavigationList>
        </>
      ),
    },
    render,
  })

  return <NavigationContext value={context}>{rail}</NavigationContext>
}

/**
 * The screen's floating action button in a navigation rail's `fab` slot: the
 * 56dp FAB, its icon alone in the collapsed rail and named by `label`, and
 * the extended FAB with `label` beside the icon in the expanded rail.
 *
 * ```tsx
 * <NavigationRail
 *   aria-label="Label"
 *   fab={
 *     <NavigationRail.Fab label="Label" onPress={add}>
 *       <PlusIcon />
 *     </NavigationRail.Fab>
 *   }
 * />
 * ```
 *
 * It takes Fab's props otherwise: `tone`, `variant`, `href` and the rest.
 */
function NavigationRailFab({ label, ...props }: NavigationRailFabProps) {
  const { form } = use(NavigationContext)

  return form === 'expanded' ? (
    <Fab {...props} label={label} />
  ) : (
    <Fab {...props} aria-label={props['aria-label'] ?? label} />
  )
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

NavigationRail.Fab = NavigationRailFab
NavigationRail.Item = NavigationRailItem

export type {
  NavigationRailFabProps,
  NavigationItemProps as NavigationRailItemProps,
  NavigationRailProps,
}

export { NavigationRailFab, NavigationRailItem }

export default NavigationRail
