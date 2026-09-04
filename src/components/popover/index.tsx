import type { ReactNode, RefObject } from 'react'
import type {
  ClassNameOrFunction,
  DialogProps,
  DialogTriggerProps,
  HeadingProps,
  PopoverRenderProps,
  StyleOrFunction,
  TextProps,
} from 'react-aria-components'

import * as stylex from '@stylexjs/stylex'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useState,
} from 'react'
import {
  Dialog,
  DialogTrigger,
  Heading,
  Popover as RACPopover,
  Text,
} from 'react-aria-components'

import { mergeStatefulStyles, mergeStyles } from '../../styles/merge'
import {
  colors,
  motion,
  radii,
  shadows,
  spacing,
  typography,
} from '../../tokens/design.tokens.stylex'

// The gap between the anchor and the panel, matching `spacing.sm`'s default.
// A number rather than the token, because React Aria computes the position in
// JavaScript and so cannot read a CSS custom property — this is the one place
// in the component where a step of the spacing scale is spelled out. React
// Aria's own default is 8 as well, but the value is this component's decision
// rather than an inherited one.
const DEFAULT_SIDE_OFFSET = 8

// Growing from the edge the panel is anchored by, rather than from its own
// centre, which is what makes it read as coming out of the trigger. React
// Aria reports which side the panel landed on through its render state, so
// the origin follows the placement it actually got rather than the one asked
// for, and the same keyframes serve all four sides.
const scaleIn = stylex.keyframes({
  from: { opacity: 0, transform: 'scale(0.95)' },
  to: { opacity: 1, transform: 'scale(1)' },
})

// Entry only, for the same reason Sheet's is: an exit animation is something
// the panel has to stay mounted through, and a popover is dismissed far more
// often than a modal panel — usually by pressing something else, where a
// lingering panel is in the way of whatever the press was for.
//
// No arrow, and that is M3 rather than an omission: menus and rich tooltips
// both sit as plain rounded surfaces offset from their anchor, with no caret
// drawn between the two. React Aria has an `OverlayArrow` part for designs
// that want one; nothing here renders it.
//
// React Aria's popover is two elements — the positioned panel and the dialog
// inside it — so the styles are split the same way: `popup` and a size on
// the panel, `dialog` on the element that carries the role.
const styles = stylex.create({
  description: {
    boxSizing: 'border-box',
    color: colors.onSurfaceVariant,
    fontFamily: typography.bodyMediumFont,
    fontSize: typography.bodyMediumSize,
    fontWeight: typography.bodyMediumWeight,
    letterSpacing: typography.bodyMediumTracking,
    lineHeight: typography.bodyMediumLineHeight,
    margin: 0,
  },
  // React Aria focuses the dialog itself when nothing inside it takes focus,
  // so it is a focusable element and needs a ring for the case where a
  // keyboard put it there — the same treatment Tabs gives its panel.
  dialog: {
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.sm,
    outlineColor: colors.primary,
    outlineOffset: '2px',
    outlineStyle: { ':focus-visible': 'solid', default: 'none' },
    outlineWidth: '2px',
  },
  fromBottom: { transformOrigin: 'bottom center' },
  fromLeft: { transformOrigin: 'left center' },
  fromRight: { transformOrigin: 'right center' },
  fromTop: { transformOrigin: 'top center' },
  // The width belongs to the size rather than to `popup`, the same split Sheet
  // makes: StyleX merges a property whole, so one unconditional `maxInlineSize`
  // on the shared style would be replaced outright by whichever size applied
  // after it. Capped at the viewport as well, so a panel wider than the
  // screen is narrowed rather than clipped by it.
  md: { maxInlineSize: 'min(320px, 100vw)' },
  popup: {
    animationDuration: motion.durationShort3,
    animationName: scaleIn,
    // Decelerating, so the panel arrives quickly and settles.
    animationTimingFunction: motion.easingEmphasizedDecelerate,
    backgroundColor: colors.surfaceContainer,
    borderRadius: radii.md,
    boxShadow: shadows.elevation2,
    boxSizing: 'border-box',
    color: colors.onSurface,
    // React Aria measures the room left between the anchor and the edge of
    // the viewport and sets it as the panel's max height inline, so the
    // panel scrolls rather than running off the screen.
    overflowY: 'auto',
    padding: spacing.lg,
  },
  sm: { maxInlineSize: 'min(240px, 100vw)' },
  title: {
    boxSizing: 'border-box',
    color: colors.onSurface,
    fontFamily: typography.titleMediumFont,
    fontSize: typography.titleMediumSize,
    fontWeight: typography.titleMediumWeight,
    letterSpacing: typography.titleMediumTracking,
    lineHeight: typography.titleMediumLineHeight,
    margin: 0,
  },
})

