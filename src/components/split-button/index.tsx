'use client'

import type { CSSProperties, ReactNode, RefAttributes } from 'react'
import type { Key } from 'react-aria-components'

import * as stylex from '@stylexjs/stylex'
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react'
import { Group as RACGroup } from 'react-aria-components'

import type { ButtonState } from '../../button'
import type { ButtonGroupItem, GroupSize } from '../../button/context'
import type { ButtonProps, ButtonSize } from '../button'

import { ButtonGroupItemContext } from '../../button/context'
import { ChevronDownGlyph } from '../../glyphs'
import { mergeStyles } from '../../styles/merge'
import { radii, spacing } from '../../tokens/design.tokens.stylex'
import Button from '../button'
import Menu from '../menu'

// The split button page's split button: an action and the menu of
// alternatives beside it, drawn as two Buttons 2dp apart — the page calls it
// a special connected button group. The outer ends keep the button's round,
// and the two edges that meet take the inner corner the size gives them,
// 4dp up to the page's M, 8dp at L and 12dp at XL, opening out to 8dp, 12dp
// and 20dp while either half is hovered, focused or pressed. The values are
// the page's size token sets, read from Material Design's own split button
// tokens; the 20dp corner, and the paddings that are not steps of the
// spacing scale, are written out.
//
// **The leading half is a Button**, with an icon, a label or both, and the
// page's own padding either side of what it holds — 12dp and 10dp at XS, for
// instance, where a lone Button takes 16dp on both.
//
// **The trailing half is the menu's trigger**: a Button holding the down
// chevron at the size's icon size, 22dp up to 50dp, with the menu below its
// end edge. The chevron sits a pixel or more toward the start while the menu
// is closed — the page's optical centring, 1dp to 6dp by size — and centres
// once it opens, when the inner corners round off entirely. The page keeps
// the colours as they are while the menu is open and lays the pressed state
// layer over them, which is what React Aria's report of the trigger as
// pressed for as long as its menu is open already draws.
//
// Both halves take the variant the root names, out of Button's four with a
// container — the page gives text no split button.

const styles = stylex.create({
  group: {
    alignItems: 'center',
    boxSizing: 'border-box',
    display: 'inline-flex',
    gap: spacing.xxs,
  },
})

// Each half's corners on each side, set from the half and its state.
const corners = stylex.create({
  shape: (start: string, end: string) => ({
    borderEndEndRadius: end,
    borderEndStartRadius: start,
    borderStartEndRadius: end,
    borderStartStartRadius: start,
  }),
})

// The leading half's padding either side of what it holds.
const leading = stylex.create({
  lg: { paddingInlineEnd: spacing.xl, paddingInlineStart: spacing.xl },
  md: { paddingInlineEnd: spacing.md, paddingInlineStart: spacing.lg },
  xl: { paddingInlineEnd: '48px', paddingInlineStart: '48px' },
  xs: { paddingInlineEnd: '10px', paddingInlineStart: spacing.md },
  xxl: { paddingInlineEnd: '64px', paddingInlineStart: '64px' },
})

// The trailing half's chevron, at the size's icon size.
const chevron = stylex.create({
  lg: { fontSize: '26px' },
  md: { fontSize: '22px' },
  xl: { fontSize: '38px' },
  xs: { fontSize: '22px' },
  xxl: { fontSize: '50px' },
})

// The trailing half's padding: centred once the menu is open, and moved
// toward the start by the page's offset while it is closed.
const trailing = stylex.create({
  padding: (start: string, end: string) => ({
    paddingInlineEnd: end,
    paddingInlineStart: start,
  }),
})

// The trailing half's padding either side of the chevron, and how far the
// chevron sits toward the start while the menu is closed.
const TRAILING_PADDING = { lg: 15, md: 13, xl: 29, xs: 13, xxl: 43 }
const CLOSED_OFFSET = { lg: 2, md: 1, xl: 3, xs: 1, xxl: 6 }

// The corner where the halves meet, at rest and while a half is hovered,
// focused or pressed.
const INNER = {
  lg: radii.xs,
  md: radii.xs,
  xl: radii.sm,
  xs: radii.xs,
  xxl: radii.md,
}

const INNER_ACTIVE = {
  lg: radii.md,
  md: radii.md,
  xl: '20px',
  xs: radii.sm,
  xxl: '20px',
}

type SplitButtonActionProps = Omit<ButtonProps, 'shape' | 'size' | 'variant'> &
  RefAttributes<HTMLAnchorElement | HTMLButtonElement>

type SplitButtonMenuProps = {
  /** What the menu offers, in words: the trailing half is an icon alone. */
  'aria-label': string
  /** The menu's items, as `Menu.Item`s and the rest of Menu's parts. */
  children: ReactNode
  /**
   * Where the menu is portalled to. Point it inside a subtree that scopes its
   * own theme, or it renders outside it.
   */
  container?: Element
  /**
   * Whether the menu starts open, when it keeps its own state.
   * @default false
   */
  defaultOpen?: boolean
  /** Whether the trailing half can be pressed. */
  isDisabled?: boolean
  /** Whether the menu is open, when the call site holds the state. */
  isOpen?: boolean
  /** Called with an item's `id` when it is chosen. */
  onAction?: (key: Key) => void
  /** Called when the menu opens or closes. */
  onOpenChange?: (isOpen: boolean) => void
}

