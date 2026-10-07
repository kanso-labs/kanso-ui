# Upgrading to 1.0

Every breaking change kanso-ui made on its way to 1.0, with the edit each one
asks of a call site. Find the version you are on and work down from the first
section after it; everything above it already applies to you.

The changelog lists the same releases, but it cannot stand in for this page. Its
entries are pull request titles, and for most of 0.x a title was all that
reached it, so a line such as "rename isDismissable" never says what the new
name is. From here on a breaking pull request carries its migration into the
changelog itself — see "Pull request bodies" in `AGENTS.md` — and adds a line
here as well.

Three kinds of change are on this page, each under its own heading:

- **Breaking changes**, release by release: a prop, a type, an export or a
  default a call site has to change for.
- **Removed custom properties**: a `--kui-*` override that no longer applies.
  These raise no error at all, so they are the easiest to miss.
- **Behaviour changes**: nothing fails to compile, but what a reader sees or
  hears is different, which matters to a test that queries by name or by text.

## Which version you are on

`npm ls @kanso-labs/kanso-ui` prints it. The package was `kanso-ui`, private and
unpublished, until 0.4.0, and 0.4.0 is the first version CI published under the
scoped name. 0.2.0 was published once by hand; 0.1.0, 0.3.0 and 0.30.5 never
reached npm at all.

The 0.31.0 entry in `CHANGELOG.md` repeats every earlier breaking change under
its own heading. That is release-please comparing against a tag that does not
exist, not a second round of breaks: 0.31.0 broke nothing.

## Breaking changes

### 0.5.0: ESM only

The package ships ES modules alone. The exports map names `types` and `default`
rather than `import` and `require`, and `dist/cjs` is gone.

- **Node** has to be `^20.19.0 || >=22.12.0`, the versions with `require(esm)`.
  A `require()` of the package still works on those, and returns the same named
  exports an `import` does, since the package has no default export.
- **A bundler** needs no change.
- **A test runner without ESM support**, such as Jest in its default CommonJS
  mode, needs its ESM configuration or a transform for this package.

### 0.12.0: React Aria Components in place of Base UI

Every interactive component moved from Base UI to React Aria Components, and
four habits change at every call site:

- **Booleans take an `is` prefix**: `disabled` is `isDisabled`, `readOnly` is
  `isReadOnly`, `required` is `isRequired`, and `open` is `isOpen`.
- **Change handlers lose their details argument**: `onXChange(value, details)`
  is `onChange(value)` or `onSelectionChange(key)`.
- **`onPress` is the handler to use.** `onClick` still compiles on a button, as
  an alias React Aria keeps but does not recommend.
- **`render` on a React Aria component is a function**, handed the props it
  would have used, and it must return the element React Aria would have rendered
  itself. A `className` or `style` function is handed React Aria's state names —
  `isSelected`, `isPressed`, `isFocusVisible` — rather than Base UI's.

`@base-ui/react` is no longer a dependency; `react-aria-components` is the only
one, and the package re-exports what a consumer needs from it, so do not install
a copy of your own.

Component by component:

- **Button and IconButton.** A link is `href`, with `target` and `rel` beside
  it, where it was `render={<a href="…" />}`; the button then renders React
  Aria's `Link`. `nativeButton` is gone, and `render` must return a `<button>`.
- **Chip.** `pressed` is `isSelected`, `defaultPressed` is `defaultSelected`,
  and `onPressedChange(pressed, details)` is `onChange(isSelected)`. `value` and
  the type parameter are gone.
- **Sheet.** `open` is `isOpen`, and `onOpenChange` is handed the boolean alone.
  `Sheet.Trigger` and `Sheet.Close` are gone, with their props types: the
  trigger is a `Button` placed directly inside `<Sheet>`, and the close button
  is any button given `slot="close"`.

  ```tsx
  // Before
  <Sheet.Trigger render={<Button />}>Open</Sheet.Trigger>
  <Sheet.Close render={<IconButton aria-label="Close" />} />

  // After
  <Button>Open</Button>
  <IconButton aria-label="Close" slot="close" />
  ```

  `Sheet.Content`'s `container` takes an `Element`, not a ref or a shadow root.
  Base UI's `disablePointerDismissal` is `isDismissable={false}` on
  `Sheet.Content`, and Escape is turned off separately, with
  `isKeyboardDismissDisabled`.

