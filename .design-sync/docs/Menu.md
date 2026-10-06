A list of actions opened from a control. Open state is React Aria's: pass
`isOpen` with `onOpenChange` to control it, or `defaultOpen` to let it keep
its own.

A `Button` or `IconButton` placed directly inside opens it; everything the
menu shows goes in `Menu.Content`, since the trigger lives in the page
while the menu is portalled out to the end of the body.

```tsx
<Menu>
  <Button>Open</Button>
  <Menu.Content aria-label="Label">
    <Menu.Item id="first">First item</Menu.Item>
  </Menu.Content>
</Menu>
```

## Parts

### `Menu.Content`

The menu itself, and the surface it is drawn on. React Aria names it after
the control that opened it, so `aria-label` here is ignored — name the
trigger instead.

The call site's `className` and `style` land on the surface, which is the
element a layout positions.

The placement and the offsets are passed on only where the call site gives
them. React Aria hands the popover a placement of its own through context —
below the trigger for a menu, at the item's inline end for a submenu — and
a prop set here replaces it, so a default written here opened every
submenu below its item, over the rest of the menu it came from.

### `Menu.LoadMore`

The row shown while more items are being fetched. React Aria calls
`onLoadMore` when it comes into view, and draws it only while `isLoading`.

Props (`MenuLoadMoreProps`):

- `label`: What the row says while it is loading. Read by a screen reader; the ring itself carries no text.
- everything in `Omit<MenuLoadMoreItemProps, 'children'>`

### `Menu.Separator`

A rule between groups of items. It takes its role from the menu around it,
so it needs no slot from the call site.

Props (`MenuSeparatorProps`):

- everything in `Omit<ComponentProps<typeof Separator$1>, 'orientation'>`

### `Menu.Submenu`

An item that opens a menu of its own. Takes exactly two children: the
`Menu.Item` that opens it, then the `Menu.Content` it opens.

Props (`MenuSubmenuProps`):

- `children`: The item that opens the submenu, then the `Menu.Content` it opens. Exactly those two, in that order. The count is the type's to enforce; the order is not, since every JSX element has the same type.
- `delay`: How long the pointer rests on the item before the submenu opens, in milliseconds.
