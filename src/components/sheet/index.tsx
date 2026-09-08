import type { HTMLAttributes, ReactNode } from 'react'
import type {
  ClassNameOrFunction,
  DialogProps,
  DialogTriggerProps,
  HeadingProps,
  ModalOverlayProps,
  ModalRenderProps,
  StyleOrFunction,
} from 'react-aria-components'

import * as stylex from '@stylexjs/stylex'
import {
  Dialog,
  DialogTrigger,
  Heading,
  Modal,
  ModalOverlay,
} from 'react-aria-components'

import { mergeStatefulStyles, mergeStyles } from '../../styles/merge'
import { overlay } from '../../styles/overlay'
import {
  colors,
  media,
  motion,
  radii,
  shadows,
  spacing,
  typography,
} from '../../tokens/design.tokens.stylex'

// One component, two presentations. Above the medium breakpoint it is a side
// sheet pinned to the inline end of the viewport; below it, the same panel
// becomes a bottom sheet. That is the pairing the Material Design pages draw
// rather than two components, and it is why nothing here takes a `side` prop
// — a sheet that stayed on the right at 375px would be a drawer covering the
// whole screen.
//
// The two differ in four things and no more: which edges they are pinned to,
// which two corners are rounded, which axis they arrive along, and how much
// of the viewport they may take. Everything inside the panel — the 24 of
// start and end padding, the 12 between the header's elements, the actions
// area — comes from the side sheets page and is drawn the same in both.
const slideInFromEnd = stylex.keyframes({
  from: { opacity: 0, transform: 'translateX(100%)' },
  to: { opacity: 1, transform: 'translateX(0)' },
})

const slideInFromBottom = stylex.keyframes({
  from: { opacity: 0, transform: 'translateY(100%)' },
  to: { opacity: 1, transform: 'translateY(0)' },
})

// Entry only, so there is no exit animation to wait for and closing is
// immediate: React Aria keeps a closing panel mounted only while an animation
// is running on it, and finds none. See the comment on `SheetContent` for why
// that is a design call rather than a limit of StyleX.
//
// React Aria's overlay is three nested elements — the scrim, the panel, and
// the dialog inside it — so the styles are split the same way: the overlay
// module's scrim on the first, `content` on the panel, its modal dialog style
// on the element that carries the role. The scrim and that dialog style are
// shared with every modal overlay; the panel is the sheet's own, since which
// edge it is pinned to is what makes it a sheet.
const styles = stylex.create({
  body: {
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    // The only part that scrolls. Header and footer keep their place while
    // the middle runs out of room, which is the whole reason the sheet is a
    // column rather than one scrolling box.
    flexGrow: 1,
    gap: spacing.lg,
    overflowY: 'auto',
    paddingBlock: spacing.lg,
    paddingInline: spacing.xl,
  },
  content: {
    animationDuration: motion.durationMedium1,
    animationName: {
      default: slideInFromEnd,
      [media.belowMedium]: slideInFromBottom,
    },
    // Decelerating: the panel arrives fast and settles, which reads as the
    // sheet coming to rest rather than sliding to a stop.
    animationTimingFunction: motion.easingEmphasizedDecelerate,
    backgroundColor: colors.surfaceContainerLow,
    // Rounded on the content-facing edges only, square where the panel meets
    // the edge of the screen — the side sheet rounds its two inline-start
    // corners, the bottom sheet its two top ones.
    borderEndEndRadius: radii.none,
    borderEndStartRadius: {
      default: radii.lg,
      [media.belowMedium]: radii.none,
    },
    borderStartEndRadius: {
      default: radii.none,
      [media.belowMedium]: radii.xl,
    },
    borderStartStartRadius: {
      default: radii.lg,
      [media.belowMedium]: radii.xl,
    },
    boxShadow: shadows.elevation1,
    boxSizing: 'border-box',
    color: colors.onSurface,
    display: 'flex',
    flexDirection: 'column',
    // The side sheets page's 400 max-width, and the modal side sheet is
    // always at it. The bottom sheet is full width: the bottom sheets page
    // caps it at 640 with 56 of margin beyond, but this presentation only
    // exists below the medium breakpoint, which is already under that cap.
    inlineSize: { default: '400px', [media.belowMedium]: '100%' },
    insetBlockEnd: 0,
    insetBlockStart: { default: 0, [media.belowMedium]: 'auto' },
    insetInlineEnd: 0,
    insetInlineStart: { default: 'auto', [media.belowMedium]: 0 },
    // The side sheet is full height; the bottom sheet is only as tall as its
    // content, up to the bottom sheets page's 72 of top margin.
    maxBlockSize: {
      default: 'none',
      [media.belowMedium]: 'calc(100dvh - 72px)',
    },
    // Clips the body's scroll to the rounded corners.
    overflow: 'hidden',
    position: 'fixed',
  },
  // The side sheets page's bottom actions area: 72 tall, 16 above the buttons
  // and 24 below them, and the buttons starting at the leading edge. The 72
  // is a floor rather than a height, since those paddings around a 40px
  // button come to 80, and a footer holding a second line of actions grows
  // further still.
  footer: {
    borderBlockStartColor: colors.outlineVariant,
    borderBlockStartStyle: 'solid',
    borderBlockStartWidth: '1px',
    boxSizing: 'border-box',
    display: 'flex',
    flexShrink: 0,
    gap: spacing.sm,
    justifyContent: 'flex-start',
    minBlockSize: '72px',
    paddingBlockEnd: spacing.xl,
    paddingBlockStart: spacing.lg,
    paddingInline: spacing.xl,
  },
  // The page's 12 between the header's elements.
  header: {
    alignItems: 'center',
    borderBlockEndColor: colors.outlineVariant,
    borderBlockEndStyle: 'solid',
    borderBlockEndWidth: '1px',
    boxSizing: 'border-box',
    display: 'flex',
    flexShrink: 0,
    gap: spacing.md,
    justifyContent: 'space-between',
    paddingBlock: spacing.sm,
    paddingInline: spacing.xl,
  },
  // The headline in the role the side sheets page gives it, on surface
  // variant, rather than the on surface the body's text takes.
  title: {
    boxSizing: 'border-box',
    color: colors.onSurfaceVariant,
    fontFamily: typography.titleLargeFont,
    fontSize: typography.titleLargeSize,
    fontWeight: typography.titleLargeWeight,
    letterSpacing: typography.titleLargeTracking,
    lineHeight: typography.titleLargeLineHeight,
    margin: 0,
  },
})

