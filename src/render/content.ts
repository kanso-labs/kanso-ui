import type { ReactNode } from 'react'

/**
 * Whether a slot was handed anything to draw. React draws nothing for
 * `null`, `false`, `true` or an empty string, and a call site passes them
 * for "nothing here" — `leading={user.avatar && <Avatar />}`, or a note that
 * is `null` — so a slot that asked only whether it was `undefined` drew an
 * empty wrapper for them, and a row counted a line it never showed. `0` is
 * content, since React draws it, and so is a string of spaces.
 */
function hasContent(node: ReactNode): boolean {
  return (
    node !== undefined &&
    node !== null &&
    node !== false &&
    node !== true &&
    node !== ''
  )
}

export { hasContent }
