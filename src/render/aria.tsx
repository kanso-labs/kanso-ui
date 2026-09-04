import type { AriaAttributes, KeyboardEventHandler } from 'react'
import type { ButtonProps, LinkProps } from 'react-aria-components'

import { createElement } from 'react'

// The four React Aria forwards on its own, and may combine with what a parent
// provides through context — a dialog's trigger names its dialog this way.
// Everything else it drops, so those stay out of the spread below rather
// than overriding a value React Aria computed.
const LABELLING = new Set([
  'aria-describedby',
  'aria-details',
  'aria-label',
  'aria-labelledby',
])

/**
 * What a component puts on the element itself, past React Aria: the `aria-*`
 * props it would drop, and the keyboard handlers it would wrap.
 *
 * React Aria forwards only the labelling attributes, which is right for the
 * states it manages but leaves a call site no way to mark a button as
 * expanded, pressed, or in control of something React Aria does not know
 * about. Its keyboard handlers stop propagation unless the handler asks
 * otherwise, which is its own convention rather than the DOM's; attached to
 * the element directly they bubble as a call site expects, and an Escape
 * pressed on a button inside a dialog still reaches the dialog.
 */
interface ElementProps {
  aria: AriaAttributes
  onKeyDown?: KeyboardEventHandler<HTMLElement> | undefined
  onKeyUp?: KeyboardEventHandler<HTMLElement> | undefined
}

/** The `aria-*` props React Aria would drop, collected for {@link ElementProps}. */
function ariaAttributesOf(props: object): AriaAttributes {
  const aria: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(props)) {
    if (key.startsWith('aria-') && !LABELLING.has(key)) {
      aria[key] = value
    }
  }
  return aria
}

/**
 * The `render` function for a React Aria `Button`: the element it would have
 * rendered, plus {@link ElementProps}, handed on to the call site's own
 * `render` when there is one. Built by a call rather than written inline at
 * the prop, which is what react-perf's no-new-function-as-prop is after.
 *
 * `createElement` rather than JSX, here and below: React Aria types the
 * props it hands over as a union of the elements it might have rendered, and
 * a spread of that union onto one tag does not type-check, where the plain
 * call takes any props object.
 */
function buttonRenderer(
  element: ElementProps,
  render: ButtonProps['render'],
): NonNullable<ButtonProps['render']> {
  return (domProps, state) => {
    const merged = withElementProps(domProps, element)
    if (render !== undefined) {
      return render(merged, state)
    }
    return createElement('button', merged)
  }
}

// React Aria's own keyboard handling comes first, then the call site's.
function chain<Event>(
  first: ((event: Event) => void) | undefined,
  second: ((event: Event) => void) | undefined,
) {
  if (second === undefined) {
    return first
  }
  return (event: Event) => {
    first?.(event)
    second(event)
  }
}

/**
 * The same for a React Aria `Link`, which renders an anchor — or, while
 * disabled, a span in its place, since a disabled anchor is no link at all.
 */
function linkRenderer(element: ElementProps): NonNullable<LinkProps['render']> {
  return (domProps, state) => {
    const merged = withElementProps(domProps, element)
    if (state.isDisabled) {
      return createElement('span', { ...merged, href: undefined })
    }
    return createElement('a', merged)
  }
}

function withElementProps<Props extends object>(
  domProps: Props,
  element: ElementProps,
) {
  const dom = domProps as Props & {
    onKeyDown?: KeyboardEventHandler<HTMLElement>
    onKeyUp?: KeyboardEventHandler<HTMLElement>
  }
  return {
    ...domProps,
    ...element.aria,
    onKeyDown: chain(dom.onKeyDown, element.onKeyDown),
    onKeyUp: chain(dom.onKeyUp, element.onKeyUp),
  }
}

export type { ElementProps }

export { ariaAttributesOf, buttonRenderer, linkRenderer }
