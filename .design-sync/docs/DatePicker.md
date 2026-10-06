A date typed into a field, or picked from a calendar behind a button. The
value is React Aria's — pass `value` with `onChange` to control it, or
`defaultValue` — as an `@internationalized/date` value from this package's
`./date` subpath.

```tsx
import { CalendarDate } from '@kanso-labs/kanso-ui/date'

<DatePicker defaultValue={new CalendarDate(2026, 9, 15)} label="Label" />
```

The segments are `DateField`'s and the calendar is `Calendar`, so
`granularity`, `minValue`, `maxValue` and `isDateUnavailable` all behave
as they do there. Above the medium breakpoint the calendar is docked to
the field; below it, it opens centred, which is the page's modal picker.

The call site's `className` and `style` land on the picker as a whole,
which is the element a layout positions.
