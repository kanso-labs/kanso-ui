import type { ReactNode } from 'react'
import type {
  FocusableElement,
  ToastRegionProps as RACToastRegionProps,
  ToastRegionRenderProps,
} from 'react-aria-components'

import * as stylex from '@stylexjs/stylex'
import {
  Button as RACButton,
  UNSTABLE_Toast as RACToast,
  UNSTABLE_ToastContent as RACToastContent,
  UNSTABLE_ToastQueue as RACToastQueue,
  UNSTABLE_ToastRegion as RACToastRegion,
  Text,
} from 'react-aria-components'

import { CloseGlyph } from '../../glyphs'
import { useRipple } from '../../hooks/useRipple'
import { mergeStatefulStyles } from '../../styles/merge'
import {
  colors,
  motion,
  radii,
  shadows,
  spacing,
  stateLayerOpacity,
  typography,
} from '../../tokens/design.tokens.stylex'

// The snackbar page's brief message at the bottom of the screen, with an
// optional action beside it and an optional close button after that. The
// page's container is the inverse surface at a 4dp corner and elevation 3,
// its supporting text is body-medium in inverse on surface, its action label
// is inverse primary, and its close icon takes the supporting text's colour.
// The measurements are the page's too: 8dp of margin from the edges of the
// screen, 8dp of padding inside the container with another 8dp either side
// of the message, 14dp above and below on a single line, and between 320 and
// 576dp wide above the page's 600dp breakpoint — full width below it.
//
// One at a time. The page shows a single snackbar and replaces it rather
// than stacking, which is `maxVisibleToasts: 1` on the queue.
//
// React Aria's toast is the behaviour: the region is a landmark that holds
// the message, moves focus into it for a keyboard, and pauses every timer
// while it is hovered or focused, so a message never expires while it is
// being read or acted on.
//
// Three things are decided here rather than taken from React Aria or from
// the page.
//
// **The queue is ours, not React Aria's.** React Aria's toast is still
// `UNSTABLE_`, and `SnackbarQueue` is what keeps that name out of a
// consumer's code — an upstream rename is this file rather than every call
// site. It wraps their queue, defaults it to one visible message, and takes
// the message and its options as one call.
//
// **The action and the close button are drawn here rather than through
// Button and IconButton.** The page colours them inverse primary and inverse
// on surface, which no variant of either carries, and a colour pushed in
// from outside through `className` is the merge hazard AGENTS.md describes:
// StyleX decides between two atomic classes by their order in the compiled
// stylesheet, not by the order they are applied. Both are React Aria's
// `Button` with the same ripple and the same state layers, over
// `currentColor` so each takes the colour the snackbar gives it.
//
// **There is no `container` prop.** Every other overlay here takes one,
// because React Aria's `Modal` and `Popover` accept a portal container.
// Its toast region does not: it reads a portal provider that
// `react-aria-components` does not export, so the region always lands at the
// end of `<body>`. An app that scopes its StyleX theme to a subtree has to
// put the theme on `:root` for the snackbar to be drawn in it.

// The page's two durations, from the same implementation its measurements
// come from: a message alone is shown for the short one, a message with an
// action for the long one, since an action has to be read before it can be
// taken.
const SHORT_MS = 1500
const LONG_MS = 2750

// Below the page's 600dp breakpoint the snackbar runs the width of the
// screen; above it, it takes between 320 and 576.
const WIDE = '@media (min-width: 600px)'

// The page's own is a fade. It rises a little as it arrives too, which is
// what the page draws and what says the message came from the edge of the
// screen rather than appearing over it.
const rise = stylex.keyframes({
  from: { opacity: 0, transform: 'translateY(100%)' },
  to: { opacity: 1, transform: 'translateY(0)' },
})

