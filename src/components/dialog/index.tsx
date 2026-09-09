import type { HTMLAttributes, ReactNode } from 'react'
import type {
  ClassNameOrFunction,
  DialogTriggerProps,
  HeadingProps,
  ModalOverlayProps,
  ModalRenderProps,
  DialogProps as RACDialogProps,
  StyleOrFunction,
} from 'react-aria-components'

import * as stylex from '@stylexjs/stylex'
import {
  DialogTrigger,
  Heading,
  Modal,
  ModalOverlay,
  Dialog as RACDialog,
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

// The dialogs page's two dialogs, which are one component here for the same
// reason Sheet's two presentations are: the page pairs them by window size
// rather than offering a choice. Above the medium breakpoint it is the basic
// dialog — a container on surface container high with a 28dp corner, between
// 280 and 560dp wide, centred over the scrim, with 24dp of padding all round,
// 16dp between the headline and the body and 24dp between the body and the
// actions. Below it the same dialog fills the window as the page's
// full-screen dialog: square corners, a 56dp header with the headline and a
// divider under it, and a 56dp action bar with a divider over it.
//
// The headline is headline-small on surface, the body body-medium on surface
// variant, and the buttons are the call site's — the page draws text buttons
// there, which is `Button`'s `text` variant.
//
// Two things the page draws are the call site's rather than the component's.
// The optional icon above the headline, which the page centres the headline
// and body with when it is there, is anything a `Dialog.Header` is given; a
// dialog that wants it centres its own header. And the dividers a basic
// dialog may show around a scrolling body are left out, since the page has
// them only for that case and the body here scrolls with the header and
// footer pinned either side of it, which is what they were marking.
//
// React Aria's overlay is three nested elements — the scrim, the container,
// and the dialog inside it — so the styles split the same way, and the scrim
// and the element carrying the dialog role are the ones every modal overlay
// shares.
const scaleIn = stylex.keyframes({
  from: { opacity: 0, transform: 'scale(0.9)' },
  to: { opacity: 1, transform: 'scale(1)' },
})

const slideInFromBottom = stylex.keyframes({
  from: { opacity: 0, transform: 'translateY(3%)' },
  to: { opacity: 1, transform: 'translateY(0)' },
})

const styles = stylex.create({
  // The only part that scrolls, so the headline and the actions keep their
  // place while the middle runs out of room.
  body: {
    boxSizing: 'border-box',
    color: colors.onSurfaceVariant,
    display: 'flex',
    flexDirection: 'column',
    flexGrow: 1,
    fontFamily: typography.bodyMediumFont,
    fontSize: typography.bodyMediumSize,
    fontWeight: typography.bodyMediumWeight,
    gap: spacing.lg,
    letterSpacing: typography.bodyMediumTracking,
    lineHeight: typography.bodyMediumLineHeight,
    overflowY: 'auto',
    paddingInline: spacing.xl,
  },
  // The scrim centres the container, which is what makes the dialog a dialog
  // rather than a sheet: it is not pinned to any edge. Full screen it has no
  // room to give, so the padding goes.
  centre: {
    alignItems: 'center',
    display: 'flex',
    justifyContent: 'center',
    padding: { default: spacing.xl, [media.belowMedium]: 0 },
  },
  container: {
    animationDuration: motion.durationMedium1,
    animationName: {
      default: scaleIn,
      [media.belowMedium]: slideInFromBottom,
    },
    // Decelerating: the dialog arrives quickly and settles.
    animationTimingFunction: motion.easingEmphasizedDecelerate,
    backgroundColor: colors.surfaceContainerHigh,
    // Between the page's two widths above the breakpoint, and never taller
    // than the room the scrim's padding leaves; full screen below it.
    blockSize: { default: 'auto', [media.belowMedium]: '100%' },
    borderRadius: { default: radii.xl, [media.belowMedium]: radii.none },
    boxShadow: shadows.elevation1,
    boxSizing: 'border-box',
    color: colors.onSurface,
    display: 'flex',
    flexDirection: 'column',
    inlineSize: '100%',
    maxBlockSize: '100%',
    maxInlineSize: { default: '560px', [media.belowMedium]: 'none' },
    minInlineSize: { default: '280px', [media.belowMedium]: 'auto' },
    // Clips the body's scroll to the rounded corners.
    overflow: 'hidden',
  },
  // The page's 24dp between the body and the actions, and 8dp between the
  // buttons themselves. Full screen, the actions are its bottom action bar:
  // 56dp tall, over a divider.
  footer: {
    alignItems: 'center',
    blockSize: { default: 'auto', [media.belowMedium]: '56px' },
    borderBlockStartColor: colors.outlineVariant,
    borderBlockStartStyle: { default: 'none', [media.belowMedium]: 'solid' },
    borderBlockStartWidth: '1px',
    boxSizing: 'border-box',
    display: 'flex',
    flexShrink: 0,
    gap: spacing.sm,
    justifyContent: 'flex-end',
    paddingBlockEnd: { default: spacing.xl, [media.belowMedium]: 0 },
    paddingBlockStart: { default: spacing.xl, [media.belowMedium]: 0 },
    paddingInline: spacing.xl,
  },
  // The page's 24dp above the headline and 16dp between it and the body.
  // Full screen, the header is the page's own: 56dp tall, under a divider.
  header: {
    alignItems: 'center',
    blockSize: { default: 'auto', [media.belowMedium]: '56px' },
    borderBlockEndColor: colors.outlineVariant,
    borderBlockEndStyle: { default: 'none', [media.belowMedium]: 'solid' },
    borderBlockEndWidth: '1px',
    boxSizing: 'border-box',
    display: 'flex',
    flexShrink: 0,
    gap: spacing.md,
    justifyContent: 'space-between',
    paddingBlockEnd: { default: spacing.lg, [media.belowMedium]: 0 },
    paddingBlockStart: { default: spacing.xl, [media.belowMedium]: 0 },
    paddingInline: spacing.xl,
  },
  // Full screen the headline shares a 56dp row with the close button, so it
  // takes the title role there rather than the headline one.
  title: {
    boxSizing: 'border-box',
    color: colors.onSurface,
    fontFamily: {
      default: typography.headlineSmallFont,
      [media.belowMedium]: typography.titleLargeFont,
    },
    fontSize: {
      default: typography.headlineSmallSize,
      [media.belowMedium]: typography.titleLargeSize,
    },
    fontWeight: {
      default: typography.headlineSmallWeight,
      [media.belowMedium]: typography.titleLargeWeight,
    },
    letterSpacing: {
      default: typography.headlineSmallTracking,
      [media.belowMedium]: typography.titleLargeTracking,
    },
    lineHeight: {
      default: typography.headlineSmallLineHeight,
      [media.belowMedium]: typography.titleLargeLineHeight,
    },
    margin: 0,
  },
})

type DialogProps = Omit<DialogTriggerProps, 'children'> & {
  children?: ReactNode
}

/**
 * A modal dialog centred over the page, and the same dialog filling the
 * window below the medium breakpoint — the dialogs page's basic and
 * full-screen dialogs, paired by window size as the page pairs them. Open
 * state is React Aria's: pass `isOpen` with `onOpenChange` to control it, or
 * `defaultOpen` to let it keep its own.
 *
 * Composed rather than configured by props, as `Sheet` is, since a dialog's
 * header, body and actions all take arbitrary content — the parts are
 * `Dialog.Content`, `Dialog.Header`, `Dialog.Title`, `Dialog.Body` and
 * `Dialog.Footer`. A `Button` or `IconButton` placed directly inside
 * `Dialog` opens it, and one given `slot="close"` anywhere inside the
 * content closes it; neither needs a part of its own.
 */
function Dialog({ children, ...props }: DialogProps) {
  return <DialogTrigger {...props}>{children}</DialogTrigger>
}

function DialogBody(props: HTMLAttributes<HTMLDivElement>) {
  return <div {...props} {...mergeStyles(stylex.props(styles.body), props)} />
}

/**
 * The dialog itself, and the scrim behind it. Everything the dialog shows
 * goes in here; the trigger stays outside it, since the trigger lives in the
 * page while this is portalled out to the end of the body.
 *
 * `role="alertdialog"` is React Aria's, for a dialog interrupting with
 * something that has to be answered before the page carries on — a screen
 * reader announces it rather than waiting to be asked.
 *
 * A press on the scrim closes the dialog unless `isDismissable` says
 * otherwise, which is the same default `Sheet` takes and the reverse of
 * React Aria's own.
 */
function DialogContent({
  children,
  className,
  container,
  isDismissable = true,
  isKeyboardDismissDisabled,
  style,
  ...props
}: DialogContentProps) {
  return (
    <ModalOverlay
      isDismissable={isDismissable}
      isKeyboardDismissDisabled={isKeyboardDismissDisabled}
      // oxlint-disable-next-line typescript/no-deprecated -- its replacement, UNSAFE_PortalProvider, is not exported by react-aria-components
      UNSTABLE_portalContainer={container}
      {...stylex.props(overlay.scrim, styles.centre)}
    >
      <Modal
        {...mergeStatefulStyles(stylex.props(styles.container), {
          className,
          style,
        })}
      >
        <RACDialog {...props} {...stylex.props(overlay.modalDialog)}>
          {children}
        </RACDialog>
      </Modal>
    </ModalOverlay>
  )
}

function DialogFooter(props: HTMLAttributes<HTMLDivElement>) {
  return <div {...props} {...mergeStyles(stylex.props(styles.footer), props)} />
}

function DialogHeader(props: HTMLAttributes<HTMLDivElement>) {
  return <div {...props} {...mergeStyles(stylex.props(styles.header), props)} />
}

/**
 * Names the dialog. Rendered through React Aria's title slot, which is what
 * points the dialog's `aria-labelledby` at it — a dialog without one
 * announces itself unnamed.
 */
function DialogTitle(props: DialogTitleProps) {
  return (
    <Heading
      slot="title"
      {...props}
      {...mergeStyles(stylex.props(styles.title), props)}
    />
  )
}

Dialog.Body = DialogBody
Dialog.Content = DialogContent
Dialog.Footer = DialogFooter
Dialog.Header = DialogHeader
Dialog.Title = DialogTitle

// The dialog's own props, plus the scrim's dismissal settings and the
// container's styling. A call site has no reason to know there are three
// elements: `className` and `style` reach the container, which is the one
// worth restyling, and everything else lands on the dialog.
type DialogContentProps = Omit<RACDialogProps, 'className' | 'style'> &
  Pick<ModalOverlayProps, 'isDismissable' | 'isKeyboardDismissDisabled'> & {
    /** A function may compute the class from the container's render state. */
    className?: ClassNameOrFunction<ModalRenderProps>
    /**
     * Where to portal the dialog and scrim. Defaults to the end of `<body>`,
     * which is right for an app that sets its StyleX theme on `:root`. An app
     * that scopes the theme to a subtree has to point this at an element
     * inside it, or the dialog renders outside the theme and falls back to
     * the tokens' `prefers-color-scheme` default.
     */
    container?: Element
    /** A function may compute the style from the container's render state. */
    style?: StyleOrFunction<ModalRenderProps>
  }

type DialogTitleProps = HeadingProps

export type { DialogContentProps, DialogProps, DialogTitleProps }

export default Dialog
