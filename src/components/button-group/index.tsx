'use client'

import type { CSSProperties, ReactNode, RefAttributes } from 'react'
import type { ToggleButtonGroupProps as RACToggleButtonGroupProps } from 'react-aria-components'

import * as stylex from '@stylexjs/stylex'
import { Children, isValidElement, useCallback, useState } from 'react'
import {
  ButtonContext,
  Group as RACGroup,
  ToggleButtonGroup as RACToggleButtonGroup,
} from 'react-aria-components'

import type { ButtonState } from '../../button'
import type { ButtonGroupItem, GroupSize } from '../../button/context'
import type { ButtonShape, ButtonSize } from '../button'

import { ButtonGroupItemContext } from '../../button/context'
import { mergeStyles } from '../../styles/merge'
import { radii, sizing, spacing } from '../../tokens/design.tokens.stylex'

// The button groups page's two groups, around Buttons and IconButtons placed
// inside: the standard group, buttons set apart by the page's 18dp, 12dp, 8dp,
// 8dp and 8dp across the sizes, and the connected group, buttons 2dp apart
// whose inner corners square off — 4dp, 8dp, 8dp, 16dp and 20dp — while the
// group's two ends keep the buttons' own round. A square connected group
// takes the same corner at its ends. The group draws nothing itself; it
// hands each button its size, its corners and its part in the press
// interaction through src/button/context.ts.
//
// **A press is felt across a standard group.** The pressed button widens by
// 15% of its width — the share Material Design's own group widens it by —
// and its neighbours narrow to make the room, so the group's width holds:
// both neighbours by half the gain each, or the one neighbour of a button at
// the group's end by all of it. Button takes the change as inline padding
// and IconButton as width, and both ease it over the motion tokens' short
// duration.
//
// **A connected group answers a press and a selection in the corner
// instead.** Its buttons stay where they are; a pressed one's inner corners
// tighten, and a selected one's round off entirely. The page gives the
// pressed corner for its small group alone, 4dp against the 8dp it rests at;
// the other sizes press to half their resting corner the same way. The page
// also gives XS and S buttons in a connected group a 48dp minimum width,
// which is their touch target.
//
// Given `selectionMode` the group is React Aria's `ToggleButtonGroup`, which
// makes every button in it a toggle and reports the selection by the
// buttons' `id`s: a radio group for `single`, a toolbar for `multiple`.
// Without it the group is React Aria's plain `Group`.

// The press interaction's share, from Material Design's own button group.
const EXPANDED_RATIO = 0.15

const DISABLED = { isDisabled: true }

const styles = stylex.create({
  group: {
    alignItems: 'center',
    boxSizing: 'border-box',
    display: 'inline-flex',
    flexWrap: 'nowrap',
  },
  // The touch target XS and S buttons keep in a connected group.
  minimum: {
    minInlineSize: '48px',
  },
})

// The space between buttons, by variant and size. The standard group's 18dp
// at XS falls between two steps of the spacing scale and is written out.
const gaps = stylex.create({
  connected: { gap: spacing.xxs },
  lg: { gap: spacing.sm },
  md: { gap: spacing.md },
  xl: { gap: spacing.sm },
  xs: { gap: '18px' },
  xxl: { gap: spacing.sm },
})

// A connected button's corners on each side, set from the button's place in
// the group and its state.
const corners = stylex.create({
  shape: (start: string, end: string) => ({
    borderEndEndRadius: end,
    borderEndStartRadius: start,
    borderStartEndRadius: end,
    borderStartStartRadius: start,
  }),
})

// The inner corner each size rests at, and the corner it presses to. The 20dp
// at XL falls between two steps of the radius scale, and the two halves that
// are not steps of it are written out too.
const INNER = {
  lg: radii.sm,
  md: radii.sm,
  xl: radii.lg,
  xs: radii.xs,
  xxl: '20px',
}

// The round end at each size: half the button's height. Not the pill's
// 9999px: CSS scales every corner of a box down together when two on one
// side add up to more than the side is long, so a 9999px end beside an 8px
// inner corner shrank the inner one to nothing. Half the height fits as
// written. A label that wraps makes a button taller than this, and its ends
// a little less than round.
const ROUND = {
  lg: `calc(${sizing.controlLg} / 2)`,
  md: `calc(${sizing.controlSm} / 2)`,
  xl: `calc(${sizing.controlXl} / 2)`,
  xs: `calc(${sizing.controlXs} / 2)`,
  xxl: `calc(${sizing.controlXxl} / 2)`,
}

const INNER_PRESSED = {
  lg: radii.xs,
  md: radii.xs,
  xl: radii.sm,
  xs: '2px',
  xxl: '10px',
}

type ButtonGroupProps = Omit<
  RACToggleButtonGroupProps,
  'children' | 'className' | 'selectionMode' | 'style'
