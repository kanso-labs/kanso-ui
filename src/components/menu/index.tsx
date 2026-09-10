import type { ComponentProps, ReactElement, ReactNode } from 'react'
import type {
  MenuItemRenderProps,
  PopoverRenderProps,
  MenuItemProps as RACMenuItemProps,
  MenuLoadMoreItemProps as RACMenuLoadMoreItemProps,
  MenuProps as RACMenuProps,
  MenuSectionProps as RACMenuSectionProps,
  MenuTriggerProps as RACMenuTriggerProps,
} from 'react-aria-components'

import * as stylex from '@stylexjs/stylex'
import {
  Header,
  Keyboard,
  Menu as RACMenu,
  MenuItem as RACMenuItem,
  MenuLoadMoreItem as RACMenuLoadMoreItem,
  MenuSection as RACMenuSection,
  MenuTrigger as RACMenuTrigger,
  Popover as RACPopover,
  SubmenuTrigger as RACSubmenuTrigger,
  Text,
} from 'react-aria-components'

import type { OverlayAlign, OverlaySide } from '../../styles/overlay'

import { ChevronEndGlyph } from '../../glyphs'
import { RowContent } from '../../row'
import { rowStyles } from '../../row/styles'
import { mergeStatefulStyles, mergeStyles } from '../../styles/merge'
import { overlay, placementOf, popupOrigin } from '../../styles/overlay'
import {
  colors,
  radii,
  spacing,
  typography,
} from '../../tokens/design.tokens.stylex'
import ProgressIndicator from '../progress-indicator'
import Separator from '../separator'

// The menus page's menu: a surface between 112 and 280 wide with a 4dp
// corner and 8dp above and below its items, holding rows of the row module's
// menu variant — 48dp tall, a label-large label, tertiary container when
// selected. The surface itself is the overlay module's, shared with Popover
// and Sheet, with the two things the menus page decides differently applied
// over it: the corner, which is the extra-small step rather than the
// medium one every other overlay takes, and the container colour, which is
// the Expressive column's surface container low rather than the baseline's
// surface container.
//
// Six parts, because everything a menu holds takes arbitrary content:
// `Menu.Content`, `Menu.Item`, `Menu.Section`, `Menu.Separator`,
// `Menu.Submenu` and `Menu.LoadMore`. A `Button` or `IconButton` placed
// directly inside `Menu` is the trigger, wired through React Aria's context
// rather than a part of ours — the same arrangement Sheet and Popover use.
//
// Four things are worth knowing about how this maps onto React Aria.
//
// **The item's styles are a function of its render state.** StyleX cannot
// target `[data-selected]` on the element it is styling, so selection,
// disabled and the rest are read from the state React Aria hands the
// `className` function, wrapped in `mergeStatefulStyles` so a call site's own
// `className` survives.
//
// **A shortcut goes through React Aria's `Keyboard` slot**, and the label
// through its `Text` slot. The second is what makes the first work: React
// Aria points the item's `aria-labelledby` at the labelled text, so a screen
// reader reads the label alone and announces the keystroke separately. Left
// as plain content, the item's name is its whole text and the shortcut is
// read as part of what the item does. The keycap itself is the library's.
//
// **A submenu's arrow is drawn from render state, not from a prop.** React
// Aria reports `hasSubmenu` on the item inside a `SubmenuTrigger`, so an item
// that opens one gets the chevron without the call site saying so twice. The
// glyph carries no direction of its own, so the style mirrors it under a
// right-to-left writing mode.
//
// **A separator needs no slot from the call site.** React Aria's menu
// provides the separator context, which is what `Menu.Separator` picks up —
// that is why Separator moved onto React Aria in Phase 0. What is added here
// is the menus page's 8dp either side of the rule.

const MENU_MIN = '112px'
const MENU_MAX = '280px'

