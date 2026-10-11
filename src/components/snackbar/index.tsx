'use client'

import type { ReactNode, RefAttributes } from 'react'
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
import { useBottomEdgeClearance } from '../../hooks/useBottomEdge'
import { useRipple } from '../../hooks/useRipple'
import { layers } from '../../styles/layers.stylex'
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
// than stacking, so a message added while another is up closes that one —
// its `onClose` runs — and takes its place. Nothing waits behind it: React
// Aria's queue, left to itself, kept every message and showed the one it had
// replaced again once the newer closed, so an Undo could come back long after
// the thing it undid.
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
// because React Aria's `Modal` and `Popover` accept a portal container, and
// `src/components/portal-container.test.tsx` is what keeps that true.
// Its toast region does not: it reads a portal provider that
// `react-aria-components` does not export, so the region always lands at the
// end of `<body>`. An app that scopes its StyleX theme to a subtree has to
// put the theme on `:root` for the snackbar to be drawn in it.

// How long a message is shown when the call site names no `timeout`. The
// specs page gives no duration, so these come from the snackbar's guidelines
// and accessibility pages.
//
// A message alone leaves after five seconds. The pages allow four to ten, and
// React Aria's toast docs set five as the least a reader should be given.
//
// A message with an action stays until the action is taken or something
// closes it, as the pages ask of every actionable snackbar. No timer can know
// how long a reader needs to act: a screen reader user hears the message
// first and has to reach the region before the action is any use, and the
// pause while the region is hovered or focused only starts once they have.
// Android's snackbar can keep shorter defaults because the platform lengthens
// them from each user's accessibility settings, and the web has no such
// setting to read.
const MESSAGE_MS = 5000
const UNTIL_CLOSED = 0

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

// Windows High Contrast and the rest of the forced-colours modes. Spelled
// here rather than imported, for the reason src/field/styles.ts records: the
// StyleX compiler resolves a constant across files only out of a `.stylex.ts`
// module, and the generated one holds design tokens rather than queries.
const FORCED_COLORS = '@media (forced-colors: active)'

// The least press area the action keeps, as Button's medium size does. A
// literal rather than a token, for the reason Button's `TARGET_SIZE` gives: a
// consumer resizing their controls should not shrink a floor the page states.
const TARGET_SIZE = '48px'

