'use client'

import type { ReactNode, RefAttributes } from 'react'
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
  sizing,
  spacing,
  stateLayerOpacity,
  typography,
} from '../../tokens/design.tokens.stylex'
import Badge from '../badge'

// The tabs page's primary and secondary tabs. Both are a 48dp bar on the
// surface, divided into equal sections, with a 1dp outline-variant divider
// inside the bar along its bottom edge.
//
// **Primary** draws the active tab in the primary role and, under its label,
// a 3dp primary indicator rounded along its top. The indicator follows the
// label rather than the tab, inset 2dp from the label's ends and never
// shorter than 24dp, which is what the page draws. A primary tab given an
// icon stacks the page's 24dp icon over its label, 2dp apart, and the bar
// grows to the page's 64dp.
//
// **Secondary** is the strip that sits under a primary one. Its active tab
// keeps the on-surface role, and its 2dp primary indicator spans the whole
// tab. An icon sits before the label, 8dp from it, which is the page's
// spacing for an inline icon and material-web's layout for a secondary tab:
// the strip keeps its 48dp under the primary one either way.
//
// A badge sits on the icon where a primary tab stacks one, placed as the
// badges page places it, and 4dp after the label anywhere else.
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
// Windows High Contrast and the rest of the forced-colours modes. Spelled
// here rather than imported, for the reason src/field/styles.ts records: the
// StyleX compiler resolves a constant across files only out of a `.stylex.ts`
// module, and the generated one holds design tokens rather than queries.
const FORCED_COLORS = '@media (forced-colors: active)'

