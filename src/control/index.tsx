import type { ReactNode, SyntheticEvent } from 'react'

import * as stylex from '@stylexjs/stylex'
import { Text } from 'react-aria-components'

import { RequiredMark } from '../field'
import { fieldChromeStyles } from '../field/styles'
import { controlStyles } from './styles'

type ControlDescriptionProps = {
  /** The hint. Nothing renders when there is none. */
  children: string | undefined
}

type ControlLabelProps = {
  /** The label's text. Nothing renders when there is none. */
  children: ReactNode
  /**
   * Whether the control must be chosen, which ends the label in the asterisk
   * every required field's label ends in.
   * @default false
   */
  isRequired?: boolean
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

// What a press inside a label belongs to rather than the control: anything
// that acts on its own, where a native `<label>` leaves the press to it too.
const INTERACTIVE =
  'a[href], button, input, select, textarea, [role="button"], [role="link"]'

/**
 * The label beside a selection control, in the second column of its grid.
 *
 * Renders nothing without children, which is what a control labelled from
 * outside — by a group's legend, or an `aria-label` — needs.
 *
 * A link or a button inside it acts on its own rather than toggling the
 * control — see `keepToInteractive`.
 */
function ControlLabel({
  children,
  isRequired = false,
  state,
}: ControlLabelProps) {
  if (children === undefined) {
    return null
  }

  return (
    // The handlers only stop events on their way out of the label; they
    // handle nothing themselves, which is what jsx-a11y cannot tell.
    // oxlint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events
    <span
      onClick={keepToInteractive}
      onKeyDown={keepToInteractive}
      onKeyUp={keepToInteractive}
      onMouseDown={keepToInteractive}
      onMouseUp={keepToInteractive}
      onPointerDown={keepToInteractive}
      onPointerUp={keepToInteractive}
      onTouchEnd={keepToInteractive}
      onTouchStart={keepToInteractive}
      {...stylex.props(
        controlStyles.label,
        state.isReadOnly && controlStyles.labelReadOnly,
        state.isDisabled && controlStyles.labelDisabled,
      )}
    >
      {children}
      {isRequired ? <RequiredMark /> : null}
    </span>
  )
}

/**
 * Keeps a press or a key that starts in something interactive inside the
 * label — the link in "I agree to the terms" — from reaching the control's
 * own press handling, which sits on the element around the label. React Aria
 * took such a press as a press on the control, toggling it and stopping the
 * link's own default, so a click toggled the box and left the page where it
 * was, and Enter did neither. Stopped here, the event goes no further than
 * the label, and the browser's own default — following the link — is left
 * alone, as a native label leaves it. A press anywhere else in the label
 * still reaches the control and toggles it.
 */
function keepToInteractive(event: SyntheticEvent<HTMLSpanElement>) {
  const { currentTarget, target } = event
  const interactive =
    target instanceof Element ? target.closest(INTERACTIVE) : null
  if (interactive !== null && currentTarget.contains(interactive)) {
    event.stopPropagation()
  }
}

export type { ControlDescriptionProps, ControlLabelProps }
export { ControlDescription, ControlLabel }