- **Tabs.** `value` is `selectedKey`, `defaultValue` is `defaultSelectedKey`,
  and `onValueChange(value, details)` is `onSelectionChange(key)`. A tab and its
  panel are matched by `id` where they were matched by `value`, and children are
  a node rather than a function. A panel that is not selected is unmounted;
  React Aria's `shouldForceMount` keeps it, where Base UI's `keepMounted` did.

  ```tsx
  // Before
  <Tabs defaultValue="a">
    <Tabs.Tab value="a">First item</Tabs.Tab>
    <Tabs.Panel value="a">…</Tabs.Panel>
  </Tabs>

  // After
  <Tabs defaultSelectedKey="a">
    <Tabs.Tab id="a">First item</Tabs.Tab>
    <Tabs.Panel id="a">…</Tabs.Panel>
  </Tabs>
  ```

- **TextField.** `onChange` is handed the string rather than the event.
  `placeholder` is no longer accepted: the label is always rendered, and the
  supporting text under the field says what a placeholder would have. The call
  site's `className` and `style` land on the field as a whole rather than on the
  `<input>`; `inputRef` reaches the `<input>` itself.

### 0.13.0: Link and Separator on React Aria

Neither takes an element as `render` any more.

- **Link** takes `href`. A router's links go through `RouterProvider`, which the
  package re-exports, around plain `<Link href="…">` elements, where they used
  to be `render={<RouterLink to="…" />}`.
- **Separator** renders an `<hr>` when horizontal and a `<div>` with
  `aria-orientation` when vertical, and takes React Aria's render function.

### 0.14.0: Button sizes follow the Material Design spec

The size names stay and three of them keep their heights, but **`xl` grows from
80px to 96px**, and `xxl` is new at 136px. Padding moved from the variant to the
size, so a medium button is 16px either side where it was 24px. A layout sized
around the old `xl` needs looking at; nothing else does.

### 0.15.0: ListItem's type and selected colour

A visual change only. The headline is body-large where it was label-large, the
supporting line body-medium where it was body-small, a row is at least 56px
tall, and a selected row is on the primary container rather than the secondary
one.

### 0.16.0: Badge is Tag, and three spec alignments

- **Badge is renamed Tag**, and `BadgeProps` is `TagProps`. `tone` and `variant`
  are unchanged.

  ```tsx
  // Before
  import { Badge, type BadgeProps } from '@kanso-labs/kanso-ui'

  // After
  import { Tag, type TagProps } from '@kanso-labs/kanso-ui'
  ```

  **0.36.0 gave the name `Badge` to a different component**, the notification
  badge, whose children are what it is anchored to. A missed `<Badge tone=…>`
  fails to compile, but a missed `<Badge>Text</Badge>` with neither prop
  compiles, and draws the text with a notification dot beside it. Search for
  `Badge` rather than waiting for the compiler.

- **Sheet's `size` prop is removed.** The side sheet is always 400px. A narrower
  panel sets its width through `className` or `style` on `Sheet.Content`.
- **TextField's label floats by default**, sitting in the box while it is empty
  and moving into its top once it is focused or filled. `floatingLabel={false}`
  keeps the fixed label above the box.
- **Tabs are Material Design's primary tabs**: an equal-width 48px bar with a
  divider and a 3px indicator. No prop changed. The pill look they replaced is
  `SegmentedButton`.

### 0.29.0: the full radius split in two

`--kui-radius-full` is gone. See "Removed custom properties" below.

### 0.32.0: Table's empty state is a function

```tsx
// Before
<Table.Body emptyState="Nothing to show">…</Table.Body>

// After
<Table.Body renderEmptyState={() => 'Nothing to show'}>…</Table.Body>
```

The function is handed the body's render state, as every other collection's is.

### 0.33.0: Snackbar's isDismissable is showCloseButton

```ts
// Before
queue.add('Message', { isDismissable: true })

// After
queue.add('Message', { showCloseButton: true })
```

`SnackbarMessage.isDismissable` is renamed the same way. There is no alias: the
old name is a type error, and at runtime it draws no button.

### 0.34.0: Toolbar's standard tone is neutral

`tone="standard"` is `tone="neutral"`, which is also the default, so the prop
can simply be dropped. `ToolbarTone` is `'neutral' | 'vibrant'`.

### After 0.38.0: AppBar, Text and ProgressIndicator props

Three props that predated the library's shared prop vocabularies now use them.

- **AppBar's `size`** takes the size scale: `small`, `medium` and `large` are
  `sm`, `md` and `lg`, and the default is `sm`.
- **Text's neutral `tone`** is `neutral`, where it was `default`, and it is
  still the default.
- **ProgressIndicator's `size`** is `diameter`. It is still a CSS length.

```tsx
// Before
<AppBar headline="Headline" size="large" />
<Text tone="default">Supporting line</Text>
<ProgressIndicator size="24px" />

// After
<AppBar headline="Headline" size="lg" />
<Text tone="neutral">Supporting line</Text>
<ProgressIndicator diameter="24px" />
```

