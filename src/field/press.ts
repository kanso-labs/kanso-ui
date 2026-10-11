import type { PointerEvent } from 'react'

// A field's press handler, apart from ./index.tsx so that file exports
// components alone, which is what keeps fast refresh working for it. The
// box every field draws takes it, and so does the search page's bar, which
// is drawn apart from that box.

// What a press inside a box leaves to the element it lands on: anything that
// acts on a press of its own, and the control itself, where the browser
// places the caret.
const PRESSABLE =
  'a, button, input, textarea, select, [role="button"], [contenteditable="true"]'

// What a press on the box focuses: the field's text control, or the first
// editable element where the control is not an input — a token field's
// editable area, a date field's first segment. Never the hidden input a
// segmented field carries its value to a form in.
const CONTROL = 'input:not([type="hidden"]), textarea, [contenteditable="true"]'

/**
 * The box's press handler: a press anywhere on the box focuses the control
 * in it, as the whole of a native text field's box does. The box is 56dp
 * and the control's line 24dp of it, so the padding above and below the
 * line, the padding at either end and the icons were dead to a press —
 * nothing took focus, and nothing said why. Built by a call rather than
 * written at the prop, which is what react-perf's no-new-function-as-prop is
 * after; the React Compiler memoises it on the call site's own handler,
 * which runs first.
 */
function focusesControl(
  onPointerDown: ((event: PointerEvent<HTMLDivElement>) => void) | undefined,
) {
  return (event: PointerEvent<HTMLDivElement>) => {
    onPointerDown?.(event)
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      !(event.target instanceof Element) ||
      event.target.closest(PRESSABLE) !== null
    ) {
      return
    }
    const control = event.currentTarget.querySelector<HTMLElement>(CONTROL)
    if (control === null || control.matches(':disabled')) {
      return
    }
    // Held, so the press does not move focus to the page on its way down
    // and away from the control the line below hands it to.
    event.preventDefault()
    control.focus()
  }
}

export { focusesControl }
