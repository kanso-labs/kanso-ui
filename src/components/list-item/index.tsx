import type { HTMLAttributes, ReactNode } from 'react'

import * as stylex from '@stylexjs/stylex'

import { useRipple } from '../../hooks/useRipple'
import { RowContent } from '../../row'
import { rowStyles } from '../../row/styles'
import { mergeStyles } from '../../styles/merge'

type ListItemProps = {
  /** The row's headline — the one thing it is mostly about. */
  children?: ReactNode
  /**
   * Renders a `<button>` that ripples and tints on hover, for a row that is
   * itself pressable. Leave it off for a row that only presents.
   * @default false
   */
  interactive?: boolean
  /** Content before the headline: an avatar, an icon, a checkbox. */
  leading?: ReactNode
  /**
   * A line above the headline, in the page's label-small and the same muted
   * role the supporting line takes — a category, a date, a status. Given
   * alongside `supporting` it makes the row the page's three-line item.
   */
  overline?: ReactNode
  /** A second line under the headline, in the muted role. */
  supporting?: ReactNode
  /** Content after the headline, such as an amount or a control. */
  trailing?: ReactNode
} & HTMLAttributes<HTMLElement>

/**
 * A static row: the row every list draws, on its own, as the lists spec page
 * gives it — a 56px one-line container, a body-large headline and a
 * body-medium supporting line. A second line takes it to the page's 72px
 * two-line container; an `overline` puts that second line above the headline
 * instead of below it, and an overline with a supporting line makes the
 * page's three-line item, an 88px container with the leading and trailing
 * slots held at the top rather than centred. The layout and the states are
 * the row module's in `src/row`, shared with every collection item; what is
 * here is the element around them — a `<div>` that presents, or a `<button>`
 * that ripples — and the props that fill the slots.
 */
function ListItem({
  children,
  interactive = false,
  leading,
  overline,
  supporting,
  trailing,
  ...props
}: ListItemProps) {
  const ripple = useRipple<HTMLButtonElement>(interactive)

  // Which of the page's three items this row is, read from the content rather
  // than taken as a prop: a row holding all three lines already says it is
  // three lines, and a word for it would be a second place to get it wrong.
  // A line that wraps grows the row past its container height on its own and
  // keeps its slots centred, which is the shorter item made taller rather
  // than the next one along.
  //
  // The three-line item is the only row whose slots move, which is why it
  // alone carries an alignment as well as a height.
  const extraLines =
    (overline === undefined ? 0 : 1) + (supporting === undefined ? 0 : 1)
  const twoLine = extraLines === 1
  const threeLine = extraLines === 2

  const content = (
    <RowContent
      leading={leading}
      overline={overline}
      supporting={supporting}
      trailing={trailing}
    >
      {children}
    </RowContent>
  )

  if (!interactive) {
    return (
      <div
        {...props}
        {...mergeStyles(
          stylex.props(
            rowStyles.base,
            rowStyles.list,
            twoLine && rowStyles.twoLine,
            threeLine && rowStyles.threeLine,
          ),
          props,
        )}
      >
        {content}
      </div>
    )
  }

  return (
    <button
      type="button"
      {...ripple.handlers}
      {...props}
      {...mergeStyles(
        stylex.props(
          rowStyles.base,
          rowStyles.list,
          rowStyles.interactive,
          twoLine && rowStyles.twoLine,
          threeLine && rowStyles.threeLine,
        ),
        props,
      )}
    >
      {content}
      {ripple.surface}
    </button>
  )
}

export type { ListItemProps }

export default ListItem
