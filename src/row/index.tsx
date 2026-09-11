import type { ReactNode } from 'react'

import * as stylex from '@stylexjs/stylex'

import { rowStyles } from './styles'

interface RowContentProps {
  /** The row's headline — the one thing it is mostly about. */
  children?: ReactNode
  /**
   * Whether the row is disabled. The supporting line takes the row's own
   * faded colour when it is, rather than staying at full strength in the
   * muted role.
   * @default false
   */
  isDisabled?: boolean
  /**
   * Whether the row is selected. The supporting line takes the selected
   * container's own content role when it is, rather than staying in the
   * muted role it draws on the surface.
   * @default false
   */
  isSelected?: boolean
  /** Content before the headline: an avatar, an icon, a checkbox. */
  leading?: ReactNode
  /**
   * A line above the headline, in the page's label-small and the same muted
   * role the supporting line takes.
   */
  overline?: ReactNode
  /** A second line under the headline, in the muted role. */
  supporting?: ReactNode
  /** Content after the headline, such as an amount or a control. */
  trailing?: ReactNode
  /**
   * Which spec page's row this is. A list item's headline is body-large; a
   * menu item's label and a navigation drawer row's are label-large. The
   * element around the content applies the matching `rowStyles.list`,
   * `rowStyles.menu` or `rowStyles.drawer` beside `rowStyles.base`.
   * @default 'list'
   */
  variant?: RowVariant
}

type RowVariant = 'drawer' | 'list' | 'menu'

/**
 * The inside of a row: the leading slot, the headline with its supporting
 * line, and the trailing slot, each rendered only when given. The element
 * around it is the caller's — ListItem's div or button, a collection's item —
 * and takes `rowStyles.base`, the variant's own style, and whichever states
 * apply; this is what every one of them puts inside it, so a list, a menu, a
 * tree and a drawer draw the same row.
 *
 * Not a component of the library's own and not exported; see `src/field` for
 * the same arrangement around a field.
 */
function RowContent({
  children,
  isDisabled = false,
  isSelected = false,
  leading,
  overline,
  supporting,
  trailing,
  variant = 'list',
}: RowContentProps) {
  // The drawer's label is the menu's, so the two share the headline style;
  // what they do not share is the container a selected row brings, which is
  // why the tone below still asks which variant this is.
  const label = variant === 'drawer' || variant === 'menu'
  // Disabled first: a disabled row's own colour is already the faded one, so
  // it wins over the selected container's content role.
  const supportingTone = isDisabled
    ? rowStyles.supportingInherit
    : isSelected && selectedSupportingTone(variant)
  return (
    <>
      {leading === undefined ? null : (
        <span {...stylex.props(rowStyles.slot)}>{leading}</span>
      )}
      <span {...stylex.props(rowStyles.main)}>
        {overline === undefined ? null : (
          <span {...stylex.props(rowStyles.overline, supportingTone)}>
            {overline}
          </span>
        )}
        <span
          {...stylex.props(
            label ? rowStyles.headlineMenu : rowStyles.headlineList,
          )}
        >
          {children}
        </span>
        {supporting === undefined ? null : (
          <span {...stylex.props(rowStyles.supporting, supportingTone)}>
            {supporting}
          </span>
        )}
      </span>
      {trailing === undefined ? null : (
        <span {...stylex.props(rowStyles.slot)}>{trailing}</span>
      )}
    </>
  )
}

// Which on-colour a supporting line takes over a selected row's own
// container. Each variant's container is a different colour family, and the
// muted role is not guaranteed to be readable over any of them.
function selectedSupportingTone(variant: RowVariant) {
  if (variant === 'drawer') {
    return rowStyles.supportingSelectedDrawer
  }
  if (variant === 'menu') {
    return rowStyles.supportingSelectedMenu
  }
  return rowStyles.supportingSelectedList
}

export type { RowContentProps, RowVariant }

export { RowContent }
