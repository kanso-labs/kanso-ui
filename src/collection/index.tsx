import ProgressIndicator from '../components/progress-indicator'
import { useMessages } from '../i18n'

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

export type { CollectionLoadMoreProps }
export { CollectionLoadMore }
