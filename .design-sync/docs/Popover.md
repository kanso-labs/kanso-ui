A panel anchored to the control that opened it. Open state is React Aria's:
pass `isOpen` with `onOpenChange` to control it, or `defaultOpen` to let it
keep its own.

Non-modal by design — the page behind stays scrollable and clickable, which
is the difference from `Sheet`. Pass `modal` to change that.

Composed rather than configured by props, because a popover's contents are
arbitrary — the parts are `Popover.Content`, `Popover.Title`, and
`Popover.Description`. A `Button` or `IconButton` placed directly inside
`Popover` opens it, and one given `slot="close"` inside the content closes
it; neither needs a part of its own.

## Parts

### `Popover.Content`

The panel itself. Everything the popover shows goes in here; the trigger
stays outside it, since the trigger lives in the page while this is
portalled out to the end of the body.

Placement is React Aria's anchor positioning, so the panel flips to the
opposite side and shifts along the edge of the viewport on its own rather
than being clipped by it.

Props (`PopoverContentProps`):

- `align`: Where the panel sits along the side it opens on.
- `alignOffset`: Moves the panel along that side, in pixels.
- `children`
- `className`: A function may compute the class from the panel's render state.
- `container`: Where to portal the panel. Defaults to the end of `<body>`, which is right for an app that sets its StyleX theme on `:root`. An app that scopes the theme to a subtree has to point this at an element inside it, or the popover renders outside the theme and falls back to the tokens' `prefers-color-scheme` default.
- `side`: Which side of the trigger the panel opens on. It flips to the opposite side when there is no room.
- `sideOffset`: The gap between the trigger and the panel, in pixels.
- `style`: A function may compute the style from the panel's render state.
- `triggerRef`: An element to anchor the panel to other than the trigger that opened it.
- everything in `Omit<DialogProps, 'children' | 'className' | 'style'>`

### `Popover.Description`

Supporting copy under the title. The panel's `aria-describedby` points at
it — see DescriptionContext for why that is this component's doing.

Props (`PopoverDescriptionProps`):

- everything in `TextProps`

### `Popover.Title`

Names the popover. Rendered through React Aria's title slot, which is what
points the panel's `aria-labelledby` at it — a popover without one announces
itself unnamed.

Props (`PopoverTitleProps`):

- everything in `HeadingProps`