const styles = stylex.create({
  // A badge after the label, which keeps its size while the label narrows.
  badge: {
    flexShrink: 0,
  },
  // The page's 24dp icon, as a font size too so an icon drawn in `em` takes
  // it. The tab's own colour is the icon's, which is what the page gives it
  // in every state of both styles.
  icon: {
    alignItems: 'center',
    blockSize: '24px',
    display: 'inline-flex',
    flexShrink: 0,
    fontSize: '24px',
    inlineSize: '24px',
    justifyContent: 'center',
  },
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
    // Under forced colours, which paint the fill in `Canvas`, the indicator
    // is a `Highlight` border filling the same 3dp instead: it is the only
    // mark of which tab is open, since the active label differs from the
    // others in colour alone, which the mode takes too. The divider under
    // the bar is decoration and stays a shadow.
    borderBlockStartColor: { default: null, [FORCED_COLORS]: 'Highlight' },
    borderBlockStartStyle: { default: null, [FORCED_COLORS]: 'solid' },
    borderBlockStartWidth: { default: null, [FORCED_COLORS]: '3px' },
    borderStartEndRadius: radii.pill,
    borderStartStartRadius: radii.pill,
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
  // A secondary tab's indicator: the page's 2dp, across the whole tab rather
  // than under its label, and square, as material-web and Compose draw it.
  // It slides the way the primary one does, and takes the same border under
  // forced colours.
  indicatorSecondary: {
    '@media (prefers-reduced-motion: reduce)': {
      transitionDuration: '0s',
    },
    backgroundColor: colors.primary,
    blockSize: '2px',
    borderBlockStartColor: { default: null, [FORCED_COLORS]: 'Highlight' },
    borderBlockStartStyle: { default: null, [FORCED_COLORS]: 'solid' },
    borderBlockStartWidth: { default: null, [FORCED_COLORS]: '2px' },
    boxSizing: 'border-box',
    insetBlockEnd: 0,
    insetInline: 0,
    position: 'absolute',
    transitionDuration: motion.durationMedium1,
    transitionProperty: 'translate, inline-size',
    transitionTimingFunction: motion.easingEmphasized,
  },
  // No wider than the tab's own share of the bar, so a long label narrows to
  // fit inside it rather than pushing out past its padding.
  label: {
    alignItems: 'center',
    blockSize: '100%',
    boxSizing: 'border-box',
    display: 'inline-flex',
    justifyContent: 'center',
    maxInlineSize: '100%',
    minInlineSize: 0,
    position: 'relative',
  },
  // A secondary tab's icon before its label, at the page's 8dp.
  labelInline: {
    gap: spacing.sm,
  },
  // A primary tab's icon over its label, 2dp apart as material-web sets them.
  labelStacked: {
    flexDirection: 'column',
    gap: spacing.xxs,
  },
  // The label's text and the badge after it, the page's 4dp apart.
  line: {
    alignItems: 'center',
    boxSizing: 'border-box',
    display: 'inline-flex',
    gap: spacing.xs,
    maxInlineSize: '100%',
    minInlineSize: 0,
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
    // Its ring is drawn inside it rather than around it, as a tab's is: the
    // box the panels share clips at its edge, and a ring drawn outside the
    // panel fell wholly outside that box, so a keyboard reaching a panel
    // with nothing focusable inside it saw no ring at all.
    outlineColor: colors.primary,
    outlineOffset: '-2px',
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
    // every change, the overflow has to go somewhere. Clipped rather than
    // hidden, and 4px past the edge: a focus ring sits 2px outside its
    // control and is 2px wide, so a control flush with the panel's edge
    // keeps its whole ring. `clip` is also not a scroll container, so
    // focusing something inside cannot scroll the box out from under it.
    overflow: 'clip',
    overflowClipMargin: '4px',
    transitionDuration: motion.durationMedium1,
    transitionProperty: 'block-size',
    transitionTimingFunction: motion.easingEmphasized,
  },
  // A minimum rather than a height, so the bar takes its tallest tab's: the
  // list stretches every tab in it to one height, and a bar with one stacked
  // tab is 64dp throughout rather than 64 under that tab alone.
  tab: {
    '@media (prefers-reduced-motion: reduce)': { transitionDuration: '0s' },
    alignItems: 'center',
    backgroundColor: 'transparent',
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
    minBlockSize: sizing.controlMd,
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
  tabActive: {
    backgroundColor: 'transparent',
    color: colors.primary,
  },
  // The state layer over the bar's surface: primary for the active tab, on
  // surface for an inactive one at rest, and primary for either once pressed,
  // as the page gives them. From React Aria's render state rather than
  // `:hover` and `:active`, for Button's reasons — see its header: a hover
  // layer stayed on after a tap, and no pressed layer showed for a press made
  // from the keyboard.
  tabActiveHovered: {
    backgroundColor: `color-mix(in srgb, ${colors.primary} calc(${stateLayerOpacity.hover} * 100%), transparent)`,
  },
  // A secondary tab keeps the on-surface role while active; its indicator is
  // what says which tab is open.
  tabActiveSecondary: {
    backgroundColor: 'transparent',
    color: colors.onSurface,
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
    backgroundColor: 'transparent',
    color: colors.onSurfaceVariant,
  },
  tabInactiveHovered: {
    backgroundColor: `color-mix(in srgb, ${colors.onSurface} calc(${stateLayerOpacity.hover} * 100%), transparent)`,
  },
  tabPressed: {
    backgroundColor: `color-mix(in srgb, ${colors.primary} calc(${stateLayerOpacity.pressed} * 100%), transparent)`,
  },
  // A secondary tab's layers are on surface whether it is active or not.
  tabSecondaryHovered: {
    backgroundColor: `color-mix(in srgb, ${colors.onSurface} calc(${stateLayerOpacity.hover} * 100%), transparent)`,
  },
  tabSecondaryPressed: {
    backgroundColor: `color-mix(in srgb, ${colors.onSurface} calc(${stateLayerOpacity.pressed} * 100%), transparent)`,
  },
  // The page's 64dp, for a primary tab with its icon over its label. No
  // sizing token holds 64.
  tabStacked: {
    minBlockSize: '64px',
  },
  // A label longer than its section, which German, Finnish and Dutch reach
  // with a single word. The word breaks inside itself where it cannot break
  // at a space — hyphenated where the page's language allows — and a label
  // of several words stops at two lines with an ellipsis, which fits the
  // 48dp tab. Clamped rather than hidden, so the name a screen reader reads
  // stays whole.
  text: {
    display: '-webkit-box',
    hyphens: 'auto',
    overflow: 'hidden',
    overflowWrap: 'anywhere',
    textAlign: 'center',
    WebkitBoxOrient: 'vertical',
    WebkitLineClamp: 2,
  },
  // Under a stacked icon the 64dp tab has room for one line: two would make
  // 24 + 2 + 40, past the page's height.
  textStacked: {
    WebkitLineClamp: 1,
  },
})

/** The tabs page's two styles of tab bar. */
type TabsVariant = 'primary' | 'secondary'

// What each style draws a tab's states in. A table rather than a branch per
// state, so the two styles cannot differ in which states they answer.
const VARIANTS = {
  primary: {
    active: styles.tabActive,
    activeHovered: styles.tabActiveHovered,
    inactiveHovered: styles.tabInactiveHovered,
    indicator: styles.indicator,
    pressed: styles.tabPressed,
  },
  secondary: {
    active: styles.tabActiveSecondary,
    activeHovered: styles.tabSecondaryHovered,
    inactiveHovered: styles.tabSecondaryHovered,
    indicator: styles.indicatorSecondary,
    pressed: styles.tabSecondaryPressed,
  },
} satisfies Record<TabsVariant, unknown>

// Which style the bar draws, from the root to every tab in it. A context
// rather than a prop on each tab, since it is the bar's decision and
// repeating it on every tab is how the two drift.
const VariantContext = createContext<TabsVariant>('primary')

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
  /**
   * Which of the page's two tab bars this is: `primary` for the main one,
   * `secondary` for a strip under a primary one.
   * @default 'primary'
   */
  variant?: TabsVariant
}

