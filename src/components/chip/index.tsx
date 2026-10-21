'use client'

import type { ReactNode, RefAttributes } from 'react'
import type {
  ButtonRenderProps,
  FocusableElement,
  ButtonProps as RACButtonProps,
  ToggleButtonProps as RACToggleButtonProps,
  ToggleButtonRenderProps,
} from 'react-aria-components'

import { Button, ToggleButton } from 'react-aria-components'

import type { ChipKind } from '../../chip'

import {
  chipGlyph,
  chipLabel,
  chipPropsFor,
  chipTrailingIcon,
} from '../../chip'
import { useRipple } from '../../hooks/useRipple'
import {
  ariaAttributesOf,
  buttonRenderer,
  toggleButtonRenderer,
} from '../../render/aria'
import { mergeStatefulStyles } from '../../styles/merge'

// The pill, its containers, its check and its disabled treatment are the
// chip module's in `src/chip`, shared with the chips a ChipGroup draws; what
// is here is React Aria's button around them. Three of the chips page's four
// chips are drawn here, and `variant` picks the button:
//
// - **A filter chip**, the default, is React Aria's `ToggleButton`: a
//   two-state button announced through `aria-pressed`, which takes the
//   secondary container and the check once selected.
// - **An assist or suggestion chip** is React Aria's `Button`: an action, so
//   nothing is announced as pressed and nothing is ever selected. The two
//   differ in the label's role alone; see `src/chip/styles.ts`.
//
// The page's fourth, the input chip, is ChipGroup's removable chip, and a
// token in a TokenField.
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
//
// A press ripples, as it does on every other pressable control here: the
// chips page names the ripple as the pressed state, beside the layer.

/** An assist or suggestion chip: an action, drawn as a plain button. */
type ChipActionProps = ChipBaseProps &
  Omit<RACButtonProps, 'children' | 'isPending'> & {
    // Described on the filter chip's `variant` alone: the table joins the
    // descriptions of both, and the one sentence there covers all three.
    variant: 'assist' | 'suggestion'
  }

/**
 * What every chip takes, whichever button it is. Declared once rather than on
 * each member of the union, so each prop has one description: the props table
 * joins the descriptions of a prop the members declare apart.
 */
type ChipBaseProps = {
  /**
   * The chip's label. A node rather than React Aria's node-or-function, since
   * a filter chip puts its own check before whatever this is and a function
   * would be handed a `defaultChildren` the chip never rendered. ChipGroup's
   * chip narrows it the same way, for the same reason. Required: the page
   * draws no chip without one, and a chip with none is an empty button to a
   * screen reader.
   */
  children: ReactNode
  /**
   * Raises the chip off the page on a container of its own, at the page's
   * elevation 1, in place of the outline. A selected filter chip keeps the
   * secondary container.
   * @default false
   */
  elevated?: boolean
  /**
   * An icon before the label, in the page's 18dp slot and the primary role.
   * On a filter chip the check takes its place while the chip is selected, so
   * the chip keeps its width. An icon drawn in `em` takes its size from the
   * slot.
   */
  icon?: ReactNode
}

/** A filter chip: a two-state button, the default. */
type ChipFilterProps = ChipBaseProps &
  Omit<RACToggleButtonProps, 'children'> & {
    /**
     * An icon after the label, in the same 18dp slot and the chip's own
     * content role, which is the page's dropdown filter chip: an arrow here
     * says the chip opens a menu. It stays while the chip is selected. An
     * icon drawn in `em` takes its size from the slot.
     */
    trailingIcon?: ReactNode
    /**
     * `filter`, the default, for a two-state button; `assist` for an action
     * the chip's context suggests, and `suggestion` for one the product
     * generates. Either of those is an action rather than a selection, so
     * neither is ever selected.
     * @default 'filter'
     */
    variant?: 'filter'
  }

type ChipProps = ChipActionProps | ChipFilterProps

/** Which of the chips page's chips a Chip is. */
type ChipVariant = 'assist' | 'filter' | 'suggestion'

function ActionChip({
  children,
  elevated = false,
  icon,
  onClick,
  onContextMenu,
  onKeyDown,
  onKeyUp,
  onPointerCancel,
  onPointerDown,
  onPointerLeave,
  onPointerUp,
  render,
  variant,
  ...props
}: ChipActionProps & RefAttributes<HTMLButtonElement>) {
  const element = { aria: ariaAttributesOf(props), onKeyDown, onKeyUp }
  // Off while disabled, as on the filter chip. `onClick` goes through the
  // ripple too: on a mouse press the ripple ends on the click, so a call
  // site's own handler spread beside it would leave it pressed.
  const ripple = useRipple<FocusableElement>(props.isDisabled !== true, {
    onClick,
    onContextMenu,
    onPointerCancel,
    onPointerDown,
    onPointerLeave,
    onPointerUp,
  })

  return (
    <Button
      render={buttonRenderer(element, render)}
      {...ripple.handlers}
      {...props}
      {...mergeStatefulStyles(actionChipClasses(variant, elevated), props)}
    >
      {actionChipContent(children, icon, ripple.surface)}
    </Button>
  )
}

