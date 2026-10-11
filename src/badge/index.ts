import type { StyleXStyles } from '@stylexjs/stylex'

import { createContext } from 'react'

// What a component drawing a badge can say about where its large mark goes.
// Apart from the badge itself for the reason src/row gives, and a module of
// its own rather than a part of the one place that uses it, since the badge
// imports it and that place imports the badge.

/**
 * A style laid over a large badge's mark by what the badge is drawn in,
 * after the mark's own, so it can move the mark out of its corner. A
 * navigation destination sets its label beside its icon in its horizontal
 * forms, and a count overhangs the icon by up to 22dp on that side: the
 * destination puts the mark in the flow there, so the label starts after it
 * rather than under it. See src/navigation/styles.ts.
 */
const BadgeMarkContext = createContext<null | StyleXStyles>(null)

export { BadgeMarkContext }
