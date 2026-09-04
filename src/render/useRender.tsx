import type {
  ComponentPropsWithRef,
  CSSProperties,
  HTMLAttributes,
  JSX,
  ReactElement,
  Ref,
  RefCallback,
  RefObject,
} from 'react'

import { cloneElement, createElement, isValidElement, useMemo } from 'react'

type Handler = (...args: ReadonlyArray<unknown>) => unknown

type IntrinsicTag = keyof JSX.IntrinsicElements

/**
 * The props of a component rendered through {@link useRender}: everything the
 * element accepts, plus `render`.
 */
type RenderComponentProps<Tag extends IntrinsicTag> =
  ComponentPropsWithRef<Tag> & {
    /**
     * Replaces the element the component renders by default: another tag, as
     * `render={<h2 />}`, or a function returning the element to render, given
     * the props the component would have put on its own.
     */
    render?: RenderProp | undefined
  }

/**
 * What a `render` function is handed: the element's props, merged and ready
 * to spread onto whatever element it returns. `any` on purpose, in the one
 * place it appears — the function may return any element, and a ref typed for
 * one of them would refuse every other.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- see above
type RenderFunctionProps = HTMLAttributes<any> & { ref?: Ref<any> | undefined }

type RenderProp = ((props: RenderFunctionProps) => ReactElement) | ReactElement

interface UseRenderParameters {
  /**
   * The tag rendered when `render` is not given.
   * @default 'div'
   */
  defaultTagName?: IntrinsicTag | undefined
  /** The props to put on whichever element ends up rendered. */
  props?: Record<string, unknown> | undefined
  render?: RenderProp | undefined
}

function attach(ref: Ref<Element>, node: Element | null): () => void {
  if (ref === null) {
    return () => {}
  }
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

function isHandler(value: unknown): value is Handler {
  return typeof value === 'function'
}

function isHandlerKey(key: string) {
  return /^on[A-Z]/u.test(key)
}

function isRefCallback(value: unknown): value is RefCallback<Element> {
  return typeof value === 'function'
}

function isRefObject(value: unknown): value is RefObject<Element | null> {
  return typeof value === 'object' && value !== null && 'current' in value
}

// undefined rather than '' when there is nothing to say, so an element with
// no classes on either side renders without a class attribute at all.
function joinClassNames(...names: ReadonlyArray<string | undefined>) {
  return names.filter(Boolean).join(' ') || undefined
}

/**
 * The component's props over the element's own. The element wins a plain
 * conflict — it is the more specific of the two — while class names, styles
 * and handlers are combined rather than chosen between. `ref` is left out:
 * the hook merges the two refs itself.
 */
function mergeElementProps(
  ours: Record<string, unknown>,
  theirs: Record<string, unknown>,
) {
  const merged: Record<string, unknown> = { ...ours, ...theirs }

  merged.className = joinClassNames(
    stringOf(ours.className),
    stringOf(theirs.className),
  )
  merged.style = mergeStyleObjects(styleOf(ours.style), styleOf(theirs.style))

  for (const key of Object.keys(theirs)) {
    const own = ours[key]
    const their = theirs[key]
    if (isHandlerKey(key) && isHandler(own) && isHandler(their)) {
      // The element's own handler runs first, as the more specific one.
      merged[key] = (...args: ReadonlyArray<unknown>) => {
        their(...args)
        own(...args)
      }
    }
  }

  delete merged.ref
  return merged
}

/**
 * One ref that feeds both, or whichever one there is. Attaching through a
 * callback lets each side keep its own cleanup: React 19 calls a callback
 * ref's returned function on detach in place of calling it with `null`, so
 * the merged callback returns one that does the same for each of the two.
 */
function mergeRefs(
  a: Ref<Element> | undefined,
  b: Ref<Element> | undefined,
): Ref<Element> | undefined {
  if (a === undefined) {
    return b
  }
  if (b === undefined) {
    return a
  }
  return (node: Element | null) => {
    const detachA = attach(a, node)
    const detachB = attach(b, node)
    return () => {
      detachA()
      detachB()
    }
  }
}

function mergeStyleObjects(
  ours: CSSProperties | undefined,
  theirs: CSSProperties | undefined,
) {
  if (ours === undefined && theirs === undefined) {
    return undefined
  }
  return { ...ours, ...theirs }
}

function refOf(value: unknown): Ref<Element> | undefined {
  if (isRefCallback(value) || isRefObject(value)) {
    return value
  }
  return undefined
}

function stringOf(value: unknown) {
  return typeof value === 'string' ? value : undefined
}

function styleOf(value: unknown) {
  return typeof value === 'object' && value !== null
    ? (value as CSSProperties)
    : undefined
}

/**
 * Renders a component's element, or whatever its `render` prop asks for
 * instead.
 *
 * `render` is either a React element, cloned with the component's props
 * merged over its own — class names joined, styles merged, event handlers
 * chained, the element's own value winning any other conflict — or a function
 * handed those merged props to return an element of its choosing. Without one,
 * `defaultTagName` is rendered. A default `button` is given `type="button"`,
 * since a bare one submits any form it happens to sit in.
 *
 * The element form is the point of owning this. React Aria's own `render`
 * is a function that must return the element the component would have
 * rendered itself, which suits its interactive components and nothing else;
 * the non-interactive ones here take `render={<h2 />}`, and keeping that
 * contract in a hook of the library's own is what lets them stay put
 * whichever behaviour library sits underneath the rest.
 */
function useRender({
  defaultTagName = 'div',
  props = {},
  render,
}: UseRenderParameters): ReactElement {
  const element = isValidElement<Record<string, unknown>>(render)
    ? render
    : undefined

  // Both refs, when there are two, have to land on one node. The merged
  // callback is memoised so React does not detach and re-attach it on every
  // render — a new identity each time would.
  const ownRef = refOf(props.ref)
  const elementRef = refOf(element?.props.ref)
  const ref = useMemo(() => mergeRefs(ownRef, elementRef), [ownRef, elementRef])

  if (element !== undefined) {
    return cloneElement(element, {
      ...mergeElementProps(props, element.props),
      ref,
    })
  }

  if (typeof render === 'function') {
    return render({ ...props, ref } as RenderFunctionProps)
  }

  return createElement(
    defaultTagName,
    defaultTagName === 'button'
      ? { type: 'button', ...props, ref }
      : { ...props, ref },
  )
}

export type { RenderComponentProps, RenderFunctionProps, UseRenderParameters }

export { useRender }
