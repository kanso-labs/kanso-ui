'use client'

import type { MouseEvent } from 'react'

import * as stylex from '@stylexjs/stylex'
import { cloneElement, isValidElement } from 'react'

import type { RenderComponentProps } from '../../render/useRender'

import { useRipple } from '../../hooks/useRipple'
import { useRender } from '../../render/useRender'
import { focus } from '../../styles/focus'
import { mergeStyles } from '../../styles/merge'
import {
  colors,
  radii,
  shadows,
  spacing,
  stateLayerOpacity,
} from '../../tokens/design.tokens.stylex'

// The three variants differ only in how they separate themselves from the
// page: a shadow, a darker fill, or a border. Each therefore sits on a
// different background, which is why the interaction styles below are keyed
// by variant too — a state layer composites an 'on-color' over whatever the
// container already is, so it cannot be written once for all three.
//
// color-mix() is inlined at each property rather than factored into a helper:
// @stylexjs/babel-plugin only statically recognizes expressions written
// directly as property values. Button's header comment records the same
// constraint.
// Windows High Contrast and the rest of the forced-colours modes. Spelled
// here rather than imported, for the reason src/field/styles.ts records: the
// StyleX compiler resolves a constant across files only out of a `.stylex.ts`
// module, and the generated one holds design tokens rather than queries.
const FORCED_COLORS = '@media (forced-colors: active)'

