'use client'

import type { ReactNode, RefAttributes } from 'react'
import type {
  ClassNameOrFunction,
  Key,
  MenuItemRenderProps,
  MenuItemProps as RACMenuItemProps,
  StyleOrFunction,
} from 'react-aria-components'

import * as stylex from '@stylexjs/stylex'
import { createContext, useCallback, useContext, useState } from 'react'
import {
  Menu as RACMenu,
  MenuItem as RACMenuItem,
  MenuTrigger as RACMenuTrigger,
  Popover as RACPopover,
  Text,
} from 'react-aria-components'

import type { ButtonState } from '../../button'
import type { FabSize, FabTone } from '../fab'

import { ButtonBase } from '../../button'
import { textOf } from '../../collection/text'
import { fabIconSizes, fabSizes, fabStyles, fabTones } from '../../fab/styles'
import { CloseGlyph } from '../../glyphs'
import { useRipple } from '../../hooks/useRipple'
import { focus } from '../../styles/focus'
import { mergeStatefulStyles } from '../../styles/merge'
import {
  colors,
  motion,
  radii,
  shadows,
  sizing,
  spacing,
  stateLayerOpacity,
  typography,
} from '../../tokens/design.tokens.stylex'

// The FAB menu page's menu: a FAB that opens two to six related actions
// floating above it, in place of a speed dial. Open, the FAB becomes the
// menu's close button — the pages' 56dp circle in the tone itself, with a
// 20dp close mark — and the actions stand in a column 8dp above it, lined up
// on its trailing edge, each a 56dp pill on the tone's container pair with
// 24dp at either end, a 24dp icon 8dp before a title-medium label, 4dp apart
// and raised on the level 3 shadow. The values are the page's, read from
// Material Design's own FAB menu tokens. The three tones are the page's three
// colour sets: the close button takes the tone and the actions its
// container, so the two contrast as the page draws them.
//
// The FAB is the menu's own rather than a child the call site places, as
// Menu's trigger is, because what it draws depends on whether the menu is
// open, and the menu is what knows. Closed, it is Fab at any of its sizes,
// with Fab's styles; it shrinks to the close button's 56dp as the menu opens,
// keeping the corner its layout anchors it by, and its corner rounds and its
// colour deepens over the same medium duration. A reader who asks for
// reduced motion gets the change at once.
//
// React Aria's `MenuTrigger`, `Menu` and `MenuItem` supply the behaviour: the
// FAB's `aria-expanded`, the arrow keys between the actions, Escape and an
// outside press to close, and focus returned to the FAB. The surface is
// React Aria's `Popover` with nothing drawn on it, since each action is a
// container of its own; it arrives over the overlay module's short duration,
// as every popup does, and leaves at once, for the reason that module
// gives.
//
// Under forced colours the shadows go and the containers are painted over,
// so the FAB and each action are drawn as a 1px `ButtonText` rule.

// Windows High Contrast and the rest of the forced-colours modes. Spelled
// here rather than imported, for the reason src/field/styles.ts records: the
// StyleX compiler resolves a constant across files only out of a `.stylex.ts`
// module, and the generated one holds design tokens rather than queries.
const FORCED_COLORS = '@media (forced-colors: active)'

// The actions rise into place from just below where they settle.
const riseIn = stylex.keyframes({
  from: { opacity: 0, transform: 'translateY(8px)' },
  to: { opacity: 1, transform: 'translateY(0)' },
})

