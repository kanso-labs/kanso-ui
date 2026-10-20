import type { ReactNode } from 'react'

import * as stylex from '@stylexjs/stylex'

import { useClippedTitle } from '../hooks/useClippedTitle'
import { chipStyles } from './styles'

// Apart from ./index.tsx so that file keeps to the helpers it shares and this
// one to the component, which is what keeps fast refresh working for both.

// The span `chipLabel` draws, as a component, since the title is state and
// `chipLabel` is called from React Aria's render functions.
function ChipLabel({ children }: { children: ReactNode }) {
  const clipped = useClippedTitle(children)

  return (
    <span {...clipped} {...stylex.props(chipStyles.label)}>
      {children}
    </span>
  )
}

export { ChipLabel }
