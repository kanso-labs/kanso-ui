A 1px rule between items. The orientation drives the accessibility tree as
well as which side the rule is drawn on: horizontal renders an `<hr>`,
whose role and orientation are implicit, and vertical a `<div>` given the
separator role and `aria-orientation="vertical"`.

`inset` holds the rule off the ends it runs between — `start` off the
leading one, `both` off each — which is what a rule between list rows
takes so it lines up with their text rather than the container's edge.

React Aria's rather than a styled element of the library's own, so a
`Menu` or `Toolbar` around it reaches it through context — a separator
between menu items is part of the collection, and one in a toolbar takes
the rule across the toolbar's own direction. `elementType` picks a
different element, and `render` is React Aria's function form.
