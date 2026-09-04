import type { ReactNode } from 'react'
import type {
  Key,
  TabsProps as RACTabsProps,
  TabListProps,
  TabPanelProps,
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
import { Tabs as RACTabs, Tab, TabList, TabPanel } from 'react-aria-components'

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
    // the tab strip, which is what React Aria's roving focus hands off to.
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
  // never matches: React Aria marks a disabled tab with aria-disabled and
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
 * A tab strip and its panels. Selection is React Aria's `selectedKey`: pass
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

function TabsTab({ render, ...props }: TabsTabProps) {
  const panels = useContext(PanelsContext)
  const hasPanel = props.id !== undefined && panels.has(props.id)

  return (
    <Tab
      {...props}
      render={tabRenderer(hasPanel, render)}
      {...mergeStatefulStyles(tabStyles, props)}
    />
  )
}

// StyleX cannot target [data-selected] on the element it is styling, so the
// active pill cannot be chosen in CSS. React Aria's answer is a className that
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
Tabs.Tab = TabsTab

type TabsListProps = TabListProps<object>

type TabsPanelProps = TabPanelProps

type TabsTabProps = TabProps

export type { TabsListProps, TabsPanelProps, TabsProps, TabsTabProps }

export default Tabs
