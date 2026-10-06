A label for the element it wraps, shown while that element is hovered or
focused — the tooltips page's plain tooltip. Its open state is React
Aria's: pass `isOpen` with `onOpenChange` to control it, `defaultOpen` to
let it keep its own, and `delay` and `closeDelay` for how long a pointer
has to rest before it appears and after it leaves.

A tooltip is not a place to put anything a person has to read or reach:
it is skipped by touch entirely and dismissed by Escape, so what it says
has to be a repeat of what the element already means. Anything with a
button in it, or worth reading twice, is a `Popover`.

The call site's `className` and `style` land on the tooltip itself.
