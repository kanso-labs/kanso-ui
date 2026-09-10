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
 * gives it — a 56px floor, a body-large headline and a body-medium
 * supporting line. An `overline` puts a line above the headline instead of
 * below it, and an overline with a supporting line makes the page's
 * three-line item: an 88px floor, with the leading and trailing slots held
 * at the top rather than centred. The layout and the states are the row
 * module's in `src/row`, shared with every collection item; what is here is
 * the element around them — a `<div>` that presents, or a `<button>` that
 * ripples — and the props that fill the slots.
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

  // The page's three-line item is an overline, a headline and a supporting
  // line, and it is the only row whose slots move. Read from the content
  // rather than taken as a prop: a row holding all three lines already says
  // it is three lines, and a word for it would be a second place to get it
  // wrong. A supporting line that wraps grows the row past 88 on its own and
  // keeps its slots centred, which is the page's two-line item made taller
  // rather than a three-line one.
  const threeLine = overline !== undefined && supporting !== undefined

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
