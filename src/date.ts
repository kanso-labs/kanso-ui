// The date values every date component here takes, re-exported wholesale from
// `@internationalized/date`. Published as the package's `./date` subpath
// rather than from the main entry, so a consumer with no date component pays
// nothing for it.
//
// Re-exported for the same reason `src/react-aria.ts` re-exports React Aria's
// utilities: a `CalendarDate` from a second copy of the package is a
// different class, and `Calendar`'s `value` would reject it. Installing
// `@internationalized/date` alongside is what this subpath makes unnecessary.
//
// `export *` here rather than the curated list that module keeps. What that
// list protects is the library's own public surface, which a React Aria
// release must not widen unread; this subpath is the other package, whole and
// declared as such — a value it adds is a value a consumer should have, and
// enumerating a hundred date functions would go stale on every bump without
// deciding anything.
export * from '@internationalized/date'
