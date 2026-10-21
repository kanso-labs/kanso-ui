'use client'

import type {
  HTMLAttributes,
  KeyboardEvent,
  ReactNode,
  RefAttributes,
  RefObject,
} from 'react'
import type {
  ClassNameOrFunction,
  DialogProps,
  DialogTriggerProps,
  HeadingProps,
  ModalOverlayProps,
  PressEvent,
  SheetRenderProps,
  StyleOrFunction,
} from 'react-aria-components'
import type { OverlayTriggerState } from 'react-stately'

import * as stylex from '@stylexjs/stylex'
import {
  createContext,
  useContext,
  useLayoutEffect,
  useMemo,
  useRef,
  useSyncExternalStore,
} from 'react'
import {
  Heading,
  HeadingContext,
  OverlayTriggerStateContext,
  Button as RACButton,
  Sheet as RACSheet,
  SheetContent as RACSheetContent,
  SheetBackdrop,
  SheetOverlay,
  SheetTrigger,
  useSlottedContext,
} from 'react-aria-components'

import { useHoldBottomEdge } from '../../hooks/useBottomEdge'
import { useScrollStop } from '../../hooks/useScrollStop'
import { useMessages } from '../../i18n'
import { OverlayScope } from '../../overlay'
import { mergeRefs } from '../../render/ref'
import { layers } from '../../styles/layers.stylex'
import { mergeStatefulStyles, mergeStyles } from '../../styles/merge'
import { overlay } from '../../styles/overlay'
import {
  colors,
  media,
  radii,
  shadows,
  spacing,
  typography,
} from '../../tokens/design.tokens.stylex'

// Windows High Contrast and the rest of the forced-colours modes. Spelled
// here rather than imported, for the reason src/field/styles.ts records: the
// StyleX compiler resolves a constant across files only out of a `.stylex.ts`
// module, and the generated one holds design tokens rather than queries.
const FORCED_COLORS = '@media (forced-colors: active)'

// One component, two presentations. Above the medium breakpoint it is a side
// sheet pinned to the inline end of the viewport; below it, the same panel
// becomes a bottom sheet. That is the pairing the Material Design pages draw
// rather than two components: a sheet that stayed on the right at 375px would
// be a drawer covering the whole screen.
//
// The two differ in five things and no more: which edge they rest on, which
// two corners are rounded, which axis they arrive and leave along, how much
// of the viewport they may take, and the drag handle, which is the bottom
// sheets page's element alone. Everything inside the panel — the 24 of start
// and end padding, the 12 between the header's elements, the actions area —
// comes from the side sheets page and is drawn the same in both.
//
// **It is React Aria's `Sheet`.** The panel sits on a scroller a viewport
// longer than the window along the axis it arrives on, and the browser's own
// scrolling moves it: a swipe toward the edge it rests on scrolls it out of
// view, which closes it, as the bottom sheets page's swipe down and the side
// sheets page's slide off the edge do. Which edge is a prop rather than a
// style, so the breakpoint is read here in JavaScript, as Dialog's full screen
// is, and the styles below are keyed on the edge React Aria reports rather
// than on the media query. `end` is the right, or the left in a right-to-left
// locale: React Aria reads the locale's direction, not the document's, so a
// right-to-left page sets it through `I18nProvider`, as it does for anything
// drawn in a popover.
//
// **It moves at the browser's pace.** Entry and exit are a smooth scroll, so
// they take the browser's own duration and easing rather than the
// side sheets page's medium 1 and emphasized decelerate: a scroll position is
// what a swipe moves, and timing it in CSS would leave the panel somewhere
// the scroller is not. Under reduced motion React Aria scrolls without
// smoothing, so the panel arrives and leaves in place. The scrim follows the
// scroll through the backdrop's swipe animation, darkening as the panel comes
// in and lifting as a swipe takes it out, and keeps the shared fade under
// reduced motion — see `backdrop` in src/styles/overlay.ts.
const scrimIn = stylex.keyframes({
  from: { opacity: 0 },
  to: { opacity: 1 },
})

// The window sizes the panel is drawn at as a bottom sheet: the medium
// breakpoint, as `media.belowMedium` spells it for the handle below.
const BOTTOM_SHEET = '(width < 600px)'