const styles = stylex.create({
  // The action: a text button in the page's inverse primary, at the label
  // large the page gives it.
  action: {
    color: colors.inversePrimary,
    fontFamily: typography.labelLargeFont,
    fontSize: typography.labelLargeSize,
    fontWeight: typography.labelLargeWeight,
    letterSpacing: typography.labelLargeTracking,
    lineHeight: typography.labelLargeLineHeight,
    paddingBlock: spacing.sm,
    paddingInline: spacing.md,
  },
  // The close button: the page's 24dp icon in the supporting text's colour,
  // in a target the icon buttons page's smallest size.
  close: {
    blockSize: '48px',
    color: colors.inverseOnSurface,
    inlineSize: '48px',
    padding: 0,
  },
  closeGlyph: {
    blockSize: '24px',
    inlineSize: '24px',
  },
  // The action, and the close button after it. Both take the colour set on
  // them and lay their state layer over it, so one set of rules serves the
  // two of them at their two different colours.
  control: {
    alignItems: 'center',
    backgroundColor: {
      ':active': `color-mix(in srgb, currentColor calc(${stateLayerOpacity.pressed} * 100%), transparent)`,
      ':focus-visible': `color-mix(in srgb, currentColor calc(${stateLayerOpacity.focus} * 100%), transparent)`,
      ':hover': `color-mix(in srgb, currentColor calc(${stateLayerOpacity.hover} * 100%), transparent)`,
      default: 'transparent',
    },
    borderRadius: radii.full,
    borderWidth: 0,
    boxSizing: 'border-box',
    cursor: 'pointer',
    display: 'inline-flex',
    flexShrink: 0,
    justifyContent: 'center',
    outlineColor: 'currentColor',
    outlineOffset: '2px',
    outlineStyle: { ':focus-visible': 'solid', default: 'none' },
    outlineWidth: '2px',
    overflow: 'hidden',
    position: 'relative',
  },
  // The message: body-medium in inverse on surface, with the page's 8dp
  // either side of it inside the container's own 8dp, and the 14dp above and
  // below that makes a single line 48 tall. The height is the message's
  // rather than the container's, which is what lets a 48dp close button sit
  // beside it without making the snackbar taller than the page draws it.
  //
  // Drawn on React Aria's content element rather than on the text inside it,
  // since that element is the flex child: growing the text would leave the
  // action and the close button beside the words instead of at the end.
  message: {
    boxSizing: 'border-box',
    color: colors.inverseOnSurface,
    flexGrow: 1,
    fontFamily: typography.bodyMediumFont,
    fontSize: typography.bodyMediumSize,
    fontWeight: typography.bodyMediumWeight,
    letterSpacing: typography.bodyMediumTracking,
    lineHeight: typography.bodyMediumLineHeight,
    marginInline: spacing.sm,
    minInlineSize: 0,
    paddingBlock: '14px',
  },
  // The region: a landmark pinned to the bottom of the screen with the
  // page's 8dp of margin, and transparent to the pointer so the strip it
  // occupies stays clickable when nothing is in it.
  region: {
    alignItems: 'center',
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.sm,
    insetBlockEnd: 0,
    insetInline: 0,
    outlineStyle: 'none',
    padding: spacing.sm,
    pointerEvents: 'none',
    position: 'fixed',
    zIndex: 1000,
  },
  // The container: the page's 8dp either side, and nothing above or below,
  // since what sets the height is the message and the close button.
  toast: {
    alignItems: 'center',
    animationDuration: motion.durationMedium1,
    animationName: rise,
    animationTimingFunction: motion.easingEmphasizedDecelerate,
    backgroundColor: colors.inverseSurface,
    borderRadius: radii.xs,
    boxShadow: shadows.elevation3,
    boxSizing: 'border-box',
    display: 'flex',
    inlineSize: '100%',
    maxInlineSize: { default: 'none', [WIDE]: '576px' },
    minBlockSize: '48px',
    minInlineSize: { default: 0, [WIDE]: '320px' },
    outlineColor: colors.inverseOnSurface,
    outlineOffset: '2px',
    outlineStyle: { ':focus-visible': 'solid', default: 'none' },
    outlineWidth: '2px',
    paddingBlock: 0,
    paddingInline: spacing.sm,
    pointerEvents: 'auto',
  },
})