const styles = stylex.create({
  // The close button the FAB becomes while the menu is open: the page's
  // 56dp circle. Its corner is half its edge rather than the pill, so it
  // rounds from the FAB's corner over the transition rather than jumping.
  closeButton: {
    blockSize: sizing.controlLg,
    borderRadius: '50%',
    inlineSize: sizing.controlLg,
  },
  closeIcon: {
    fontSize: '20px',
  },
  glyph: {
    blockSize: '1em',
    inlineSize: '1em',
  },
  item: {
    alignItems: 'center',
    // The action's rule under forced colours — see the header.
    borderColor: { default: null, [FORCED_COLORS]: 'ButtonText' },
    borderRadius: radii.pill,
    borderStyle: { default: null, [FORCED_COLORS]: 'solid' },
    borderWidth: { default: 0, [FORCED_COLORS]: '1px' },
    boxShadow: shadows.elevation3,
    boxSizing: 'border-box',
    cursor: 'pointer',
    display: 'flex',
    fontFamily: typography.titleMediumFont,
    fontSize: typography.titleMediumSize,
    fontWeight: typography.titleMediumWeight,
    gap: spacing.sm,
    letterSpacing: typography.titleMediumTracking,
    lineHeight: typography.titleMediumLineHeight,
    minBlockSize: sizing.controlLg,
    minInlineSize: sizing.controlLg,
    outlineStyle: 'none',
    overflow: 'hidden',
    paddingInline: spacing.xl,
    position: 'relative',
    // One line, as the page draws every action. Allowed to wrap, a label
    // made the surface's width depend on where React Aria placed it, which
    // moved it, which changed the width again.
    whiteSpace: 'nowrap',
  },
  // The page gives no disabled action; one takes the 12% and 38% every
  // disabled container takes, and drops its shadow.
  itemDisabled: {
    backgroundColor: `color-mix(in srgb, ${colors.onSurface} calc(${stateLayerOpacity.disabledContainer} * 100%), ${colors.surface})`,
    borderColor: { default: null, [FORCED_COLORS]: 'GrayText' },
    boxShadow: 'none',
    color: {
      default: `color-mix(in srgb, ${colors.onSurface} calc(${stateLayerOpacity.disabledContent} * 100%), ${colors.surface})`,
      [FORCED_COLORS]: 'GrayText',
    },
    cursor: 'not-allowed',
  },
  // The ring for a keyboard, drawn outside the pill as Fab's is.
  itemFocused: {
    outlineColor: { default: null, [FORCED_COLORS]: 'Highlight' },
    outlineOffset: '2px',
    outlineStyle: 'solid',
    outlineWidth: '2px',
  },
  // The menu inside the surface: the actions in a column on its trailing
  // edge, the page's 4dp apart.
  menu: {
    alignItems: 'flex-end',
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.xs,
    outlineStyle: 'none',
  },
  // The surface, with nothing drawn on it: each action is its own container.
  popover: {
    animationDuration: {
      '@media (prefers-reduced-motion: reduce)': '0s',
      default: motion.durationShort3,
    },
    animationName: riseIn,
    animationTimingFunction: motion.easingEmphasizedDecelerate,
    boxSizing: 'border-box',
    outlineStyle: 'none',
  },
  // The FAB's change into the close button and back.
  trigger: {
    transitionDuration: {
      '@media (prefers-reduced-motion: reduce)': '0s',
      default: motion.durationMedium1,
    },
    transitionProperty:
      'background-color, block-size, border-radius, color, inline-size',
    transitionTimingFunction: motion.easingEmphasized,
  },
})

// What a tone draws its actions in: the container pair, as the close button
// takes the tone itself.
const ToneContext = createContext<FabTone>('primary')

type FabMenuItemProps = Omit<
  RACMenuItemProps,
  'children' | 'className' | 'style'
> & {
  /** The action's name, drawn as its label. */
  children: ReactNode
  /** A function may compute the class from the action's render state. */
  className?: ClassNameOrFunction<MenuItemRenderProps>
  /** An icon before the label, at the page's 24px. */
  icon?: ReactNode
  /** A function may compute the style from the action's render state. */
  style?: StyleOrFunction<MenuItemRenderProps>
}

type FabMenuProps = {
  /**
   * What the FAB does, in words: an icon alone has no name, and the menu
   * takes its name from the FAB that opens it.
   */
  'aria-label': string
  /** The actions, as `FabMenu.Item`s — the page asks for two to six. */
  children: ReactNode
  /**
   * A function may compute the class from the FAB's render state. It lands
   * on the FAB, which is what a layout positions.
   */
  className?: ClassNameOrFunction<ButtonState>
  /**
   * Where the actions are portalled to. Point it inside a subtree that
   * scopes its own theme, or they render outside it.
   */
  container?: Element
  /**
   * Whether the menu starts open, when it keeps its own state.
   * @default false
   */
  defaultOpen?: boolean
  /** The FAB's icon while the menu is closed. */
  icon: ReactNode
  /** Whether the menu is open, when the call site holds the state. */
  isOpen?: boolean
  /** Called with an action's `id` when it is chosen. */
  onAction?: (key: Key) => void
  /** Called when the menu opens or closes. */
  onOpenChange?: (isOpen: boolean) => void
  /**
   * The FAB's size while the menu is closed, as Fab's: `md` 56px, `lg` 80px
   * or `xl` 96px. Open, it is the close button's 56px whatever it was.
   * @default 'md'
   */
  size?: FabSize
  /** A function may compute the style from the FAB's render state. */
  style?: StyleOrFunction<ButtonState>
  /**
   * The page's three colour sets: the close button takes the tone and the
   * actions its container pair.
   * @default 'primary'
   */
  tone?: FabTone
} & RefAttributes<HTMLButtonElement>

