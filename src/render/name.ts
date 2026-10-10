import type { ReactNode } from 'react'

// What gives a control its accessible name, as a type a component's props
// take one of. Written out so a control with no name source is a compile
// error rather than an unnamed control a screen reader announces as just
// its role — React Aria warns about a missing label only where it renders no
// labelled child, which a switch, a chip and a segmented set all do.

/**
 * A name from the control's own content — the label beside a switch — or,
 * where a row labels it some other way, from an attribute.
 */
type AccessibleName =
  | LabelledByAttribute
  | {
      'aria-label'?: string
      'aria-labelledby'?: string
      children: ReactNode
    }

/** A name from an attribute: the label itself, or the id of what labels it. */
type LabelledByAttribute =
  | { 'aria-label': string; 'aria-labelledby'?: string }
  | { 'aria-label'?: string; 'aria-labelledby': string }

export type { AccessibleName, LabelledByAttribute }