const REDUCED_MOTION = '(prefers-reduced-motion: reduce)'

// The scrim's range along a sheet with snap points: from closed to the first
// of them, as React Aria counts its swipe animation's range in snap points.
const TO_THE_FIRST_SNAP_POINT = { end: 0 }

// React Aria's overlay is a layer holding the scrim and a scroller, the
// scroller holds the panel, and the panel holds the dialog. The styles are
// split the same way: the layer and the scrim, `panel` and the edge's own
// styles on the panel, and the overlay module's modal dialog style on the
// element that carries the role.
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
    // Spelled out rather than left to the scroll container's own zero, so
    // the body keeps the same size while `bodyHeld` takes the scrolling away.
    minBlockSize: 0,
    // A string with nowhere to break — a long address, a token — wraps
    // rather than running past the body's width, which made the body scroll
    // sideways.
    overflowWrap: 'anywhere',
    overflowY: 'auto',
    paddingBlock: spacing.lg,
    paddingInline: spacing.xl,
  },
  // A bottom sheet resting short of its last snap point. Its body is no
  // scroll container until the sheet is expanded, so a swipe on the content
  // reaches React Aria's scroller and moves the sheet, rather than scrolling
  // the body inside a sheet that has more of itself to show. `clip` rather
  // than `hidden`, which would still be a scroll container: one a swipe
  // cannot move, but a focused control inside it could still scroll.
  bodyHeld: {
    overflowY: 'clip',
  },
  // The bottom sheet: full width, only as tall as its content up to the
  // bottom sheets page's 72 of top margin, and rounded along its top.
  //
  // The page caps a bottom sheet at 640 with 56 of margin beyond, but this
  // presentation only exists below the medium breakpoint, which is already
  // under that cap.
  bottom: {
    // Its top edge under forced colours; see `panel`.
    borderBlockStartColor: { default: null, [FORCED_COLORS]: 'CanvasText' },
    borderBlockStartStyle: { default: null, [FORCED_COLORS]: 'solid' },
    borderBlockStartWidth: { default: null, [FORCED_COLORS]: '1px' },
    borderStartEndRadius: radii.xl,
    borderStartStartRadius: radii.xl,
    inlineSize: '100%',
    maxBlockSize: 'calc(100dvh - 72px)',
    // The safe area on the three edges it meets the screen by.
    paddingBlockEnd: 'env(safe-area-inset-bottom, 0px)',
    paddingLeft: 'env(safe-area-inset-left, 0px)',
    paddingRight: 'env(safe-area-inset-right, 0px)',
  },
  // The side sheets page's bottom actions area: 72 tall, 16 above the buttons
  // and 24 below them, and the buttons starting at the leading edge. The 72
  // is a floor rather than a height, since those paddings around a 40px
  // button come to 80, and a footer holding a second line of actions grows
  // further still.
  //
  // Actions that do not fit on one row wrap onto another, 8dp below and
  // still from the leading edge, each at its own one-line width. Held to one
  // row, two actions with long translated labels were squeezed into pills of
  // two and three lines instead, against the page's single-line label.
  footer: {
    borderBlockStartColor: colors.outlineVariant,
    borderBlockStartStyle: 'solid',
    borderBlockStartWidth: '1px',
    boxSizing: 'border-box',
    display: 'flex',
    flexShrink: 0,
    flexWrap: 'wrap',
    gap: spacing.sm,
    justifyContent: 'flex-start',
    minBlockSize: '72px',
    paddingBlockEnd: spacing.xl,
    paddingBlockStart: spacing.lg,
    paddingInline: spacing.xl,
  },
  // The bottom sheets page's drag handle: a 32 by 4 bar in on surface
  // variant, centred, with 22 above and below it. Drawn on the bottom sheet
  // alone, since it is that page's element — above the breakpoint the panel
  // is a side sheet, and the same markup draws nothing. The query is the one
  // `BOTTOM_SHEET` reads, so the two agree on which sheet this is.
  handle: {
    alignItems: 'center',
    boxSizing: 'border-box',
    display: { default: 'none', [media.belowMedium]: 'flex' },
    flexShrink: 0,
    justifyContent: 'center',
    paddingBlock: '22px',
  },
  // `CanvasText` under forced colours, which otherwise paints the bar in the
  // same `Canvas` as the panel it sits on. Kept by opting the bar out of the
  // mode, since a system colour named as a background is repainted too.
  handleBar: {
    backgroundColor: {
      default: colors.onSurfaceVariant,
      [FORCED_COLORS]: 'CanvasText',
    },
    blockSize: '4px',
    // 9999 on a 4dp bar resolves to the page's own 2dp corner.
    borderRadius: radii.pill,
    boxSizing: 'border-box',
    forcedColorAdjust: { default: null, [FORCED_COLORS]: 'none' },
    inlineSize: '32px',
  },
  // The handle of a sheet with snap points: a button around the bar, at the
  // page's 48 target. The 22 above and below the 4 bar are that target's
  // height already, so the button takes the row's height in place of them,
  // and the bar is where it was.
  //
  // Its focus ring is drawn just inside its edge, since the panel clips what
  // lies past its own top edge and the button starts there. The circle that
  // leaves still clears the bar's ends, 16 from its centre against the
  // ring's 22.
  handleButton: {
    alignItems: 'center',
    backgroundColor: 'transparent',
    blockSize: '48px',
    borderRadius: radii.pill,
    borderStyle: 'none',
    boxSizing: 'border-box',
    cursor: 'pointer',
    display: 'flex',
    inlineSize: '48px',
    justifyContent: 'center',
    margin: 0,
    outlineColor: colors.primary,
    outlineOffset: '-2px',
    outlineStyle: { ':focus-visible': 'solid', default: 'none' },
    outlineWidth: '2px',
    padding: 0,
  },
  handleHolding: {
    paddingBlock: 0,
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
  // The layer the scrim and the panel are drawn in. React Aria positions it
  // over the whole page; what is the library's own is the layer it takes —
  // see src/styles/layers.stylex.ts.
  layer: {
    boxSizing: 'border-box',
    zIndex: layers.modal,
  },
  // What both presentations share. React Aria places the panel on its
  // scroller, against the edge it rests on, so none of this pins it.
  panel: {
    backgroundColor: colors.surfaceContainerLow,
    // What the panel's edge becomes under forced colours is a border on the
    // content-facing edge alone, the one whose corners are rounded: that
    // mode drops box shadows outright and paints backgrounds in `Canvas`,
    // the panel's fill and the scrim behind it alike, so the panel would be
    // the page's own colour laid over the page's own colour with nothing at
    // its edge. A `CanvasText` border is what `popup` in
    // src/styles/overlay.ts draws for the same reason. The other edges meet
    // the edge of the screen, where a border would frame the viewport rather
    // than the panel. Inside the size rather than around it, since the panel
    // is `border-box`, and none of it is drawn while forced colours are off.
    // `bottom` and `side` each draw their own edge.
    boxShadow: shadows.elevation1,
    boxSizing: 'border-box',
    color: colors.onSurface,
    display: 'flex',
    flexDirection: 'column',
    // Clips the body's scroll to the rounded corners. `clip` rather than
    // `hidden`, which would make the panel a scroll container: the dialog
    // inside it is what React Aria's view timeline follows across the
    // scroller, and the timeline takes the nearest scroll container around
    // its subject, so the scrim's fade would read the panel instead and
    // stand still, or hold the scrim clear behind a tall bottom sheet.
    overflow: 'clip',
  },
  // The side sheet: the side sheets page's 400 max-width, which the modal
  // side sheet is always at, the whole height of the window, and rounded
  // down the edge that faces the content.
  //
  // Logical corners and border, since React Aria gives the panel the
  // locale's direction: the content-facing edge is the inline start in
  // both, the left of a sheet on the right and the right of one on the left.
  side: {
    blockSize: '100%',
    borderEndStartRadius: radii.lg,
    borderInlineStartColor: { default: null, [FORCED_COLORS]: 'CanvasText' },
    borderInlineStartStyle: { default: null, [FORCED_COLORS]: 'solid' },
    borderInlineStartWidth: { default: null, [FORCED_COLORS]: '1px' },
    borderStartStartRadius: radii.lg,
    inlineSize: '400px',
    // The safe area on the top and the bottom, which it runs between; the
    // edge it rests against is `sideLeft`'s or `sideRight`'s.
    paddingBlockEnd: 'env(safe-area-inset-bottom, 0px)',
    paddingBlockStart: 'env(safe-area-inset-top, 0px)',
  },
  // The safe area on the edge a side sheet rests against. Physical, as the
  // edge is: a panel is portalled to the body, so a consumer's own safe-area
  // padding never reaches it, and `env()` reads 0 without
  // `viewport-fit=cover`, which leaves every other page as it was.
  sideLeft: {
    paddingLeft: 'env(safe-area-inset-left, 0px)',
  },
  sideRight: {
    paddingRight: 'env(safe-area-inset-right, 0px)',
  },
  // The headline in the role the side sheets page gives it, on surface
  // variant, rather than the on surface the body's text takes.
  //
  // It is the part of the header's row that gives way. As a flex item it
  // would otherwise keep its longest word's width as its least one, so a
  // single long word, which a German compound easily is, pushed the close
  // button past the panel's edge, where the panel clipped it; the headline
  // now shrinks and breaks that word instead, and the button keeps its size
  // and its place, as Dialog's does.
  title: {
    boxSizing: 'border-box',
    color: colors.onSurfaceVariant,
    fontFamily: typography.titleLargeFont,
    fontSize: typography.titleLargeSize,
    fontWeight: typography.titleLargeWeight,
    letterSpacing: typography.titleLargeTracking,
    lineHeight: typography.titleLargeLineHeight,
    margin: 0,
    minInlineSize: 0,
    overflowWrap: 'anywhere',
  },
})

