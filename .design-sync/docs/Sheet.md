A modal panel that arrives from the edge of the screen — a side sheet on a
wide viewport, a bottom sheet on a narrow one. Open state is React Aria's:
pass `isOpen` with `onOpenChange` to control it, or `defaultOpen` to let it
keep its own.

Composed rather than configured by props, because a sheet's header, body,
and footer all take arbitrary content — the parts are `Sheet.Content`,
`Sheet.Header`, `Sheet.Title`, `Sheet.Body`, and `Sheet.Footer`. A
`Button` or `IconButton` placed directly inside `Sheet` opens it, and one
given `slot="close"` anywhere inside the content closes it; neither needs
a part of its own.

## Parts

### `Sheet.Body`

Props: `HTMLAttributes<HTMLDivElement>`.

### `Sheet.Content`

The panel itself, and the scrim behind it. Everything the sheet shows goes
in here; the trigger stays outside it, since the trigger lives in the page
while this is portalled out to the end of the body.

A press on the scrim closes the sheet unless `isDismissable` says
otherwise — React Aria's own default is the reverse, and a sheet that
ignores a tap outside it reads as stuck.

Props (`SheetContentProps`):

- `className`: A function may compute the class from the panel's render state.
- `container`: Where to portal the panel and scrim. Defaults to the end of `<body>`, which is right for an app that sets its StyleX theme on `:root`. An app that scopes the theme to a subtree has to point this at an element inside it, or the sheet renders outside the theme and falls back to the tokens' `prefers-color-scheme` default.
- `isDismissable`: Whether a press on the scrim, outside the panel, closes the sheet. `true` here where React Aria's own default is `false`, since a sheet that ignores a tap outside it reads as stuck. Escape is `isKeyboardDismissDisabled`'s, and this says nothing about it.
- `style`: A function may compute the style from the panel's render state.
- everything in `Omit<DialogProps, 'className' | 'style'>` and `Pick<ModalOverlayProps, 'isKeyboardDismissDisabled'>`

### `Sheet.Footer`

Props: `HTMLAttributes<HTMLDivElement>`.

### `Sheet.Handle`

The bottom sheets page's drag handle: a short bar above the sheet's
content, saying the panel is a bottom sheet. Place it first inside
`Sheet.Content`; above the medium breakpoint the panel is a side sheet and
this draws nothing.

It is decoration rather than a control, and hidden from assistive
technology. Material's own handle drags a sheet between a collapsed and an
expanded height and dismisses it from the collapsed one; this panel has
one height and cannot be dragged, so a control that only looked draggable
would promise what it cannot do. Closing is already the scrim, Escape, and
any button given `slot="close"`.

Props: `HTMLAttributes<HTMLDivElement>`.

### `Sheet.Header`

Props: `HTMLAttributes<HTMLDivElement>`.

### `Sheet.Title`

Names the sheet. Rendered through React Aria's title slot, which is what
points the dialog's `aria-labelledby` at it — a sheet without one announces
itself as an unnamed dialog.

Props (`SheetTitleProps`):

- everything in `HeadingProps`
