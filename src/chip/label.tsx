import type { ReactNode } from 'react'

import * as stylex from '@stylexjs/stylex'

import { useClippedTitle } from '../hooks/useClippedTitle'
import { chipStyles } from './styles'

// Apart from ./index.tsx so that file keeps to the helpers it shares and this
// one to the component, which is what keeps fast refresh working for both.

// The span `chipLabel` draws, as a component, since the title is state and
// `chipLabel` is called from React Aria's render functions.
//
// `dir="auto"` runs the label the way its own first strong letter says, and
// `chipStyles.label` isolates it from the text around it, as a `<bdi>` is: a
// label is the call site's text, often a tag or a mention, and a leading `#`
// or `@` is a neutral character that otherwise takes the page's direction —
// `#first` read `first#` in a right-to-left page. A label with no strong
// letter at all, a count, runs left to right, the way its digits read in
// either direction.
function ChipLabel({ children }: { children: ReactNode }) {
  const clipped = useClippedTitle(children)

  return (
    <span dir="auto" {...clipped} {...stylex.props(chipStyles.label)}>
      {children}
    </span>
  )
}

export { ChipLabel }
