import type { ReactNode } from 'react'
import type {
  ClassNameOrFunction,
  StyleOrFunction,
  TooltipRenderProps,
  TooltipTriggerComponentProps,
} from 'react-aria-components'

import * as stylex from '@stylexjs/stylex'
import { Tooltip as RACTooltip, TooltipTrigger } from 'react-aria-components'

import { mergeStatefulStyles } from '../../styles/merge'
import { overlay, popupOrigin } from '../../styles/overlay'
import {
  colors,
  radii,
  spacing,
  typography,
} from '../../tokens/design.tokens.stylex'

// The tooltips page's plain tooltip: a 24dp container on inverse surface
// with 8dp of padding, holding one line of supporting text in inverse on
// surface at 12 over 16, which is the body-small role. The page names a
// shape token for the container without giving its value, so the container
// takes the smallest corner the library has — a 24dp box has room for no
// more.
//
// The rich tooltip on the same page is a hover-triggered `Popover`, which is
// where its subhead, supporting text and buttons already live; this one is
// text and nothing else, which is why it takes its label as a string rather
// than as parts.
//
// The entry is the overlay module's, shared with every anchored surface, and
// so is the origin it grows from — the tooltip comes out of the thing it
// describes. The surface itself is not: a tooltip inverts the page's colours
// where a popover sits on a container role, so it draws its own.
const styles = stylex.create({
  container: {
    backgroundColor: colors.inverseSurface,
    borderRadius: radii.xs,
    boxSizing: 'border-box',
    color: colors.inverseOnSurface,
    fontFamily: typography.bodySmallFont,
    fontSize: typography.bodySmallSize,
    fontWeight: typography.bodySmallWeight,
    letterSpacing: typography.bodySmallTracking,
    lineHeight: typography.bodySmallLineHeight,
    // A label rather than a paragraph, so a long one is capped and wraps
    // instead of running the width of the window.
    maxInlineSize: 'min(320px, 100vw)',
    // The page's 24dp container: its 16dp line, with the 8dp of padding
    // split either side of it, and the same 8dp at the ends.
    minBlockSize: '24px',
    paddingBlock: spacing.xs,
    paddingInline: spacing.sm,
  },
})

// The gap between the anchor and the tooltip. A number rather than a token,
// because React Aria computes the position in JavaScript and so cannot read
// a custom property — the same one place `Popover` spells a step out.
const DEFAULT_SIDE_OFFSET = 8

type TooltipAlign = 'center' | 'end' | 'start'

type TooltipProps = {
  /**
   * Where the tooltip sits along the side it opens on.
   * @default 'center'
   */
  align?: TooltipAlign
  /** Shifts the tooltip along that side, in pixels. */
  alignOffset?: number
  /**
   * The element the tooltip describes, and nothing else. It has to be able
   * to take focus, since a tooltip a keyboard cannot reach is one most
   * people never see — wrap anything that cannot in `Focusable`, which this
   * package re-exports.
   */
  children?: ReactNode
  /** A function may compute the class from the tooltip's render state. */
  className?: ClassNameOrFunction<TooltipRenderProps>
  /**
   * Where to portal the tooltip. Defaults to the end of `<body>`, which is
   * right for an app that sets its StyleX theme on `:root`. An app that
   * scopes the theme to a subtree has to point this at an element inside it,
   * or the tooltip renders outside the theme and falls back to the tokens'
   * `prefers-color-scheme` default.
   */
  container?: Element
  /** What the tooltip says. Text, since the page's plain tooltip is text. */
  label: ReactNode
  /**
   * Which side of the element the tooltip opens on. It flips to the opposite
   * side on its own when there is no room.
   * @default 'top'
   */
  side?: TooltipSide
  /** The gap between the element and the tooltip, in pixels. */
  sideOffset?: number
  /** A function may compute the style from the tooltip's render state. */
  style?: StyleOrFunction<TooltipRenderProps>
} & Omit<TooltipTriggerComponentProps, 'children'>

type TooltipSide = 'bottom' | 'left' | 'right' | 'top'

// React Aria names a placement by the side and, along it, the end the
// tooltip is aligned to — the same mapping `Popover` makes, kept identical
// so the two agree on what `side` and `align` mean.
function placementOf(side: TooltipSide, align: TooltipAlign) {
  if (align === 'center') {
    return side
  }
  if (side === 'top' || side === 'bottom') {
    return `${side} ${align}` as const
  }
  return `${side} ${align === 'start' ? 'top' : 'bottom'}` as const
}

/**
 * A label for the element it wraps, shown while that element is hovered or
 * focused — the tooltips page's plain tooltip. Its open state is React
 * Aria's: pass `isOpen` with `onOpenChange` to control it, `defaultOpen` to
 * let it keep its own, and `delay` and `closeDelay` for how long a pointer
 * has to rest before it appears and after it leaves.
 *
 * A tooltip is not a place to put anything a person has to read or reach:
 * it is skipped by touch entirely and dismissed by Escape, so what it says
 * has to be a repeat of what the element already means. Anything with a
 * button in it, or worth reading twice, is a `Popover`.
 *
 * The call site's `className` and `style` land on the tooltip itself.
 */
function Tooltip({
  align = 'center',
  alignOffset,
  children,
  className,
  container,
  label,
  side = 'top',
  sideOffset = DEFAULT_SIDE_OFFSET,
  style,
  ...props
}: TooltipProps) {
  return (
    <TooltipTrigger {...props}>
      {children}
      <RACTooltip
        crossOffset={alignOffset}
        offset={sideOffset}
        placement={placementOf(side, align)}
        // oxlint-disable-next-line typescript/no-deprecated -- its replacement, UNSAFE_PortalProvider, is not exported by react-aria-components
        UNSTABLE_portalContainer={container}
        {...mergeStatefulStyles(
          (state: TooltipRenderProps) =>
            stylex.props(
              overlay.popup,
              styles.container,
              popupOrigin(state.placement),
            ),
          { className, style },
        )}
      >
        {label}
      </RACTooltip>
    </TooltipTrigger>
  )
}

export type { TooltipAlign, TooltipProps, TooltipSide }

export default Tooltip
