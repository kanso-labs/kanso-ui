import type { HTMLAttributes, RefObject } from 'react'

import { useLayoutEffect, useState } from 'react'

// What a keyboard reaches with Tab: the controls that are focusable by
// default, and anything a `tabindex` puts in the order. Each match is then
// held to `tabIndex >= 0`, which drops a control taken out with
// `tabindex="-1"`, and to being drawn, which drops a hidden one.
const TABBABLE = [
  'a[href]',
  'area[href]',
  'audio[controls]',
  'button:not(:disabled)',
  'iframe',
  'input:not(:disabled):not([type="hidden"])',
  'select:not(:disabled)',
  'summary',
  'textarea:not(:disabled)',
  'video[controls]',
  '[contenteditable]:not([contenteditable="false"])',
  '[tabindex]',
].join(', ')

// The attributes that move a control in or out of the tab order, so a
// change to one re-reads what the element holds.
const TAB_ORDER_ATTRIBUTES = [
  'contenteditable',
  'disabled',
  'hidden',
  'href',
  'inert',
  'tabindex',
]

/** What a panel's body is named by while it is a tab stop. */
type Naming = {
  /** The call site's own `aria-label`, which names it in place of the title. */
  label: string | undefined
  /** The id of the panel's title. */
  title: string | undefined
}

type ScrollStopProps = Pick<
  HTMLAttributes<HTMLElement>,
  'aria-labelledby' | 'role' | 'tabIndex'
>

/**
 * The props that make the element in `ref` a tab stop while it scrolls its
 * content and holds nothing a keyboard can reach: its content runs past the
 * element's own size in either direction, and nothing inside it is in the
 * tab order. Kept current as the element resizes and as its content changes.
 *
 * What it is for is keyboard access. A scroll container with nothing
 * focusable inside it cannot be reached from the keyboard in every browser,
 * so it is made a tab stop, and only then — a body short enough to show
 * whole is no stop at all, and one holding a field or a button is reached
 * and scrolled through that, where a stop of its own would be one more press
 * of Tab before the control.
 *
 * While it is a stop it is a region named by the panel's title, so a screen
 * reader landing on it says what it is rather than announcing an unnamed
 * group. A call site's `aria-label` names it instead, and a body with neither
 * stays a plain stop, since a region with no name is not one. The call site's
 * own `role`, `aria-labelledby` and `tabIndex` are spread after these, so
 * they win.
 *
 * The element is watched for its own size, and each child for its size, since
 * a child growing is how content outgrows a container whose size is capped.
 * The children are re-observed whenever the content changes, and a change of
 * text alone is caught by the same mutation observer, as is a control
 * entering or leaving the tab order. Measured in a layout effect, so the
 * first paint already has the answer rather than a frame later.
 */
function useScrollStop(
  ref: RefObject<HTMLElement | null>,
  { label, title }: Naming,
): ScrollStopProps {
  const [scrolls, setScrolls] = useState(false)
  const [holdsTabStop, setHoldsTabStop] = useState(false)

  useLayoutEffect(() => {
    const element = ref.current
    if (element === null) {
      return undefined
    }

    const measure = () => {
      setScrolls(
        element.scrollHeight > element.clientHeight ||
          element.scrollWidth > element.clientWidth,
      )
    }
    const read = () => {
      setHoldsTabStop(
        [...element.querySelectorAll<HTMLElement>(TABBABLE)].some(
          (candidate) =>
            candidate.tabIndex >= 0 &&
            candidate.closest('[inert]') === null &&
            candidate.getClientRects().length > 0,
        ),
      )
    }
    const resize = new ResizeObserver(measure)
    const observe = () => {
      resize.disconnect()
      resize.observe(element)
      for (const child of element.children) {
        resize.observe(child)
      }
    }
    const mutation = new MutationObserver(() => {
      observe()
      measure()
      read()
    })

    observe()
    mutation.observe(element, {
      attributeFilter: TAB_ORDER_ATTRIBUTES,
      characterData: true,
      childList: true,
      subtree: true,
    })
    measure()
    read()

    return () => {
      resize.disconnect()
      mutation.disconnect()
    }
  }, [ref])

  if (!scrolls || holdsTabStop) {
    return {}
  }
  return {
    'aria-labelledby': label === undefined ? title : undefined,
    role: label === undefined && title === undefined ? undefined : 'region',
    tabIndex: 0,
  }
}

export { useScrollStop }
