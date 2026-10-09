'use client'

import type { ReactNode, RefAttributes, RefObject } from 'react'
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
  useRef,
  useState,
} from 'react'
import {
  ButtonContext,
  DEFAULT_SLOT,
  Dialog,
  DialogContext,
  DialogTrigger,
  Heading,
  HeadingContext,
  OverlayTriggerStateContext,
  PreviewTrigger,
  Popover as RACPopover,
  Text,
  TextContext,
} from 'react-aria-components'

import type { OverlayAlign, OverlaySide } from '../../styles/overlay'

import { focus } from '../../styles/focus'
import { mergeStatefulStyles, mergeStyles } from '../../styles/merge'
import { overlay, placementOf, popupOrigin } from '../../styles/overlay'
import { colors, spacing, typography } from '../../tokens/design.tokens.stylex'

// The gap between the anchor and the panel, matching `spacing.sm`'s default.
// A number rather than the token, because React Aria computes the position in
// JavaScript and so cannot read a CSS custom property — this is the one place
// in the component where a step of the spacing scale is spelled out. React
// Aria's own default is 8 as well, but the value is this component's decision
// rather than an inherited one.
const DEFAULT_SIDE_OFFSET = 8

// The surface, its entry and the dialog's focus ring are the overlay module's,
// shared with every anchored overlay; what is here is Popover's own — its
// inset, its two widths, and the type of its title and description.
//
// Popover has no page of its own, so the inset and the type follow the rich
// tooltip, the nearest thing the Material Design pages draw: a plain rounded
// panel offset from its anchor, with no caret drawn between the two, holding
// a subhead over supporting text.
//
// React Aria's popover is two elements — the positioned panel and the dialog
// inside it — so the styles are split the same way: the surface, `content`
// and a size on the panel, the dialog style on the element that carries the
// role.
const styles = stylex.create({
  // The rich tooltip's inset: 12 above, 8 below and 16 at the sides. The
  // surface leaves it out, since a menu's items run to its edges.
  content: {
    paddingBlockEnd: spacing.sm,
    paddingBlockStart: spacing.md,
    paddingInline: spacing.lg,
  },
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
  // The width belongs to the size rather than to the surface, the same split
  // Sheet makes: StyleX merges a property whole, so one unconditional
  // `maxInlineSize` on the shared style would be replaced outright by
  // whichever size applied after it. Capped at the viewport as well, so a
  // panel wider than the screen is narrowed rather than clipped by it.
  md: { maxInlineSize: 'min(320px, 100vw)' },
  sm: { maxInlineSize: 'min(240px, 100vw)' },
  // The rich tooltip's subhead: title-small, in the same on surface variant
  // as the supporting text under it.
  title: {
    boxSizing: 'border-box',
    color: colors.onSurfaceVariant,
    fontFamily: typography.titleSmallFont,
    fontSize: typography.titleSmallSize,
    fontWeight: typography.titleSmallWeight,
    letterSpacing: typography.titleSmallTracking,
    lineHeight: typography.titleSmallLineHeight,
    margin: 0,
  },
})

// How long a pointer rests on the trigger before a hovered popover opens,
// and how long it has to leave before it closes. React Aria's own defaults,
// spelled out because they are the whole feel of a hover trigger and worth
// finding in the component rather than in a changelog.
const DEFAULT_HOVER_DELAY = 600
const DEFAULT_HOVER_CLOSE_DELAY = 200

// The overlay module's, since which side a surface opens on is the same
// question for every anchored overlay. Aliased rather than re-declared so
// the names a call site imports stay this component's.
type PopoverAlign = OverlayAlign

type PopoverSide = OverlaySide

type PopoverSize = 'md' | 'sm'

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

// The same for the title, which the non-modal panel names itself by — see
// PanelDialog. React Aria's own Dialog finds its title by looking for it;
// the panel here is told it is there.
const TitleContext = createContext<() => () => void>(() => () => {})

// The text slot the description fills, with the default beside it so a
// plain `Text` still renders. Hoisted, since it never changes.
const TEXT_SLOTS = {
  slots: { [DEFAULT_SLOT]: {}, description: {} },
}

