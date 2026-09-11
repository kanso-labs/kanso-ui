import type { ReactNode } from 'react'
import type {
  Key,
  TabsProps as RACTabsProps,
  TabListProps,
  TabPanelProps,
  TabPanelsProps,
  TabProps,
  TabRenderProps,
} from 'react-aria-components'

import * as stylex from '@stylexjs/stylex'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'
import {
  SelectionIndicator as RACSelectionIndicator,
  TabPanels as RACTabPanels,
  Tabs as RACTabs,
  Tab,
  TabList,
  TabPanel,
} from 'react-aria-components'

import { mergeStatefulStyles, mergeStyles } from '../../styles/merge'
import {
  colors,
  motion,
  radii,
  spacing,
  stateLayerOpacity,
  typography,
} from '../../tokens/design.tokens.stylex'

// The tabs page's primary tabs: a 48dp bar on the surface, divided into equal
// sections, with a 1dp outline-variant divider inside the bar along its
// bottom edge and, under the active tab's label, a 3dp primary indicator
// rounded along its top. The indicator follows the label rather than the
// tab, inset 2dp from the label's ends and never shorter than 24dp, which is
// what the page draws.
//
// The indicator is React Aria's `SelectionIndicator`, which is a shared
// element: it is rendered inside every tab but drawn in the selected one,
// and on a change it keeps the old one until it has finished moving to the
// new one's place. No `SharedElementTransition` is rendered here — `Tab`
// scopes its own, and one added around the list changes nothing, which is
// worth knowing because the primitive throws outside a scope when it is put
// anywhere else.
//
// The label is wrapped in a span of its own so the indicator has the label's
// width to follow: it is the span's `::after`, and the span is as tall as the
// tab so the indicator reaches the bottom of the bar. Which tab carries it
// comes from React Aria's render state rather than a selector, since StyleX
// cannot target [data-selected] on the element it is styling.
const styles = stylex.create({
  // The active indicator. Centred with auto margins between two zero insets,
  // so the 24dp floor still centres it under a label narrower than that. The
  // full radius on a 3dp box resolves to the page's 3, 3, 0, 0.
  //
  // `transitionProperty` is what makes it slide rather than jump, and it is
  // load-bearing in a way nothing here shows: React Aria's shared element
  // snapshots only the properties a transition names, and takes `none` as
  // "this element does not animate". Drop the line and the indicator still
  // draws, in the right place, without ever moving.
  //
  // `translate` is the one React Aria computes itself, from the gap between
  // where the indicator was and where it now is; `inline-size` is the plain
  // kind, for two tabs whose labels are different widths.
  indicator: {
    '@media (prefers-reduced-motion: reduce)': {
      transitionDuration: '0s',
    },
    backgroundColor: colors.primary,
    blockSize: '3px',
    borderStartEndRadius: radii.full,
    borderStartStartRadius: radii.full,
    boxSizing: 'border-box',
    inlineSize: `calc(100% - 2 * ${spacing.xxs})`,
    insetBlockEnd: 0,
    insetInline: 0,
    marginInline: 'auto',
    minInlineSize: '24px',
    position: 'absolute',
    transitionDuration: motion.durationMedium1,
    transitionProperty: 'translate, inline-size',
    transitionTimingFunction: motion.easingEmphasized,
  },
  label: {
    alignItems: 'center',
    blockSize: '100%',
    boxSizing: 'border-box',
    display: 'inline-flex',
    position: 'relative',
  },
  // The divider is drawn inside the bar as an inset shadow, so it is part of
  // the 48 rather than a pixel under it, and the active tab's indicator sits
  // over it.
  list: {
    boxShadow: `inset 0 -1px 0 0 ${colors.outlineVariant}`,
    boxSizing: 'border-box',
    display: 'flex',
  },
  panel: {
    boxSizing: 'border-box',
    // The panel is focusable so keyboard users can reach its content after
    // the tab strip, which is what React Aria's roving focus hands off to.
    outlineColor: colors.primary,
    outlineOffset: '2px',
    outlineStyle: { ':focus-visible': 'solid', default: 'none' },
    outlineWidth: '2px',
  },
  // The box the panels share, which is what gives a change of panel a size
  // to animate between. React Aria measures the new panel, puts the old
  // size back, and then sets the new one on `--tab-panel-height`, so the
  // transition below is what carries the box from one to the other.
  //
  // `transitionProperty` is load-bearing, and quietly: React Aria reads the
  // element's computed `transition` once and does none of the measuring at
  // all unless it names a size. Drop the line and the panels still swap,
  // and the box still resizes — it just jumps.
  //
  // Only the height is taken. The width of a tab panel is its column's,
  // which does not change with the panel, and reading the variable for it
  // would pin a width the layout never asked for.
  panels: {
    '@media (prefers-reduced-motion: reduce)': {
      transitionDuration: '0s',
    },
    blockSize: 'var(--tab-panel-height, auto)',
    boxSizing: 'border-box',
    // While the box is smaller than the panel inside it, which is half of
    // every change, the overflow has to go somewhere.
    overflow: 'hidden',
    transitionDuration: motion.durationMedium1,
    transitionProperty: 'block-size',
    transitionTimingFunction: motion.easingEmphasized,
  },
  tab: {
    alignItems: 'center',
    backgroundColor: 'transparent',
    blockSize: '48px',
    borderWidth: 0,
    boxSizing: 'border-box',
    color: colors.onSurfaceVariant,
    cursor: 'pointer',
    display: 'flex',
    // Equal sections: every tab takes the same share of the bar, whatever
    // its label measures.
    flexBasis: 0,
    flexGrow: 1,
    flexShrink: 1,
    fontFamily: typography.titleSmallFont,
    fontSize: typography.titleSmallSize,
    fontWeight: typography.titleSmallWeight,
    justifyContent: 'center',
    letterSpacing: typography.titleSmallTracking,
    lineHeight: typography.titleSmallLineHeight,
    minInlineSize: 0,
    outlineColor: colors.primary,
    // Drawn inside the tab rather than around it, so a focused tab shows its
    // whole ring instead of the half that falls under its neighbours.
    outlineOffset: '-2px',
    outlineStyle: { ':focus-visible': 'solid', default: 'none' },
    outlineWidth: '2px',
    paddingBlock: 0,
    paddingInline: spacing.lg,
    position: 'relative',
    textDecoration: 'none',
    transitionDuration: motion.durationShort2,
    transitionProperty: 'background-color, color',
    transitionTimingFunction: motion.easingStandard,
  },
  // The state layer over the bar's surface: primary for the active tab, on
  // surface for an inactive one at rest and primary once pressed, as the
  // page gives them.
  tabActive: {
    backgroundColor: {
      ':active': `color-mix(in srgb, ${colors.primary} calc(${stateLayerOpacity.pressed} * 100%), transparent)`,
      ':hover': `color-mix(in srgb, ${colors.primary} calc(${stateLayerOpacity.hover} * 100%), transparent)`,
      default: 'transparent',
    },
    color: colors.primary,
  },
  // Applied from the tab's own state rather than through `:disabled`, which
  // never matches: React Aria marks a disabled tab with aria-disabled and
  // data-disabled and leaves the native attribute off, so the pseudo-class
  // has nothing to hook onto. Listed after the active and inactive styles
  // below so it wins over whichever of the two is also applied.
  tabDisabled: {
    backgroundColor: 'transparent',
    color: `color-mix(in srgb, ${colors.onSurface} calc(${stateLayerOpacity.disabledContent} * 100%), ${colors.surface})`,
    cursor: 'not-allowed',
  },
  tabInactive: {
    backgroundColor: {
      ':active': `color-mix(in srgb, ${colors.primary} calc(${stateLayerOpacity.pressed} * 100%), transparent)`,
      ':hover': `color-mix(in srgb, ${colors.onSurface} calc(${stateLayerOpacity.hover} * 100%), transparent)`,
      default: 'transparent',
    },
    color: colors.onSurfaceVariant,
  },
})