const styles = stylex.create({
  base: {
    // The cards spec page's corner, 12dp, which is the medium shape.
    borderRadius: radii.md,
    borderWidth: 0,
    boxSizing: 'border-box',
    // `render` lets the card be any element, and an <a> arrives carrying the
    // UA's link colour and underline. Both are reset here rather than
    // alongside the button resets below, because they have to hold for a
    // card that is a link without being `interactive` too. Neither changes
    // anything for the default <div>, which already inherits its colour and
    // underlines nothing.
    color: 'inherit',
    display: 'block',
    // A child that reaches the card's edges — a row in a list, an image
    // across the top — is square where the card is round, so its background
    // paints over the corner arcs unless the card clips. The rounding is the
    // card's, so containing it is the card's job too: nothing a child can
    // set fixes this, since a row has no way to know it is the first or last
    // one and so no way to round only the corners that need it.
    //
    // Clips the card's contents, not the card: an element's own box-shadow
    // and outline are drawn outside its border box and are unaffected, which
    // is what keeps the elevated variant's shadow and the interactive
    // variant's focus ring intact.
    //
    // `clip` rather than `hidden`, which clips to the same rounded edge but
    // also makes the card a scroll container, and a scroll container's
    // automatic minimum size as a flex or grid item is zero rather than its
    // content's. In a column that runs short of room — a sheet's body once
    // the sheet reaches its cap — the card would then be the item that gives
    // way, shrinking below its content and hiding the rest, while the column
    // around it, left with nothing to overflow, never scrolls. Under `clip`
    // the card keeps its content's size and the column scrolls instead. A
    // card that should give way, because it scrolls content of its own, asks
    // for it with `minBlockSize: 0`, as any flex item does.
    overflow: 'clip',
    // Which is also why a word wider than the card breaks: under `clip` it
    // was cut off at the card's edge, and the text was lost rather than
    // merely wide. `anywhere`, so a word inside a flex row of the card's
    // content breaks too.
    overflowWrap: 'anywhere',
    // Positioning context for the ripple surface, which fills the card.
    position: 'relative',
    textDecoration: 'none',
  },
  // What an interactive card's children sit in. A <button> centres its
  // content top to bottom in a box of the browser's own, which no property on
  // the button reaches — not `align-content`, and not a `display` that keeps
  // it a block — so a card stretched taller than its content by a row of
  // cards drew it in the middle where a static card draws it at the top.
  // This box is at least as tall as the card's own, which leaves the browser
  // nothing to centre, and lays the children out as the static card does:
  // as a block, so inline content stays on a line and margins still
  // collapse, which a flex or grid card would change. A <span>, since a
  // button may only hold phrasing content.
  content: {
    boxSizing: 'border-box',
    display: 'block',
    minBlockSize: '100%',
  },
  // The cards page's disabled states: each variant's container at 38%, and
  // the outlined card's rule in the outline role at 12%. The page draws a
  // disabled card flat, so the elevated card drops its shadow. Applied last,
  // after the interaction styles, so no hover or press layer shows through,
  // and the pointer is the plain one, since nothing happens under it.
  //
  // Under forced colours the boundary an interactive card draws there is
  // `GrayText`, the one keyword that mode has for disabled; the fades above
  // are author colours it repaints.
  disabled: {
    borderColor: { default: null, [FORCED_COLORS]: 'GrayText' },
    cursor: 'default',
  },
  // What the card holds, at the 38% Material Design fades disabled content
  // to. A card's content is the call site's — text, an image, a row of its
  // own — so no colour role reaches all of it, and an opacity is the one
  // fade that does.
  disabledContent: {
    opacity: stateLayerOpacity.disabledContent,
  },
  disabledElevated: {
    backgroundColor: `color-mix(in srgb, ${colors.surfaceContainerLow} calc(${stateLayerOpacity.disabledContent} * 100%), transparent)`,
    boxShadow: 'none',
  },
  disabledFilled: {
    backgroundColor: `color-mix(in srgb, ${colors.surfaceContainerHighest} calc(${stateLayerOpacity.disabledContent} * 100%), transparent)`,
  },
  disabledOutlined: {
    borderColor: {
      default: `color-mix(in srgb, ${colors.outline} calc(${stateLayerOpacity.disabledContainer} * 100%), transparent)`,
      [FORCED_COLORS]: 'GrayText',
    },
  },
  elevated: {
    backgroundColor: colors.surfaceContainerLow,
    boxShadow: shadows.elevation1,
  },
  filled: {
    backgroundColor: colors.surfaceContainerHighest,
  },
  // Resets the parts of a <button> that would otherwise fight the card: its
  // centred text, its own font, and its shrink-to-fit width — and, through
  // `content`, its centring top to bottom. Without these an interactive card
  // would lay its contents out differently from a static one holding exactly
  // the same children.
  interactive: {
    cursor: 'pointer',
    font: 'inherit',
    inlineSize: '100%',
    textAlign: 'start',
  },
  // An elevated or filled card that can be pressed is told apart from the
  // page by its container's fill and shadow, and forced colours removes the
  // shadow and repaints the fill in the page's own `Canvas` — so the card
  // read as loose content until it was focused. A border is what the mode
  // keeps, in the colour it gives what can be pressed. The outlined card
  // has one already, and a static card's elevation is decoration.
  //
  // The width restates the base's 0, which resets a <button>'s own border,
  // since StyleX replaces a property whole.
  interactiveBoundary: {
    borderColor: { default: null, [FORCED_COLORS]: 'ButtonText' },
    borderStyle: { default: null, [FORCED_COLORS]: 'solid' },
    borderWidth: { default: 0, [FORCED_COLORS]: '1px' },
  },
  outlined: {
    backgroundColor: colors.surface,
    borderColor: colors.outlineVariant,
    borderStyle: 'solid',
    borderWidth: '1px',
  },
  // A card holding a list wants none, so its rows can run to the edges and
  // the separators between them can span the full width. That is the whole
  // of the design's "bordered list container": an outlined card with no
  // padding of its own.
  paddingDefault: {
    padding: spacing.lg,
  },
  paddingNone: {
    padding: 0,
  },
})

// A pointer that can hover: a mouse or a trackpad, not a finger. An
// interactive card is a plain element React Aria does not host, so it has no
// `isHovered` to draw its hover layer from, and Chromium leaves `:hover` on
// whatever a touch last tapped — a card tapped and then navigated back to
// stayed lifted. Inside this query a touch screen draws no hover at all. A
// touchscreen laptop still matches it for its trackpad, which is the limit of
// asking the device rather than the event.
const HOVER_CAPABLE = '@media (hover: hover)'

