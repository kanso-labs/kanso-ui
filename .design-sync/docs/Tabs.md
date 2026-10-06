A tab bar and its panels. Selection is React Aria's `selectedKey`: pass
it with `onSelectionChange` to control it, or `defaultSelectedKey` to let
it keep its own. Each `Tabs.Tab` names the `Tabs.Panel` it controls through
a shared `id`, and a strip may stand alone without panels.

Composed rather than configured by props, because the number of tabs and
what each panel holds are the call site's to decide — the parts are
`Tabs.List`, `Tabs.Tab`, and `Tabs.Panel`.

## Parts

### `Tabs.List`

Props (`TabsListProps`):

- everything in `TabListProps<object>`

### `Tabs.Panel`

Props (`TabsPanelProps`):

- everything in `TabPanelProps`

### `Tabs.Panels`

An optional box around the panels, which animates its height as one panel
gives way to the next. Without it the panels still work; the box around
them simply jumps from one height to the other.

Props (`TabsPanelsProps`):

- `children`
- everything in `Omit<TabPanelsProps<object>, 'children'>`

### `Tabs.Tab`

Props (`TabsTabProps`):

- everything in `TabProps`
