import type { PressEvent } from 'react-aria-components'

import type { ButtonGroupItem } from './context'

// What a button in a standard ButtonGroup does about its own presses: tell
// the group when one starts, with its width, and when it ends, so the group
// can widen it and narrow its neighbours. Apart from ./index.tsx so that file
// exports components alone, which is what keeps fast refresh working for it.

/**
 * The press handlers a button inside a group that tracks presses takes: its
 * own, with the group told first. Empty anywhere else, which leaves the
 * call site's own handlers on the button untouched.
 */
function groupPressHandlers(
  group: ButtonGroupItem | null,
  onPressStart: ((event: PressEvent) => void) | undefined,
  onPressEnd: ((event: PressEvent) => void) | undefined,
) {
  const start = group?.onPressStart
  if (start === undefined) {
    return {}
  }
  const end = group?.onPressEnd

  return {
    onPressEnd: (event: PressEvent) => {
      end?.()
      onPressEnd?.(event)
    },
    onPressStart: (event: PressEvent) => {
      start(event.target.getBoundingClientRect().width)
      onPressStart?.(event)
    },
  }
}

export { groupPressHandlers }
