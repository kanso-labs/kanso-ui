import type { ReactNode } from 'react'

// Apart from ./index.tsx so that file exports components alone, which is what
// keeps fast refresh working for it — the same arrangement ./styles.ts has.

// The text children render as, or `undefined` once any part is not text.
function flatText(node: ReactNode): string | undefined {
  if (typeof node === 'string') {
    return node
  }
  if (typeof node === 'number' || typeof node === 'bigint') {
    return String(node)
  }
  if (node === null || node === undefined || typeof node === 'boolean') {
    return ''
  }
  if (!isNodeArray(node)) {
    return undefined
  }
  let text = ''
  for (const part of node) {
    const partText = flatText(part)
    if (partText === undefined) {
      return undefined
    }
    text += partText
  }
  return text
}

// `Array.isArray` narrows to `any[]`, which says nothing about the parts.
function isNodeArray(node: ReactNode): node is readonly ReactNode[] {
  return Array.isArray(node)
}

/**
 * What a collection item is worth as text: what React Aria matches typeahead
 * on, what a combo box filters by, what a select shows once an option is
 * chosen, and what names a chip. React Aria reads it off an item's children
 * when they are a string and finds nothing when they are not — and an item
 * here is always an element, since it wraps its text in one of its own. So
 * this reads it instead, from children made of text alone: a string, a
 * number, or an array of those, which is what JSX hands over for
 * `Label {3}`. The parts join as React renders them, and `null`, `undefined`
 * and booleans count for nothing, as they draw nothing. Anything holding an
 * element is worth no text here, so it has to say what it is worth through
 * `textValue`.
 */
function textOf(children: ReactNode) {
  const text = flatText(children)
  return text === '' ? undefined : text
}

export { textOf }
