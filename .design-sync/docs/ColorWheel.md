Hue as a ring, with a handle on it. The value is React Aria's: pass
`value` with `onChange` to control it, or `defaultValue`, as a CSS colour
string or a `Color` from `parseColor`, which this package re-exports.

```tsx
<ColorWheel defaultValue="hsl(200, 100%, 50%)" />
```

A wheel slides hue and nothing else, so unlike `ColorSlider` and
`ColorArea` it names no channel and there is no space for one to be
missing from — a hex value works here.

The middle is genuinely empty rather than filled, so a `ColorArea` or a
`ColorSwatch` can sit inside one. React Aria names the handle "Hue" and
announces the value; pass `aria-label` to say something else.

The call site's `className` and `style` land on the wheel, which is the
element a layout positions. Its size comes from `outerRadius`.
