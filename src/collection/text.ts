import type { ReactNode } from 'react'

// Apart from ./index.tsx so that file exports components alone, which is what
// keeps fast refresh working for it — the same arrangement ./styles.ts has.

/**
 * What a collection item is worth as text: what React Aria matches typeahead
 * on, what a combo box filters by, what a select shows once an option is
 * chosen, and what names a chip. React Aria reads it off an item's children
 * when they are a string and finds nothing when they are not — and an item
 * here is always an element, since it wraps its text in one of its own. So
 * plain-string children become the text value, and anything else has to say
 * what it is worth through `textValue`.
 */
function textOf(children: ReactNode) {
  return typeof children === 'string' ? children : undefined
}

export { textOf }
