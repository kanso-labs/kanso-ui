A modal dialog centred over the page, and the same dialog filling the
window below the medium breakpoint — the dialogs page's basic and
full-screen dialogs, paired by window size as the page pairs them. Open
state is React Aria's: pass `isOpen` with `onOpenChange` to control it, or
`defaultOpen` to let it keep its own.

Composed rather than configured by props, as `Sheet` is, since a dialog's
header, body and actions all take arbitrary content — the parts are
`Dialog.Content`, `Dialog.Header`, `Dialog.Title`, `Dialog.Body` and
`Dialog.Footer`. A `Button` or `IconButton` placed directly inside
`Dialog` opens it, and one given `slot="close"` anywhere inside the
content closes it; neither needs a part of its own.

## Parts

### `Dialog.Body`

Props: `HTMLAttributes<HTMLDivElement>`.

### `Dialog.Content`

The dialog itself, and the scrim behind it. Everything the dialog shows
goes in here; the trigger stays outside it, since the trigger lives in the
page while this is portalled out to the end of the body.

`role="alertdialog"` is React Aria's, for a dialog interrupting with
something that has to be answered before the page carries on — a screen
reader announces it rather than waiting to be asked.

A press on the scrim closes the dialog unless `isDismissable` says
otherwise, which is the same default `Sheet` takes and the reverse of
React Aria's own. Escape is a separate prop, `isKeyboardDismissDisabled`,
and `isDismissable` says nothing about it — so a dialog that has to be
answered from one of its actions, as an alert dialog usually does, turns
off both.

Props (`DialogContentProps`):

- `className`: A function may compute the class from the container's render state.
- `container`: Where to portal the dialog and scrim. Defaults to the end of `<body>`, which is right for an app that sets its StyleX theme on `:root`. An app that scopes the theme to a subtree has to point this at an element inside it, or the dialog renders outside the theme and falls back to the tokens' `prefers-color-scheme` default.
- `isDismissable`: Whether a press on the scrim, outside the container, closes the dialog. `true` here where React Aria's own default is `false`, the same default `Sheet` takes. Escape is `isKeyboardDismissDisabled`'s, and this says nothing about it — an alert dialog, which has to be answered from one of its actions, turns off both.
- `style`: A function may compute the style from the container's render state.
- everything in `Omit<DialogProps, 'className' | 'style'>` and `Pick<ModalOverlayProps, 'isKeyboardDismissDisabled'>`

### `Dialog.Footer`

Props: `HTMLAttributes<HTMLDivElement>`.

### `Dialog.Header`

Props: `HTMLAttributes<HTMLDivElement>`.

### `Dialog.Title`

Names the dialog. Rendered through React Aria's title slot, which is what
points the dialog's `aria-labelledby` at it — a dialog without one
announces itself unnamed.

Props (`DialogTitleProps`):

- everything in `HeadingProps`
