export { useDragAndDrop } from './drag/hooks'
// The React Aria utilities a consumer reaches for around the components:
// the providers that give them a locale and a router, the collection and
// data hooks a list or table is fed from, the drag and drop hooks and their
// item guards, the virtualizer and its layouts, colour parsing, and the
// pieces that make an element focusable or pressable. Re-exported here
// rather than left to a consumer's own copy of react-aria-components,
// because a second copy carries a second set of contexts: a `Button` inside
// a `Sheet` from this package opens nothing when the trigger context it
// looks for belongs to another copy of the library. The README says so, and
// this module is what makes installing it alongside unnecessary.
//
// `TokenFieldValue` is here for the same reason as the hooks: a token field's
// value is a list of segments rather than a string, and what counts as a
// token is decided by subclassing it and overriding `tokenize`. A consumer
// cannot write that against a second copy of the library.
//
// `SharedElement` and `SharedElementTransition` are here for the context
// reason above rather than for a wrapper of our own. The scope is a React
// context, so a `SharedElement` from a second copy of the package cannot
// find a scope opened by this one. Nothing is added to them: the motion is
// a plain CSS transition on the element, which is what puts the motion
// tokens in reach of a call site without this package mediating. See
// `src/shared-element.stories.tsx` for the two things that are easy to get
// wrong, neither of which reports anything when you do.
//
// `useDragAndDrop` is the one name here that is not React Aria's own. This
// package's version defaults the drop indicator and the drag preview to the
// styled ones in `src/drag`, so a call site gets a line and a preview that
// look like the rest of the library without wiring either. Everything it
// takes is React Aria's, and passing either renderer replaces the default.
//
// A curated list rather than `export *`, so the public surface stays the one
// `src/index.test.ts` pins and a React Aria release adding an export does not
// widen it unread.
export type {
  Key,
  PressEvent,
  Selection,
  SortDescriptor,
} from 'react-aria-components'
export {
  Collection,
  DIRECTORY_DRAG_TYPE,
  Focusable,
  getColorChannels,
  GridLayout,
  I18nProvider,
  isDirectoryDropItem,
  isFileDropItem,
  isTextDropItem,
  ListLayout,
  parseColor,
  Pressable,
  RouterProvider,
  SharedElement,
  SharedElementTransition,
  TableLayout,
  TokenFieldValue,
  useAsyncList,
  useDrag,
  useDrop,
  useFilter,
  useListData,
  useLocale,
  useTreeData,
  Virtualizer,
  VisuallyHidden,
  WaterfallLayout,
} from 'react-aria-components'
