A button that is an icon, at five control heights. Given `href` it is a
link with the same appearance. Every `aria-*` prop is forwarded to the
element; React Aria alone would keep only the labelling ones.

Given `isSelected`, `defaultSelected` or `onChange` it is a toggle, which
reports its state through `aria-pressed` and draws the page's second pair
of colour roles for its variant. A toggle takes neither `href` nor the
pending props.

```tsx
<IconButton aria-label="Label" defaultSelected variant="tonal">
  <StarIcon />
</IconButton>
```