const styles = stylex.create({
  // The chevron on an item that opens a submenu. Mirrored under a
  // right-to-left writing mode, since it points further in rather than right.
  chevron: {
    blockSize: '20px',
    inlineSize: '20px',
    transform: { ':dir(rtl)': 'scaleX(-1)', default: 'none' },
  },
  // The surface's own decisions, over the shared overlay's: the menus page's
  // 4dp corner, the Expressive column's container colour, the page's 8dp
  // above and below the items, and its width range.
  content: {
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: radii.xs,
    maxInlineSize: MENU_MAX,
    minInlineSize: MENU_MIN,
    paddingBlock: spacing.sm,
  },
  // A section's heading, at the item's own inline padding so it lines up
  // with the labels under it. The menus page names no subhead, so the type
  // is the lists page's — title-small in on surface variant — and it takes
  // more room above than below so it reads as belonging to what follows.
  header: {
    boxSizing: 'border-box',
    color: colors.onSurfaceVariant,
    fontFamily: typography.titleSmallFont,
    fontSize: typography.titleSmallSize,
    fontWeight: typography.titleSmallWeight,
    letterSpacing: typography.titleSmallTracking,
    lineHeight: typography.titleSmallLineHeight,
    paddingBlockEnd: spacing.xxs,
    paddingBlockStart: spacing.md,
    paddingInline: spacing.lg,
  },
  // The row shown while more items are being fetched: the ring on its own,
  // centred, in a row the height of an item.
  loading: {
    alignItems: 'center',
    boxSizing: 'border-box',
    display: 'flex',
    justifyContent: 'center',
    minBlockSize: '48px',
  },
  // The element with the menu role inside the surface, and the focus ring it
  // shows when a keyboard puts focus on the menu itself rather than an item.
  menu: {
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    outlineStyle: 'none',
  },
  // The menus page's divider: the rule with 8dp either side of it.
  separator: {
    marginBlock: spacing.sm,
  },
  // The shortcut, in the muted role so the label stays the thing being read.
  shortcut: {
    color: colors.onSurfaceVariant,
  },
})

type MenuAlign = OverlayAlign

type MenuContentProps<T extends object = object> = Omit<
  RACMenuProps<T>,
  'className' | 'style'
> & {
  /** Where the menu lines up along that side. @default 'start' */
  align?: MenuAlign
  /** Moves the menu along that side, in pixels. */
  alignOffset?: number
  /** A function may compute the class from the menu's render state. */
  className?: RACMenuProps<T>['className']
  /**
   * Where to portal the menu. Defaults to the end of `<body>`, which is right
   * for an app that sets its StyleX theme on `:root`. An app that scopes the
   * theme to a subtree has to point this at an element inside it, or the menu
   * renders outside the theme and falls back to the tokens'
   * `prefers-color-scheme` default.
   */
  container?: Element
  /** Which side of the trigger the menu opens on. @default 'bottom' */
  side?: MenuSide
  /** How far the menu sits from the trigger, in pixels. @default 8 */
  sideOffset?: number
  /** A function may compute the style from the menu's render state. */
  style?: RACMenuProps<T>['style']
}

type MenuItemProps<T extends object = object> = {
  /** The item's label — what it does. */
  children?: ReactNode
  /** A function may compute the class from the item's render state. */
  className?: RACMenuItemProps<T>['className']
  /** Content before the label, usually an icon. */
  leading?: ReactNode
  /**
   * The keystroke that runs the item, drawn as a keycap at the end. Goes
   * through React Aria's keyboard slot, so a screen reader announces it
   * apart from the label rather than reading the two as one name.
   */
  shortcut?: ReactNode
  /** A function may compute the style from the item's render state. */
  style?: RACMenuItemProps<T>['style']
  /** Content after the label, before the shortcut. */
  trailing?: ReactNode
} & Omit<RACMenuItemProps<T>, 'children' | 'className' | 'style'>

type MenuLoadMoreProps = Omit<RACMenuLoadMoreItemProps, 'children'> & {
  /**
   * What the row says while it is loading. Read by a screen reader; the ring
   * itself carries no text.
   * @default 'Loading more'
   */
  label?: string
}

