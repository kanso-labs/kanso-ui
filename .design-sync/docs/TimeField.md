A time typed rather than picked: one segment per part, each its own focus
stop. The value is React Aria's — pass `value` with `onChange` to control
it, or `defaultValue` — as a `Time` from this package's `./date` subpath.

```tsx
import { Time } from '@kanso-labs/kanso-ui/date'

<TimeField defaultValue={new Time(9, 30)} label="Label" />
```

Whether it shows a twelve or twenty-four hour clock is the reader's
locale, through React Aria's `I18nProvider`. `granularity` takes it down
to seconds, and `minValue` and `maxValue` bound what may be typed.

The segments are `DateField`'s, and the box, label and message are the
field chrome in `src/field`. The call site's `className` and `style` land
on the field as a whole, which is the element a layout positions.
