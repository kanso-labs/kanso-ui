import ProgressIndicator from '../components/progress-indicator'

type CollectionLoadMoreProps = {
  /** What a screen reader announces while the next page is on its way. */
  label: string
  /** The ring's diameter, which follows the row it sits in. */
  size: string
}

/**
 * The ring a collection shows while it loads more items.
 *
 * Indeterminate and circular in every collection that has one, since none of
 * them knows how many items are still to come.
 */
function CollectionLoadMore({ label, size }: CollectionLoadMoreProps) {
  return (
    <ProgressIndicator
      aria-label={label}
      isIndeterminate
      size={size}
      variant="circular"
    />
  )
}

export type { CollectionLoadMoreProps }
export { CollectionLoadMore }
