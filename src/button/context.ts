import type * as stylex from '@stylexjs/stylex'

import { createContext } from 'react'

import type { ButtonState } from '.'

// What a group hands each Button or IconButton in it: ButtonGroup's two
// variants and SplitButton's two halves. Apart from ./index.tsx so that file
// exports components alone, which is what keeps fast refresh working for it.

type ButtonGroupItem = {
  /** Called as a press on the button ends, so the group lets go of it. */
  onPressEnd?: () => void
  /**
   * Called as a press on the button starts, with its width, so a standard
   * group can widen it and narrow its neighbours.
   */
  onPressStart?: (width: number) => void
  /**
   * How far the button's width moves while it or a neighbour is pressed, in
   * pixels: the pressed button's gain, or a neighbour's loss as a negative.
   * Zero at rest.
   */
  shift: number
  /** The group's size, which a button takes unless it names its own. */
  size: GroupSize | undefined
  /**
   * Styles the group lays over the button's own, from its render state: a
   * connected group's inner corners, a split button's paddings. Applied
   * after the button's own shape and before its disabled styles.
   */
  styles?: (state: ButtonState) => stylex.StyleXStyles[]
}

/** The five sizes Button and IconButton share. */
type GroupSize = 'lg' | 'md' | 'xl' | 'xs' | 'xxl'

const ButtonGroupItemContext = createContext<ButtonGroupItem | null>(null)

export type { ButtonGroupItem, GroupSize }

export { ButtonGroupItemContext }