// The state layers, from pseudo-classes, since the card has no render state
// to read — see `HOVER_CAPABLE`.
// `:active` is written twice, bare for a touch and again inside the query.
// StyleX orders a rule by the sum of its conditions, so a hover inside the
// query would otherwise come after a bare press and win while both held.
const interactionStyles = stylex.create({
  elevated: {
    backgroundColor: {
      ':active': {
        default: `color-mix(in srgb, ${colors.onSurface} calc(${stateLayerOpacity.pressed} * 100%), ${colors.surfaceContainerLow})`,
        [HOVER_CAPABLE]: `color-mix(in srgb, ${colors.onSurface} calc(${stateLayerOpacity.pressed} * 100%), ${colors.surfaceContainerLow})`,
      },
      ':hover': {
        default: null,
        [HOVER_CAPABLE]: `color-mix(in srgb, ${colors.onSurface} calc(${stateLayerOpacity.hover} * 100%), ${colors.surfaceContainerLow})`,
      },
      default: colors.surfaceContainerLow,
    },
    boxShadow: {
      ':active': {
        default: shadows.elevation1,
        [HOVER_CAPABLE]: shadows.elevation1,
      },
      ':hover': { default: null, [HOVER_CAPABLE]: shadows.elevation2 },
      default: shadows.elevation1,
    },
  },
  filled: {
    backgroundColor: {
      ':active': {
        default: `color-mix(in srgb, ${colors.onSurface} calc(${stateLayerOpacity.pressed} * 100%), ${colors.surfaceContainerHighest})`,
        [HOVER_CAPABLE]: `color-mix(in srgb, ${colors.onSurface} calc(${stateLayerOpacity.pressed} * 100%), ${colors.surfaceContainerHighest})`,
      },
      ':hover': {
        default: null,
        [HOVER_CAPABLE]: `color-mix(in srgb, ${colors.onSurface} calc(${stateLayerOpacity.hover} * 100%), ${colors.surfaceContainerHighest})`,
      },
      default: colors.surfaceContainerHighest,
    },
  },
  outlined: {
    backgroundColor: {
      ':active': {
        default: `color-mix(in srgb, ${colors.onSurface} calc(${stateLayerOpacity.pressed} * 100%), ${colors.surface})`,
        [HOVER_CAPABLE]: `color-mix(in srgb, ${colors.onSurface} calc(${stateLayerOpacity.pressed} * 100%), ${colors.surface})`,
      },
      ':hover': {
        default: null,
        [HOVER_CAPABLE]: `color-mix(in srgb, ${colors.onSurface} calc(${stateLayerOpacity.hover} * 100%), ${colors.surface})`,
      },
      default: colors.surface,
    },
  },
})

// Typed as the attributes a <div> accepts, because that is the surface every
// element this can render shares. Anything element-specific — a button's
// `type`, an anchor's `href` — would be wrong for the others, and does not
// need to be here anyway: those are written on the element handed to
// `render`, where TypeScript checks them against that element's own props.
type CardProps = {
  /**
   * Makes the card the thing you press: it ripples, lifts on hover, and takes
   * a focus ring. Renders a `<button>` unless `render` says otherwise. Leave
   * it off for a card that merely holds content, including one containing its
   * own buttons.
   * @default false
   */
  interactive?: boolean
  /**
   * Turns an interactive card off: it fades as the cards page draws a
   * disabled card, stops rippling and lifting, and takes no press. The
   * default `<button>` is disabled outright. An element of the call site's
   * own through `render` is marked `aria-disabled`, and an element handed in
   * directly loses its `href`, `tabIndex` and `onClick`, so a link card can
   * neither be followed nor focused. Has no effect on a card that is not
   * `interactive`, which cannot be pressed to begin with.
   * @default false
   */
  isDisabled?: boolean
  /**
   * `none` removes the card's own padding, for a card whose children run to
   * its edges — a list of rows separated by rules.
   * @default 'default'
   */
  padding?: 'default' | 'none'
  /**
   * How the card separates itself from the page: `elevated` casts a shadow,
   * `filled` sits on a darker surface, `outlined` draws a border.
   * @default 'elevated'
   */
  variant?: CardVariant
} & RenderComponentProps<'div'>

type CardVariant = 'elevated' | 'filled' | 'outlined'

