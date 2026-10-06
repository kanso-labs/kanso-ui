A navigational link. It renders an `<a>` and sets no type of its own, so it
takes the size and face of the text it sits in. Without `href`, or while
disabled, it is a span announced as a link instead, since a disabled
anchor is no link at all.

Behaviour is React Aria's: `onPress` fires for pointer, touch and keyboard
alike, a `RouterProvider` above it turns a navigation into a client-side
one, and a `Breadcrumbs` or `Menu` around it reaches it through context.
`render` is React Aria's function form, handed the anchor's props to spread
onto an element of its own. Every `aria-*` prop is forwarded to the element;
React Aria alone would keep only the labelling ones.
