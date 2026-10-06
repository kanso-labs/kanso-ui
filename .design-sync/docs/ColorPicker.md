A colour picked from a plane, a hue strip and a text field, behind a
trigger showing the colour. The value is React Aria's: pass `value` with
`onChange` to control it, or `defaultValue`, as a CSS colour string or a
`Color` from `parseColor`, which this package re-exports.

```tsx
<ColorPicker defaultValue="#6750A4" label="Label" />
```

`alpha` adds the transparency strip. Above the medium breakpoint the
surface is docked to the trigger; below it, it opens centred, the same
swap `DatePicker` makes. `defaultOpen`, `isOpen` and `onOpenChange` reach
the overlay, since the picker itself carries no open state — React Aria
keeps that on the dialog trigger this renders inside.

Every part inside is this package's own — `ColorArea`, `ColorSlider`,
`ColorField` and `ColorSwatch` — and they share the picker's value
through React Aria's context rather than props. Passing `children`
replaces all of them, for a picker that wants a different arrangement.

The call site's `className` and `style` land on the trigger, which is the
element a layout positions.