type PopoverAlign = 'center' | 'end' | 'start'

type PopoverSide = 'bottom' | 'left' | 'right' | 'top'

type PopoverSize = 'md' | 'sm'

// Which side the panel opens on, and the origin its entry grows from. Keyed
// on the placement React Aria reports rather than the one asked for, since
// the panel flips to the opposite side when there is no room on its own.
const origins = {
  bottom: styles.fromTop,
  center: styles.fromTop,
  left: styles.fromRight,
  right: styles.fromLeft,
  top: styles.fromBottom,
}

// `size` and `modal` are declared on the root, where a reader expects to set
// the shape of the whole popover, but it is `Popover.Content` that has to
// apply them. Through context rather than making the call site repeat them —
// the same arrangement Sheet uses, and worth keeping identical between the
// two panels a consumer is most likely to reach for in the same afternoon.
const PopoverContext = createContext<{ modal: boolean; size: PopoverSize }>({
  modal: false,
  size: 'md',
})

// React Aria points a dialog's `aria-describedby` at its description slot
// only for an alert dialog, on the grounds that an ordinary dialog's content
// is read anyway. A popover's description names what the panel is for, so it
// is pointed at here: the content hands the description an id, and the
// description reports that it is mounted, since an `aria-describedby` with
// nothing at the other end is an invalid reference rather than a harmless one.
const DescriptionContext = createContext<{
  id: string
  register: () => () => void
}>({ id: '', register: () => () => {} })

type PopoverProps = Omit<DialogTriggerProps, 'children'> & {
  children?: ReactNode
  /**
   * Blocks the page behind the panel while it is open, as a dialog would.
   * Off by default: a popover leaves the page interactive, which is the
   * difference from `Sheet`.
   * @default false
   */
  modal?: boolean
  /**
   * Panel width: `sm` caps at 240px, `md` at 320px. Either way the panel is
   * only as wide as its contents, and never wider than the viewport.
   * @default 'md'
   */
  size?: PopoverSize
}

// React Aria names a placement by the side and, along it, the end the panel
// is aligned to — `bottom start`, or `left top` on the sides where the axis
// runs the other way.
function placementOf(side: PopoverSide, align: PopoverAlign) {
  if (align === 'center') {
    return side
  }
  if (side === 'top' || side === 'bottom') {
    return `${side} ${align}` as const
  }
  return `${side} ${align === 'start' ? 'top' : 'bottom'}` as const
}

/**
 * A panel anchored to the control that opened it. Open state is React Aria's:
 * pass `isOpen` with `onOpenChange` to control it, or `defaultOpen` to let it
 * keep its own.
 *
 * Non-modal by design — the page behind stays scrollable and clickable, which
 * is the difference from `Sheet`. Pass `modal` to change that.
 *
 * Composed rather than configured by props, because a popover's contents are
 * arbitrary — the parts are `Popover.Content`, `Popover.Title`, and
 * `Popover.Description`. A `Button` or `IconButton` placed directly inside
 * `Popover` opens it, and one given `slot="close"` inside the content closes
 * it; neither needs a part of its own.
 */
function Popover({
  children,
  modal = false,
  size = 'md',
  ...props
}: PopoverProps) {
  const context = useMemo(() => ({ modal, size }), [modal, size])

  return (
    <DialogTrigger {...props}>
      <PopoverContext value={context}>{children}</PopoverContext>
    </DialogTrigger>
  )
}

/**
 * The panel itself. Everything the popover shows goes in here; the trigger
 * stays outside it, since the trigger lives in the page while this is
 * portalled out to the end of the body.
 *
 * Placement is React Aria's anchor positioning, so the panel flips to the
 * opposite side and shifts along the edge of the viewport on its own rather
 * than being clipped by it.
 */
