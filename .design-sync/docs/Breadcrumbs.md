A trail of links back up a hierarchy, ending at the page you are on.
React Aria makes the last item the current one and marks it
`aria-current="page"`; everything before it is a link.

```tsx
<Breadcrumbs aria-label="Label">
  <Breadcrumbs.Item href="#first">First item</Breadcrumbs.Item>
  <Breadcrumbs.Item href="#second">Second item</Breadcrumbs.Item>
  <Breadcrumbs.Item>Third item</Breadcrumbs.Item>
</Breadcrumbs>
```

Name it with `aria-label` or `aria-labelledby`. A page that navigates
without an `href` gives each item an `id` and the trail an `onAction`,
which is React Aria's and reports the key that was pressed.

The call site's `className` and `style` land on the list, which is the
element a layout positions.

## Parts

### `Breadcrumbs.Item`

One entry in the trail. Give it an `href` to navigate, or an `id` and let
the trail's `onAction` handle it. The last entry is the current page and
is drawn as text rather than a link, whatever it is given.

Props (`BreadcrumbsItemProps`):

- `children`: The item's label.
- `className`: A function may compute the class from the item's render state.
- `href`: Where the item leads. Leave it out on an item the page handles through the trail's `onAction`, and on the current one, which is never a link.
- `rel`: The link's `rel`.
- `style`: A function may compute the style from the item's render state.
- `target`: The link's `target`.
- everything in `Omit<BreadcrumbProps, 'children' | 'className' | 'style'>`
