import type { Ref } from 'react'
import type { FocusableElement } from 'react-aria-components'

import { ButtonContext, useSlottedContext } from 'react-aria-components'

import type { ButtonDOMProps } from '.'

import { useRipple } from '../hooks/useRipple'
import { ariaAttributesOf } from '../render/aria'
import { refCallback } from '../render/ref'

// The hook half of `src/button`, apart from ./index.tsx so that file exports
// components alone — which is what keeps fast refresh working for it, the
// same arrangement `src/drag` uses.

/** What {@link useButtonBase} takes off a button's props for itself. */
type ButtonBaseInput = Pick<
  ButtonDOMProps,
  | 'isDisabled'
  | 'onClick'
  | 'onContextMenu'
  | 'onKeyDown'
  | 'onKeyUp'
  | 'onPointerCancel'
  | 'onPointerDown'
  | 'onPointerLeave'
  | 'onPointerUp'
  | 'slot'
> & {
  disableRipple?: boolean
  ref?: Ref<HTMLAnchorElement | HTMLButtonElement>
}

/**
 * What a button does past React Aria, whichever of its elements it renders:
 * the disabled state a parent's context sets, the ripple, and the `aria-*`
 * props and keyboard handlers React Aria would drop or wrap. Hands back the
 * props it did not take, for the element.
 *
 * Shared by ButtonBase and by IconButton's toggle, which is React Aria's
 * `ToggleButton` rather than either element ButtonBase renders.
 */
function useButtonBase<Props extends ButtonBaseInput>(
  input: Props,
  isPending: boolean,
) {
  const {
    disableRipple = false,
    isDisabled,
    onClick,
    onContextMenu,
    onKeyDown,
    onKeyUp,
    onPointerCancel,
    onPointerDown,
    onPointerLeave,
    onPointerUp,
    ref,
    ...props
  } = input

  // A parent's context may disable the button — React Aria's own fields
  // disable the buttons they hold with them, a number field's stepper at the
  // end of its range and a search field's clear button with the field — and
  // React Aria takes a prop over its context, so a default of `false` here
  // would keep the button enabled whatever the parent said. The call site's
  // own prop still wins where it is given; the context is read for the
  // ripple, which has to know before the render state does.
  const context = useSlottedContext(ButtonContext, input.slot)
  const disabled = isDisabled ?? context?.isDisabled ?? false

  // The rest of the props (className/style, etc.) are handed back rather
  // than given to the ripple: `className` and `style` there may be functions
  // of render state, which the ripple's own handler-only merge doesn't need
  // to know about. It is also why ButtonBase merges the styles through
  // mergeStatefulStyles rather than the plain mergeStyles. The ripple is off
  // while disabled: React Aria still forwards pointer events to a disabled
  // element, and a press that changes nothing should not look like one.
  //
  // Off while pending for the same reason, and for a second one. React Aria
  // nulls out the handlers it derived itself while pending — the click among
  // them — but not the separate copy of the global pointer events that
  // carries ours, so a press still reached the ripple and started it while
  // the click that would have ended it never arrived. The ripple stayed at
  // its pressed opacity until some later press completed a cycle of its own.
  const ripple = useRipple<FocusableElement>(
    !disableRipple && !disabled && !isPending,
    {
      onClick,
      onContextMenu,
      onPointerCancel,
      onPointerDown,
      onPointerLeave,
      onPointerUp,
    },
  )

  return {
    disabled,
    element: { aria: ariaAttributesOf(props), onKeyDown, onKeyUp },
    props,
    // The element is a button, a link or IconButton's toggle, so the ref is
    // typed as a link or a button and handed to each as the callback all
    // three accept — see src/render/ref.ts.
    ref: refCallback(ref),
    ripple,
  }
}

export { useButtonBase }