> &
  RefAttributes<HTMLDivElement> & {
    /** The buttons: Buttons and IconButtons, each with an `id` in a group that selects. */
    children?: ReactNode
    /** The class for the group's own element. */
    className?: string
    /**
     * Makes the group select, as React Aria's `ToggleButtonGroup`: `single`
     * for one at a time, `multiple` for any number. Left out, the group's
     * buttons are plain buttons.
     */
    selectionMode?: RACToggleButtonGroupProps['selectionMode']
    /**
     * The shape a connected group gives its two ends: `round`, the pill, or
     * `square`, the size's corner, which its inner corners take as well.
     * @default 'round'
     */
    shape?: ButtonShape
    /**
     * The size every button in the group takes, unless it names its own, and
     * the size the group spaces and shapes them for.
     * @default 'md'
     */
    size?: ButtonSize
    /** The style for the group's own element. */
    style?: CSSProperties
    /**
     * `standard` sets the buttons apart and widens a pressed one; `connected`
     * sets them 2dp apart with square inner corners.
     * @default 'standard'
     */
    variant?: ButtonGroupVariant
  }

type ButtonGroupVariant = 'connected' | 'standard'

type Press = { delta: number; index: number }

/**
 * A row of Buttons and IconButtons drawn as the button groups page's
 * standard or connected group. Given `selectionMode`, its buttons are
 * toggles whose selection the group keeps, by their `id`s.
 *
 * ```tsx
 * <ButtonGroup aria-label="Label" selectionMode="single" variant="connected">
 *   <Button id="first">First item</Button>
 *   <Button id="second">Second item</Button>
 *   <Button id="third">Third item</Button>
 * </ButtonGroup>
 * ```
 */
function ButtonGroup({
  children,
  className,
  ref,
  selectionMode,
  shape = 'round',
  size,
  style,
  variant = 'standard',
  ...props
}: ButtonGroupProps) {
  const [press, setPress] = useState<null | Press>(null)
  const items = Children.toArray(children).filter(isValidElement)
  const sized = size ?? 'md'
  const groupProps = mergeStyles(
    stylex.props(
      styles.group,
      variant === 'connected' ? gaps.connected : gaps[sized],
    ),
    { className, style },
  )
  const endPress = useCallback(() => {
    setPress(null)
  }, [])

  const content = items.map((child, index) => (
    <ButtonGroupItemContext
      key={child.key ?? index}
      value={itemFor({
        count: items.length,
        endPress,
        index,
        press,
        setPress,
        shape,
        size,
        variant,
      })}
    >
      {child}
    </ButtonGroupItemContext>
  ))

  if (selectionMode !== undefined) {
    return (
      <RACToggleButtonGroup
        ref={ref}
        selectionMode={selectionMode}
        {...props}
        {...groupProps}
      >
        {content}
      </RACToggleButtonGroup>
    )
  }

  // A plain group disables its buttons through React Aria's own context,
  // which Button and IconButton read; a selecting one does it itself.
  return (
    <RACGroup
      aria-label={props['aria-label']}
      aria-labelledby={props['aria-labelledby']}
      ref={ref}
      {...groupProps}
    >
      {props.isDisabled === true ? (
        <ButtonContext value={DISABLED}>{content}</ButtonContext>
      ) : (
        content
      )}
    </RACGroup>
  )
}

// A connected button's corners: the group's ends keep the outer shape, and
// every edge it shares with a neighbour takes the inner corner, tighter while
// pressed and round once selected — a press wins over a selection.
function connectedStyles(
  index: number,
  count: number,
  size: GroupSize,
  shape: ButtonShape,
  state: ButtonState,
) {
  const outer = shape === 'square' ? INNER[size] : ROUND[size]
  const inner = state.isPressed
    ? INNER_PRESSED[size]
    : state.isSelected === true
      ? ROUND[size]
      : INNER[size]
  const start = index === 0 ? outer : inner
  const end = index === count - 1 ? outer : inner

  return [
    corners.shape(start, end),
    (size === 'xs' || size === 'md') && styles.minimum,
  ]
}

// One button's part in the group: its size, its corners in a connected
// group, and its share of a press in a standard one.
function itemFor({
  count,
  endPress,
  index,
  press,
  setPress,
  shape,
  size,
  variant,
}: {
  count: number
  endPress: () => void
  index: number
  press: null | Press
  setPress: (press: Press) => void
  shape: ButtonShape
  size: GroupSize | undefined
  variant: ButtonGroupVariant
}): ButtonGroupItem {
  const sized = size ?? 'md'
  if (variant === 'connected') {
    return {
      shift: 0,
      size,
      styles: (state: ButtonState) =>
        connectedStyles(index, count, sized, shape, state),
    }
  }

  return {
    onPressEnd: endPress,
    onPressStart: (width: number) => {
      setPress({ delta: width * EXPANDED_RATIO, index })
    },
    shift: shiftFor(index, count, press),
    size,
  }
}

// How far a standard group moves one button's width while a press is held:
// the pressed button gains the whole share, and its neighbours give it up —
// half each, or all of it from the one neighbour of a button at an end.
function shiftFor(index: number, count: number, press: null | Press) {
  if (press === null) {
    return 0
  }
  if (index === press.index) {
    return press.delta
  }
  if (Math.abs(index - press.index) !== 1) {
    return 0
  }
  const atEnd = press.index === 0 || press.index === count - 1
  return -(atEnd ? press.delta : press.delta / 2)
}

export type { ButtonGroupProps, ButtonGroupVariant }

export default ButtonGroup
