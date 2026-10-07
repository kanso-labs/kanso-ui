import type { Ref, RefCallback } from 'react'

// A ref that can be written through. React reads a `null` ref as none at all,
// so a merge is only ever handed one that is there.
type AttachableRef<E> = NonNullable<Ref<E>>

function attach<E>(ref: AttachableRef<E>, node: E | null): () => void {
  if (typeof ref === 'function') {
    const cleanup = ref(node)
    return typeof cleanup === 'function'
      ? cleanup
      : () => {
          ref(null)
        }
  }
  ref.current = node
  return () => {
    ref.current = null
  }
}

/**
 * One ref that feeds both, or whichever one there is. Attaching through a
 * callback lets each side keep its own cleanup: React 19 calls a callback
 * ref's returned function on detach in place of calling it with `null`, so
 * the merged callback returns one that does the same for each of the two.
 *
 * For an element that needs a ref of its own — a body measuring whether it
 * scrolls, a row clearing an attribute React Aria sets — and is handed the
 * call site's as well.
 */
function mergeRefs<E>(
  a: AttachableRef<E> | undefined,
  b: AttachableRef<E> | undefined,
): AttachableRef<E> | undefined {
  if (a === undefined) {
    return b
  }
  if (b === undefined) {
    return a
  }
  return (node: E | null) => {
    const detachA = attach(a, node)
    const detachB = attach(b, node)
    return () => {
      detachA()
      detachB()
    }
  }
}

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

export type { AttachableRef }

export { mergeRefs, refCallback }
