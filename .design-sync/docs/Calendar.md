A month calendar for picking a date. The value is React Aria's: pass
`value` with `onChange` to control it, or `defaultValue` to let it keep its
own, both as an `@internationalized/date` value from this package's
`./date` subpath.

```tsx
import { today, getLocalTimeZone } from '@kanso-labs/kanso-ui/date'

<Calendar aria-label="Label" defaultValue={today(getLocalTimeZone())} />
```

`minValue` and `maxValue` bound it, `isDateUnavailable` rules individual
dates out, and `visibleDuration` of `{ months: 2 }` draws two months side
by side. Name it with `aria-label` or `aria-labelledby`; React Aria
composes the visible month into that name itself.

The call site's `className` and `style` land on the container, which is the
element a layout positions.
