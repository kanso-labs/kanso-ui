import { createContext } from 'react'

// Who to tell that a collection has emptied, so it can say so where a screen
// reader hears it. See `CollectionStatus` in ./index.tsx.
const EmptyStatusContext = createContext<((empty: boolean) => void) | null>(
  null,
)

export { EmptyStatusContext }