type SnackbarAction = {
  /** What the action says. The page gives it a single word where it can. */
  label: string
  /** Run when the action is pressed, just before the snackbar closes. */
  onPress: () => void
}

/** What a snackbar carries: its message, and what may sit beside it. */
type SnackbarMessage = {
  action: SnackbarAction | undefined
  isDismissable: boolean
  message: ReactNode
}

type SnackbarOptions = {
  /**
   * A single action shown after the message. Pressing it runs `onPress` and
   * closes the snackbar, which is what the page draws.
   */
  action?: SnackbarAction
  /**
   * Whether a close button is shown at the end. The page draws one for a
   * message a reader may want out of the way before it expires.
   * @default false
   */
  isDismissable?: boolean
  /** Run when the snackbar closes, however it was closed. */
  onClose?: () => void
  /**
   * How long the snackbar is shown, in milliseconds. Defaults to the page's
   * short duration, or its long one when there is an action to read, and the
   * timer is paused while the region is hovered or focused so a message never
   * expires while it is being read.
   *
   * `0` is the page's indefinite length: the snackbar stays until something
   * closes it. Give one of those an action or `isDismissable`, or there is no
   * way to be rid of it.
   */
  timeout?: number
}

type SnackbarProps = Omit<
  RACToastRegionProps<SnackbarMessage>,
  'children' | 'className' | 'queue' | 'style'
> & {
  /**
   * What a screen reader calls the region holding the snackbar.
   * @default 'Notifications'
   */
  'aria-label'?: string
  /** A function may compute the class from the region's render state. */
  className?: RACToastRegionProps<SnackbarMessage>['className']
  /** The queue the region shows messages from. */
  queue: SnackbarQueue
  /** A function may compute the style from the region's render state. */
  style?: RACToastRegionProps<SnackbarMessage>['style']
}

// One entry of the queue, as React Aria hands it to the region's render
// function. Taken from its render state rather than imported from
// `react-stately`, which this package does not depend on.
type SnackbarToastItem =
  ToastRegionRenderProps<SnackbarMessage>['visibleToasts'][number]

/**
 * The queue a snackbar is shown from. Make one where the app can reach it —
 * a module of its own is the usual place — mount `Snackbar` once with it,
 * and call `add` from anywhere.
 *
 * ```ts
 * const messages = new Snackbar.Queue()
 * messages.add('Label', { action: { label: 'Undo', onPress: undo } })
 * ```
 *
 * It wraps React Aria's toast queue rather than exposing it, which is what
 * keeps that API's `UNSTABLE_` name out of a consumer's code.
 */
class SnackbarQueue {
  /**
   * React Aria's queue, which `Snackbar` subscribes to. Not part of the
   * package's API — read it and an upstream release may break the call site.
   */
  readonly rac: RACToastQueue<SnackbarMessage>

  constructor() {
    // One at a time, which is what the page shows: a second message replaces
    // the first rather than stacking under it.
    this.rac = new RACToastQueue<SnackbarMessage>({ maxVisibleToasts: 1 })
  }

  /**
   * Shows a message, and returns the key that closes it.
   */
  add(message: ReactNode, options: SnackbarOptions = {}) {
    const { action, isDismissable = false, onClose, timeout } = options
    return this.rac.add(
      { action, isDismissable, message },
      {
        onClose,
        timeout: timeout ?? (action === undefined ? SHORT_MS : LONG_MS),
      },
    )
  }

  /** Closes every snackbar, shown or waiting. */
  clear() {
    this.rac.clear()
  }

  /** Closes one snackbar, by the key `add` returned. */
  close(key: string) {
    this.rac.close(key)
  }
}

