'use client'

import type {
  AriaAttributes,
  DOMAttributes,
  ReactNode,
  RefAttributes,
} from 'react'
import type {
  ClassNameOrFunction,
  LinkRenderProps,
  LinkProps as RACLinkProps,
  StyleOrFunction,
} from 'react-aria-components'

import * as stylex from '@stylexjs/stylex'
import { Link as RACLink } from 'react-aria-components'

import { ariaAttributesOf, linkRenderer } from '../../render/aria'
import { focus } from '../../styles/focus'
import { mergeStatefulStyles } from '../../styles/merge'
import {
  colors,
  motion,
  radii,
  stateLayerOpacity,
} from '../../tokens/design.tokens.stylex'

// No Material Design page draws an inline link. The nearest component is the
// text button, whose label is the same primary role on no container, and this
// takes that, with the disabled treatment every page gives content: on
// surface at the disabled-content opacity. What belongs to a control standing
// on its own is left out — the button's height, padding, type and state
// layer. A link takes its size and face from the sentence it sits in, and
// says it can be followed with its underline instead, which is this
// component's own: a 1px rule in 70% of the primary role, or in the outline
// role under `inherit`, turning fully primary on hover.
//
// 70% is the least that keeps the rule at 3:1 against the surface in every
// scheme the library is shown in — Nordic, the closest, comes to 3.15:1. The
// rule is what separates a link from its sentence, since the primary role
// sits as close as 1.3:1 to body text in the dark theme, and at the 45% it
// was drawn in before it measured 2:1 on the light surface.
//
// Hover is React Aria's render state rather than `:hover`, as Button's and
// Tabs' are. A tap leaves a touch screen's emulated pointer over what was
// tapped, so `:hover` kept a tapped link lit until the next tap, and React
// Aria ignores that pointer; it also never reports a disabled link hovered.

const styles = stylex.create({
  base: {
    '@media (prefers-reduced-motion: reduce)': { transitionDuration: '0s' },
    borderRadius: radii.xs,
    boxSizing: 'border-box',
    cursor: 'pointer',
    // A long address breaks rather than widening the page. `anywhere`, which
    // also lowers the link's min-content width, so a link that is a flex
    // item — a footer's row of links — gives way as well.
    overflowWrap: 'anywhere',
    textDecorationThickness: '1px',
    textUnderlineOffset: '0.2em',
    transitionDuration: motion.durationShort2,
    transitionProperty: 'color, text-decoration-color',
    transitionTimingFunction: motion.easingStandard,
  },
  // React Aria renders a disabled link as a span, which no `:disabled`
  // matches, so the state is applied from the render state — the same reason
  // Tabs and Button style theirs that way. A disabled link is never hovered,
  // so neither its colour nor an underline held back until hover comes on
  // under a pointer, and the rule of an `always` link stays, greyed.
  disabled: {
    color: `color-mix(in srgb, ${colors.onSurface} calc(${stateLayerOpacity.disabledContent} * 100%), ${colors.surface})`,
    cursor: 'not-allowed',
    textDecorationColor: `color-mix(in srgb, ${colors.onSurface} calc(${stateLayerOpacity.disabledContent} * 100%), ${colors.surface})`,
  },
})

const tones = stylex.create({
  inherit: {
    color: 'inherit',
    textDecorationColor: colors.outline,
  },
  primary: {
    color: colors.primary,
    textDecorationColor: `color-mix(in srgb, ${colors.primary} 70%, transparent)`,
  },
})

const underlines = stylex.create({
  always: {
    textDecorationLine: 'underline',
  },
  hover: {
    textDecorationLine: 'none',
  },
  none: {
    textDecorationLine: 'none',
  },
})

// Under a pointer, from the render state — see the comment at the top. Either
// tone turns its text and its rule fully primary, and a rule held back until
// hover is drawn.
const hovered = stylex.create({
  tone: {
    color: colors.primary,
    textDecorationColor: colors.primary,
  },
  underline: {
    textDecorationLine: 'underline',
  },
})

// React Aria types the global DOM events against the element it renders, and
// a handler written for an <a> does not type-check against the <span> it
// renders while disabled. The keys are retyped against HTMLElement here, as
// Button's are, so one set of props serves both forms; the events React Aria
// defines itself (press, hover, focus) keep its types, since it hands those
// its own event objects.
type GlobalEventKey = Exclude<
  keyof DOMAttributes<HTMLElement> & keyof RACLinkProps,
  'onBlur' | 'onClick' | 'onFocus'
>

type LinkDOMProps = Omit<
  RACLinkProps,
  'children' | 'className' | 'style' | GlobalEventKey
> &
  Pick<DOMAttributes<HTMLElement>, GlobalEventKey>

type LinkProps = {
  children?: ReactNode
  /** A function may compute the class from the link's render state. */
  className?: ClassNameOrFunction<LinkRenderProps>
  /** A function may compute the style from the link's render state. */
  style?: StyleOrFunction<LinkRenderProps>
  /**
   * Which colour role to render in. `primary` marks the link out from the
   * text around it; `inherit` takes the surrounding colour and leans on the
   * underline alone, for a link in a place already understood to be links —
   * a footer, a breadcrumb, a nav.
   * @default 'primary'
   */
  tone?: LinkTone
  /**
   * When to draw the rule. Leave it at `always` in prose: without it, colour
   * is the only thing separating the link from the sentence, which some
   * readers cannot see. `hover` and `none` are for links whose position
   * already announces them, such as a row of footer links.
   * @default 'always'
   */
  underline?: LinkUnderline
} & AriaAttributes &
  LinkDOMProps

type LinkTone = 'inherit' | 'primary'

type LinkUnderline = 'always' | 'hover' | 'none'

/**
 * A navigational link. It renders an `<a>` and sets no type of its own, so it
 * takes the size and face of the text it sits in. Without `href`, or while
 * disabled, it is a span announced as a link instead, since a disabled
 * anchor is no link at all.
 *
 * ```tsx
 * <Link href="#first">Label</Link>
 * ```
 *
 * Behaviour is React Aria's: `onPress` fires for pointer, touch and keyboard
 * alike, a `RouterProvider` above it turns a navigation into a client-side
 * one, and a `Breadcrumbs` or `Menu` around it reaches it through context.
 * `render` is React Aria's function form, handed the anchor's props to spread
 * onto an element of its own. Every `aria-*` prop is forwarded to the element;
 * React Aria alone would keep only the labelling ones.
 */
function Link({
  onKeyDown,
  onKeyUp,
  render,
  tone = 'primary',
  underline = 'always',
  ...props
}: LinkProps & RefAttributes<HTMLAnchorElement>) {
  const element = { aria: ariaAttributesOf(props), onKeyDown, onKeyUp }

  return (
    <RACLink
      render={linkRenderer(element, render)}
      {...props}
      {...mergeStatefulStyles(
        (state: LinkRenderProps) =>
          stylex.props(
            styles.base,
            focus.ring,
            tones[tone],
            underlines[underline],
            state.isHovered && hovered.tone,
            state.isHovered && underline === 'hover' && hovered.underline,
            state.isDisabled && styles.disabled,
          ),
        props,
      )}
    />
  )
}

export type { LinkDOMProps, LinkProps, LinkTone, LinkUnderline }

export default Link
