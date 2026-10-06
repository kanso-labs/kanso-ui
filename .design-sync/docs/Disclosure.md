A section that opens to show what is under it. Whether it is open is React
Aria's: pass `isExpanded` with `onExpandedChange` to control it, or
`defaultExpanded` to let it keep its own.

```tsx
<Disclosure>
  <Disclosure.Header>Headline</Disclosure.Header>
  <Disclosure.Panel>Supporting line</Disclosure.Panel>
</Disclosure>
```

The header is the row every list here draws, so a section above a list of
rows lines up with them. The panel opens to whatever height its content
turns out to have, and snaps rather than sliding under
`prefers-reduced-motion`.

The call site's `className` and `style` land on the container, which is the
element a layout positions.

## Parts

### `Disclosure.Header`

The row that opens the section. It renders the heading React Aria wants
around the trigger and the button inside it, and draws the shared row's
slots with a chevron in the trailing one.

Props (`DisclosureHeaderProps`):

- `children`: The header's headline — what the section is about.
- `headingLevel`: Where the header sits in the page's outline. React Aria renders the trigger inside a heading, and a screen reader moves between them.
- `leading`: Content before the headline: an avatar, an icon.
- `supporting`: A second line under the headline, in the muted role.