const styles = stylex.create({
  // The action: Material Design's text button in the page's inverse primary,
  // at the label large the page gives it. That button is 40dp tall with a
  // 48dp target, as Button's medium size is; sized by its padding alone, it
  // came out 36dp in the default type scale and 32dp in a tighter one, and a
  // press just off its box landed on the strip and did nothing.
  //
  // The target is a transparent box reaching past the top and bottom to
  // 48dp, which is the strip's own height, and the 40dp a least height
  // rather than a height, so a scale with a taller line grows the button
  // instead of clipping its label.
  action: {
    '::before': {
      content: '""',
      insetBlock: `min(0px, calc((100% - ${TARGET_SIZE}) / 2))`,
      insetInline: 0,
      position: 'absolute',
    },
    color: colors.inversePrimary,
    fontFamily: typography.labelLargeFont,
    fontSize: typography.labelLargeSize,
    fontWeight: typography.labelLargeWeight,
    letterSpacing: typography.labelLargeTracking,
    lineHeight: typography.labelLargeLineHeight,
    minBlockSize: sizing.controlSm,
    paddingBlock: spacing.sm,
    paddingInline: spacing.md,
  },
  // The close button: the page's 24dp icon in the supporting text's colour,
  // in a 48dp box. That is the least press area the icon buttons page
  // allows, which it asks even of its two smallest sizes, 32 and 40dp across
  // — see IconButton's `TARGET_SIZE`.
  close: {
    blockSize: sizing.controlMd,
    color: colors.inverseOnSurface,
    inlineSize: sizing.controlMd,
    padding: 0,
  },
  closeGlyph: {
    blockSize: '24px',
    inlineSize: '24px',
  },
  // The action, and the close button after it. Both take the colour set on
  // them and lay their state layer over it, so one set of rules serves the
  // two of them at their two different colours.
  //
  // Their focus ring is drawn inside the control, 2dp in from its edge,
  // where the library's ring stands 2dp outside. The close button is 48dp in
  // a strip 48dp tall, so a ring outside it crossed the strip's top and
  // bottom edges onto the page, in a colour chosen to read on the strip and
  // close to the page by design — 1.07:1 against it in the light scheme.
  // Inside, it is drawn on the strip's fill, where each control's own colour
  // already reads. The action takes the same, so the two rings match.
  control: {
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderRadius: radii.pill,
    borderWidth: 0,
    boxSizing: 'border-box',
    cursor: 'pointer',
    display: 'inline-flex',
    flexShrink: 0,
    justifyContent: 'center',
    outlineColor: 'currentColor',
    outlineOffset: '-4px',
    outlineStyle: { ':focus-visible': 'solid', default: 'none' },
    outlineWidth: '2px',
    // A positioning context for the ripple and the action's target. Nothing
    // here clips: the ripple's surface clips itself to the corner, and the
    // action's target has to reach past the action's box to be pressed.
    position: 'relative',
  },
  // A control's three layers, from React Aria's render state rather than
  // `:hover`, `:focus-visible` and `:active`, for Button's reasons — see its
  // header: a hover layer stayed on after a tap, and no pressed layer showed
  // for a press made from the keyboard. `controlClassName` applies them in
  // the order the pages draw one layer at a time: focus over hover, and a
  // press over both.
  controlFocused: {
    backgroundColor: `color-mix(in srgb, currentColor calc(${stateLayerOpacity.focus} * 100%), transparent)`,
  },
  controlHovered: {
    backgroundColor: `color-mix(in srgb, currentColor calc(${stateLayerOpacity.hover} * 100%), transparent)`,
  },
  controlPressed: {
    backgroundColor: `color-mix(in srgb, currentColor calc(${stateLayerOpacity.pressed} * 100%), transparent)`,
  },
  // The action and the close button, kept together after the message. They
  // share its row while that leaves the message half the strip, and drop
  // onto a line of their own beneath it, at the trailing edge, once they
  // take more — Material Design's two-line snackbar with a longer action,
  // which Compose's `actionOnNewLine` draws the same way, the close button
  // on that line beside the action. Held on one row whatever their length,
  // a long action squeezed the message into a column a word or two wide.
  //
  // The trailing edge is the auto margin: on the message's row the message
  // grows into all the room first and leaves it nothing, and on a row of
  // their own it is all the room there is.
  controls: {
    alignItems: 'center',
    boxSizing: 'border-box',
    display: 'flex',
    flexShrink: 0,
    marginInlineStart: 'auto',
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
  //
  // Its basis is half the strip, which is what decides when the controls
  // drop beneath it — see `controls`. A word longer than the line holds, a
  // file name or a German compound, breaks inside itself rather than running
  // under the controls and past the strip's edge; a word of the reader's
  // language breaks at a syllable where the browser can hyphenate it.
  message: {
    boxSizing: 'border-box',
    color: colors.inverseOnSurface,
    flexBasis: '50%',
    flexGrow: 1,
    fontFamily: typography.bodyMediumFont,
    fontSize: typography.bodyMediumSize,
    fontWeight: typography.bodyMediumWeight,
    hyphens: 'auto',
    letterSpacing: typography.bodyMediumTracking,
    lineHeight: typography.bodyMediumLineHeight,
    marginInline: spacing.sm,
    minInlineSize: 0,
    overflowWrap: 'anywhere',
    paddingBlock: '14px',
  },
  // The region: a landmark pinned to the bottom of the screen with the
  // page's 8dp of margin, and transparent to the pointer so the strip it
  // occupies stays clickable when nothing is in it.
  //
  // The margin is counted from the device's safe area on the three edges the
  // region is pinned to, so a snackbar clears the home indicator. The region
  // is portalled to the body, so a consumer's own safe-area padding never
  // reaches it, and `env()` reads 0 without `viewport-fit=cover`, which
  // leaves every other page as it was. Left and right rather than logical,
  // since the insets are physical.
  region: {
    alignItems: 'center',
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.sm,
    insetBlockEnd: 0,
    insetInline: 0,
    outlineStyle: 'none',
    paddingBlockEnd: `calc(${spacing.sm} + env(safe-area-inset-bottom, 0px))`,
    paddingBlockStart: spacing.sm,
    paddingLeft: `calc(${spacing.sm} + env(safe-area-inset-left, 0px))`,
    paddingRight: `calc(${spacing.sm} + env(safe-area-inset-right, 0px))`,
    pointerEvents: 'none',
    position: 'fixed',
    // Above a modal's scrim — see src/styles/layers.stylex.ts.
    zIndex: layers.toast,
  },
  // The region risen clear of the actions an open overlay holds the bottom
  // edge with: a full-screen dialog's action bar, or a sheet's actions. Its
  // 8dp of margin is then counted from the top of those actions, and the
  // safe area is left out of it, since the strip they hold already reaches
  // the bottom of the window. See src/hooks/useBottomEdge.ts.
  risen: (clearance: string) => ({
    insetBlockEnd: clearance,
    paddingBlockEnd: spacing.sm,
  }),
  // The container: the page's 8dp either side, and nothing above or below,
  // since what sets the height is the message and the close button.
  //
  // Its focus ring is in inverse on surface, drawn inside the fill, 2dp in
  // from the edge. That role is the one made to read on the inverse surface
  // the strip is filled with, and the one made to sit close to the page:
  // drawn outside the strip, as the library's ring is, it was 1.07:1 against
  // the page in the light scheme and 1.41:1 in the dark one, under the 3:1 a
  // focus indicator needs. Still an `outline`, which forced colours keeps.
  toast: {
    alignItems: 'center',
    // Reduced motion zeroes the duration, so the strip arrives in its settled
    // place with the rise never drawn. See `popup` in src/styles/overlay.ts for
    // why all four overlays zero the duration rather than fading. This is the
    // one with no scrim behind it to fade instead, which is the cost of
    // answering the preference the same way in all four.
    animationDuration: {
      '@media (prefers-reduced-motion: reduce)': '0s',
      default: motion.durationMedium1,
    },
    animationName: rise,
    animationTimingFunction: motion.easingEmphasizedDecelerate,
    backgroundColor: colors.inverseSurface,
    // What the strip's edge becomes under forced colours, where the
    // `boxShadow` below is gone and the fill is painted in `Canvas`: a
    // `CanvasText` border, as `popup` in src/styles/overlay.ts draws for
    // every anchored surface. Without it the message sat on the page with
    // nothing at its edge. Inside the size, since the strip is `border-box`.
    borderColor: { default: null, [FORCED_COLORS]: 'CanvasText' },
    borderRadius: radii.xs,
    borderStyle: { default: null, [FORCED_COLORS]: 'solid' },
    borderWidth: { default: null, [FORCED_COLORS]: '1px' },
    boxShadow: shadows.elevation3,
    boxSizing: 'border-box',
    display: 'flex',
    // See `controls`.
    flexWrap: 'wrap',
    inlineSize: '100%',
    maxInlineSize: { default: 'none', [WIDE]: '576px' },
    minBlockSize: sizing.controlMd,
    minInlineSize: { default: 0, [WIDE]: '320px' },
    outlineColor: colors.inverseOnSurface,
    outlineOffset: '-4px',
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
  message: ReactNode
  showCloseButton: boolean
}

type SnackbarOptions = {
  /**
   * A single action shown after the message. Pressing it runs `onPress` and
   * closes the snackbar, which is what the page draws.
   */
  action?: SnackbarAction
  /**
   * Run when the snackbar closes, however it was closed: by its timer, its
   * action or close button, `close`, `clear`, or a newer message added in its
   * place.
   */
  onClose?: () => void
  /**
   * Whether a close button is shown at the end. The page draws one for a
   * message a reader may want out of the way before it expires.
   *
   * Named for what it draws rather than `isDismissable`, which on `Sheet`,
   * `Dialog` and React Aria's modals is whether a press outside them closes
   * them — a snackbar has no outside to press.
   * @default false
   */
  showCloseButton?: boolean
  /**
   * How long the snackbar is shown, in milliseconds. Defaults to five seconds
   * for a message alone. A message with an action defaults to `0` and stays
   * until the action is taken or something closes it, as Material Design asks
   * of an actionable snackbar, since a reader may need longer to reach the
   * action than any timer allows. The timer is paused while the region is
   * hovered or focused, so a message never expires while it is being read.
   *
   * `0` is the page's indefinite length: the snackbar stays until something
   * closes it. Give one of those an action or `showCloseButton`, or there is no
   * way to be rid of it.
   */
  timeout?: number
}

type SnackbarProps = {
  /**
   * What a screen reader calls the region holding the snackbar. Left out,
   * React Aria names the region itself: a count of the messages it holds, in
   * the reader's own locale — "1 notification." in English, and one of some
   * thirty languages otherwise. Pass a name only to replace that, and pass a
   * translated one, since whatever is passed is read as written.
   */
  'aria-label'?: string
  /** A function may compute the class from the region's render state. */
  className?: RACToastRegionProps<SnackbarMessage>['className']
  /**
   * What a screen reader calls the button that dismisses a snackbar. It sits
   * here rather than on a message's own options because it does not vary by
   * message, so putting it there would make every `add` call repeat it. Left
   * out, React Aria names it in the reader's locale — "Close" in English.
   */
  closeLabel?: string
  /** The queue the region shows messages from. */
  queue: SnackbarQueue
  /** A function may compute the style from the region's render state. */
  style?: RACToastRegionProps<SnackbarMessage>['style']
} & Omit<
  RACToastRegionProps<SnackbarMessage>,
  'children' | 'className' | 'queue' | 'style'
>

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

  // The keys of the snackbars not yet closed, which `add` and `clear` close.
  // Kept here because React Aria keeps its own list private, and its own
  // `clear` empties that list without running a single `onClose`.
  readonly #open = new Set<string>()

  constructor() {
    // One at a time, which is what the page shows. `add` closes whatever is
    // up before it adds, so nothing is ever left waiting for this to hold
    // back; it says the same thing to React Aria in its own terms.
    this.rac = new RACToastQueue<SnackbarMessage>({ maxVisibleToasts: 1 })
  }

  /**
   * Shows a message in place of the one on screen, and returns the key that
   * closes it. The message it replaces is closed, so its `onClose` runs, and
   * it does not come back.
   */
  add(message: ReactNode, options: SnackbarOptions = {}) {
    const { action, onClose, showCloseButton = false, timeout } = options
    this.clear()
    const key = this.rac.add(
      { action, message, showCloseButton },
      {
        // However it closes — its timer runs inside React Aria's queue,
        // past this one — it leaves the open set on the way out.
        onClose: () => {
          this.#open.delete(key)
          onClose?.()
        },
        timeout: timeout ?? (action === undefined ? MESSAGE_MS : UNTIL_CLOSED),
      },
    )
    this.#open.add(key)
    return key
  }

  /** Closes the snackbar on screen, running its `onClose`. */
  clear() {
    // Each close runs that message's `onClose`, which deletes its own key
    // from the set — the entry being visited, which a Set allows.
    for (const key of this.#open) {
      this.rac.close(key)
    }
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

// A control's classes, from its own render state — see `controlFocused`.
function controlClassName(style: stylex.StyleXStyles) {
  return (state: {
    isFocusVisible: boolean
    isHovered: boolean
    isPressed: boolean
  }) =>
    stylex.props(
      styles.control,
      style,
      state.isHovered && styles.controlHovered,
      state.isFocusVisible && styles.controlFocused,
      state.isPressed && styles.controlPressed,
    ).className ?? ''
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
 *
 * While a full-screen `Dialog` or a `Sheet` with a footer is open, the region
 * rises to sit above those actions rather than over them, since they share
 * the bottom edge of the window and the snackbar is drawn above both.
 */
function Snackbar({
  closeLabel,
  queue,
  ...props
}: RefAttributes<HTMLDivElement> & SnackbarProps) {
  const clearance = useBottomEdgeClearance()

  return (
    <RACToastRegion<SnackbarMessage>
      queue={queue.rac}
      {...props}
      {...mergeStatefulStyles(
        stylex.props(
          styles.region,
          clearance > 0 && styles.risen(`${clearance}px`),
        ),
        props,
      )}
    >
      {snackbarContent(queue, closeLabel)}
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
      className={controlClassName(style)}
    >
      {children}
      {ripple.surface}
    </RACButton>
  )
}

function snackbarContent(queue: SnackbarQueue, closeLabel: string | undefined) {
  return ({ toast }: { toast: SnackbarToastItem }) => (
    <SnackbarToast
      close={closeToast(queue, toast.key)}
      closeLabel={closeLabel}
      toast={toast}
    />
  )
}

/**
 * The action, the close button, or nothing, after the message — together, so
 * they move beneath it together.
 */
function SnackbarControls({
  action,
  close,
  closeLabel,
  showCloseButton,
}: {
  action: SnackbarAction | undefined
  close: () => void
  closeLabel: string | undefined
  showCloseButton: boolean
}) {
  if (action === undefined && !showCloseButton) {
    return null
  }

  return (
    <div {...stylex.props(styles.controls)}>
      {action === undefined ? null : (
        <SnackbarButton
          onPress={actionPress(action, close)}
          style={styles.action}
        >
          {action.label}
        </SnackbarButton>
      )}
      {showCloseButton ? (
        <SnackbarButton
          aria-label={closeLabel}
          slot="close"
          style={styles.close}
        >
          <CloseGlyph {...stylex.props(styles.closeGlyph)} />
        </SnackbarButton>
      ) : null}
    </div>
  )
}

/** One snackbar: its message, then whatever sits after it. */
function SnackbarToast({
  close,
  closeLabel,
  toast,
}: {
  close: () => void
  closeLabel: string | undefined
  toast: SnackbarToastItem
}) {
  const { action, message, showCloseButton } = toast.content

  return (
    <RACToast toast={toast} {...stylex.props(styles.toast)}>
      <RACToastContent {...stylex.props(styles.message)}>
        <Text slot="title">{message}</Text>
      </RACToastContent>
      <SnackbarControls
        action={action}
        close={close}
        closeLabel={closeLabel}
        showCloseButton={showCloseButton}
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
