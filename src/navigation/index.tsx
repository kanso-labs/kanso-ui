import type { ReactNode, RefAttributes } from 'react'
import type {
  LinkRenderProps,
  LinkProps as RACLinkProps,
} from 'react-aria-components'

import * as stylex from '@stylexjs/stylex'
import { useContext, useId } from 'react'
import { Link as RACLink } from 'react-aria-components'

import type { NavigationForm } from './context'

import { BadgeMarkContext } from '../badge'
import Badge from '../components/badge'
import { useClippedTitle } from '../hooks/useClippedTitle'
import { focus } from '../styles/focus'
import { mergeStatefulStyles } from '../styles/merge'
import { NavigationContext } from './context'
import {
  barItemStyles,
  collapsedItemStyles,
  crampedBarItemStyles,
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
// NavigationTree does, and it carries `aria-current="page"`. A destination's
// own `isCurrent` overrides that match, which is how an app on a route
// nested under a destination marks the destination it is under: the match
// is exact, and a top-level destination's `href` is rarely the whole route.
// The attribute, the indicator and the label all read the one answer.
//
// A badge is hidden from assistive technology — see the Badge component for
// why — so what it says reaches the link's name through `badgeLabel`: the
// link is named by its label and that text together, through
// `aria-labelledby`, rather than by an `aria-label` the call site would keep
// in step with both the label and the count, in every language. The text
// sits in a hidden span beside the badge, which a name can still be read
// from, so the label's own text and the width the bar measures it at are
// untouched. An `aria-label` or `aria-labelledby` the call site passes still
// names the link instead.

const FORMS = {
  bar: barItemStyles,
  barCramped: { ...collapsedItemStyles, item: crampedBarItemStyles.item },
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
  barCramped: { indicator: focus.ringVisible, item: null },
  collapsed: { indicator: focus.ringVisible, item: null },
  expanded: { indicator: null, item: focus.ringVisible },
}

// The ids a destination naming its badge gives its label and the badge's
// words, which its link is labelled by.
type Naming = { badgeId: string; badgeLabel: string; labelId: string }

type NavigationItemProps = {
  /**
   * A badge on the icon: `true` for the badges page's small dot, a number
   * for the large badge holding it. The badge is hidden from assistive
   * technology, so say what it says in `badgeLabel`.
   */
  badge?: boolean | number
  /**
   * What the badge says, in words and in the reader's language — "3 new",
   * or "new" for the dot. It follows the label in the destination's
   * accessible name, "First item 3 new", and is read only while the badge is
   * drawn.
   */
  badgeLabel?: string
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
  /**
   * Whether this is the current destination, in place of matching its
   * `href` against the bar's or the rail's `selectedRoute`. Pass it for a
   * route nested under the destination, `/first/42` under `/first`, which
   * the exact match leaves without a current destination; `false` turns
   * the match off. Left out, the match decides.
   */
  isCurrent?: boolean
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
  naming: Naming | undefined,
) {
  const styles = FORMS[form]
  const glyph =
    badge === undefined || badge === false ? (
      icon
    ) : (
      <BadgeMarkContext value={styles.badgeMark}>
        <Badge count={badge === true ? undefined : badge}>{icon}</Badge>
      </BadgeMarkContext>
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
        {naming && (
          <span hidden id={naming.badgeId}>
            {naming.badgeLabel}
          </span>
        )}
      </span>
      <NavigationLabel
        id={naming?.labelId}
        styling={stylex.props(
          navigationItemStyles.label,
          styles.label,
          isCurrent && styles.labelCurrent,
          state.isDisabled && navigationItemStyles.itemDisabled,
        )}
      >
        {label}
      </NavigationLabel>
    </>
  )
}

/**
 * One destination in a navigation bar or rail: an icon, a label and, when
 * it is the current one, the active indicator behind them.
 */
function NavigationItem({
  badge,
  badgeLabel,
  children,
  href,
  icon,
  isCurrent: isCurrentProp,
  ...props
}: NavigationItemProps & RefAttributes<HTMLAnchorElement>) {
  const { form, selectedRoute } = useContext(NavigationContext)
  const isCurrent =
    isCurrentProp ?? (selectedRoute !== undefined && href === selectedRoute)
  const labelId = useId()
  const badgeId = useId()
  // Only while the badge is drawn, and only where the call site names the
  // link no other way.
  const naming =
    badge !== undefined &&
    badge !== false &&
    badgeLabel !== undefined &&
    props['aria-label'] === undefined &&
    props['aria-labelledby'] === undefined
      ? { badgeId, badgeLabel, labelId }
      : undefined

  return (
    <RACLink
      aria-current={isCurrent ? 'page' : undefined}
      aria-labelledby={naming && `${naming.labelId} ${naming.badgeId}`}
      href={href}
      {...props}
      {...mergeStatefulStyles(itemClasses(form, isCurrent), props)}
    >
      {itemContent(form, isCurrent, badge, icon, children, naming)}
    </RACLink>
  )
}

// The label, kept to one line, which shows its full text in the browser's
// tooltip on hover once it is cut short — see `useClippedTitle`. A component
// because the title is state, and `itemContent` runs inside React Aria's
// render function.
function NavigationLabel({
  children,
  id,
  styling,
}: {
  children: ReactNode
  id: string | undefined
  styling: ReturnType<typeof stylex.props>
}) {
  const clipped = useClippedTitle(children)

  return (
    <span {...clipped} id={id} {...styling}>
      {children}
    </span>
  )
}

export type { NavigationItemProps }

export { NavigationItem }
