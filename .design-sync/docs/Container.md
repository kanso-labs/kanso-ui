A centred measure for a page or a section of one: content grows to a width
and stops, with the leftover space split evenly either side.

Layout only — it paints no surface and gives its children no container of
their own, which is what separates it from Card. It sets no gaps either, so
reach for Stack inside it for the rhythm between sections.

`render` swaps the element, for a container that should be a `<main>` or a
`<section>` rather than a `<div>`.
