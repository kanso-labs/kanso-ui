A slider over one channel of a colour — hue, saturation, lightness, alpha
and the rest. The value is React Aria's: pass `value` with `onChange` to
control it, or `defaultValue`, as a CSS colour string or a `Color` from
`parseColor`, which this package re-exports.

```tsx
<ColorSlider channel="hue" defaultValue="hsl(200, 100%, 50%)" label="Label" />
```

**`channel` has to name a channel the value's own space has.** A hex or
`rgb()` value parses as RGB, which has no hue, so `channel="hue"` against
one throws rather than converting — pass `colorSpace="hsl"` to convert it,
or give the value in the space you mean to slide.

React Aria paints the gradient and names the value — "200°, cyan blue" —
so the readout beside the label is what it announces.

The call site's `className` and `style` land on the slider as a whole,
which is the element a layout positions.
