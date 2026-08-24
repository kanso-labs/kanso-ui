import type { ReactElement } from 'react'

/**
 * Whether the element a `render` prop produces is a real `<button>`.
 *
 * Base UI needs this: a `<button>` already announces its role, activates on
 * Space and Enter, and takes `disabled`, while an `<a>` or a `<div>` has to be
 * given all three by hand. It cannot see through `render` to find out, so it
 * assumes a native button and logs an error when the DOM turns out to
 * disagree — which is what `<Button render={<a href="…" />}>` used to produce
 * unless the call site knew to pass `nativeButton={false}`.
 *
 * Only a plain element with a host tag is decided here. A `render` that is a
 * function, or an element whose type is a component, could still return a
 * `<button>`, and treating one as a non-button would hand a real button the
 * role, tab index and keyboard handling it already has. Those keep Base UI's
 * own default, which is where its error message — and an explicit
 * `nativeButton` at the call site — remain the answer.
 */
function rendersNativeButton(
  render: ((...args: never) => unknown) | ReactElement | undefined,
) {
  if (
    render !== undefined &&
    typeof render !== 'function' &&
    typeof render.type === 'string'
  ) {
    return render.type === 'button'
  }
  return true
}

export { rendersNativeButton }
