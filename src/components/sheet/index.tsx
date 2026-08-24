import type {
  DialogCloseProps as BaseUIDialogCloseProps,
  DialogPopupProps as BaseUIDialogPopupProps,
  DialogPortalProps as BaseUIDialogPortalProps,
  DialogRootProps as BaseUIDialogRootProps,
  DialogTitleProps as BaseUIDialogTitleProps,
  DialogTriggerProps as BaseUIDialogTriggerProps,
} from '@base-ui/react/dialog'
import type { HTMLAttributes, ReactNode } from 'react'

import { Dialog as BaseUIDialog } from '@base-ui/react/dialog'
import * as stylex from '@stylexjs/stylex'
import { createContext, useContext } from 'react'

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
// immediate. See the comment on `SheetContent` for why that is a design call
// rather than a limit of StyleX.
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
  footer: {
    borderBlockStartColor: colors.outlineVariant,
    borderBlockStartStyle: 'solid',
    borderBlockStartWidth: '1px',
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

// `children` is narrowed to nodes. Base UI also accepts a function there, to
// hand the sheet a payload passed by whichever trigger opened it, and that
// form cannot be wrapped in a context provider without calling it first —
// which would be doing Base UI's job with none of its state. Nothing in this
// component needs the payload, so the narrower type says so rather than
// leaving a signature that type-checks and then fails to render.
type SheetProps = Omit<BaseUIDialogRootProps, 'children'> & {
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
 * wide viewport, a bottom sheet on a narrow one. Open state is Base UI's:
 * pass `open` with `onOpenChange` to control it, or `defaultOpen` to let it
 * keep its own.
 *
 * Composed rather than configured by props, because a sheet's header, body,
 * and footer all take arbitrary content — the parts are `Sheet.Trigger`,
 * `Sheet.Content`, `Sheet.Header`, `Sheet.Title`, `Sheet.Body`,
 * `Sheet.Footer`, and `Sheet.Close`.
 */
function Sheet({ children, size = 'md', ...props }: SheetProps) {
  return (
    <BaseUIDialog.Root {...props}>
      <SheetSizeContext value={size}>{children}</SheetSizeContext>
    </BaseUIDialog.Root>
  )
}

function SheetBody(props: HTMLAttributes<HTMLDivElement>) {
  return <div {...props} {...mergeStyles(stylex.props(styles.body), props)} />
}

/**
 * Closes the sheet when pressed. Carries no styling of its own, so give it
 * the control it should be through `render` — an `IconButton` in the header,
 * a `Button` in the footer.
 */
function SheetClose(props: BaseUIDialogCloseProps) {
  return <BaseUIDialog.Close {...props} />
}

/**
 * The panel itself, and the scrim behind it. Everything the sheet shows goes
 * in here; `Sheet.Trigger` stays outside it, since the trigger lives in the
 * page while this is portalled out to the end of the body.
 */
function SheetContent({ children, container, ...props }: SheetContentProps) {
  const size = useContext(SheetSizeContext)

  return (
    <BaseUIDialog.Portal container={container}>
      <BaseUIDialog.Backdrop {...stylex.props(styles.backdrop)} />
      <BaseUIDialog.Popup
        {...props}
        {...mergeStatefulStyles(
          stylex.props(styles.content, styles[size]),
          props,
        )}
      >
        {children}
      </BaseUIDialog.Popup>
    </BaseUIDialog.Portal>
  )
}

function SheetFooter(props: HTMLAttributes<HTMLDivElement>) {
  return <div {...props} {...mergeStyles(stylex.props(styles.footer), props)} />
}

function SheetHeader(props: HTMLAttributes<HTMLDivElement>) {
  return <div {...props} {...mergeStyles(stylex.props(styles.header), props)} />
}

/**
 * Names the sheet. Rendered through Base UI's title part, which is what
 * points the dialog's `aria-labelledby` at it — a sheet without one announces
 * itself as an unnamed dialog.
 */
function SheetTitle(props: BaseUIDialogTitleProps) {
  return (
    <BaseUIDialog.Title
      {...props}
      {...mergeStatefulStyles(stylex.props(styles.title), props)}
    />
  )
}

/**
 * Opens the sheet when pressed. Unstyled like `Sheet.Close`, so pass the
 * control through `render`.
 */
function SheetTrigger(props: BaseUIDialogTriggerProps) {
  return <BaseUIDialog.Trigger {...props} />
}

Sheet.Body = SheetBody
Sheet.Close = SheetClose
Sheet.Content = SheetContent
Sheet.Footer = SheetFooter
Sheet.Header = SheetHeader
Sheet.Title = SheetTitle
Sheet.Trigger = SheetTrigger

type SheetCloseProps = BaseUIDialogCloseProps

type SheetContentProps = BaseUIDialogPopupProps & {
  /**
   * Where to portal the panel and scrim. Defaults to the end of `<body>`,
   * which is right for an app that sets its StyleX theme on `:root`. An app
   * that scopes the theme to a subtree has to point this at an element inside
   * it, or the sheet renders outside the theme and falls back to the tokens'
   * `prefers-color-scheme` default.
   */
  container?: BaseUIDialogPortalProps['container']
}

type SheetTitleProps = BaseUIDialogTitleProps

type SheetTriggerProps = BaseUIDialogTriggerProps

export type {
  SheetCloseProps,
  SheetContentProps,
  SheetProps,
  SheetSize,
  SheetTitleProps,
  SheetTriggerProps,
}

export default Sheet