// An action chip's classes: the unselected pill, which it always is.
function actionChipClasses(kind: ChipKind, elevated: boolean) {
  return (state: ButtonRenderProps) =>
    chipPropsFor({ ...state, isSelected: false }, { elevated, kind })
}

// What an action chip draws: its icon, if any, then the label, and the
// ripple over both. Built by a call for the reason `chipContent` is.
function actionChipContent(
  children: ReactNode,
  icon: ReactNode,
  surface: ReactNode,
) {
  return (state: ButtonRenderProps) => (
    <>
      {chipGlyph(
        { isDisabled: state.isDisabled, isSelected: false },
        icon,
        false,
      )}
      {chipLabel(children)}
      {surface}
    </>
  )
}

/**
 * A chip. By default a filter chip, which is a two-state button, so its
 * selected state is React Aria's `isSelected`: pass it with `onChange` to
 * control it, or `defaultSelected` to let it keep its own state. Selection is
 * announced through `aria-pressed` rather than a role of its own.
 *
 * This is the chip on its own. A set of chips with a selection rule, one at a
 * time or several, is a `ChipGroup`, which keeps the rule, moves between the
 * chips with the arrow keys and labels the set.
 *
 * Given a `trailingIcon`, a filter chip is the page's dropdown filter chip:
 * placed first inside a `Menu`, it opens the menu, and an arrow after its
 * label says so.
 *
 * `variant="assist"` and `variant="suggestion"` draw the page's two action
 * chips instead: plain buttons, pressed with `onPress`, never selected.
 *
 * ```tsx
 * const [selected, setSelected] = useState(false)
 *
 * <Chip isSelected={selected} onChange={setSelected}>
 *   Label
 * </Chip>
 * <Chip icon={<AddIcon />} onPress={onAdd} variant="assist">
 *   Label
 * </Chip>
 * ```
 */
function Chip(props: ChipProps & RefAttributes<HTMLButtonElement>) {
  if (isAction(props)) {
    return <ActionChip {...props} />
  }
  return <FilterChip {...props} />
}

// What the chip draws, from React Aria's render state: the check while it is
// selected or its icon while it is not, then the label and any trailing
// icon, and the ripple over them all. Built by a call rather than written inline at the prop, which is what
// react-perf's no-new-function-as-prop is after; the React Compiler memoises
// the result on its inputs.
function chipContent(
  children: ReactNode,
  icon: ReactNode,
  trailingIcon: ReactNode,
  surface: ReactNode,
) {
  return (state: ToggleButtonRenderProps) => (
    <>
      {chipGlyph(state, icon)}
      {chipLabel(children)}
      {chipTrailingIcon(trailingIcon)}
      {surface}
    </>
  )
}

function FilterChip({
  children,
  elevated = false,
  icon,
  onClick,
  onContextMenu,
  onKeyDown,
  onKeyUp,
  onPointerCancel,
  onPointerDown,
  onPointerLeave,
  onPointerUp,
  render,
  trailingIcon,
  variant = 'filter',
  ...props
}: ChipFilterProps & RefAttributes<HTMLButtonElement>) {
  const element = { aria: ariaAttributesOf(props), onKeyDown, onKeyUp }
  // Off while disabled: React Aria still forwards pointer events to a
  // disabled element, and a press that changes nothing should not look like
  // one. Typed as Button's ripple is, since React Aria types a toggle
  // button's pointer events against a <div> rather than the <button> it
  // renders. `onClick` goes through it for the action chip's reason.
  const ripple = useRipple<FocusableElement>(props.isDisabled !== true, {
    onClick,
    onContextMenu,
    onPointerCancel,
    onPointerDown,
    onPointerLeave,
    onPointerUp,
  })

  return (
    <ToggleButton
      render={toggleButtonRenderer(element, render)}
      {...ripple.handlers}
      {...props}
      {...mergeStatefulStyles(filterChipClasses(variant, elevated), props)}
    >
      {chipContent(children, icon, trailingIcon, ripple.surface)}
    </ToggleButton>
  )
}

// A filter chip's classes, from its render state.
function filterChipClasses(kind: ChipKind, elevated: boolean) {
  return (state: ToggleButtonRenderProps) =>
    chipPropsFor(state, { elevated, kind })
}

// Whether a chip is one of the two action chips. A guard rather than a
// comparison at the call, since TypeScript does not narrow the union through
// React Aria's mapped prop types on `variant` alone.
function isAction(props: ChipProps): props is ChipActionProps {
  return props.variant === 'assist' || props.variant === 'suggestion'
}

export type { ChipActionProps, ChipFilterProps, ChipProps, ChipVariant }

export default Chip
