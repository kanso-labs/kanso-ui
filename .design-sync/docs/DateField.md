A date typed rather than picked: one segment per part, each its own focus
stop. The value is React Aria's — pass `value` with `onChange` to control
it, or `defaultValue` — as an `@internationalized/date` value from this
package's `./date` subpath.

```tsx
import { CalendarDate } from '@kanso-labs/kanso-ui/date'

<DateField defaultValue={new CalendarDate(2026, 9, 15)} label="Label" />
```

How many segments there are and what order they come in is the reader's
locale, through React Aria's `I18nProvider` — `granularity` adds time
segments, and `minValue` and `maxValue` bound what may be typed.

The box, label and message are the field chrome in `src/field`, shared
with every other field. The call site's `className` and `style` land on
the field as a whole, which is the element a layout positions.