function PopoverContent({
  align = 'center',
  alignOffset,
  children,
  className,
  container,
  side = 'bottom',
  sideOffset = DEFAULT_SIDE_OFFSET,
  style,
  triggerRef,
  ...props
}: PopoverContentProps) {
  const { modal, size } = useContext(PopoverContext)

  const descriptionId = useId()
  const [described, setDescribed] = useState(false)
  const register = useCallback(() => {
    setDescribed(true)
    return () => {
      setDescribed(false)
    }
  }, [])
  const description = useMemo(
    () => ({ id: descriptionId, register }),
    [descriptionId, register],
  )

  return (
    <RACPopover
      crossOffset={alignOffset}
      isNonModal={!modal}
      offset={sideOffset}
      placement={placementOf(side, align)}
      triggerRef={triggerRef}
      // oxlint-disable-next-line typescript/no-deprecated -- its replacement, UNSAFE_PortalProvider, is not exported by react-aria-components
      UNSTABLE_portalContainer={container}
      {...mergeStatefulStyles(
        (state: PopoverRenderProps) =>
          stylex.props(
            styles.popup,
            styles[size],
            origins[state.placement ?? 'bottom'],
          ),
        { className, style },
      )}
    >
      <Dialog
        aria-describedby={described ? descriptionId : undefined}
        {...props}
        {...stylex.props(styles.dialog)}
      >
        <DescriptionContext value={description}>{children}</DescriptionContext>
      </Dialog>
    </RACPopover>
  )
}

/**
 * Supporting copy under the title. The panel's `aria-describedby` points at
 * it — see DescriptionContext for why that is this component's doing.
 */
function PopoverDescription(props: PopoverDescriptionProps) {
  const { id, register } = useContext(DescriptionContext)

  useEffect(() => register(), [register])

  return (
    <Text
      id={id}
      slot="description"
      {...props}
      {...mergeStyles(stylex.props(styles.description), props)}
    />
  )
}

/**
 * Names the popover. Rendered through React Aria's title slot, which is what
 * points the panel's `aria-labelledby` at it — a popover without one announces
 * itself unnamed.
 */
function PopoverTitle(props: PopoverTitleProps) {
  return (
    <Heading
      slot="title"
      {...props}
      {...mergeStyles(stylex.props(styles.title), props)}
    />
  )
}

Popover.Content = PopoverContent
Popover.Description = PopoverDescription
Popover.Title = PopoverTitle

// The dialog's own props, plus the four that place the panel and its
// styling. Those belong to the positioned panel rather than to the dialog,
// but a call site has no reason to know there are two elements — `className`
// and `style` reach the panel, which is the one worth restyling, and
// everything else lands on the dialog.
type PopoverContentProps = Omit<
  DialogProps,
  'children' | 'className' | 'style'
> & {
  /**
   * Where the panel sits along the side it opens on.
   * @default 'center'
   */
  align?: PopoverAlign
  /** Moves the panel along that side, in pixels. */
  alignOffset?: number
  children?: ReactNode
  /** A function may compute the class from the panel's render state. */
  className?: ClassNameOrFunction<PopoverRenderProps>
  /**
   * Where to portal the panel. Defaults to the end of `<body>`, which is
   * right for an app that sets its StyleX theme on `:root`. An app that
   * scopes the theme to a subtree has to point this at an element inside it,
   * or the popover renders outside the theme and falls back to the tokens'
   * `prefers-color-scheme` default.
   */
  container?: Element
  /**
   * Which side of the trigger the panel opens on. It flips to the opposite
   * side when there is no room.
   * @default 'bottom'
   */
  side?: PopoverSide
  /**
   * The gap between the trigger and the panel, in pixels.
   * @default 8
   */
  sideOffset?: number
  /** A function may compute the style from the panel's render state. */
  style?: StyleOrFunction<PopoverRenderProps>
  /**
   * An element to anchor the panel to other than the trigger that opened it.
   */
  triggerRef?: RefObject<Element | null>
}

type PopoverDescriptionProps = TextProps

type PopoverTitleProps = HeadingProps

export type {
  PopoverAlign,
  PopoverContentProps,
  PopoverDescriptionProps,
  PopoverProps,
  PopoverSide,
  PopoverSize,
  PopoverTitleProps,
}

export default Popover
