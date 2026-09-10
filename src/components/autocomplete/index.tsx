import type { ReactNode } from 'react'
import type { AutocompleteProps as RACAutocompleteProps } from 'react-aria-components'

import {
  Autocomplete as RACAutocomplete,
  useFilter,
} from 'react-aria-components'

// The search page's search with suggestions, as the wrapper React Aria makes
// it: a search input over a collection, where typing narrows what the
// collection shows. It draws nothing of its own — the input is SearchField,
// the collection is ListBox or Menu, and where the two sit is the page's
// business, which is what lets the same wrapper be a searchable list, a
// filtered menu and a command palette inside a Dialog.
//
// Every other component here is a shape; this one is a behaviour, so it
// renders no element and takes no `className` or `style`. There is nothing
// for them to land on, and a wrapper element added to give them somewhere
// would be a layout decision this component has no business making — the
// three shapes above want three different ones.
//
// One thing is added to React Aria's. **Filtering is on by default.** Their
// wrapper filters nothing unless it is handed a predicate, on the grounds
// that a collection fed from a server may already be filtered. A collection
// written out in the page is the common case here, and a search box that
// does not search is a puzzle rather than a default, so `filter` falls back
// to the same locale-aware contains match ComboBox uses. A collection that
// filters itself passes a predicate that always returns true.

// React Aria's own filter signature. Taken from the prop rather than written
// out, since its third parameter is a collection node whose type this package
// does not depend on directly.
type AutocompleteFilter<T extends object = object> = NonNullable<
  RACAutocompleteProps<T>['filter']
>

type AutocompleteProps<T extends object = object> = {
  /**
   * The search input and the collection it filters, in whatever the page
   * puts around them. React Aria needs both somewhere inside.
   */
  children?: ReactNode
  /**
   * Which options a search keeps. Defaults to a locale-aware contains match
   * on each option's text — React Aria's own default is to filter nothing,
   * which is right for a collection that arrives filtered and wrong for one
   * written out in the page.
   */
  filter?: AutocompleteFilter<T>
} & Omit<RACAutocompleteProps<T>, 'children' | 'filter'>

/**
 * A search input that filters the collection under it. Its value is React
 * Aria's: pass `inputValue` with `onInputChange` to control what has been
 * typed, or `defaultInputValue` to let it keep its own.
 *
 * ```tsx
 * <Autocomplete>
 *   <SearchField label="Search" placeholder="Search" />
 *   <ListBox aria-label="Results">
 *     <ListBox.Item id="first">First item</ListBox.Item>
 *   </ListBox>
 * </Autocomplete>
 * ```
 *
 * It renders no element of its own, so the input and the collection sit
 * wherever the page puts them — side by side in a panel, in a `Menu.Content`,
 * or in a `Dialog` as a command palette. That is also why it takes no
 * `className` or `style`: there is nothing for them to land on.
 *
 * Keyboard focus stays in the input while the arrow keys move through the
 * collection, which is React Aria's virtual focus. `disableVirtualFocus`
 * turns that off and makes the collection tabbable instead.
 */
function Autocomplete<T extends object = object>({
  children,
  filter,
  ...props
}: AutocompleteProps<T>) {
  const { contains } = useFilter({ sensitivity: 'base' })

  return (
    <RACAutocomplete<T> filter={filter ?? containsFilter(contains)} {...props}>
      {children}
    </RACAutocomplete>
  )
}

// React Aria's filter is handed the node as well as the two strings, which a
// contains match has no use for. Built by a call rather than written inline
// at the prop, which is what react-perf's no-new-function-as-prop is after;
// the React Compiler memoises the result on its input.
function containsFilter(
  contains: (textValue: string, inputValue: string) => boolean,
) {
  return (textValue: string, inputValue: string) =>
    contains(textValue, inputValue)
}

export type { AutocompleteFilter, AutocompleteProps }

export default Autocomplete
