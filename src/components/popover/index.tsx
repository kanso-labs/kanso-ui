import type {
  PopoverCloseProps as BaseUIPopoverCloseProps,
  PopoverDescriptionProps as BaseUIPopoverDescriptionProps,
  PopoverPopupProps as BaseUIPopoverPopupProps,
  PopoverPortalProps as BaseUIPopoverPortalProps,
  PopoverPositionerProps as BaseUIPopoverPositionerProps,
  PopoverRootProps as BaseUIPopoverRootProps,
  PopoverTitleProps as BaseUIPopoverTitleProps,
  PopoverTriggerProps as BaseUIPopoverTriggerProps,
} from '@base-ui/react/popover'
import type { ReactNode } from 'react'

import { Popover as BaseUIPopover } from '@base-ui/react/popover'
import * as stylex from '@stylexjs/stylex'
import { createContext, useContext } from 'react'

import { mergeStatefulStyles } from '../../styles/merge'
import {
  colors,
  motion,
  radii,
  shadows,
  spacing,
  typography,
} from '../../tokens/design.tokens.stylex'

// The gap between the anchor and the panel, matching `spacing.sm`'s default.
// A number rather than the token, because Floating UI computes the position in
// JavaScript and so cannot read a CSS custom property — this is the one place
// in the component where a step of the spacing scale is spelled out. Base UI's
// own default is 0, which leaves the panel touching the control that opened it.
const DEFAULT_SIDE_OFFSET = 8

// Growing from the corner the panel is anchored by, rather than from its own
// centre, which is what makes it read as coming out of the trigger. Base UI
// publishes that corner as `--transform-origin` on the positioner, so the same
// two keyframes serve all four sides and neither the animation nor the surface
// has to know which one it landed on.
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
// drawn between the two. Base UI has a `Popover.Arrow` part for designs that
// want one; nothing here renders it.
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
  // The width belongs to the size rather than to `popup`, the same split Sheet
  // makes: StyleX merges a property whole, so one unconditional `maxInlineSize`
  // on the shared style would be replaced outright by whichever size applied
  // after it.
  md: { maxInlineSize: 'min(320px, var(--available-width, 100vw))' },
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
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.sm,
    // Base UI measures the room left between the anchor and the edge of the
    // viewport and publishes it here. Without this a tall panel runs off the
    // screen, since the positioner moves the panel to fit but never shrinks it.
    maxBlockSize: 'var(--available-height, none)',
    // Base UI focuses the panel itself when it was opened by touch, so it is a
    // focusable element and needs a ring for the case where a keyboard put it
    // there — the same treatment Tabs gives its panel.
    outlineColor: colors.primary,
    outlineOffset: '2px',
    outlineStyle: { ':focus-visible': 'solid', default: 'none' },
    outlineWidth: '2px',
    overflowY: 'auto',
    padding: spacing.lg,
    transformOrigin: 'var(--transform-origin)',
  },
  sm: { maxInlineSize: 'min(240px, var(--available-width, 100vw))' },
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

type PopoverSize = 'md' | 'sm'

// `size` is declared on the root, where a reader expects to set the shape of
// the whole popover, but it is `Popover.Content` that has to apply it. One
// string through context rather than making the call site repeat it on both —
// the same arrangement Sheet uses, and worth keeping identical between the two
// panels a consumer is most likely to reach for in the same afternoon.
const PopoverSizeContext = createContext<PopoverSize>('md')

// `children` is narrowed to nodes for the same reason Sheet's is: Base UI also
// accepts a function there, to hand the panel the payload passed by whichever
// trigger opened it, and that form cannot be wrapped in a context provider
// without calling it first. Nothing here needs the payload, so the narrower
// type says so rather than leaving a signature that type-checks and then fails
// to render.
type PopoverProps = Omit<BaseUIPopoverRootProps, 'children'> & {
  children?: ReactNode
  /**
   * Panel width: `sm` caps at 240px, `md` at 320px. Either way the panel is
   * only as wide as its contents, and never wider than the room left beside
   * the anchor.
   * @default 'md'
   */
  size?: PopoverSize
}

/**
 * A panel anchored to the control that opened it. Open state is Base UI's:
 * pass `open` with `onOpenChange` to control it, or `defaultOpen` to let it
 * keep its own.
 *
 * Non-modal by design — the page behind stays scrollable and clickable, which
 * is the difference from `Sheet`. Pass `modal` to change that.
 *
 * Composed rather than configured by props, because a popover's contents are
 * arbitrary — the parts are `Popover.Trigger`, `Popover.Content`,
 * `Popover.Title`, `Popover.Description`, and `Popover.Close`.
 */