type SplitButtonProps = RefAttributes<HTMLDivElement> & {
  /** What the pair is, in words, for the group around the two halves. */
  'aria-label'?: string
  /** The two halves: a `SplitButton.Action`, then a `SplitButton.Menu`. */
  children: ReactNode
  /** The class for the group around the two halves. */
  className?: string
  /**
   * The size both halves take, as Button's: `xs` to `xxl`.
   * @default 'md'
   */
  size?: ButtonSize
  /** The style for the group around the two halves. */
  style?: CSSProperties
  /**
   * The colour style both halves take: Button's four with a container.
   * @default 'filled'
   */
  variant?: SplitButtonVariant
}

type SplitButtonVariant = 'elevated' | 'filled' | 'outlined' | 'tonal'

// What the root hands its two halves.
const SplitButtonContext = createContext<{
  size: GroupSize
  variant: SplitButtonVariant
}>({ size: 'md', variant: 'filled' })

// Whether a half shows the corner it opens out to: while it is hovered,
// focused or pressed.
function isActive(state: ButtonState) {
  return state.isHovered || state.isFocusVisible || state.isPressed
}

// The leading half's part: its padding, its round start and the inner
// corner at its end.
function leadingItem(size: GroupSize): ButtonGroupItem {
  return {
    shift: 0,
    size,
    styles: (state: ButtonState) => [
      leading[size],
      corners.shape(
        radii.pill,
        isActive(state) ? INNER_ACTIVE[size] : INNER[size],
      ),
    ],
  }
}

/**
 * An action and a menu of alternatives beside it, drawn as one control.
 *
 * ```tsx
 * <SplitButton>
 *   <SplitButton.Action onPress={save}>Label</SplitButton.Action>
 *   <SplitButton.Menu aria-label="More options">
 *     <Menu.Item id="first">First item</Menu.Item>
 *   </SplitButton.Menu>
 * </SplitButton>
 * ```
 *
 * The call site's `className`, `style` and `ref` land on the group around
 * the two halves.
 */
function SplitButton({
  'aria-label': label,
  children,
  className,
  ref,
  size = 'md',
  style,
  variant = 'filled',
}: SplitButtonProps) {
  const context = useMemo(() => ({ size, variant }), [size, variant])

  return (
    <SplitButtonContext value={context}>
      <RACGroup
        aria-label={label}
        ref={ref}
        {...mergeStyles(stylex.props(styles.group), { className, style })}
      >
        {children}
      </RACGroup>
    </SplitButtonContext>
  )
}

/**
 * The split button's leading half: a Button, with an icon, a label or both,
 * in the root's size and variant.
 */
function SplitButtonAction(props: SplitButtonActionProps) {
  const { size, variant } = useContext(SplitButtonContext)
  const item = useMemo(() => leadingItem(size), [size])

  return (
    <ButtonGroupItemContext value={item}>
      <Button {...props} variant={variant} />
    </ButtonGroupItemContext>
  )
}

/**
 * The split button's trailing half: the down chevron, which opens the menu
 * of alternatives its children describe.
 */
function SplitButtonMenu({
  'aria-label': label,
  children,
  container,
  defaultOpen = false,
  isDisabled,
  isOpen,
  onAction,
  onOpenChange,
}: SplitButtonMenuProps) {
  const { size, variant } = useContext(SplitButtonContext)
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
  const item = useMemo(() => trailingItem(size, open), [size, open])

  return (
    <Menu isOpen={open} onOpenChange={changeOpen}>
      <ButtonGroupItemContext value={item}>
        <Button aria-label={label} isDisabled={isDisabled} variant={variant}>
          <ChevronDownGlyph height="1em" width="1em" />
        </Button>
      </ButtonGroupItemContext>
      <Menu.Content align="end" container={container} onAction={onAction}>
        {children}
      </Menu.Content>
    </Menu>
  )
}

// The trailing half's part: its chevron and padding, the inner corner at its
// start, and its round end — and while the menu is open, the chevron centred
// and the inner corner rounded off.
function trailingItem(size: GroupSize, isOpen: boolean): ButtonGroupItem {
  const padding = TRAILING_PADDING[size]
  const offset = isOpen ? 0 : CLOSED_OFFSET[size]

  return {
    shift: 0,
    size,
    styles: (state: ButtonState) => [
      chevron[size],
      trailing.padding(`${padding - offset}px`, `${padding + offset}px`),
      corners.shape(
        isOpen
          ? radii.pill
          : isActive(state)
            ? INNER_ACTIVE[size]
            : INNER[size],
        radii.pill,
      ),
    ],
  }
}

SplitButton.Action = SplitButtonAction
SplitButton.Menu = SplitButtonMenu

export type {
  SplitButtonActionProps,
  SplitButtonMenuProps,
  SplitButtonProps,
  SplitButtonVariant,
}

export { SplitButtonAction, SplitButtonMenu }

export default SplitButton