// Whether the window is at the size the bottom sheet is drawn at, and whether
// its reader asked for less motion, each kept current. False on the server,
// where there is no window and nothing is open.
function isBottomSheet() {
  return window.matchMedia(BOTTOM_SHEET).matches
}

function isReducedMotion() {
  return window.matchMedia(REDUCED_MOTION).matches
}

/**
 * Moves the sheet whose handle was pressed to its next snap point, or from
 * the last back to the first. React Aria offers no call that moves a sheet,
 * so this scrolls its scroller as React Aria does to open the sheet at the
 * first: React Aria places a marker in the panel for each snap point, and a
 * scroll that rests a marker one viewport below the scroller's top leaves
 * that snap point showing. The markers are `[data-sheet-detent]`, in the
 * order the snap points were given, and they are React Aria's markup rather
 * than its API — a release that renames them leaves the handle pressing
 * nothing, which the handle's tests are there to say.
 *
 * Which snap point the sheet is at is the marker whose resting scroll lies
 * nearest the scroller's own, so a press after a swipe moves on from where
 * the swipe left the sheet.
 */
function moveToNextSnapPoint({ target }: PressEvent) {
  const scroller = target.closest('[data-sheet-scroll]')
  if (!(scroller instanceof HTMLElement)) {
    return
  }
  // Where the scroller's content starts, in the window's coordinates.
  const origin = scroller.getBoundingClientRect().top - scroller.scrollTop
  const stops = [...scroller.querySelectorAll('[data-sheet-detent]')].map(
    (marker) =>
      marker.getBoundingClientRect().top -
      origin -
      Number.parseFloat(getComputedStyle(marker).scrollMarginTop),
  )
  if (stops.length === 0) {
    return
  }
  const distances = stops.map((stop) => Math.abs(stop - scroller.scrollTop))
  const at = distances.indexOf(Math.min(...distances))
  scroller.scrollTo({
    behavior: isReducedMotion() ? 'auto' : 'smooth',
    top: stops[(at + 1) % stops.length],
  })
}

