A brief message at the bottom of the screen, with an optional action. Mount
one of these with a `Snackbar.Queue`, and call the queue's `add` to show a
message from anywhere.

```tsx
const messages = new Snackbar.Queue()

<Snackbar queue={messages} />
```

The region is portalled to the end of `<body>` and renders nothing while
the queue is empty. It is one region rather than one per message, so mount
it once, near the root.

The call site's `className` and `style` land on that region, which is the
element a layout positions.

## Parts

### `Snackbar.Queue`

The queue a snackbar is shown from. Make one where the app can reach it —
a module of its own is the usual place — mount `Snackbar` once with it,
and call `add` from anywhere.

```ts
const messages = new Snackbar.Queue()
messages.add('Label', { action: { label: 'Undo', onPress: undo } })
```

It wraps React Aria's toast queue rather than exposing it, which is what
keeps that API's `UNSTABLE_` name out of a consumer's code.
