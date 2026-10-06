## Parts

### `ChipGroup.Chip`

One chip. Give every chip an `id` — that is the key selection and removal
are reported by.

Props (`ChipGroupChipProps`):

- `children`: The chip's label.
- `className`: A function may compute the class from the chip's render state.
- `style`: A function may compute the style from the chip's render state.
- everything in `Omit<TagProps, 'children' | 'className' | 'style'>`