// The three handlers the snackbar hands to something below it, each built by
// a call rather than written inline at the prop, which is what react-perf's
// no-new-function-as-prop is after; the React Compiler memoises the result on
// its inputs.
function actionPress(action: SnackbarAction, close: () => void) {
  return () => {
    action.onPress()
    close()
  }
}

function closeToast(queue: SnackbarQueue, key: string) {
  return () => {
    queue.close(key)
  }
}

/**
 * A brief message at the bottom of the screen, with an optional action. Mount
 * one of these with a `Snackbar.Queue`, and call the queue's `add` to show a
 * message from anywhere.
 *
 * ```tsx
 * const messages = new Snackbar.Queue()
 *
 * <Snackbar queue={messages} />
 * ```
 *
 * The region is portalled to the end of `<body>` and renders nothing while
 * the queue is empty. It is one region rather than one per message, so mount
 * it once, near the root.
 *
 * The call site's `className` and `style` land on that region, which is the
 * element a layout positions.
 */
function Snackbar({ queue, ...props }: SnackbarProps) {
  return (
    <RACToastRegion<SnackbarMessage>
      queue={queue.rac}
      {...props}
      {...mergeStatefulStyles(stylex.props(styles.region), props)}
    >
      {snackbarContent(queue)}
    </RACToastRegion>
  )
}

/**
 * One of the snackbar's two controls. React Aria's `Button` rather than the
 * library's, for the colour reason in the comment at the top of this file;
 * the ripple and the state layers are the same ones every other control
 * here draws, over `currentColor`.
 */
function SnackbarButton({
  children,
  style,
  ...props
}: {
  'aria-label'?: string
  children: ReactNode
  onPress?: () => void
  slot?: string
  style: stylex.StyleXStyles
}) {
  const ripple = useRipple<FocusableElement>()

  return (
    <RACButton
      {...ripple.handlers}
      {...props}
      {...stylex.props(styles.control, style)}
    >
      {children}
      {ripple.surface}
    </RACButton>
  )
}

function snackbarContent(queue: SnackbarQueue) {
  return ({ toast }: { toast: SnackbarToastItem }) => (
    <SnackbarToast close={closeToast(queue, toast.key)} toast={toast} />
  )
}

/** The action, the close button, or nothing, after the message. */
function SnackbarControls({
  action,
  close,
  isDismissable,
}: {
  action: SnackbarAction | undefined
  close: () => void
  isDismissable: boolean
}) {
  return (
    <>
      {action === undefined ? null : (
        <SnackbarButton
          onPress={actionPress(action, close)}
          style={styles.action}
        >
          {action.label}
        </SnackbarButton>
      )}
      {isDismissable ? (
        <SnackbarButton aria-label="Close" slot="close" style={styles.close}>
          <CloseGlyph {...stylex.props(styles.closeGlyph)} />
        </SnackbarButton>
      ) : null}
    </>
  )
}

/** One snackbar: its message, then whatever sits after it. */
function SnackbarToast({
  close,
  toast,
}: {
  close: () => void
  toast: SnackbarToastItem
}) {
  const { action, isDismissable, message } = toast.content

  return (
    <RACToast toast={toast} {...stylex.props(styles.toast)}>
      <RACToastContent {...stylex.props(styles.message)}>
        <Text slot="title">{message}</Text>
      </RACToastContent>
      <SnackbarControls
        action={action}
        close={close}
        isDismissable={isDismissable}
      />
    </RACToast>
  )
}

Snackbar.Queue = SnackbarQueue

// The queue is reached as `Snackbar.Queue` rather than exported beside the
// component: this file would otherwise export something that is not a
// component, which is what turns fast refresh off for it.
export type {
  SnackbarAction,
  SnackbarMessage,
  SnackbarOptions,
  SnackbarProps,
  SnackbarQueue,
  ToastRegionRenderProps as SnackbarRegionRenderProps,
}

export default Snackbar