/**
 * A FAB that opens a column of related actions above it, and closes them
 * again. The actions are `FabMenu.Item`s.
 *
 * ```tsx
 * <FabMenu aria-label="Label" icon={<PlusIcon />}>
 *   <FabMenu.Item icon={<FirstIcon />} id="first">
 *     First item
 *   </FabMenu.Item>
 *   <FabMenu.Item icon={<SecondIcon />} id="second">
 *     Second item
 *   </FabMenu.Item>
 * </FabMenu>
 * ```
 *
 * The call site's `className`, `style` and `ref` land on the FAB.
 */
function FabMenu({
  'aria-label': label,
  children,
  className,
  container,
  defaultOpen = false,
  icon,
  isOpen,
  onAction,
  onOpenChange,
  ref,
  size = 'md',
  style,
  tone = 'primary',
}: FabMenuProps) {
  const [ownOpen, setOwnOpen] = useState(defaultOpen)
  const open = isOpen ?? ownOpen
  const changeOpen = useCallback(
    (next: boolean) => {
      if (isOpen === undefined) {
        setOwnOpen(next)
      }
      onOpenChange?.(next)
    },
    [isOpen, onOpenChange],
  )

  return (
    <ToneContext value={tone}>
      <RACMenuTrigger isOpen={open} onOpenChange={changeOpen}>
        <ButtonBase
          aria-label={label}
          classes={triggerClasses(open, size, tone)}
          className={className}
          ref={ref}
          style={style}
        >
          <span
            {...stylex.props(
              fabStyles.icon,
              open ? styles.closeIcon : fabIconSizes[size],
            )}
          >
            {open ? <CloseGlyph {...stylex.props(styles.glyph)} /> : icon}
          </span>
        </ButtonBase>
        <RACPopover
          offset={8}
          placement="top end"
          // oxlint-disable-next-line typescript/no-deprecated -- its replacement, UNSAFE_PortalProvider, is not exported by react-aria-components
          UNSTABLE_portalContainer={container}
          {...stylex.props(styles.popover)}
        >
          <RACMenu onAction={onAction} {...stylex.props(styles.menu)}>
            {children}
          </RACMenu>
        </RACPopover>
      </RACMenuTrigger>
    </ToneContext>
  )
}

/**
 * One action: a pill holding an icon and a label, on the menu's tone.
 * Choosing it closes the menu.
 */
function FabMenuItem({
  children,
  icon,
  onContextMenu,
  onPointerCancel,
  onPointerDown,
  onPointerLeave,
  onPointerUp,
  textValue,
  ...props
}: FabMenuItemProps & RefAttributes<HTMLDivElement>) {
  const tone = useContext(ToneContext)
  // The press ripple Menu's items draw — see MenuItem there.
  const ripple = useRipple<HTMLDivElement>(
    true,
    {
      onContextMenu,
      onPointerCancel,
      onPointerDown,
      onPointerLeave,
      onPointerUp,
    },
    true,
  )

  return (
    <RACMenuItem
      textValue={textValue ?? textOf(children)}
      {...ripple.handlers}
      {...props}
      {...mergeStatefulStyles(itemClasses(tone), props)}
    >
      {icon === undefined ? null : (
        <span {...stylex.props(fabStyles.icon, fabIconSizes.md)}>{icon}</span>
      )}
      <Text slot="label">{children}</Text>
      {ripple.surface}
    </RACMenuItem>
  )
}

// An action's classes, from React Aria's render state: the tone's container
// pair, and the layers over it. Built by a call rather than written inline at
// the prop, which is what react-perf's no-new-function-as-prop is after.
function itemClasses(tone: FabTone) {
  return (state: MenuItemRenderProps) =>
    stylex.props(
      styles.item,
      fabTones.tonal[tone],
      state.isHovered && fabStyles.hovered,
      state.isFocused && fabStyles.focused,
      state.isFocusVisible && styles.itemFocused,
      state.isPressed && fabStyles.pressed,
      state.isDisabled && styles.itemDisabled,
    )
}

// The FAB's classes: Fab's own while the menu is closed, the close button's
// while it is open. A press layer is drawn only while closed — React Aria
// reports the FAB pressed for as long as its menu is open.
function triggerClasses(isOpen: boolean, size: FabSize, tone: FabTone) {
  return (state: ButtonState) =>
    stylex.props(
      fabStyles.base,
      focus.ring,
      styles.trigger,
      isOpen ? fabTones.filled[tone] : fabTones.tonal[tone],
      isOpen ? styles.closeButton : fabSizes[size],
      state.isHovered && fabStyles.hovered,
      state.isFocusVisible && fabStyles.focused,
      !isOpen && state.isPressed && fabStyles.pressed,
      state.isDisabled && fabStyles.disabled,
    )
}

FabMenu.Item = FabMenuItem

export type { FabMenuItemProps, FabMenuProps }

export { FabMenuItem }

export default FabMenu
