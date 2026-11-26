import type { MouseEvent, PointerEvent } from 'react'

// A field's press handler, apart from ./index.tsx so that file exports
// components alone, which is what keeps fast refresh working for it. The
// box every field draws takes it, and so does the search page's bar, which
// is drawn apart from that box.

// What a press inside a box leaves to the element it lands on: anything that
// acts on a press of its own, and the control itself, where the browser
// places the caret.
const PRESSABLE =
  'a, button, input, textarea, select, [role="button"], [contenteditable="true"]'

// What a press on the box may focus: the field's text control, or the
// editable elements where the control is not an input — a token field's
// editable area, a date field's segments. Never the hidden input a segmented
// field carries its value to a form in.
const CONTROL = 'input:not([type="hidden"]), textarea, [contenteditable="true"]'

// The control each box's last press down focused, until the click that
// press ends in. React Aria's label for a date field focuses the first
// segment on a click, which follows the press down whatever it did, so a
// press on the label over the day focused the day and then the month; the
// box's own click, after the label's, focuses the day again.
const pressed = new WeakMap<Element, HTMLElement>()

/**
 * The box's press handler: a press anywhere on the box focuses the control
 * in it nearest the press, as the whole of a native text field's box does. The box is 56dp
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
    pressed.delete(event.currentTarget)
    onPointerDown?.(event)
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      !(event.target instanceof Element) ||
      event.target.closest(PRESSABLE) !== null
    ) {
      return
    }
    const control = nearestTo(
      event.currentTarget.querySelectorAll<HTMLElement>(CONTROL),
      event.clientX,
    )
    if (control === null || control.matches(':disabled')) {
      return
    }
    // Held, so the press does not move focus to the page on its way down
    // and away from the control the line below hands it to.
    event.preventDefault()
    control.focus()
    pressed.set(event.currentTarget, control)
  }
}

/**
 * The box's handler for a press the browser cancelled, as a touch that
 * turns into a scroll is: that press ends in no click, so nothing it
 * focused is held for one.
 */
function forgetsCancelledPress(
  onPointerCancel: ((event: PointerEvent<HTMLDivElement>) => void) | undefined,
) {
  return (event: PointerEvent<HTMLDivElement>) => {
    onPointerCancel?.(event)
    pressed.delete(event.currentTarget)
  }
}

/**
 * The box's click handler: the click that ends a press `focusesControl`
 * answered puts focus back on the control that press focused, should
 * anything inside the box have moved it on the way up, as a date field's
 * label does. The click goes on as it would, to whatever else listens. Only
 * a pointer's click counts, `detail` above 0, which a press down always
 * comes before, so a click from the keyboard or a screen reader, which has
 * none, is left alone, and so is one after a press that was cancelled.
 */
function keepsPressedFocus(
  onClick: ((event: MouseEvent<HTMLDivElement>) => void) | undefined,
) {
  return (event: MouseEvent<HTMLDivElement>) => {
    onClick?.(event)
    const control = pressed.get(event.currentTarget)
    pressed.delete(event.currentTarget)
    if (
      control !== undefined &&
      event.detail > 0 &&
      control.isConnected &&
      document.activeElement !== control
    ) {
      control.focus()
    }
  }
}

/**
 * The control nearest a press along the box's line: the one whose span
 * holds it, else the one whose edge is closest, the first on a tie. A field
 * with one control gets that control. A date's segments are each a control,
 * and its line is 24dp of the 56dp box, so each segment's press area is the
 * box's whole height under it: a press just below the day focuses the day,
 * where it focused the month, the first segment, whatever the press was
 * nearest.
 */
function nearestTo(controls: NodeListOf<HTMLElement>, x: number) {
  let nearest: HTMLElement | null = null
  let distance = Infinity
  for (const control of controls) {
    const { left, right } = control.getBoundingClientRect()
    const away = Math.max(left - x, x - right, 0)
    if (away < distance) {
      nearest = control
      distance = away
    }
  }
  return nearest
}

export { focusesControl, forgetsCancelledPress, keepsPressedFocus }
