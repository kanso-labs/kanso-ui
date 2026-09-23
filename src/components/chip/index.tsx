import type { ReactNode } from 'react'
import type {
  ToggleButtonProps as RACToggleButtonProps,
  ToggleButtonRenderProps,
} from 'react-aria-components'

import * as stylex from '@stylexjs/stylex'
import { ToggleButton } from 'react-aria-components'

import { chipGlyph, chipLabel } from '../../chip'
import { chipStyles } from '../../chip/styles'
import { ariaAttributesOf, toggleButtonRenderer } from '../../render/aria'
import { focus } from '../../styles/focus'
import { mergeStatefulStyles } from '../../styles/merge'

// The pill, its two containers, its check and its disabled treatment are the
// chip module's in `src/chip`, shared with the chips a ChipGroup draws; what
// is here is React Aria's `ToggleButton` around them, which is what makes a
// standalone chip a two-state button rather than one of a set.
//
// Two of the call site's props go on the element through `src/render/aria`
// rather than through that spread, as `Button` and `IconButton` do. React
// Aria builds a button's attributes from an allowlist that holds only the
// labelling `aria-*` and the state it manages itself, so any other one — a
// shortcut, an owned element — is dropped before it reaches the DOM. And it
// wraps a keyboard handler it is given so that the event stops there unless
// the handler asks otherwise, which is its convention rather than the DOM's;
// on the element the handler bubbles, so an Escape pressed on a chip inside
// a dialog still reaches the dialog.

type ChipProps = Omit<RACToggleButtonProps, 'children'> & {
  /**
   * The chip's label. A node rather than React Aria's node-or-function,
   * since the chip puts its own check before whatever this is and a function
   * would be handed a `defaultChildren` the chip never rendered. ChipGroup's
   * chip narrows it the same way, for the same reason.
   */
  children?: ReactNode
}

/**
 * A chip is a two-state button, so its selected state is React Aria's
 * `isSelected`: pass it with `onChange` to control it, or `defaultSelected` to
 * let it keep its own state. Selection is announced through `aria-pressed`
 * rather than a role of its own.
 */
function Chip({ children, onKeyDown, onKeyUp, render, ...props }: ChipProps) {
  const element = { aria: ariaAttributesOf(props), onKeyDown, onKeyUp }

  return (
    <ToggleButton
      render={toggleButtonRenderer(element, render)}
      {...props}
      {...mergeStatefulStyles(propsFor, props)}
    >
      {chipContent(children)}
    </ToggleButton>
  )
}

// What the chip draws, from React Aria's render state: the check while it is
// selected, then the label. Built by a call rather than written inline at
// the prop, which is what react-perf's no-new-function-as-prop is after; the
// React Compiler memoises the result on its input.
function chipContent(children: ReactNode) {
  return (state: ToggleButtonRenderProps) => (
    <>
      {chipGlyph(state.isSelected)}
      {chipLabel(children)}
    </>
  )
}

// StyleX has no way to target [data-selected] on the element it is styling,
// so the selected styles cannot be chosen in CSS. React Aria's answer is to
// let className and style be functions of the component's own render state,
// which is what this is — and it is why an uncontrolled chip styles itself
// correctly without this component keeping a copy of the state.
//
// mergeStatefulStyles takes the function rather than a computed result for
// exactly that reason, and combines it with whatever the call site passed.
function propsFor(state: ToggleButtonRenderProps) {
  return stylex.props(
    chipStyles.base,
    focus.ring,
    state.isSelected ? chipStyles.selected : chipStyles.unselected,
    state.isDisabled && chipStyles.disabled,
    state.isDisabled &&
      (state.isSelected
        ? chipStyles.disabledSelected
        : chipStyles.disabledUnselected),
  )
}

export type { ChipProps }

export default Chip