const NO_PANELS: ReadonlySet<Key> = new Set()

// Which panels are mounted, by id. React Aria points a selected tab's
// `aria-controls` at the panel it would control whether or not one exists,
// and a strip used on its own — tabs that filter the content below rather
// than swapping a panel — then references an id nothing carries, which axe
// reports as an invalid attribute value. Each panel registers itself here so
// a tab can leave the attribute off when its panel is not there.
const PanelsContext = createContext<ReadonlySet<Key>>(NO_PANELS)

const RegisterPanelContext = createContext<(id: Key) => () => void>(
  () => () => {},
)

// `children` is narrowed to nodes. React Aria also accepts a function there,
// to hand the children the tabs' render state, and that form cannot be
// wrapped in a context provider without calling it first — which would be
// doing React Aria's job with none of its state. Nothing here needs it, so
// the narrower type says so rather than leaving a signature that type-checks
// and then fails to render.
type TabsProps = Omit<RACTabsProps, 'children'> & {
  children?: ReactNode
}

// The label, wrapped so the indicator has its width to follow. Built by a
// call for the same reason as `tabRenderer` below; React Aria hands the
// function the tab's state, and it is passed on when the children are a
// function too.
function tabContent(children: TabProps['children']) {
  return (state: TabRenderProps & { defaultChildren: ReactNode }) => (
    <span {...stylex.props(styles.label)}>
      {typeof children === 'function' ? children(state) : children}
      <RACSelectionIndicator {...stylex.props(styles.indicator)} />
    </span>
  )
}

