A stack of `Disclosure` sections that agree about what is open. Which are
expanded is React Aria's: pass `expandedKeys` with `onExpandedChange` to
control it, or `defaultExpandedKeys` to let the group keep its own.

```tsx
<DisclosureGroup defaultExpandedKeys={FIRST}>
  <Disclosure id="first">
    <Disclosure.Header>Headline</Disclosure.Header>
    <Disclosure.Panel>Supporting line</Disclosure.Panel>
  </Disclosure>
</DisclosureGroup>
```

One section opens at a time unless `allowsMultipleExpanded` says otherwise.
Give every section an `id` — that is the key the group reports.

The call site's `className` and `style` land on the container, which is the
element a layout positions.
