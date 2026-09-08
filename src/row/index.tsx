import type { ReactNode } from 'react'

import * as stylex from '@stylexjs/stylex'

import { rowStyles } from './styles'

interface RowContentProps {
  /** The row's headline — the one thing it is mostly about. */
  children?: ReactNode
  /** Content before the headline: an avatar, an icon, a checkbox. */
  leading?: ReactNode
  /** A second line under the headline, in the muted role. */
  supporting?: ReactNode
  /** Content after the headline, such as an amount or a control. */
  trailing?: ReactNode
  /**
   * Which spec page's row this is. A list item's headline is body-large; a
   * menu item's label is label-large. The element around the content applies
   * the matching `rowStyles.list` or `rowStyles.menu` beside `rowStyles.base`.
   * @default 'list'
   */
  variant?: RowVariant
}

type RowVariant = 'list' | 'menu'

/**
 * The inside of a row: the leading slot, the headline with its supporting
 * line, and the trailing slot, each rendered only when given. The element
 * around it is the caller's — ListItem's div or button, a collection's item —
 * and takes `rowStyles.base`, the variant's `rowStyles.list` or
 * `rowStyles.menu`, and whichever states apply; this is what every one of
 * them puts inside it, so a list, a menu and a tree draw the same row.
 *
 * Not a component of the library's own and not exported; see `src/field` for
 * the same arrangement around a field.
 */
function RowContent({
  children,
  leading,
  supporting,
  trailing,
  variant = 'list',
}: RowContentProps) {
  return (
    <>
      {leading === undefined ? null : (
        <span {...stylex.props(rowStyles.slot)}>{leading}</span>
      )}
      <span {...stylex.props(rowStyles.main)}>
        <span
          {...stylex.props(
            variant === 'menu'
              ? rowStyles.headlineMenu
              : rowStyles.headlineList,
          )}
        >
          {children}
        </span>
        {supporting === undefined ? null : (
          <span {...stylex.props(rowStyles.supporting)}>{supporting}</span>
        )}
      </span>
      {trailing === undefined ? null : (
        <span {...stylex.props(rowStyles.slot)}>{trailing}</span>
      )}
    </>
  )
}

export type { RowContentProps, RowVariant }

export { RowContent }
