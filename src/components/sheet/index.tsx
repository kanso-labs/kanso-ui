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
import { createContext, useContext } from 'react'
import {
  Dialog,
  DialogTrigger,
  Heading,
  Modal,
  ModalOverlay,
} from 'react-aria-components'

import { mergeStatefulStyles, mergeStyles } from '../../styles/merge'
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
// becomes a bottom sheet. That is M3's own pairing rather than two components,
// and it is why nothing here takes a `side` prop — a sheet that stayed on the
// right at 375px would be a drawer covering the whole screen.
//
// The two differ in three things and no more: which edges they are pinned to,
// which two corners are rounded, and which axis they arrive along.
const slideInFromEnd = stylex.keyframes({
  from: { opacity: 0, transform: 'translateX(100%)' },
  to: { opacity: 1, transform: 'translateX(0)' },
})

const slideInFromBottom = stylex.keyframes({
  from: { opacity: 0, transform: 'translateY(100%)' },
  to: { opacity: 1, transform: 'translateY(0)' },
})

const fadeIn = stylex.keyframes({
  from: { opacity: 0 },
  to: { opacity: 1 },
})

// Entry only, so there is no exit animation to wait for and closing is
// immediate: React Aria keeps a closing panel mounted only while an animation
// is running on it, and finds none. See the comment on `SheetContent` for why
// that is a design call rather than a limit of StyleX.
//
// React Aria's overlay is three nested elements — the scrim, the panel, and
// the dialog inside it — so the styles are split the same way: `backdrop` on
// the scrim, `content` and a size on the panel, `dialog` on the element that
// carries the role.
const styles = stylex.create({
  backdrop: {
    // Shorter than the panel's 250ms, so the scrim has settled by the time
    // the panel arrives rather than the two finishing together.
    animationDuration: motion.durationShort2,
    animationName: fadeIn,
    animationTimingFunction: motion.easingStandard,
    // M3's scrim is the scrim role at 32%, not a colour of its own.
    backgroundColor: `color-mix(in srgb, ${colors.scrim} 32%, transparent)`,
    inset: 0,
    position: 'fixed',
  },
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
    padding: spacing.lg,
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
    insetBlockEnd: 0,
    insetBlockStart: { default: 0, [media.belowMedium]: 'auto' },
    insetInlineEnd: 0,
    insetInlineStart: { default: 'auto', [media.belowMedium]: 0 },
    // The side sheet is full height; the bottom sheet is only as tall as its
    // content until it would cover the screen.
    maxBlockSize: { default: 'none', [media.belowMedium]: '90dvh' },
    // Clips the body's scroll to the rounded corners.
    overflow: 'hidden',
    position: 'fixed',
  },
  // The element with the dialog role fills the panel and lays its header,
  // body and footer out as a column. The panel already draws the focus
  // treatment through its scrim, so the dialog shows no ring of its own when
  // React Aria focuses it.
  dialog: {
    blockSize: '100%',
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    outlineStyle: 'none',
  },
  footer: {
    borderBlockStartColor: colors.outlineVariant,
    borderBlockStartStyle: 'solid',
    borderBlockStartWidth: '1px',
    boxSizing: 'border-box',
    display: 'flex',
    flexShrink: 0,
    gap: spacing.sm,
    justifyContent: 'flex-end',
    paddingBlock: spacing.md,
    paddingInline: spacing.lg,
  },
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
    paddingInline: spacing.lg,
  },
  // The width belongs to the size rather than to `content`, because StyleX
  // merges a property whole: an unconditional `inlineSize` here would replace
  // `content`'s media-conditional one outright and take the mobile case with
  // it. Each size therefore carries its own override.
  md: {
    inlineSize: { default: '400px', [media.belowMedium]: '100%' },
  },
  sm: {
    inlineSize: { default: '320px', [media.belowMedium]: '100%' },
  },
  title: {
    boxSizing: 'border-box',
    color: colors.onSurface,
    fontFamily: typography.titleLargeFont,
    fontSize: typography.titleLargeSize,
    fontWeight: typography.titleLargeWeight,
    letterSpacing: typography.titleLargeTracking,
    lineHeight: typography.titleLargeLineHeight,
    margin: 0,
  },
})

type SheetSize = 'md' | 'sm'

// `size` is declared on the root, where a reader expects to set the shape of
// the whole sheet, but it is `Sheet.Content` that has to apply it. One string
// through context rather than making the call site repeat it on both.
const SheetSizeContext = createContext<SheetSize>('md')

type SheetProps = Omit<DialogTriggerProps, 'children'> & {
  children?: ReactNode
  /**
   * Panel width on the side-sheet presentation: `sm` 320px, `md` 400px.
   * Ignored below the medium breakpoint, where the sheet is full width.
   * @default 'md'
   */
  size?: SheetSize
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
function Sheet({ children, size = 'md', ...props }: SheetProps) {
  return (
    <DialogTrigger {...props}>
      <SheetSizeContext value={size}>{children}</SheetSizeContext>
    </DialogTrigger>
  )
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
  const size = useContext(SheetSizeContext)

  return (
    <ModalOverlay
      isDismissable={isDismissable}
      isKeyboardDismissDisabled={isKeyboardDismissDisabled}
      // oxlint-disable-next-line typescript/no-deprecated -- its replacement, UNSAFE_PortalProvider, is not exported by react-aria-components
      UNSTABLE_portalContainer={container}
      {...stylex.props(styles.backdrop)}
    >
      <Modal
        {...mergeStatefulStyles(stylex.props(styles.content, styles[size]), {
          className,
          style,
        })}
      >
        <Dialog {...props} {...stylex.props(styles.dialog)}>
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

export type { SheetContentProps, SheetProps, SheetSize, SheetTitleProps }

export default Sheet