// `children` is optional here where React Aria makes it required, so the
// type reads the way Sheet's and Popover's do: a root that composes rather
// than one that has to be handed something. Sheet does the same for the same
// reason.
type MenuProps = Omit<RACMenuTriggerProps, 'children'> & {
  /** The trigger, then the `Menu.Content` it opens. */
  children?: ReactNode
}

type MenuSectionProps<T extends object = object> = Omit<
  RACMenuSectionProps<T>,
  'children'
> & {
  /**
   * The items in the section. A section built from data puts React Aria's
   * `Collection` in here rather than a render function, since the header is
   * an element beside them.
   */
  children?: ReactNode
  /**
   * The section's heading, rendered through React Aria's header so the
   * section is named by it. A section without one is a group with no name.
   */
  header?: ReactNode
}

type MenuSeparatorProps = Omit<ComponentProps<typeof Separator>, 'orientation'>

type MenuSide = OverlaySide

type MenuSubmenuProps = {
  /**
   * The item that opens the submenu, then the `Menu.Content` it opens.
   * Exactly those two, in that order.
   */
  children: ReactElement[]
  /**
   * How long the pointer rests on the item before the submenu opens, in
   * milliseconds.
   * @default 200
   */
  delay?: number
}

// What the item draws, from React Aria's render state. Built by a call
// rather than written inline at the prop, which is what react-perf's
// no-new-function-as-prop is after; the React Compiler memoises the result
// on its inputs.
//
// The render state decides two things: the chevron, which an item inside a
// SubmenuTrigger gets without the call site asking twice, and the supporting
// line's colour, which the row module takes from whether the row is selected
// or disabled.
function itemContent(
  children: ReactNode,
  leading: ReactNode,
  shortcut: ReactNode,
  trailing: ReactNode,
) {
  return (state: MenuItemRenderProps) => (
    <RowContent
      isDisabled={state.isDisabled}
      isSelected={state.isSelected}
      leading={leading}
      trailing={trailingOf(state, shortcut, trailing)}
      variant="menu"
    >
      <Text slot="label">{children}</Text>
    </RowContent>
  )
}

// StyleX cannot target `[data-selected]` on the element it is styling, so an
// item's state comes from the render state React Aria hands its className.
// The order matters: `disabled` is applied last so it wins over both the
// interactive and the selected branches, and StyleX replaces a property
// whole, so it takes their hover states with it.
function itemStyles(state: MenuItemRenderProps) {
  return stylex.props(
    rowStyles.base,
    rowStyles.menu,
    rowStyles.interactive,
    state.isSelected && rowStyles.selectedMenu,
    state.isDisabled && rowStyles.disabled,
  )
}

/**
 * A list of actions opened from a control. Open state is React Aria's: pass
 * `isOpen` with `onOpenChange` to control it, or `defaultOpen` to let it keep
 * its own.
 *
 * A `Button` or `IconButton` placed directly inside opens it; everything the
 * menu shows goes in `Menu.Content`, since the trigger lives in the page
 * while the menu is portalled out to the end of the body.
 *
 * ```tsx
 * <Menu>
 *   <Button>Open</Button>
 *   <Menu.Content aria-label="Label">
 *     <Menu.Item id="first">First item</Menu.Item>
 *   </Menu.Content>
 * </Menu>
 * ```
 */
function Menu({ children, ...props }: MenuProps) {
  return <RACMenuTrigger {...props}>{children}</RACMenuTrigger>
}

/**
 * The menu itself, and the surface it is drawn on. React Aria names it after
 * the control that opened it, so `aria-label` here is ignored — name the
 * trigger instead.
 *
 * The call site's `className` and `style` land on the surface, which is the
 * element a layout positions.
 */
function MenuContent<T extends object = object>({
  align = 'start',
  alignOffset,
  className,
  container,
  side = 'bottom',
  sideOffset = 8,
  style,
  ...props
}: MenuContentProps<T>) {
  return (
    <RACPopover
      crossOffset={alignOffset}
      offset={sideOffset}
      placement={placementOf(side, align)}
      // oxlint-disable-next-line typescript/no-deprecated -- its replacement, UNSAFE_PortalProvider, is not exported by react-aria-components
      UNSTABLE_portalContainer={container}
      {...mergeStatefulStyles(surfaceStyles, {})}
    >
      <RACMenu<T>
        {...props}
        {...mergeStatefulStyles(stylex.props(styles.menu), {
          className,
          style,
        })}
      />
    </RACPopover>
  )
}

