A chip is a two-state button, so its selected state is React Aria's
`isSelected`: pass it with `onChange` to control it, or `defaultSelected` to
let it keep its own state. Selection is announced through `aria-pressed`
rather than a role of its own.
