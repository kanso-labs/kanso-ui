import type { DateDuration } from '@internationalized/date'

import { useSyncExternalStore } from 'react'

// The window the date pickers dock their calendar in while its months stack:
// from the medium breakpoint, where `src/styles/picker.ts` stops centring the
// surface, to the expanded one, where `src/calendar/styles.ts` puts the months
// side by side. Spelled again for `matchMedia`, since the stylesheet reads
// both as `media.medium` and `media.belowExpanded` and this is the one thing
// that has to know them outside it: a calendar's months are a prop, not a
// style.
const DOCKED_AND_STACKED = '(600px <= width < 840px)'

const ONE_MONTH: DateDuration = { months: 1 }

function isDockedAndStacked() {
  return window.matchMedia(DOCKED_AND_STACKED).matches
}

function isDockedAndStackedOnServer() {
  return false
}

function subscribe(listener: () => void) {
  const query = window.matchMedia(DOCKED_AND_STACKED)
  query.addEventListener('change', listener)
  return () => {
    query.removeEventListener('change', listener)
  }
}

/**
 * The months a docked date picker's calendar shows at once: what the call
 * site asked for, apart from between the medium and the expanded breakpoint,
 * where more than one comes down to one.
 *
 * There the surface is docked under the field and the months stack, and two
 * stacked months are taller than the room under a field near the top of a
 * tablet's window: the surface capped itself at that room and scrolled, and
 * the second month's last week sat below its edge with nothing to say it was
 * there. One month fits, and the calendar pages a month at a time. Below the
 * medium breakpoint the surface is the modal, centred with the window's height
 * to hold it, and the months stack there as asked.
 */
function useDockedMonths(
  visibleDuration: DateDuration | undefined,
): DateDuration | undefined {
  const narrowed = useSyncExternalStore(
    subscribe,
    isDockedAndStacked,
    isDockedAndStackedOnServer,
  )

  return narrowed && (visibleDuration?.months ?? 1) > 1
    ? ONE_MONTH
    : visibleDuration
}

export { useDockedMonths }
