Two channels of a colour as a plane, with a handle where they meet. The
value is React Aria's: pass `value` with `onChange` to control it, or
`defaultValue`, as a CSS colour string or a `Color` from `parseColor`,
which this package re-exports.

```tsx
<ColorArea
  defaultValue="hsl(200, 100%, 50%)"
  xChannel="saturation"
  yChannel="lightness"
/>
```

**`xChannel` and `yChannel` have to name channels the value's own space
has.** A hex or `rgb()` value parses as RGB, which has no saturation, so
naming one against it throws rather than converting — pass `colorSpace` to
convert it, or give the value in the space you mean to work in. The same
trap `ColorSlider` documents.

**`alpha` is a channel here only in RGB.** Asked for it in HSL, React Aria
quietly draws the saturation and lightness plane instead, so a plane that
will not fade is the only sign anything was ignored.

React Aria names the handle "Color picker" and announces both channels;
pass `aria-label` to say what the plane is for instead.

The call site's `className` and `style` land on the square around the
plane rather than on the plane itself, so setting an `inlineSize` is what
resizes one — and it stays square, since two channels sharing a box want
equal travel. React Aria's function forms are not taken here for the same
reason `ColorSwatch` does not take them: the element they would read
state for is not the one a layout reaches.
