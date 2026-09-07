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
  /** A second line under the headline, in the muted role. */
  supporting?: ReactNode
  /** Content after the headline, such as an amount or a control. */
  trailing?: ReactNode
} & HTMLAttributes<HTMLElement>

/**
 * A static row: the row every list draws, on its own. The layout and the
 * states are the row module's in `src/row`, shared with every collection
 * item; what is here is the element around them — a `<div>` that presents,
 * or a `<button>` that ripples — and the props that fill the slots.
 */
function ListItem({
  children,
  interactive = false,
  leading,
  supporting,
  trailing,
  ...props
}: ListItemProps) {
  const ripple = useRipple<HTMLButtonElement>(interactive)

  const content = (
    <RowContent leading={leading} supporting={supporting} trailing={trailing}>
      {children}
    </RowContent>
  )

  if (!interactive) {
    return (
      <div {...props} {...mergeStyles(stylex.props(rowStyles.base), props)}>
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
        stylex.props(rowStyles.base, rowStyles.interactive),
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
