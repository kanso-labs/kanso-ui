import type { ReactNode } from 'react'

import * as stylex from '@stylexjs/stylex'
import { useContext, useEffect, useState } from 'react'

import ProgressIndicator from '../components/progress-indicator'
import { useMessages } from '../i18n'
import { rowStyles } from '../row/styles'
import { EmptyStatusContext } from './empty'
import { collectionStyles } from './styles'

type CollectionEmptyProps = {
  /** Which spec page's row it stands in for: a list's or a menu's. */
  variant: 'list' | 'menu'
}

type CollectionLoadMoreProps = {
  /** The ring's diameter, which follows the row it sits in. */
  diameter: string
  /**
   * What a screen reader announces while the next page is on its way. Left
   * out, it is the I18nProvider's locale's word for it.
   */
  label: string | undefined
}

/**
 * The row a collection shows when nothing is in it, which is what a search
 * that matches nothing leaves. `ListBox` and `Menu.Content` draw it as their
 * default `renderEmptyState`.
 *
 * An item's box and headline, so the collection keeps a row's height rather
 * than collapsing to its padding, in the muted role and with no role of its
 * own: it is not an option or an action. React Aria wraps it in an element
 * with the collection's item role and `display: contents`, since a listbox
 * or a menu may only own those.
 *
 * It also tells the nearest `CollectionStatus` the collection has emptied,
 * which is what puts it where a screen reader hears it.
 */
function CollectionEmpty({ variant }: CollectionEmptyProps) {
  const messages = useMessages()
  const report = useContext(EmptyStatusContext)

  useEffect(() => {
    report?.(true)
    return () => {
      report?.(false)
    }
  }, [report])

  return (
    <div
      {...stylex.props(
        rowStyles.base,
        variant === 'menu' ? rowStyles.menu : rowStyles.list,
        collectionStyles.empty,
      )}
    >
      <span
        {...stylex.props(
          variant === 'menu' ? rowStyles.headlineMenu : rowStyles.headlineList,
        )}
      >
        {messages.noResults}
      </span>
    </div>
  )
}

/**
 * The ring a collection shows while it loads more items.
 *
 * Indeterminate and circular in every collection that has one, since none of
 * them knows how many items are still to come.
 */
function CollectionLoadMore({ diameter, label }: CollectionLoadMoreProps) {
  const messages = useMessages()

  return (
    <ProgressIndicator
      aria-label={label ?? messages.loadingMore}
      diameter={diameter}
      isIndeterminate
      variant="circular"
    />
  )
}

/**
 * A polite status that says when a collection inside it has emptied.
 *
 * The region is rendered from the start and only its text changes, since a
 * screen reader announces a change to a live region it already knows about
 * and not one that arrives with its text in it. That is why the empty row
 * cannot announce itself: it mounts already saying what it says. `<output>`
 * carries an implicit role of status, as CopyField's does.
 *
 * `Autocomplete` puts one round what it filters, and `Menu.Content` one
 * inside its surface — a modal popover hides everything outside it from
 * assistive technology, a live region included, so the menu's has to be
 * within it. A row reports to the nearest, so a menu inside an
 * `Autocomplete` speaks through its own.
 */
function CollectionStatus({ children }: { children: ReactNode }) {
  const messages = useMessages()
  const [empty, setEmpty] = useState(false)

  return (
    <EmptyStatusContext value={setEmpty}>
      {children}
      <output {...stylex.props(collectionStyles.status)}>
        {empty ? messages.noResults : ''}
      </output>
    </EmptyStatusContext>
  )
}

export type { CollectionEmptyProps, CollectionLoadMoreProps }
export { CollectionEmpty, CollectionLoadMore, CollectionStatus }
