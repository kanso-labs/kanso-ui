A row or a column of children with one gap between them, taken from the
spacing scale.

Layout only — it paints no surface and wraps no child, so each child is a
flex item exactly as it was written. It is the answer to spacing a group of
things, which is why no component here carries a margin of its own: the
space between two things belongs to whatever holds both of them.

`render` swaps the element, for a stack that should be a `<ul>`, a `<nav>`,
or a `<section>` rather than a `<div>`.