// The badge, which wraps the icon where a primary tab stacks one and stands
// after the label anywhere else: `true` for the small dot, a number for the
// large badge, and nothing for `false`.
function badgeFor(
  badge: boolean | number | undefined,
  icon?: ReactNode,
): ReactNode {
  if (badge === undefined || badge === false) {
    return icon ?? null
  }
  return (
    <Badge
      count={badge === true ? undefined : badge}
      {...stylex.props(icon === undefined && styles.badge)}
    >
      {icon}
    </Badge>
  )
}

// StyleX cannot target [data-selected] on the element it is styling, so the
// active tab cannot be chosen in CSS. React Aria's answer is a className that
// is a function of the tab's own state, the same mechanism Chip uses —
// mergeStatefulStyles wraps this one so a tab still keeps a className the call
// site passed.
function tabClasses(variant: TabsVariant, stacked: boolean) {
  const roles = VARIANTS[variant]

  return (state: TabRenderProps) =>
    stylex.props(
      styles.tab,
      stacked && styles.tabStacked,
      state.isSelected ? roles.active : styles.tabInactive,
      state.isHovered &&
        (state.isSelected ? roles.activeHovered : roles.inactiveHovered),
      state.isPressed && roles.pressed,
      state.isDisabled && styles.tabDisabled,
    )
}

// The tab's content: the icon, if any, then the label, wrapped so the
// indicator has its width to follow. A badge after the label shares a line
// with it, which is the one wrapper a tab without one goes without. Built by
// a call for the same reason as `tabRenderer` below; React Aria hands the
// function the tab's state, and it is passed on when the children are a
// function too.
function tabContent(
  children: TabProps['children'],
  variant: TabsVariant,
  icon: ReactNode,
  badge: boolean | number | undefined,
) {
  const hasIcon = icon !== undefined && icon !== null
  const stacked = hasIcon && variant === 'primary'
  const after = stacked ? null : badgeFor(badge)
  const indicator = (
    <RACSelectionIndicator {...stylex.props(VARIANTS[variant].indicator)} />
  )

  return (state: TabRenderProps & { defaultChildren: ReactNode }) => {
    const text = (
      <span {...stylex.props(styles.text, stacked && styles.textStacked)}>
        {typeof children === 'function' ? children(state) : children}
      </span>
    )

    return (
      <>
        <span
          {...stylex.props(
            styles.label,
            hasIcon && (stacked ? styles.labelStacked : styles.labelInline),
          )}
        >
          {hasIcon ? (
            <span {...stylex.props(styles.icon)}>
              {stacked ? badgeFor(badge, icon) : icon}
            </span>
          ) : null}
          {after === null ? (
            text
          ) : (
            <span {...stylex.props(styles.line)}>
              {text}
              {after}
            </span>
          )}
          {variant === 'primary' ? indicator : null}
        </span>
        {variant === 'secondary' ? indicator : null}
      </>
    )
  }
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
function Tabs({
  children,
  variant = 'primary',
  ...props
}: RefAttributes<HTMLDivElement> & TabsProps) {
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
        <PanelsContext value={panels}>
          <VariantContext value={variant}>{children}</VariantContext>
        </PanelsContext>
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

function TabsTab({ badge, children, icon, render, ...props }: TabsTabProps) {
  const panels = useContext(PanelsContext)
  const variant = useContext(VariantContext)
  const hasPanel = props.id !== undefined && panels.has(props.id)
  const stacked = icon !== undefined && icon !== null && variant === 'primary'

  return (
    <Tab
      {...props}
      render={tabRenderer(hasPanel, render)}
      {...mergeStatefulStyles(tabClasses(variant, stacked), props)}
    >
      {tabContent(children, variant, icon, badge)}
    </Tab>
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

type TabsTabProps = {
  /**
   * A badge on the tab: `true` for the badges page's small dot, a number for
   * the large badge holding it. It sits on a primary tab's icon, and after
   * the label anywhere else. The badge is hidden from assistive technology,
   * so say what it says in the tab's name too — "First item, 3 new".
   */
  badge?: boolean | number
  /**
   * An icon with the label, at the page's 24dp: over it on a primary tab,
   * whose bar grows to 64dp, and before it on a secondary one. An icon drawn
   * in `em` takes its size from the slot.
   */
  icon?: ReactNode
} & TabProps

export type {
  TabsListProps,
  TabsPanelProps,
  TabsPanelsProps,
  TabsProps,
  TabsTabProps,
  TabsVariant,
}

export { TabsList, TabsPanel, TabsPanels, TabsTab }

export default Tabs