type PopoverProps = Omit<DialogTriggerProps, 'children'> & {
  children?: ReactNode
  /**
   * How long the pointer has to leave a hovered popover before it closes, in
   * milliseconds. Ignored by a pressed one.
   * @default 200
   */
  closeDelay?: number
  /**
   * How long the pointer has to rest on the trigger before a hovered popover
   * opens, in milliseconds. Ignored by a pressed one.
   * @default 600
   */
  delay?: number
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
  /**
   * What opens the panel: a press, or a pointer resting on the trigger.
   * `hover` is the tooltips page's rich tooltip — it opens on hover, focus
   * or a long press, and stays open while the pointer is inside it, so the
   * panel's own buttons and links can be reached.
   * @default 'press'
   */
  trigger?: PopoverTrigger
}

type PopoverTrigger = 'hover' | 'press'

/**
 * The element that carries the dialog role in a non-modal popover: what
 * React Aria's `Dialog` gives a modal one — the role, the name from the
 * title, the description, and the close slot — without the two things that
 * make `Dialog` a modal's.
 *
 * `Dialog` moves focus into itself as it mounts, whatever opened it, and
 * holds focus inside the overlay until it closes. A hover popover therefore
 * took focus from wherever the reader was typing the moment a pointer
 * rested on its trigger, and Tab in an open popover went round its own
 * controls forever, though the page behind a non-modal popover is meant to
 * stay in reach. Here a pressed popover still takes focus as it opens, since
 * a press asked for the panel, but a hovered one leaves it where it is, and
 * Tab past the panel's last control carries on from the trigger in the
 * page. React Aria's popover sees a dialog inside it and so adds no role or
 * focus handling of its own.
 */
function PanelDialog({
  'aria-labelledby': labelledBy,
  children,
  id,
  // React Aria's render prop is the one part of a dialog's props this
  // element cannot honour, being an element of its own rather than React
  // Aria's; left out rather than spread onto the DOM.
  render: _render,
  slot,
  ...props
}: Omit<
  PopoverContentProps,
  | 'align'
  | 'alignOffset'
  | 'className'
  | 'container'
  | 'side'
  | 'sideOffset'
  | 'style'
  | 'triggerRef'
>) {
  const ref = useRef<HTMLElement>(null)
  const state = useContext(OverlayTriggerStateContext)
  // What the trigger hands its overlay: the id the trigger's
  // `aria-controls` points at, and the trigger itself as the name of a
  // panel with no title. A hover trigger hands nothing, and is a hover
  // trigger for exactly that reason.
  const trigger = triggerOf(useContext(DialogContext))
  const pressed = trigger !== undefined

  const titleId = useId()
  const [titled, setTitled] = useState(false)
  const registerTitle = useCallback(() => {
    setTitled(true)
    return () => {
      setTitled(false)
    }
  }, [])
  const headings = useMemo(
    () => ({
      slots: { [DEFAULT_SLOT]: {}, title: { id: titleId, level: 2 } },
    }),
    [titleId],
  )
  const buttons = useMemo(
    () => ({
      slots: {
        close: {
          onPress: () => {
            state?.close()
          },
        },
        [DEFAULT_SLOT]: {},
      },
    }),
    [state],
  )

  useEffect(() => {
    const element = ref.current
    if (
      pressed &&
      element !== null &&
      !element.contains(document.activeElement)
    ) {
      element.focus({ preventScroll: true })
    }
  }, [pressed])

  return (
    // A section with the role, as React Aria's own dialog is: a `<dialog>`
    // element brings the browser's own positioning, border, padding and top
    // layer, all of which the panel around it already decides.
    <section
      {...props}
      aria-labelledby={labelledBy ?? (titled ? titleId : trigger?.labelledBy)}
      id={id ?? trigger?.id}
      ref={ref}
      // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role -- a `<dialog>` element would bring the browser's own positioning and top layer, which the panel around it already decides
      role="dialog"
      slot={slot ?? undefined}
      tabIndex={-1}
      {...stylex.props(overlay.popupDialog, focus.ring)}
    >
      <HeadingContext value={headings}>
        <TextContext value={TEXT_SLOTS}>
          <ButtonContext value={buttons}>
            <TitleContext value={registerTitle}>{children}</TitleContext>
          </ButtonContext>
        </TextContext>
      </HeadingContext>
    </section>
  )
}

