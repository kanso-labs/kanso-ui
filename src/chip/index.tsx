import type { ReactNode } from 'react'

import * as stylex from '@stylexjs/stylex'

import { CheckGlyph } from '../glyphs'
import { focus } from '../styles/focus'
import { chipLayers, chipStyles } from './styles'

/**
 * What a chip draws before its label: the check while it is selected, its own
 * icon while it is not, and nothing for an unselected chip with no icon.
 * Returns a node rather than letting the type be inferred, since `ReactNode`
 * is a union that includes a promise and an inferred one has to be `async`.
 *
 * The check takes the icon's place rather than joining it, as the chips page
 * draws a filter chip and as a segmented button's segments do. So a chip with
 * an icon keeps its width when it is chosen, where one without grows by the
 * slot.
 *
 * Shared rather than written at each of the two call sites: Chip and
 * ChipGroup's chip draw the same pill from `./styles`, and a check written
 * twice is the drift that module exists to stop. Not a component of the
 * library's own and not exported from the package; see `src/row` for the
 * same arrangement around a list's row.
 */
function chipGlyph(
  state: { isDisabled: boolean; isSelected: boolean },
  icon?: ReactNode,
): ReactNode {
  if (state.isSelected) {
    return (
      <span {...stylex.props(chipStyles.glyph)}>
        <CheckGlyph {...stylex.props(chipStyles.glyphSvg)} />
      </span>
    )
  }
  if (icon === undefined || icon === null) {
    return null
  }
  return (
    <span
      {...stylex.props(chipStyles.glyph, !state.isDisabled && chipStyles.icon)}
    >
      {icon}
    </span>
  )
}

/**
 * The label a chip draws, in a span of its own so it can be cut short with an
 * ellipsis rather than wrapped out of the pill; see the header of `./styles`.
 * Shared for the reason `chipGlyph` is, by all three components that draw the
 * pill.
 */
function chipLabel(children: ReactNode): ReactNode {
  return <span {...stylex.props(chipStyles.label)}>{children}</span>
}

/**
 * The pill's styles in the render state React Aria hands a chip's
 * `className`, for Chip's toggle button and ChipGroup's tag alike. StyleX
 * cannot target `[data-selected]` on the element it is styling, so the
 * container is chosen here rather than in CSS — which is also why an
 * uncontrolled chip styles itself without keeping a copy of its state.
 *
 * Shared for the reason `chipGlyph` is: the order is the precedence. The
 * hover, focus and pressed layers come from the render state over the
 * container — focus over hover, and a press over both — and disabled comes
 * last so it wins over all of them, since StyleX replaces a property whole. `inGroup` is a ChipGroup's
 * chip, whose touch target reaches only halfway across the gap to the next
 * row; see `targetInGroup` in `./styles`.
 */
function chipPropsFor(
  state: {
    isDisabled: boolean
    isFocusVisible: boolean
    isHovered: boolean
    isPressed: boolean
    isSelected: boolean
  },
  inGroup = false,
) {
  return stylex.props(
    chipStyles.base,
    chipStyles.target,
    inGroup && chipStyles.targetInGroup,
    focus.ring,
    state.isSelected ? chipStyles.selected : chipStyles.unselected,
    state.isHovered &&
      (state.isSelected
        ? chipLayers.selectedHovered
        : chipLayers.unselectedHovered),
    state.isFocusVisible &&
      (state.isSelected
        ? chipLayers.selectedFocused
        : chipLayers.unselectedFocused),
    state.isPressed &&
      (state.isSelected
        ? chipLayers.selectedPressed
        : chipLayers.unselectedPressed),
    state.isDisabled && chipStyles.disabled,
    state.isDisabled &&
      (state.isSelected
        ? chipStyles.disabledSelected
        : chipStyles.disabledUnselected),
  )
}

/**
 * The close target's class, from its button's own render state, so its
 * hover and pressed layers follow React Aria's report rather than `:hover`
 * and `:active` — see `chipLayers`. A function, which React Aria's
 * `className` takes alongside a string.
 */
function chipRemoveClassName(state: {
  isHovered: boolean
  isPressed: boolean
}) {
  return (
    stylex.props(
      chipStyles.remove,
      state.isHovered && chipLayers.removeHovered,
      state.isPressed && chipLayers.removePressed,
    ).className ?? ''
  )
}

export { chipGlyph, chipLabel, chipPropsFor, chipRemoveClassName }