// React Aria renders a tab with `href` as an anchor and any other as a div,
// and expects a `render` function to return the same element it would have.
// Built by a call rather than written inline at the prop, which is what
// react-perf's no-new-function-as-prop is after; the React Compiler memoises
// the result on its two inputs. See PanelsContext for why the attribute is
// dropped.
function tabRenderer(
  hasPanel: boolean,
  render: TabProps['render'],
): NonNullable<TabProps['render']> {
  return (domProps, state) => {
    const adjusted = hasPanel
      ? domProps
      : { ...domProps, 'aria-controls': undefined }
    if (render !== undefined) {
      return render(adjusted, state)
    }
    if ('href' in adjusted) {
      // oxlint-disable-next-line jsx-a11y/anchor-has-content -- filled by React Aria
      return <a {...adjusted} />
    }
    return <div {...adjusted} />
  }
}

/**
 * A tab bar and its panels. Selection is React Aria's `selectedKey`: pass
 * it with `onSelectionChange` to control it, or `defaultSelectedKey` to let
 * it keep its own. Each `Tabs.Tab` names the `Tabs.Panel` it controls through
 * a shared `id`, and a strip may stand alone without panels.
 *
 * Composed rather than configured by props, because the number of tabs and
 * what each panel holds are the call site's to decide — the parts are
 * `Tabs.List`, `Tabs.Tab`, and `Tabs.Panel`.
 */
function Tabs({ children, ...props }: TabsProps) {
  const [panels, setPanels] = useState<ReadonlySet<Key>>(NO_PANELS)

  const register = useCallback((id: Key) => {
    setPanels((previous) => {
      if (previous.has(id)) {
        return previous
      }
      const next = new Set(previous)
      next.add(id)
      return next
    })
    return () => {
      setPanels((previous) => {
        if (!previous.has(id)) {
          return previous
        }
        const next = new Set(previous)
        next.delete(id)
        return next
      })
    }
  }, [])

  return (
    <RACTabs {...props}>
      <RegisterPanelContext value={register}>
        <PanelsContext value={panels}>{children}</PanelsContext>
      </RegisterPanelContext>
    </RACTabs>
  )
}

function TabsList(props: TabsListProps) {
  return (
    <TabList
      {...props}
      {...mergeStatefulStyles(stylex.props(styles.list), props)}
    />
  )
}

function TabsPanel(props: TabsPanelProps) {
  const register = useContext(RegisterPanelContext)
  const { id } = props

  useEffect(() => {
    if (id === undefined) {
      return undefined
    }
    return register(id)
  }, [id, register])

  return (
    <TabPanel
      {...props}
      {...mergeStatefulStyles(stylex.props(styles.panel), props)}
    />
  )
}

/**
 * An optional box around the panels, which animates its height as one panel
 * gives way to the next. Without it the panels still work; the box around
 * them simply jumps from one height to the other.
 */
function TabsPanels(props: TabsPanelsProps) {
  return (
    <RACTabPanels
      {...props}
      {...mergeStyles(stylex.props(styles.panels), props)}
    />
  )
}

function TabsTab({ children, render, ...props }: TabsTabProps) {
  const panels = useContext(PanelsContext)
  const hasPanel = props.id !== undefined && panels.has(props.id)

  return (
    <Tab
      {...props}
      render={tabRenderer(hasPanel, render)}
      {...mergeStatefulStyles(tabStyles, props)}
    >
      {tabContent(children)}
    </Tab>
  )
}

// StyleX cannot target [data-selected] on the element it is styling, so the
// active tab cannot be chosen in CSS. React Aria's answer is a className that
// is a function of the tab's own state, the same mechanism Chip uses —
// mergeStatefulStyles wraps this one so a tab still keeps a className the call
// site passed.
function tabStyles(state: TabRenderProps) {
  return stylex.props(
    styles.tab,
    state.isSelected ? styles.tabActive : styles.tabInactive,
    state.isDisabled && styles.tabDisabled,
  )
}

Tabs.List = TabsList
Tabs.Panel = TabsPanel
Tabs.Panels = TabsPanels
Tabs.Tab = TabsTab

type TabsListProps = TabListProps<object>

type TabsPanelProps = TabPanelProps

type TabsPanelsProps = Omit<TabPanelsProps<object>, 'children'> & {
  children?: ReactNode
}

type TabsTabProps = TabProps

export type {
  TabsListProps,
  TabsPanelProps,
  TabsPanelsProps,
  TabsProps,
  TabsTabProps,
}

export default Tabs