/**
 * One action. Its slots are the row's: `leading` before the label, the label
 * as children, and `trailing` after it, with `shortcut` at the end. An item
 * that opens a submenu draws the chevron itself.
 */
function MenuItem<T extends object = object>({
  children,
  leading,
  shortcut,
  trailing,
  ...props
}: MenuItemProps<T>) {
  return (
    <RACMenuItem {...props} {...mergeStatefulStyles(itemStyles, props)}>
      {itemContent(children, leading, shortcut, trailing)}
    </RACMenuItem>
  )
}

/**
 * The row shown while more items are being fetched. React Aria calls
 * `onLoadMore` when it comes into view, and draws it only while `isLoading`.
 */
function MenuLoadMore({ label = 'Loading more', ...props }: MenuLoadMoreProps) {
  return (
    <RACMenuLoadMoreItem
      {...props}
      {...mergeStyles(stylex.props(styles.loading), props)}
    >
      <ProgressIndicator
        aria-label={label}
        isIndeterminate
        size="20px"
        variant="circular"
      />
    </RACMenuLoadMoreItem>
  )
}

/**
 * A named group of items. `header` names it, and is what a screen reader
 * reads before the items inside.
 */
function MenuSection<T extends object = object>({
  children,
  header,
  ...props
}: MenuSectionProps<T>) {
  return (
    <RACMenuSection {...props}>
      {header === undefined ? null : (
        <Header {...stylex.props(styles.header)}>{header}</Header>
      )}
      {children}
    </RACMenuSection>
  )
}

/**
 * A rule between groups of items. It takes its role from the menu around it,
 * so it needs no slot from the call site.
 */
function MenuSeparator(props: MenuSeparatorProps) {
  return (
    <Separator
      {...props}
      {...mergeStyles(stylex.props(styles.separator), props)}
    />
  )
}

/**
 * An item that opens a menu of its own. Takes exactly two children: the
 * `Menu.Item` that opens it, then the `Menu.Content` it opens.
 */
function MenuSubmenu(props: MenuSubmenuProps) {
  return <RACSubmenuTrigger {...props} />
}

// The surface grows from the edge it is anchored by, which is what makes it
// read as coming out of the trigger. Built by a call rather than written
// inline at the prop, which is what react-perf's no-new-function-as-prop is
// after.
function surfaceStyles(state: PopoverRenderProps) {
  return stylex.props(
    overlay.popup,
    styles.content,
    popupOrigin(state.placement),
  )
}

/** What sits after the label: the call site's content, then the shortcut or
 * the submenu's chevron. */
function trailingOf(
  state: MenuItemRenderProps,
  shortcut: ReactNode,
  trailing: ReactNode,
) {
  if (state.hasSubmenu) {
    return (
      <>
        {trailing}
        <ChevronEndGlyph {...stylex.props(styles.chevron)} />
      </>
    )
  }
  if (shortcut === undefined && trailing === undefined) {
    return undefined
  }
  return (
    <>
      {trailing}
      {shortcut === undefined ? null : (
        <Keyboard {...stylex.props(styles.shortcut)}>{shortcut}</Keyboard>
      )}
    </>
  )
}

Menu.Content = MenuContent
Menu.Item = MenuItem
Menu.LoadMore = MenuLoadMore
Menu.Section = MenuSection
Menu.Separator = MenuSeparator
Menu.Submenu = MenuSubmenu

export type {
  MenuAlign,
  MenuContentProps,
  MenuItemProps,
  MenuLoadMoreProps,
  MenuProps,
  MenuSectionProps,
  MenuSeparatorProps,
  MenuSide,
  MenuSubmenuProps,
}

export default Menu