function onServer() {
  return false
}

// The panel's styles for the edge React Aria rests it on. `top` and `center`
// are positions React Aria offers and this never asks for.
function panelStyles({ position }: SheetRenderProps) {
  return stylex.props(
    styles.panel,
    position === 'bottom' ? styles.bottom : styles.side,
    position === 'left' && styles.sideLeft,
    position === 'right' && styles.sideRight,
  )
}

function subscribeTo(query: string) {
  return (listener: () => void) => {
    const list = window.matchMedia(query)
    list.addEventListener('change', listener)
    return () => {
      list.removeEventListener('change', listener)
    }
  }
}

const subscribeToBottomSheet = subscribeTo(BOTTOM_SHEET)
const subscribeToReducedMotion = subscribeTo(REDUCED_MOTION)

// Where a bottom sheet with snap points rests: at its last, `expanded`, or
// short of it, `collapsed`. Content sets it from React Aria's render state,
// and the handle and the body read it. Null in a sheet without snap points,
// whose handle is decoration and whose body always scrolls.
type SnapState = 'collapsed' | 'expanded' | null

const SnapContext = createContext<SnapState>(null)

/**
 * The dialog's element, given a key handler for Escape. React Aria's sheet
 * has one switch for every way out, so where this sheet's two settings
 * disagree about Escape the handler answers for it: `close` closes the sheet
 * React Aria is holding open, and `hold` keeps Escape from the overlay that
 * would close it. Either way the key goes no further, as it would not have
 * from React Aria's own handler.
 */
