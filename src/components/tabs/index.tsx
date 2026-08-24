import type {
  TabsListProps as BaseUITabsListProps,
  TabsPanelProps as BaseUITabsPanelProps,
  TabsRootProps as BaseUITabsRootProps,
  TabsTabProps as BaseUITabsTabProps,
  TabsTabState as BaseUITabsTabState,
} from '@base-ui/react/tabs'

import { Tabs as BaseUITabs } from '@base-ui/react/tabs'
import * as stylex from '@stylexjs/stylex'

import { mergeStatefulStyles } from '../../styles/merge'
import {
  colors,
  motion,
  radii,
  spacing,
  stateLayerOpacity,
  typography,
} from '../../tokens/design.tokens.stylex'

// A tinted pill marks the active tab, not the underline Material draws. That
// is what the source design uses, and the two are different controls wearing
// the same name: an underline belongs to a full-width tab bar, while a row of
// pills reads as a segmented control sitting inside a section.
//
// The pill takes the same height, radius, and type as Chip. Both are
// pill-shaped selection controls, and a row of tabs above a row of chips
// looks wrong the moment the two disagree about either.
const styles = stylex.create({
  list: {
    boxSizing: 'border-box',
    display: 'flex',
    // The pills carry their own separation through their padding, so the gap
    // only needs to keep two selected ones from touching.
    gap: spacing.xxs,
  },
  panel: {
    boxSizing: 'border-box',
    // The panel is focusable so keyboard users can reach its content after
    // the tab strip, which is what Base UI's roving focus hands off to.
    outlineColor: colors.primary,
    outlineOffset: '2px',
    outlineStyle: { ':focus-visible': 'solid', default: 'none' },
    outlineWidth: '2px',
  },
  tab: {
    alignItems: 'center',
    backgroundColor: 'transparent',
    blockSize: '32px',
    borderRadius: radii.sm,
    borderWidth: 0,
    boxSizing: 'border-box',
    color: colors.onSurfaceVariant,
    cursor: 'pointer',
    display: 'inline-flex',
    flexShrink: 0,
    fontFamily: typography.labelLargeFont,
    fontSize: typography.labelLargeSize,
    fontWeight: typography.labelLargeWeight,
    justifyContent: 'center',
    letterSpacing: typography.labelLargeTracking,
    lineHeight: typography.labelLargeLineHeight,
    outlineColor: colors.primary,
    outlineOffset: '2px',
    outlineStyle: { ':focus-visible': 'solid', default: 'none' },
    outlineWidth: '2px',
    paddingBlock: 0,
    paddingInline: spacing.md,
    transitionDuration: motion.durationShort2,
    transitionProperty: 'background-color, color',
    transitionTimingFunction: motion.easingStandard,
  },
  tabActive: {
    backgroundColor: {
      ':hover': `color-mix(in srgb, ${colors.onPrimaryContainer} calc(${stateLayerOpacity.hover} * 100%), ${colors.primaryContainer})`,
      default: colors.primaryContainer,
    },
    color: colors.onPrimaryContainer,
  },
  // Applied from the tab's own state rather than through `:disabled`, which
  // never matches: Base UI marks a disabled tab with aria-disabled and
  // data-disabled and leaves the native attribute off, so the pseudo-class
  // has nothing to hook onto. Listed after the active and inactive styles
  // below so it wins over whichever of the two is also applied.
  tabDisabled: {
    backgroundColor: 'transparent',
    color: `color-mix(in srgb, ${colors.onSurface} calc(${stateLayerOpacity.disabledContent} * 100%), ${colors.surface})`,
    cursor: 'not-allowed',
  },
  // Transparent, so an inactive tab tints whatever section it sits in rather
  // than carrying a container of its own — the same treatment ListItem's rows
  // and IconButton's standard variant get.
  tabInactive: {
    backgroundColor: {
      ':hover': `color-mix(in srgb, ${colors.onSurface} calc(${stateLayerOpacity.hover} * 100%), transparent)`,
      default: 'transparent',
    },
    color: colors.onSurfaceVariant,
  },
})

/**
 * A tab strip and its panels. Selection is Base UI's `value`: pass `value`
 * with `onValueChange` to control it, or `defaultValue` to let it keep its
 * own.
 *
 * Composed rather than configured by props, because the number of tabs and
 * what each panel holds are the call site's to decide — the parts are
 * `Tabs.List`, `Tabs.Tab`, and `Tabs.Panel`.
 */
function Tabs(props: BaseUITabsRootProps) {
  return <BaseUITabs.Root {...props} />
}

function TabsList(props: BaseUITabsListProps) {
  return (
    <BaseUITabs.List
      {...props}
      {...mergeStatefulStyles(stylex.props(styles.list), props)}
    />
  )
}

function TabsPanel(props: BaseUITabsPanelProps) {
  return (
    <BaseUITabs.Panel
      {...props}
      {...mergeStatefulStyles(stylex.props(styles.panel), props)}
    />
  )
}

function TabsTab(props: BaseUITabsTabProps) {
  return (
    <BaseUITabs.Tab {...props} {...mergeStatefulStyles(tabStyles, props)} />
  )
}

// StyleX cannot target [data-selected] on the element it is styling, so the
// active pill cannot be chosen in CSS. Base UI's answer is a className that is
// a function of the tab's own state, the same mechanism Chip uses —
// mergeStatefulStyles wraps this one so a tab still keeps a className the call
// site passed.
function tabStyles(state: BaseUITabsTabState) {
  return stylex.props(
    styles.tab,
    state.active ? styles.tabActive : styles.tabInactive,
    state.disabled && styles.tabDisabled,
  )
}

Tabs.List = TabsList
Tabs.Panel = TabsPanel
Tabs.Tab = TabsTab

type TabsListProps = BaseUITabsListProps

type TabsPanelProps = BaseUITabsPanelProps

type TabsProps = BaseUITabsRootProps

type TabsTabProps = BaseUITabsTabProps

export type { TabsListProps, TabsPanelProps, TabsProps, TabsTabProps }

export default Tabs