function Popover({ children, size = 'md', ...props }: PopoverProps) {
  return (
    <BaseUIPopover.Root {...props}>
      <PopoverSizeContext value={size}>{children}</PopoverSizeContext>
    </BaseUIPopover.Root>
  )
}

/**
 * Closes the popover when pressed. Carries no styling of its own, so give it
 * the control it should be through `render` — a `Button`, an `IconButton`.
 */
function PopoverClose(props: PopoverCloseProps) {
  return <BaseUIPopover.Close {...props} />
}

/**
 * The panel itself. Everything the popover shows goes in here;
 * `Popover.Trigger` stays outside it, since the trigger lives in the page
 * while this is portalled out to the end of the body.
 *
 * Placement is Base UI's anchor positioning, so the panel flips to the
 * opposite side and shifts along the edge of the viewport on its own rather
 * than being clipped by it.
 */
function PopoverContent({
  align,
  alignOffset,
  anchor,
  children,
  container,
  side,
  sideOffset = DEFAULT_SIDE_OFFSET,
  ...props
}: PopoverContentProps) {
  const size = useContext(PopoverSizeContext)

  return (
    <BaseUIPopover.Portal container={container}>
      <BaseUIPopover.Positioner
        align={align}
        alignOffset={alignOffset}
        anchor={anchor}
        side={side}
        sideOffset={sideOffset}
      >
        <BaseUIPopover.Popup
          {...props}
          {...mergeStatefulStyles(
            stylex.props(styles.popup, styles[size]),
            props,
          )}
        >
          {children}
        </BaseUIPopover.Popup>
      </BaseUIPopover.Positioner>
    </BaseUIPopover.Portal>
  )
}

/**
 * Supporting copy under the title. Rendered through Base UI's description
 * part, which points the panel's `aria-describedby` at it.
 */
function PopoverDescription(props: PopoverDescriptionProps) {
  return (
    <BaseUIPopover.Description
      {...props}
      {...mergeStatefulStyles(stylex.props(styles.description), props)}
    />
  )
}

/**
 * Names the popover. Rendered through Base UI's title part, which is what
 * points the panel's `aria-labelledby` at it — a popover without one announces
 * itself unnamed.
 */
function PopoverTitle(props: PopoverTitleProps) {
  return (
    <BaseUIPopover.Title
      {...props}
      {...mergeStatefulStyles(stylex.props(styles.title), props)}
    />
  )
}

/**
 * Opens the popover when pressed. Unstyled like `Popover.Close`, so pass the
 * control through `render`.
 */
function PopoverTrigger(props: PopoverTriggerProps) {
  return <BaseUIPopover.Trigger {...props} />
}

Popover.Close = PopoverClose
Popover.Content = PopoverContent
Popover.Description = PopoverDescription
Popover.Title = PopoverTitle
Popover.Trigger = PopoverTrigger

type PopoverCloseProps = BaseUIPopoverCloseProps

// The popup's own props, plus the four that place it. Those four belong to the
// positioner rather than to the panel, but a call site has no reason to know
// there are two elements — `className` and `style` reach the panel, which is
// the one worth restyling, and the placement props are forwarded past it.
type PopoverContentProps = BaseUIPopoverPopupProps &
  Pick<
    BaseUIPopoverPositionerProps,
    'align' | 'alignOffset' | 'anchor' | 'side' | 'sideOffset'
  > & {
    /**
     * Where to portal the panel. Defaults to the end of `<body>`, which is
     * right for an app that sets its StyleX theme on `:root`. An app that
     * scopes the theme to a subtree has to point this at an element inside it,
     * or the popover renders outside the theme and falls back to the tokens'
     * `prefers-color-scheme` default.
     */
    container?: BaseUIPopoverPortalProps['container']
  }

type PopoverDescriptionProps = BaseUIPopoverDescriptionProps

type PopoverTitleProps = BaseUIPopoverTitleProps

type PopoverTriggerProps = BaseUIPopoverTriggerProps

export type {
  PopoverCloseProps,
  PopoverContentProps,
  PopoverDescriptionProps,
  PopoverProps,
  PopoverSize,
  PopoverTitleProps,
  PopoverTriggerProps,
}

export default Popover