type SheetProps = Omit<DialogTriggerProps, 'children'> & {
  children?: ReactNode
}

/**
 * A modal panel that arrives from the edge of the screen — a side sheet on a
 * wide viewport, a bottom sheet on a narrow one. Open state is React Aria's:
 * pass `isOpen` with `onOpenChange` to control it, or `defaultOpen` to let it
 * keep its own.
 *
 * Composed rather than configured by props, because a sheet's header, body,
 * and footer all take arbitrary content — the parts are `Sheet.Content`,
 * `Sheet.Header`, `Sheet.Title`, `Sheet.Body`, and `Sheet.Footer`. A
 * `Button` or `IconButton` placed directly inside `Sheet` opens it, and one
 * given `slot="close"` anywhere inside the content closes it; neither needs
 * a part of its own.
 */
function Sheet({ children, ...props }: SheetProps) {
  return <DialogTrigger {...props}>{children}</DialogTrigger>
}

function SheetBody(props: HTMLAttributes<HTMLDivElement>) {
  return <div {...props} {...mergeStyles(stylex.props(styles.body), props)} />
}

/**
 * The panel itself, and the scrim behind it. Everything the sheet shows goes
 * in here; the trigger stays outside it, since the trigger lives in the page
 * while this is portalled out to the end of the body.
 *
 * A press on the scrim closes the sheet unless `isDismissable` says
 * otherwise — React Aria's own default is the reverse, and a sheet that
 * ignores a tap outside it reads as stuck.
 */
function SheetContent({
  children,
  className,
  container,
  isDismissable = true,
  isKeyboardDismissDisabled,
  style,
  ...props
}: SheetContentProps) {
  return (
    <ModalOverlay
      isDismissable={isDismissable}
      isKeyboardDismissDisabled={isKeyboardDismissDisabled}
      // oxlint-disable-next-line typescript/no-deprecated -- its replacement, UNSAFE_PortalProvider, is not exported by react-aria-components
      UNSTABLE_portalContainer={container}
      {...stylex.props(overlay.scrim)}
    >
      <Modal
        {...mergeStatefulStyles(stylex.props(styles.content), {
          className,
          style,
        })}
      >
        <Dialog {...props} {...stylex.props(overlay.modalDialog)}>
          {children}
        </Dialog>
      </Modal>
    </ModalOverlay>
  )
}

function SheetFooter(props: HTMLAttributes<HTMLDivElement>) {
  return <div {...props} {...mergeStyles(stylex.props(styles.footer), props)} />
}

function SheetHeader(props: HTMLAttributes<HTMLDivElement>) {
  return <div {...props} {...mergeStyles(stylex.props(styles.header), props)} />
}

/**
 * Names the sheet. Rendered through React Aria's title slot, which is what
 * points the dialog's `aria-labelledby` at it — a sheet without one announces
 * itself as an unnamed dialog.
 */
function SheetTitle(props: SheetTitleProps) {
  return (
    <Heading
      slot="title"
      {...props}
      {...mergeStyles(stylex.props(styles.title), props)}
    />
  )
}

Sheet.Body = SheetBody
Sheet.Content = SheetContent
Sheet.Footer = SheetFooter
Sheet.Header = SheetHeader
Sheet.Title = SheetTitle

// The dialog's own props, plus the scrim's dismissal settings and the panel's
// styling. A call site has no reason to know there are three elements:
// `className` and `style` reach the panel, which is the one worth restyling
// and positioning, and everything else lands on the dialog.
type SheetContentProps = Omit<DialogProps, 'className' | 'style'> &
  Pick<ModalOverlayProps, 'isDismissable' | 'isKeyboardDismissDisabled'> & {
    /** A function may compute the class from the panel's render state. */
    className?: ClassNameOrFunction<ModalRenderProps>
    /**
     * Where to portal the panel and scrim. Defaults to the end of `<body>`,
     * which is right for an app that sets its StyleX theme on `:root`. An app
     * that scopes the theme to a subtree has to point this at an element inside
     * it, or the sheet renders outside the theme and falls back to the tokens'
     * `prefers-color-scheme` default.
     */
    container?: Element
    /** A function may compute the style from the panel's render state. */
    style?: StyleOrFunction<ModalRenderProps>
  }

type SheetTitleProps = HeadingProps

export type { SheetContentProps, SheetProps, SheetTitleProps }

export default Sheet