/**
 * A surface holding related content. `render` decides which element that
 * surface is, so a card that navigates can be a real `<a href>` — announced
 * as a link and opening in a new tab on a modifier click, which a `<button>`
 * with an onClick does neither of.
 *
 * `interactive` and `render` are separate axes. `interactive` says the card
 * is pressable and gives it the ripple, the hover lift, and a focus ring;
 * `render` says what it is. A pressable card with no `render` is a
 * `<button>`, which is the right default for one that acts rather than
 * navigates.
 */
function Card({
  children,
  interactive = false,
  isDisabled = false,
  onClick,
  onContextMenu,
  onPointerCancel,
  onPointerDown,
  onPointerLeave,
  onPointerUp,
  padding = 'default',
  render,
  variant = 'elevated',
  ...props
}: CardProps) {
  // The consumer's own pointer handlers are handed to useRipple to merge
  // rather than spread over its handlers afterwards, which is what Button
  // does and for the same reason: a plain spread means whichever object
  // comes last silently wins, so an onPointerDown on the call site would
  // replace the one driving the ripple and the card would stop rippling.
  const disabled = interactive && isDisabled
  const ripple = useRipple(interactive && !disabled, {
    onClick: disabled ? undefined : onClick,
    onContextMenu,
    onPointerCancel,
    onPointerDown,
    onPointerLeave,
    onPointerUp,
  })
  const padded = padding === 'none' ? styles.paddingNone : styles.paddingDefault

  return useRender({
    defaultTagName: interactive ? 'button' : 'div',
    props: {
      ...props,
      // Only when the default <button> is what renders. On an element the
      // call site chose, `type` is either meaningless or wrong — an <a>'s
      // `type` is a hint about the MIME type of what it links to — and that
      // element's own attributes are the call site's to write.
      ...(interactive && render === undefined ? { type: 'button' } : undefined),
      ...ripple.handlers,
      // After the ripple's handlers, whose click it replaces while disabled.
      ...disabledAttributes(disabled, render),
      children: (
        <>
          {interactive ? (
            <span
              {...stylex.props(
                styles.content,
                disabled && styles.disabledContent,
              )}
            >
              {children}
            </span>
          ) : (
            children
          )}
          {ripple.surface}
        </>
      ),
      ...mergeStyles(
        stylex.props(
          styles.base,
          styles[variant],
          padded,
          interactive && styles.interactive,
          interactive && variant !== 'outlined' && styles.interactiveBoundary,
          interactive && !disabled && focus.ring,
          interactive && !disabled && interactionStyles[variant],
          disabled && styles.disabled,
          disabled && disabledStyles[variant],
        ),
        props,
      ),
    },
    render: disabled ? withoutActivation(render) : render,
  })
}

const disabledStyles = {
  elevated: styles.disabledElevated,
  filled: styles.disabledFilled,
  outlined: styles.disabledOutlined,
}

// How a disabled card says so, by the element it renders. The default
// <button> takes the native `disabled`, which removes it from the tab order
// and fires nothing on a press. Any other element has no such attribute, so
// it is marked `aria-disabled` for assistive technology, and a click on it
// has its default prevented, which is what would follow a link — the click
// a function passed as `render` wires up is its own, and runs first.
function disabledAttributes(disabled: boolean, render: CardProps['render']) {
  if (!disabled) {
    return undefined
  }
  if (render === undefined) {
    return { disabled: true }
  }
  return { 'aria-disabled': true, onClick: preventDefault }
}

function preventDefault(event: MouseEvent) {
  event.preventDefault()
}

// An element handed in as `render`, without what would still activate it: an
// element's own props win over the card's, so an <a href> stays a link the
// card cannot switch off from outside. Without an `href` it is neither
// followed nor focusable, and without its `tabIndex` it is not focusable
// either. Its `onClick` is replaced rather than removed, since a key the
// element carries wins even when its value is undefined, and would drop the
// card's own prevented click along with it.
function withoutActivation(render: CardProps['render']): CardProps['render'] {
  if (!isValidElement<Record<string, unknown>>(render)) {
    return render
  }
  return cloneElement(render, {
    href: undefined,
    onClick: preventDefault,
    tabIndex: undefined,
  })
}

export type { CardProps, CardVariant }

export default Card
