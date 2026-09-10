import type {
  ToggleButtonProps,
  ToggleButtonRenderProps,
} from 'react-aria-components'

import * as stylex from '@stylexjs/stylex'
import { ToggleButton } from 'react-aria-components'

import { chipStyles } from '../../chip/styles'
import { mergeStatefulStyles } from '../../styles/merge'

// The pill, its two containers and its disabled treatment are the chip
// module's in `src/chip`, shared with the chips a ChipGroup draws; what is
// here is React Aria's `ToggleButton` around them, which is what makes a
// standalone chip a two-state button rather than one of a set.

type ChipProps = ToggleButtonProps

/**
 * A chip is a two-state button, so its selected state is React Aria's
 * `isSelected`: pass it with `onChange` to control it, or `defaultSelected` to
 * let it keep its own state. Selection is announced through `aria-pressed`
 * rather than a role of its own.
 */
function Chip({ children, ...props }: ChipProps) {
  return (
    <ToggleButton {...props} {...mergeStatefulStyles(propsFor, props)}>
      {children}
    </ToggleButton>
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