### Changes that shipped without a breaking mark

Each of these is narrower than the ones above, but a call site written against
the earlier type stops compiling.

| Version | What changed                                                                                                    | The edit                                                                                  |
| ------- | --------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| 0.28.5  | Chip's `children` is a node, where it could be a function                                                       | Pass a node.                                                                              |
| 0.30.4  | `Menu.Content`'s `className` and `style` land on the popover surface rather than on the list inside it          | Recheck styles aimed at the list, and write a function form against `PopoverRenderProps`. |
| 0.34.2  | `MenuSubmenuProps['children']` is a `[trigger, content]` tuple, where it was any array of elements              | Type a stored value as the tuple. Children written inline in JSX are unaffected.          |
| 0.36.0  | `NavigationTreeHeaderProps` and `TreeHeaderProps` are no longer exported; both described parts that are private | Drop the imports.                                                                         |

## Removed custom properties

An override of a property that no longer exists raises nothing and silently
stops applying, so search a stylesheet for each name here.

| Removed             | In     | Override instead                                                                                   |
| ------------------- | ------ | -------------------------------------------------------------------------------------------------- |
| `--kui-radius-full` | 0.29.0 | `--kui-radius-pill` for pill shapes, `--kui-radius-circle` for circles, or both. Each is `9999px`. |

Pills are the fully rounded ends of buttons, chips, toolbars, search fields, the
tabs' indicator and the slider and switch tracks; circles are what is round all
the way, such as Avatar, a radio button and a switch's handle. An override that
restyled every fully rounded shape sets both.

Two values changed without a rename. 0.14.0 lowered the focus and pressed
state-layer opacities, `--kui-state-layer-opacity-focus` and
`--kui-state-layer-opacity-pressed`, from 0.12 to 0.1. And since 0.36.0 the
typography roles are built on `--kui-typography-font-family-brand`,
`--kui-typography-font-family-plain` and `--kui-typography-weight-regular`, so
overriding one of those restyles every role built on it; a role's own property
still wins.

## Behaviour changes

Nothing here fails to compile. A test that finds a control by its name or its
text, or a layout that relied on a timing, may need updating.

### Snackbar durations (0.34.10)

A message alone stays for 5 seconds, where it stayed for 1.5. A message with an
action stays until the action is taken or the snackbar is closed, where it went
after 2.75 seconds. An explicit `timeout` is honoured as before, so pass one to
keep a timer on a snackbar with an action, and give a snackbar with no action
and no timer `showCloseButton` so it can be closed.

### Accessible names in the reader's language (0.36.0)

The names the library gave in English now come from React Aria's localised
strings, so they follow `I18nProvider`. In English five of them read
differently:

| Control                             | Before                        | After              |
| ----------------------------------- | ----------------------------- | ------------------ |
| SearchField's clear button          | "Clear"                       | "Clear search"     |
| Table's select-all checkbox         | "Select all"                  | "Select All"       |
| Table's column resizer              | "Resize column ‹label›"       | "Resizer ‹label›"  |
| DatePicker's trigger and its dialog | "Choose a date ‹label›"       | "Calendar ‹label›" |
| DateRangePicker's trigger           | "Choose a date range ‹label›" | "Calendar ‹label›" |

Each one still takes a prop that names it otherwise — `clearLabel`,
`selectAllLabel`, `resizeLabel` and `triggerLabel` — and passing the old words
there brings the old name back. The words the library writes itself, such as
"Loading" and "Copy", are localised the same way and read the same in English.

Two more changes reach a test by text. Currency and Avatar's initials follow
`I18nProvider`'s locale where they followed the runtime's; pass `locale` to
Currency to pin it. And a required field's label ends in an asterisk hidden from
screen readers, which changes the label's `textContent`.

### The cascade layer is kanso (0.35.0)

The compiled stylesheet's layers are `kanso.priority1` to `kanso.priority9`,
where they were `priority1` to `priority9`. An app that orders layers names
`kanso` in its order instead:

```css
@layer theme, base, kanso, components, utilities;
```

An unlayered stylesheet of the app's own still beats the library. So does an
unlayered reset, which is rarely what is meant: put the reset in a layer ahead
of `kanso`, as the README's "Ordering the library's rules" shows.

### Numbers are grouped (0.36.0)

A field's character counter and its limit are written with the locale's digits
and grouping: `12/1,200` where it was `12/1200`, and "Up to 1,200 characters"
where it was "Up to 1200 characters". `characterLimitLabel` takes a sentence of
your own.
