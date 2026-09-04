import type { ReactElement } from 'react'

import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import {
  AppBar,
  Avatar,
  Badge,
  Button,
  Card,
  Chip,
  Code,
  CopyField,
  Currency,
  Feed,
  IconButton,
  Keycap,
  Link,
  ListDetail,
  ListItem,
  Popover,
  ProductIcon,
  Separator,
  Sheet,
  SupportingPane,
  Tabs,
  Text,
  TextField,
} from '.'

// Every element the library renders that a call site can reach, rendered with
// both of the props a call site positions a component with. Spreading
// `stylex.props()` over them used to drop both silently, which left no way to
// place a component in a layout from outside it — see src/styles/merge.ts.
//
// One list rather than a case per component file, because what is being pinned
// is a rule that has to hold across all of them at once: a new component that
// forgets to merge fails here rather than shipping the same bug again.
const PROBE = { className: 'probe', style: { zIndex: 42 } }

// Portalled parts land outside the render container, so every case is found
// from the document. `cleanup` in vitest.setup.ts unmounts between tests, so
// only the current tree is ever in it.
const CASES: ReadonlyArray<{ element: ReactElement; name: string }> = [
  { element: <AppBar {...PROBE} headline="Headline" />, name: 'AppBar' },
  { element: <Avatar {...PROBE} name="Ada Lovelace" />, name: 'Avatar' },
  { element: <Badge {...PROBE}>Label</Badge>, name: 'Badge' },
  { element: <Button {...PROBE}>Label</Button>, name: 'Button' },
  { element: <Card {...PROBE}>First item</Card>, name: 'Card' },
  {
    element: (
      <Card {...PROBE} interactive>
        First item
      </Card>
    ),
    name: 'Card (interactive)',
  },
  { element: <Chip {...PROBE}>Label</Chip>, name: 'Chip' },
  { element: <Code {...PROBE}>Label</Code>, name: 'Code' },
  { element: <CopyField {...PROBE} value="Label" />, name: 'CopyField' },
  { element: <Currency {...PROBE} value={1} />, name: 'Currency' },
  {
    element: (
      <Feed {...PROBE}>
        <Card>First item</Card>
      </Feed>
    ),
    name: 'Feed',
  },
  {
    element: (
      <IconButton {...PROBE} aria-label="Label">
        {null}
      </IconButton>
    ),
    name: 'IconButton',
  },
  { element: <Keycap {...PROBE}>Esc</Keycap>, name: 'Keycap' },
  { element: <Link {...PROBE}>Label</Link>, name: 'Link' },
  {
    element: <ListDetail {...PROBE} detail="Second item" list="First item" />,
    name: 'ListDetail',
  },
  { element: <ListItem {...PROBE}>Headline</ListItem>, name: 'ListItem' },
  {
    element: (
      <ListItem {...PROBE} interactive>
        Headline
      </ListItem>
    ),
    name: 'ListItem (interactive)',
  },
  {
    element: (
      <Popover defaultOpen>
        <Popover.Content {...PROBE}>First item</Popover.Content>
      </Popover>
    ),
    name: 'Popover.Content',
  },
  {
    element: (
      <Popover defaultOpen>
        <Popover.Content>
          <Popover.Description {...PROBE}>Supporting line</Popover.Description>
        </Popover.Content>
      </Popover>
    ),
    name: 'Popover.Description',
  },
  {
    element: (
      <Popover defaultOpen>
        <Popover.Content>
          <Popover.Title {...PROBE}>Headline</Popover.Title>
        </Popover.Content>
      </Popover>
    ),
    name: 'Popover.Title',
  },
  { element: <ProductIcon {...PROBE} name="Label" />, name: 'ProductIcon' },
  { element: <Separator {...PROBE} />, name: 'Separator' },
  {
    element: (
      <Sheet defaultOpen>
        <Sheet.Content>
          <Sheet.Body {...PROBE}>First item</Sheet.Body>
        </Sheet.Content>
      </Sheet>
    ),
    name: 'Sheet.Body',
  },
  {
    element: (
      <Sheet defaultOpen>
        <Sheet.Content {...PROBE}>First item</Sheet.Content>
      </Sheet>
    ),
    name: 'Sheet.Content',
  },
  {
    element: (
      <Sheet defaultOpen>
        <Sheet.Content>
          <Sheet.Footer {...PROBE}>First item</Sheet.Footer>
        </Sheet.Content>
      </Sheet>
    ),
    name: 'Sheet.Footer',
  },
  {
    element: (
      <Sheet defaultOpen>
        <Sheet.Content>
          <Sheet.Header {...PROBE}>First item</Sheet.Header>
        </Sheet.Content>
      </Sheet>
    ),
    name: 'Sheet.Header',
  },
  {
    element: (
      <Sheet defaultOpen>
        <Sheet.Content>
          <Sheet.Title {...PROBE}>Headline</Sheet.Title>
        </Sheet.Content>
      </Sheet>
    ),
    name: 'Sheet.Title',
  },
  {
    element: (
      <SupportingPane {...PROBE} main="First item" supporting="Second item" />
    ),
    name: 'SupportingPane',
  },
  {
    element: (
      <Tabs defaultValue="first">
        <Tabs.List {...PROBE}>
          <Tabs.Tab value="first">Label</Tabs.Tab>
        </Tabs.List>
      </Tabs>
    ),
    name: 'Tabs.List',
  },
  {
    element: (
      <Tabs defaultValue="first">
        <Tabs.Panel {...PROBE} value="first">
          First item
        </Tabs.Panel>
      </Tabs>
    ),
    name: 'Tabs.Panel',
  },
  {
    element: (
      <Tabs defaultValue="first">
        <Tabs.List>
          <Tabs.Tab {...PROBE} value="first">
            Label
          </Tabs.Tab>
        </Tabs.List>
      </Tabs>
    ),
    name: 'Tabs.Tab',
  },
  { element: <Text {...PROBE}>Headline</Text>, name: 'Text' },
  { element: <TextField {...PROBE} label="Label" />, name: 'TextField' },
]

/** The probed element, or a failure naming what went missing. */
function probed() {
  const element = document.querySelector('.probe')
  if (!(element instanceof HTMLElement)) {
    throw new Error('expected the className to reach an element')
  }
  return element
}

describe.each(CASES)('$name', ({ element }) => {
  it('keeps the className and style it was passed', () => {
    render(element)

    // The call site's `style` is inline, so it reads straight off the
    // attribute rather than through the cascade.
    expect(probed().style.zIndex).toBe('42')
  })

  it('still carries its own compiled classes', () => {
    render(element)

    // A merge that kept only the call site's className would satisfy the test
    // above and leave the component unstyled, which is the failure this one
    // rules out. The generated names are hashes, so what is checked is that
    // there is something beside the probe rather than which classes they are —
    // each component's own spec pins the roles it reaches for.
    const classes = [...probed().classList].filter((name) => name !== 'probe')

    expect(classes.length).toBeGreaterThan(0)
  })
})
