A calendar for picking a range of dates. The value is React Aria's: pass
`value` with `onChange` to control it, or `defaultValue` to let it keep its
own, both as a `{ start, end }` pair of `@internationalized/date` values
from this package's `./date` subpath.

```tsx
import { CalendarDate } from '@kanso-labs/kanso-ui/date'

<RangeCalendar
  aria-label="Label"
  defaultValue={{
    start: new CalendarDate(2026, 9, 8),
    end: new CalendarDate(2026, 9, 15),
  }}
/>
```

The two ends take the circle a selected date takes in `Calendar`, and the
days between them a band in the secondary container. `minValue`,
`maxValue`, `isDateUnavailable` and `visibleDuration` are the same props
`Calendar` takes, and `allowsNonContiguousRanges` lets a range skip the
dates ruled out inside it rather than stopping at the first.

The call site's `className` and `style` land on the container, which is the
element a layout positions.
