A colour shown as a value: a square of it, with a chequer behind so
transparency reads as transparency. The colour is React Aria's — a CSS
string, or a `Color` from `parseColor`, which this package re-exports.

```tsx
import { parseColor } from '@kanso-labs/kanso-ui'

<ColorSwatch color={parseColor('hsla(200, 100%, 50%, 0.4)')} />
```

React Aria names it from the colour itself — "light vibrant cyan blue, 60%
transparent" — so it needs no label. Pass `colorName` to say something
else instead.

The call site's `className` and `style` land on the square around the
swatch rather than on the swatch itself, which is what makes setting a
size from outside work — the colour fills whatever square it is given.
React Aria's function forms are not taken here, since a swatch has no
interactive state for one to read.
