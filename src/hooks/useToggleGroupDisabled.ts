import type { Key } from 'react-aria-components'

import { useContext } from 'react'
import { ToggleGroupStateContext } from 'react-aria-components'

/**
 * Whether the React Aria `ToggleButtonGroup` around a toggle disables it.
 *
 * The group does that through its own state rather than through the toggle's
 * props, so it reaches the toggle's render state and nothing earlier. A
 * ripple has to know earlier than that, since its handlers go on the element
 * outside the render function, and this is where it reads the group.
 *
 * Only a toggle with an `id` belongs to the group: React Aria leaves one
 * without an `id` to keep its own state, enabled whatever the group says.
 * This follows the same rule, so a toggle the group does not disable keeps
 * its ripple.
 */
function useToggleGroupDisabled(id: Key | undefined): boolean {
  const group = useContext(ToggleGroupStateContext)
  return group !== null && id !== undefined && group.isDisabled
}

export { useToggleGroupDisabled }