function escapeKeyOn(
  escape: 'close' | 'hold',
  state: null | OverlayTriggerState,
  render: DialogProps['render'],
): NonNullable<DialogProps['render']> {
  return (props, renderProps) => {
    const next = {
      ...props,
      onKeyDown: (event: KeyboardEvent<HTMLElement>) => {
        props.onKeyDown?.(event)
        if (
          event.key !== 'Escape' ||
          event.nativeEvent.isComposing ||
          // A key from an overlay opened inside this one reaches here through
          // React's tree, though that overlay is portalled out over this one,
          // and is that overlay's to answer.
          !(
            event.target instanceof Node &&
            event.currentTarget.contains(event.target)
          )
        ) {
          return
        }
        event.stopPropagation()
        if (escape === 'close') {
          event.preventDefault()
          state?.close()
        }
      },
    }
    return render === undefined ? (
      <section {...next} />
    ) : (
      render(next, renderProps)
    )
  }
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
 *
 * ```tsx
 * <Sheet>
 *   <Button>Open</Button>
 *   <Sheet.Content>
 *     <Sheet.Handle />
 *     <Sheet.Header>
 *       <Sheet.Title>Headline</Sheet.Title>
 *     </Sheet.Header>
 *     <Sheet.Body>Supporting line</Sheet.Body>
 *     <Sheet.Footer>
 *       <Button slot="close">Close</Button>
 *     </Sheet.Footer>
 *   </Sheet.Content>
 * </Sheet>
 * ```
 *
 * `Sheet` is the trigger's half, so a sheet nothing on the page opens — one
 * a route shows, or a menu item raises — leaves it out and passes `isOpen`
 * and `onOpenChange` to `Sheet.Content` instead. Wrapped in `Sheet` with no
 * button inside it, React Aria warns that its press responder found nothing
 * to press.
 *
 * ```tsx
 * <Sheet.Content isOpen={isOpen} onOpenChange={setOpen}>
 *   …
 * </Sheet.Content>
 * ```
 *
 * Tab stays inside an open sheet, so a `Snackbar` shown meanwhile is reached
 * with F6, which React Aria uses to move between landmarks. Tabbing on past
 * the snackbar's last control leads back into the sheet.
 */
function Sheet({ children, ...props }: SheetProps) {
  return <SheetTrigger {...props}>{children}</SheetTrigger>
}

function SheetBody({
  ref: callerRef,
  ...props
}: HTMLAttributes<HTMLDivElement> & RefAttributes<HTMLDivElement>) {
  const ref = useRef<HTMLDivElement>(null)
  const snap = useContext(SnapContext)
  // A body its content runs past is a tab stop named by the title, so a
  // keyboard can scroll it, when nothing inside it takes focus; a call
  // site's own name, role and tabIndex still win. See useScrollStop.
  const title = useSlottedContext(HeadingContext, 'title')
  const scrollStop = useScrollStop(ref, {
    label: props['aria-label'],
    title: title?.id,
  })
  // The body measures itself through its own ref, and the call site's lands
  // on the same element.
  const merged = useMemo(
    () => mergeRefs(ref, callerRef ?? undefined),
    [callerRef],
  )

  return (
    <div
      {...scrollStop}
      {...props}
      ref={merged}
      {...mergeStyles(
        stylex.props(
          styles.body,
          snap === 'collapsed' && styles.bodyHeld,
          overlay.modalBodyRing,
        ),
        props,
      )}
    />
  )
}

/**
 * The panel itself, and the scrim behind it. Everything the sheet shows goes
 * in here; the trigger stays outside it, since the trigger lives in the page
 * while this is portalled out to the end of the body.
 *
 * A swipe toward the edge the panel rests on closes it — down on a bottom
 * sheet, toward the screen's edge on a side sheet — as do a press on the
 * scrim, Escape and a `slot="close"` button. `isDismissable` holds the first
 * two, and `isKeyboardDismissDisabled` holds Escape. React Aria's default for
 * the scrim is the reverse of this one: a sheet that ignores a tap outside it
 * reads as stuck.
 *
 * Inside `Sheet`, the open state is the trigger's. On its own, with no
 * trigger, it is this part's: `isOpen` with `onOpenChange` controls it, and
 * a swipe, a `slot="close"` button, Escape and the scrim all report through
 * `onOpenChange`, as they would to `Sheet`.
 *
 * The sheet draws at `z-index: 900`, the scrim and the panel over it, over
 * any page content layered below that, such as a sticky header. A
 * `Snackbar` draws at 1000, so a toast raised from inside the sheet is read
 * over it, and React Aria's popovers and menus draw above both.
 *
 * React Aria lays the sheet over the page from the page's own top-left
 * corner rather than fixing it to the window, so a `container` inside a
 * positioned element holds the sheet to that element instead.
 */
function SheetContent({
  children,
  className,
  container,
  defaultOpen,
  isDismissable = true,
  isKeyboardDismissDisabled = false,
  isOpen,
  onOpenChange,
  ref,
  snapPoints,
  style,
  ...props
}: RefAttributes<HTMLDivElement> & SheetContentProps) {
  const isBottom = useSyncExternalStore(
    subscribeToBottomSheet,
    isBottomSheet,
    onServer,
  )
  const isReduced = useSyncExternalStore(
    subscribeToReducedMotion,
    isReducedMotion,
    onServer,
  )
  const position = isBottom ? 'bottom' : 'end'
  // The heights are the bottom sheet's alone; a side sheet has one width.
  const heights =
    isBottom && snapPoints !== undefined && snapPoints.length > 0
      ? snapPoints
      : undefined
  const overlayRef = useRef<HTMLDivElement>(null)
  useRestOnTurn(overlayRef, position)
  // React Aria holds Escape whenever it holds the scrim and the swipe, so
  // the two settings disagreeing is where the dialog answers for Escape.
  let escape: 'close' | 'hold' | undefined
  if (isDismissable === isKeyboardDismissDisabled) {
    escape = isKeyboardDismissDisabled ? 'hold' : 'close'
  }

  return (
    <OverlayScope>
      <SheetOverlay
        defaultOpen={defaultOpen}
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        position={position}
        preventDismissal={!isDismissable}
        ref={overlayRef}
        snapPoints={heights}
        // oxlint-disable-next-line typescript/no-deprecated -- its replacement, UNSAFE_PortalProvider, is not exported by react-aria-components
        UNSTABLE_portalContainer={container}
        {...stylex.props(styles.layer)}
      >
        <SheetBackdrop
          // The shared fade instead under reduced motion, where the panel
          // arrives without moving and the scrim is all that says so.
          swipeAnimation={isReduced ? undefined : scrimIn}
          // Whole once the panel reaches its first snap point rather than
          // only once all of it shows, so a collapsed sheet holds the page
          // behind the same scrim an expanded one does, and a swipe below
          // that point is what lifts it.
          swipeAnimationRange={
            heights === undefined ? undefined : TO_THE_FIRST_SNAP_POINT
          }
          {...stylex.props(overlay.backdrop)}
        />
        <RACSheet
          // The panel, where the call site's class and style land, rather than
          // the dialog inside it, which takes the rest of the props.
          ref={ref}
          {...mergeStatefulStyles(panelStyles, { className, style })}
        >
          {({ isExpanded }) => {
            let snap: SnapState = null
            if (heights !== undefined) {
              snap = isExpanded ? 'expanded' : 'collapsed'
            }
            return (
              <SnapContext value={snap}>
                <SheetDialog escape={escape} {...props}>
                  {children}
                </SheetDialog>
              </SnapContext>
            )
          }}
        </RACSheet>
      </SheetOverlay>
    </OverlayScope>
  )
}

// The element with the dialog role, inside the overlay so it can reach the
// open state React Aria holds there.
function SheetDialog({
  escape,
  render,
  ...props
}: DialogProps & { escape: 'close' | 'hold' | undefined }) {
  const state = useContext(OverlayTriggerStateContext)

  return (
    <RACSheetContent
      {...props}
      render={
        escape === undefined ? render : escapeKeyOn(escape, state, render)
      }
      {...stylex.props(overlay.modalDialog)}
    />
  )
}

/**
 * The sheet's actions. The panel rests on the window's bottom edge in both
 * presentations, so they sit on that edge, and a toast rises clear of them
 * while the sheet is open rather than lying over its buttons. A side sheet's
 * are included: the toast is centred in the window, and on any window
 * narrower than about 1376px its 576 reach into the sheet's 400.
 */
function SheetFooter({
  ref: callerRef,
  ...props
}: HTMLAttributes<HTMLDivElement> & RefAttributes<HTMLDivElement>) {
  const ref = useRef<HTMLDivElement>(null)
  useHoldBottomEdge(ref, true)
  // The footer measures itself through its own ref, and the call site's
  // lands on the same element.
  const merged = useMemo(
    () => mergeRefs(ref, callerRef ?? undefined),
    [callerRef],
  )

  return (
    <div
      {...props}
      ref={merged}
      {...mergeStyles(stylex.props(styles.footer), props)}
    />
  )
}

/**
 * The bottom sheets page's drag handle: a short bar above the sheet's
 * content, saying the panel is a bottom sheet that a swipe moves. Place it
 * first inside `Sheet.Content`; above the medium breakpoint the panel is a
 * side sheet and this draws nothing.
 *
 * On a sheet given `snapPoints` it is a button, as the bottom sheets page
 * asks of a handle that moves the sheet between heights: a press, from a
 * pointer, a keyboard or assistive technology, moves the sheet to its next
 * snap point, from the last back to the first, and `aria-expanded` says
 * whether it rests at the last. It is called "Drag handle" in the locale's
 * own words, and a call site's `aria-label` names it instead. Its 48 square
 * is the page's target, centred over the bar.
 *
 * On a sheet without them it is decoration, hidden from assistive
 * technology: the panel has one height, and the swipe the bar points at
 * takes it from anywhere on the panel, so a control here would offer
 * nothing a swipe, the scrim, Escape or a `slot="close"` button does not.
 */
function SheetHandle({
  'aria-label': label,
  ...props
}: HTMLAttributes<HTMLDivElement> & RefAttributes<HTMLDivElement>) {
  const snap = useContext(SnapContext)
  const messages = useMessages()
  const bar = <span {...stylex.props(styles.handleBar)} />

  if (snap === null) {
    return (
      <div
        aria-hidden="true"
        aria-label={label}
        {...props}
        {...mergeStyles(stylex.props(styles.handle), props)}
      >
        {bar}
      </div>
    )
  }

  return (
    <div
      {...props}
      {...mergeStyles(stylex.props(styles.handle, styles.handleHolding), props)}
    >
      <RACButton
        aria-expanded={snap === 'expanded'}
        aria-label={label ?? messages.dragHandle}
        onPress={moveToNextSnapPoint}
        {...stylex.props(styles.handleButton)}
      >
        {bar}
      </RACButton>
    </div>
  )
}

function SheetHeader(
  props: HTMLAttributes<HTMLDivElement> & RefAttributes<HTMLDivElement>,
) {
  return <div {...props} {...mergeStyles(stylex.props(styles.header), props)} />
}

/**
 * Names the sheet. Rendered through React Aria's title slot, which is what
 * points the dialog's `aria-labelledby` at it — a sheet without one announces
 * itself as an unnamed dialog.
 */
function SheetTitle(
  props: RefAttributes<HTMLHeadingElement> & SheetTitleProps,
) {
  return (
    <Heading
      slot="title"
      {...props}
      {...mergeStyles(stylex.props(styles.title), props)}
    />
  )
}

/**
 * Puts an open panel back where it rests when the window crosses the
 * breakpoint. Its scroller runs along the axis the panel arrives on, so a
 * side sheet turned into a bottom sheet kept the side sheet's scroll, which on
 * the new axis is the closed position: the panel stayed open below the
 * window, and its scrim went on holding the page. A panel resting against the
 * end of its scroller — a bottom sheet, a sheet on the right — goes to the
 * end, and a sheet on the left to the start, without the smooth scroll its
 * arrival takes, since it is not arriving.
 *
 * A layout effect, so the panel is back before the frame is drawn and before
 * React Aria's observer can see it gone; the parent's, so it runs after
 * React Aria has set the scroller up for the new edge.
 */
function useRestOnTurn(
  overlayRef: RefObject<HTMLDivElement | null>,
  position: 'bottom' | 'end',
) {
  const previous = useRef(position)

  useLayoutEffect(() => {
    if (previous.current === position) {
      return
    }
    previous.current = position
    const layer = overlayRef.current
    const scroller = layer?.querySelector('[data-sheet-scroll]')
    if (!(layer instanceof HTMLElement && scroller instanceof HTMLElement)) {
      return
    }
    const edge = layer.dataset.position
    if (edge === 'bottom') {
      scroller.scrollTo({ top: scroller.scrollHeight })
    } else {
      scroller.scrollTo({ left: edge === 'left' ? 0 : scroller.scrollWidth })
    }
  }, [overlayRef, position])
}

Sheet.Body = SheetBody
Sheet.Content = SheetContent
Sheet.Footer = SheetFooter
Sheet.Handle = SheetHandle
Sheet.Header = SheetHeader
Sheet.Title = SheetTitle

// The dialog's own props, plus the overlay's open state and dismissal
// settings and the panel's styling. A call site has no reason to know there
// are four elements: `className` and `style` reach the panel, which is the
// one worth restyling, the open state and the dismissal settings reach the
// overlay, and everything else lands on the dialog.
//
// The two dismissal settings are declared here rather than picked with their
// siblings, since React Aria's sheet has neither: one switch holds every way
// out of it, and these split the keyboard from the pointer as the rest of the
// library's modals do.
type SheetContentProps = Omit<DialogProps, 'className' | 'style'> &
  Pick<ModalOverlayProps, 'defaultOpen' | 'isOpen' | 'onOpenChange'> & {
    /** A function may compute the class from the panel's render state. */
    className?: ClassNameOrFunction<SheetRenderProps>
    /**
     * Where to portal the panel and scrim. Defaults to the container of the
     * `ThemeScope` around it, which keeps the sheet on that scope's tokens, or
     * to the end of `<body>` where there is none. A subtree themed through the
     * `themeScope` class has no container of its own, so point this inside it,
     * or the sheet renders outside and keeps the page's tokens.
     */
    container?: Element
    /**
     * Whether a press on the scrim, outside the panel, or a swipe toward the
     * edge it rests on closes the sheet. `true` here where React Aria's own
     * default for the scrim is `false`, since a sheet that ignores a tap
     * outside it reads as stuck. Escape is `isKeyboardDismissDisabled`'s, and
     * this says nothing about it.
     * @default true
     */
    isDismissable?: boolean
    /**
     * Whether Escape is kept from closing the sheet. The scrim and the swipe
     * are `isDismissable`'s, and this says nothing about them.
     * @default false
     */
    isKeyboardDismissDisabled?: boolean
    /**
     * The heights a bottom sheet rests at, each the amount of the panel
     * showing: a number of pixels, or a percentage of the panel's own
     * height. The sheet opens at the first, a swipe moves it between them,
     * and a press on `Sheet.Handle` moves it to the next, from the last
     * back to the first. React Aria's own prop, under its own name.
     *
     * End on `'100%'` for a sheet that can show all of itself: its body
     * scrolls only while the whole panel is showing, and short of that a
     * swipe on the body moves the sheet instead. The side sheet has one
     * width and ignores them.
     */
    snapPoints?: Array<number | string>
    /** A function may compute the style from the panel's render state. */
    style?: StyleOrFunction<SheetRenderProps>
  }

type SheetProps = Omit<DialogTriggerProps, 'children'> & {
  children?: ReactNode
}

type SheetTitleProps = HeadingProps

export type { SheetContentProps, SheetProps, SheetTitleProps }

export {
  SheetBody,
  SheetContent,
  SheetFooter,
  SheetHandle,
  SheetHeader,
  SheetTitle,
}

export default Sheet