// React Aria names a placement by the side and, along it, the end the panel
// is aligned to — `bottom start`, or `left top` on the sides where the axis
// runs the other way.
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
  closeDelay = DEFAULT_HOVER_CLOSE_DELAY,
  delay = DEFAULT_HOVER_DELAY,
  modal = false,
  size = 'md',
  trigger = 'press',
  ...props
}: PopoverProps) {
  // A hovered popover is React Aria's preview trigger, which is a different
  // element around the same parts rather than a mode of the pressed one: it
  // opens from hover, focus or a long press, and it is always non-modal,
  // since a panel that blocked the page while the pointer merely rested on
  // something would be a trap. `modal` is ignored there rather than
  // refused, so the content draws the non-modal panel whatever it says.
  const context = useMemo(
    () => ({ modal: modal && trigger !== 'hover', size }),
    [modal, size, trigger],
  )

  if (trigger === 'hover') {
    return (
      <PopoverContext value={context}>
        <PreviewTrigger closeDelay={closeDelay} delay={delay} {...props}>
          {children}
        </PreviewTrigger>
      </PopoverContext>
    )
  }

  return (
    <PopoverContext value={context}>
      <DialogTrigger {...props}>{children}</DialogTrigger>
    </PopoverContext>
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
  ref,
  side = 'bottom',
  sideOffset = DEFAULT_SIDE_OFFSET,
  style,
  triggerRef,
  ...props
}: PopoverContentProps & RefAttributes<HTMLElement>) {
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
      // The surface, where the call site's class and style land, rather than
      // the dialog inside it, which takes the rest of the props.
      ref={ref}
      triggerRef={triggerRef}
      // oxlint-disable-next-line typescript/no-deprecated -- its replacement, UNSAFE_PortalProvider, is not exported by react-aria-components
      UNSTABLE_portalContainer={container}
      {...mergeStatefulStyles(
        (state: PopoverRenderProps) =>
          stylex.props(
            overlay.popup,
            styles.content,
            styles[size],
            popupOrigin(state.placement),
          ),
        { className, style },
      )}
    >
      {modal ? (
        <Dialog
          aria-describedby={described ? descriptionId : undefined}
          {...props}
          {...stylex.props(overlay.popupDialog, focus.ring)}
        >
          <DescriptionContext value={description}>
            {children}
          </DescriptionContext>
        </Dialog>
      ) : (
        <PanelDialog
          aria-describedby={described ? descriptionId : undefined}
          {...props}
        >
          <DescriptionContext value={description}>
            {children}
          </DescriptionContext>
        </PanelDialog>
      )}
    </RACPopover>
  )
}

/**
 * Supporting copy under the title. The panel's `aria-describedby` points at
 * it — see DescriptionContext for why that is this component's doing.
 */
function PopoverDescription(
  props: PopoverDescriptionProps & RefAttributes<HTMLElement>,
) {
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
function PopoverTitle(
  props: PopoverTitleProps & RefAttributes<HTMLHeadingElement>,
) {
  const register = useContext(TitleContext)

  useEffect(() => register(), [register])

  return (
    <Heading
      slot="title"
      {...props}
      {...mergeStyles(stylex.props(styles.title), props)}
    />
  )
}

/**
 * What a pressed trigger hands the overlay it opens: the id its
 * `aria-controls` points at, and its own id to name a panel with no title.
 * Read field by field, since the context's type also admits a slotted
 * value; a hover trigger hands nothing.
 */
function triggerOf(context: unknown) {
  if (typeof context !== 'object' || context === null || 'slots' in context) {
    return undefined
  }
  return {
    id:
      'id' in context && typeof context.id === 'string'
        ? context.id
        : undefined,
    labelledBy:
      'aria-labelledby' in context &&
      typeof context['aria-labelledby'] === 'string'
        ? context['aria-labelledby']
        : undefined,
  }
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
   * Where to portal the panel. Defaults to the container of the `ThemeScope`
   * around it, which keeps the popover on that scope's tokens, or to the end of
   * `<body>` where there is none. A subtree themed through the `themeScope`
   * class has no container of its own, so point this inside it, or the popover
   * renders outside and keeps the page's tokens.
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
  PopoverTrigger,
}

export { PopoverContent, PopoverDescription, PopoverTitle }

export default Popover
