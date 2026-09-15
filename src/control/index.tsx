import type { ReactNode } from 'react'

import * as stylex from '@stylexjs/stylex'

import { controlStyles } from './styles'

type ControlLabelProps = {
  /** The label's text. Nothing renders when there is none. */
  children: ReactNode
  /** The render state React Aria hands the component. */
  state: ControlLabelState
}

/**
 * The state a label reads. Each of React Aria's three render states carries
 * more than this, and this is the part all three share.
 */
type ControlLabelState = {
  isDisabled: boolean
  isReadOnly: boolean
}

/**
 * The label beside a selection control, in the second column of its grid.
 *
 * Renders nothing without children, which is what a control labelled from
 * outside — by a group's legend, or an `aria-label` — needs.
 */
function ControlLabel({ children, state }: ControlLabelProps) {
  if (children === undefined) {
    return null
  }

  return (
    <span
      {...stylex.props(
        controlStyles.label,
        state.isReadOnly && controlStyles.labelReadOnly,
        state.isDisabled && controlStyles.labelDisabled,
      )}
    >
      {children}
    </span>
  )
}

export type { ControlLabelProps }
export { ControlLabel }
