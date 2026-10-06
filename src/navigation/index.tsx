import type { ReactNode, RefAttributes } from 'react'
import type {
  LinkRenderProps,
  LinkProps as RACLinkProps,
} from 'react-aria-components'

import * as stylex from '@stylexjs/stylex'
import { useContext } from 'react'
import { Link as RACLink } from 'react-aria-components'

import type { NavigationForm } from './context'

import Badge from '../components/badge'
import { focus } from '../styles/focus'
import { mergeStatefulStyles } from '../styles/merge'
import { NavigationContext } from './context'
import {
  barItemStyles,
  collapsedItemStyles,
  expandedItemStyles,
  navigationItemStyles,
} from './styles'

// The destination NavigationBar and NavigationRail both render, and the
// context each hands it: which of the three forms to draw and which route is
// current. See ./styles.ts for the forms.
//
// A destination is a link — it goes somewhere, rather than selecting
// something — so it is React Aria's `Link`, which routes through a
// `RouterProvider` when an app has one. The current one is the one whose
// `href` is the bar's or the rail's `selectedRoute`, the same matching
// NavigationTree does, and it carries `aria-current="page"`.

const FORMS = {
  bar: barItemStyles,
  collapsed: collapsedItemStyles,
  expanded: expandedItemStyles,
}

// The focus ring goes around the pill, wherever a form draws it: the
// indicator in a vertical destination, the whole destination in a horizontal
// one. The rail's two forms take the library's shared ring. The bar's pill
// moves from one element to the other at the medium breakpoint, so its rings
// are its own, each giving way at the width the other takes over.
const RINGS = {
  bar: { indicator: barItemStyles.indicatorRing, item: barItemStyles.itemRing },
  collapsed: { indicator: focus.ringVisible, item: null },
  expanded: { indicator: null, item: focus.ringVisible },
}

type NavigationItemProps = {
  /**
   * A badge on the icon: `true` for the badges page's small dot, a number
   * for the large badge holding it. The badge is hidden from assistive
   * technology, so say what it says in the destination's `aria-label` too —
   * "First item, 3 new".
   */
  badge?: boolean | number
  /** The destination's name, drawn as its label. */
  children: ReactNode
  /** A function may compute the class from the destination's render state. */
  className?: RACLinkProps['className']
  /**
   * Where the destination goes, and what the bar's or the rail's
   * `selectedRoute` is matched against.
   */
  href: string
  /** The destination's icon, at the pages' 24dp. */
  icon: ReactNode
  /** A function may compute the style from the destination's render state. */
  style?: RACLinkProps['style']
} & Omit<RACLinkProps, 'children' | 'className' | 'href' | 'style'>

// A destination's own classes, from React Aria's render state: the pill in a
// horizontal form, and the layers over it.
function itemClasses(form: NavigationForm, isCurrent: boolean) {
  const styles = FORMS[form]

  return (state: LinkRenderProps) =>
    stylex.props(
      navigationItemStyles.link,
      styles.item,
      isCurrent && styles.itemCurrent,
      state.isHovered &&
        (isCurrent ? styles.itemHoveredCurrent : styles.itemHovered),
      state.isFocusVisible &&
        (isCurrent ? styles.itemFocusedCurrent : styles.itemFocused),
      state.isPressed &&
        (isCurrent ? styles.itemPressedCurrent : styles.itemPressed),
      state.isFocusVisible && RINGS[form].item,
      state.isDisabled && navigationItemStyles.itemDisabled,
    )
}

// What a destination draws, from React Aria's render state: the indicator
// holding the icon, and the label beside or under it. Built by a call rather
// than written inline at the prop, which is what react-perf's
// no-new-function-as-prop is after.
function itemContent(
  form: NavigationForm,
  isCurrent: boolean,
  badge: boolean | number | undefined,
  icon: ReactNode,
  label: ReactNode,
) {
  const styles = FORMS[form]
  const glyph =
    badge === undefined || badge === false ? (
      icon
    ) : (
      <Badge count={badge === true ? undefined : badge}>{icon}</Badge>
    )

  return (state: LinkRenderProps) => (
    <>
      <span
        {...stylex.props(
          navigationItemStyles.pill,
          styles.indicator,
          isCurrent && styles.indicatorCurrent,
          state.isHovered &&
            (isCurrent
              ? styles.indicatorHoveredCurrent
              : styles.indicatorHovered),
          state.isFocusVisible &&
            (isCurrent
              ? styles.indicatorFocusedCurrent
              : styles.indicatorFocused),
          state.isPressed &&
            (isCurrent
              ? styles.indicatorPressedCurrent
              : styles.indicatorPressed),
          state.isFocusVisible && RINGS[form].indicator,
          state.isDisabled && navigationItemStyles.itemDisabled,
        )}
      >
        <span {...stylex.props(navigationItemStyles.icon)}>{glyph}</span>
      </span>
      <span
        {...stylex.props(
          navigationItemStyles.label,
          styles.label,
          isCurrent && styles.labelCurrent,
          state.isDisabled && navigationItemStyles.itemDisabled,
        )}
      >
        {label}
      </span>
    </>
  )
}

/**
 * One destination in a navigation bar or rail: an icon, a label and, when
 * it is the current one, the active indicator behind them.
 */
function NavigationItem({
  badge,
  children,
  href,
  icon,
  ...props
}: NavigationItemProps & RefAttributes<HTMLAnchorElement>) {
  const { form, selectedRoute } = useContext(NavigationContext)
  const isCurrent = selectedRoute !== undefined && href === selectedRoute

  return (
    <RACLink
      aria-current={isCurrent ? 'page' : undefined}
      href={href}
      {...props}
      {...mergeStatefulStyles(itemClasses(form, isCurrent), props)}
    >
      {itemContent(form, isCurrent, badge, icon, children)}
    </RACLink>
  )
}

export type { NavigationItemProps }

export { NavigationItem }
