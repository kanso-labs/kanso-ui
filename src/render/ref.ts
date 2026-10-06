import type { Ref, RefCallback } from 'react'

/**
 * A call site's ref, as a callback that writes the element into it.
 *
 * For a component that renders one of two elements — Button and IconButton a
 * `<button>` or an `<a>`, ListItem a `<div>` or a `<button>` — whose ref is
 * typed as either. React Aria types each of its elements' refs to the one
 * element it renders, and a ref object typed to two cannot be handed to
 * either: its `current` could hold the other. A callback can, since it only
 * ever receives the element, and an element of either type is one the ref
 * accepts. A callback the call site passed is handed through as it is.
 */
function refCallback<E>(ref: Ref<E> | undefined): RefCallback<E> | undefined {
  if (ref === undefined || ref === null) {
    return undefined
  }

  if (typeof ref === 'function') {
    return ref
  }

  return (element) => {
    ref.current = element
  }
}

export { refCallback }
