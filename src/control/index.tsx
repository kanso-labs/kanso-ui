import type { ReactNode } from 'react'

import * as stylex from '@stylexjs/stylex'
import { Text } from 'react-aria-components'

import { fieldChromeStyles } from '../field/styles'
import { controlStyles } from './styles'

type ControlDescriptionProps = {
  /** The hint. Nothing renders when there is none. */
  children: string | undefined
}

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
 * The hint under one option of a group, in the second column of its grid and
 * in the option's description slot, so it is read with the option.
 *
 * Not `FieldMessage`, which is the line under a whole field: it reads the
 * validation of the field around it and draws an error, or an empty line for
 * one to arrive in. An option sits inside its group's validation, so through
 * `FieldMessage` it took the group's error for its own — React Aria's
 * `FieldError` then rendered into the option's slots, which hold no error
 * slot, and threw — dropped its own hint whenever the group was invalid, and
 * drew an empty line under every option inside a `Form`. The group's own line
 * is where its error goes, and an option has only its hint to say.
 */
function ControlDescription({ children }: ControlDescriptionProps) {
  if (children === undefined) {
    return null
  }

  return (
    <div {...stylex.props(controlStyles.messages)}>
      <div
        {...stylex.props(
          fieldChromeStyles.message,
          fieldChromeStyles.messageLine,
        )}
      >
        <Text slot="description" {...stylex.props(fieldChromeStyles.message)}>
          {children}
        </Text>
      </div>
    </div>
  )
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

export type { ControlDescriptionProps, ControlLabelProps }
export { ControlDescription, ControlLabel }
