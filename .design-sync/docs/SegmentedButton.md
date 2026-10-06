A row of two to five joined segments, of which one — or with
`selectionMode="multiple"`, several — is chosen. Selection is React Aria's:
pass `selectedKeys` with `onSelectionChange` to control it, or
`defaultSelectedKeys` to let it keep its own. Give every segment an `id`,
which is the key selection is reported by.

```tsx
<SegmentedButton aria-label="Label" defaultSelectedKeys={['first']}>
  <SegmentedButton.Segment id="first">First item</SegmentedButton.Segment>
  <SegmentedButton.Segment id="second">Second item</SegmentedButton.Segment>
</SegmentedButton>
```

Name the set with `aria-label` or `aria-labelledby` — nothing here labels
it for you, and a set with no name is a group a screen reader cannot
announce. What it is announced as follows the selection mode: choosing one
is a radio group, choosing several a toolbar of two-state buttons. So does
how the chosen container moves: it slides between segments while one is
chosen, and fades in place while several may be.

The call site's `className` and `style` land on the track, which is the
element a layout positions.

## Parts

### `SegmentedButton.Segment`

One segment. Its `id` is what selection is reported by, and its label is
what names it. A chosen segment draws a check before the label; an
unchosen one draws whatever `icon` holds, if anything.

Props (`SegmentedButtonSegmentProps`):

- `children`: The segment's label.
- `className`: A function may compute the class from the segment's render state.
- `disableRipple`: Disables the press ripple. The hover and pressed state layers are unaffected.
- `icon`: An icon before the label, in the page's 18dp size. Replaced by the check while the segment is chosen, unless the set turns that off. An icon drawn in `em` takes that size from the slot.
- `style`: A function may compute the style from the segment's render state.
- everything in `Omit<ToggleButtonProps, 'children' | 'className' | 'style'>`
