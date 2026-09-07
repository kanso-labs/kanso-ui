import type { AriaAttributes, DOMAttributes, ReactNode } from 'react'
import type {
  ClassNameOrFunction,
  LinkRenderProps,
  LinkProps as RACLinkProps,
  StyleOrFunction,
} from 'react-aria-components'

import * as stylex from '@stylexjs/stylex'
import { Link as RACLink } from 'react-aria-components'

import { ariaAttributesOf, linkRenderer } from '../../render/aria'
import { mergeStatefulStyles } from '../../styles/merge'
import {
  colors,
  motion,
  radii,
  stateLayerOpacity,
} from '../../tokens/design.tokens.stylex'

const styles = stylex.create({
  base: {
    borderRadius: radii.xs,
    boxSizing: 'border-box',
    cursor: 'pointer',
    outlineColor: colors.primary,
    outlineOffset: '2px',
    outlineStyle: { ':focus-visible': 'solid', default: 'none' },
    outlineWidth: '2px',
    textDecorationThickness: '1px',
    textUnderlineOffset: '0.2em',
    transitionDuration: motion.durationShort2,
    transitionProperty: 'color, text-decoration-color',
    transitionTimingFunction: motion.easingStandard,
  },
  // React Aria renders a disabled link as a span, which no `:disabled`
  // matches, so the state is applied from the render state — the same reason
  // Tabs and Button style theirs that way. Applied after the tone, and StyleX
  // replaces a property whole, so the tone's hover colour goes with it: a
  // hovered disabled link does not light up.
  disabled: {
    color: `color-mix(in srgb, ${colors.onSurface} calc(${stateLayerOpacity.disabledContent} * 100%), ${colors.surface})`,
    cursor: 'not-allowed',
    textDecorationColor: `color-mix(in srgb, ${colors.onSurface} calc(${stateLayerOpacity.disabledContent} * 100%), ${colors.surface})`,
  },
})

const tones = stylex.create({
  inherit: {
    color: { ':hover': colors.primary, default: 'inherit' },
    textDecorationColor: { ':hover': colors.primary, default: colors.outline },
  },
  primary: {
    color: colors.primary,
    textDecorationColor: {
      ':hover': colors.primary,
      default: `color-mix(in srgb, ${colors.primary} 45%, transparent)`,
    },
  },
})

const underlines = stylex.create({
  always: {
    textDecorationLine: 'underline',
  },
  hover: {
    textDecorationLine: { ':hover': 'underline', default: 'none' },
  },
  none: {
    textDecorationLine: 'none',
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
}: LinkProps) {
  const element = { aria: ariaAttributesOf(props), onKeyDown, onKeyUp }

  return (
    <RACLink
      render={linkRenderer(element, render)}
      {...props}
      {...mergeStatefulStyles(
        (state: LinkRenderProps) =>
          stylex.props(
            styles.base,
            tones[tone],
            underlines[underline],
            state.isDisabled && styles.disabled,
          ),
        props,
      )}
    />
  )
}

export type { LinkDOMProps, LinkProps, LinkTone, LinkUnderline }

export default Link
