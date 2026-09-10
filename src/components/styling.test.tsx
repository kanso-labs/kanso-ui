import type { ReactElement } from 'react'

import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import {
  AppBar,
  Avatar,
  Breadcrumbs,
  Button,
  Card,
  Checkbox,
  CheckboxGroup,
  Chip,
  ChipGroup,
  Code,
  ComboBox,
  CopyField,
  Currency,
  Dialog,
  Feed,
  Form,
  IconButton,
  Keycap,
  Link,
  List,
  ListBox,
  ListDetail,
  ListItem,
  Menu,
  Meter,
  NumberField,
  Popover,
  ProductIcon,
  ProgressIndicator,
  Radio,
  RadioGroup,
  SearchField,
  SegmentedButton,
  Select,
  Separator,
  Sheet,
  Slider,
  Snackbar,
  SupportingPane,
  Switch,
  Tabs,
  Tag,
  Text,
  TextArea,
  TextField,
  TokenField,
  Toolbar,
  Tooltip,
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

// Snackbar renders nothing while its queue is empty, so this one is filled
// before the case list is built. The queue lives outside React, so the
// message is there on the first render rather than after an effect.
const SNACKBARS = new Snackbar.Queue()
SNACKBARS.add('First item')

// Autocomplete has no case: it renders no element of its own, so there is
// nothing for a className or a style to land on. Sheet, Menu, Dialog and
// Popover are absent for the same reason — each is a trigger whose parts are
// listed instead.
//
// Portalled parts land outside the render container, so every case is found
// from the document. `cleanup` in vitest.setup.ts unmounts between tests, so
// only the current tree is ever in it.
const CASES: ReadonlyArray<{ element: ReactElement; name: string }> = [
  { element: <AppBar {...PROBE} headline="Headline" />, name: 'AppBar' },
  { element: <Avatar {...PROBE} name="Ada Lovelace" />, name: 'Avatar' },
  {
    element: (
      <Breadcrumbs {...PROBE} aria-label="Label">
        <Breadcrumbs.Item href="#first">First item</Breadcrumbs.Item>
        <Breadcrumbs.Item>Second item</Breadcrumbs.Item>
      </Breadcrumbs>
    ),
    name: 'Breadcrumbs',
  },
  {
    element: (
      <Breadcrumbs aria-label="Label">
        <Breadcrumbs.Item {...PROBE} href="#first">
          First item
        </Breadcrumbs.Item>
        <Breadcrumbs.Item>Second item</Breadcrumbs.Item>
      </Breadcrumbs>
    ),
    name: 'Breadcrumbs.Item',
  },
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
  { element: <Checkbox {...PROBE}>Label</Checkbox>, name: 'Checkbox' },
  {
    element: <CheckboxGroup {...PROBE} label="Label" />,
    name: 'CheckboxGroup',
  },
  { element: <Chip {...PROBE}>Label</Chip>, name: 'Chip' },
  {
    element: (
      <ChipGroup {...PROBE} label="Label">
        <ChipGroup.Chip id="first">First item</ChipGroup.Chip>
      </ChipGroup>
    ),
    name: 'ChipGroup',
  },
  {
    element: (
      <ChipGroup label="Label">
        <ChipGroup.Chip {...PROBE} id="first">
          First item
        </ChipGroup.Chip>
      </ChipGroup>
    ),
    name: 'ChipGroup.Chip',
  },
  { element: <Code {...PROBE}>Label</Code>, name: 'Code' },
  {
    element: (
      <ComboBox
        {...PROBE}
        label="Label"
        options={<ListBox.Item id="first">First item</ListBox.Item>}
      />
    ),
    name: 'ComboBox',
  },
  { element: <CopyField {...PROBE} value="Label" />, name: 'CopyField' },
  { element: <Currency {...PROBE} value={1} />, name: 'Currency' },
  {
    element: (
      <Dialog defaultOpen>
        <Dialog.Content>
          <Dialog.Body {...PROBE}>First item</Dialog.Body>
        </Dialog.Content>
      </Dialog>
    ),
    name: 'Dialog.Body',
  },
  {
    element: (
      <Feed {...PROBE}>
        <Card>First item</Card>
      </Feed>
    ),
    name: 'Feed',
  },
  { element: <Form {...PROBE}>Label</Form>, name: 'Form' },
  {
    element: (
      <IconButton {...PROBE} aria-label="Label">
        {null}
      </IconButton>
    ),
    name: 'IconButton',
  },
  {
    element: (
      <IconButton {...PROBE} aria-label="Label" defaultSelected>
        {null}
      </IconButton>
    ),
    name: 'IconButton (toggle)',
  },
  { element: <Keycap {...PROBE}>Esc</Keycap>, name: 'Keycap' },
  { element: <Link {...PROBE}>Label</Link>, name: 'Link' },
  {
    element: (
      <List {...PROBE} aria-label="Label">
        <List.Item id="first">First item</List.Item>
      </List>
    ),
    name: 'List',
  },
  {
    element: (
      <List aria-label="Label">
        <List.Item {...PROBE} id="first">
          First item
        </List.Item>
      </List>
    ),
    name: 'List.Item',
  },
  {
    element: (
      <List aria-label="Label">
        <List.Section {...PROBE} header="First group">
          <List.Item id="first">First item</List.Item>
        </List.Section>
      </List>
    ),
    name: 'List.Section',
  },
  {
    element: (
      <ListBox {...PROBE} aria-label="Label">
        <ListBox.Item id="first">First item</ListBox.Item>
      </ListBox>
    ),
    name: 'ListBox',
  },
  {
    element: (
      <ListBox aria-label="Label">
        <ListBox.Item {...PROBE} id="first">
          First item
        </ListBox.Item>
      </ListBox>
    ),
    name: 'ListBox.Item',
  },
  {
    element: (
      <ListBox aria-label="Label">
        <ListBox.Section {...PROBE} header="First group">
          <ListBox.Item id="first">First item</ListBox.Item>
        </ListBox.Section>
      </ListBox>
    ),
    name: 'ListBox.Section',
  },
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
      <Menu defaultOpen>
        <Button>Open</Button>
        <Menu.Content {...PROBE}>
          <Menu.Item id="first">First item</Menu.Item>
        </Menu.Content>
      </Menu>
    ),
    name: 'Menu.Content',
  },
  {
    element: (
      <Menu defaultOpen>
        <Button>Open</Button>
        <Menu.Content>
          <Menu.Item {...PROBE} id="first">
            First item
          </Menu.Item>
        </Menu.Content>
      </Menu>
    ),
    name: 'Menu.Item',
  },
  {
    element: (
      <Menu defaultOpen>
        <Button>Open</Button>
        <Menu.Content>
          <Menu.Item id="first">First item</Menu.Item>
          <Menu.Separator {...PROBE} />
        </Menu.Content>
      </Menu>
    ),
    name: 'Menu.Separator',
  },
  { element: <Meter {...PROBE} label="Label" value={40} />, name: 'Meter' },
  { element: <NumberField {...PROBE} label="Label" />, name: 'NumberField' },
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
  {
    element: <ProgressIndicator {...PROBE} label="Label" value={40} />,
    name: 'ProgressIndicator',
  },
  {
    element: (
      <RadioGroup label="Label">
        <Radio {...PROBE} value="first">
          Label
        </Radio>
      </RadioGroup>
    ),
    name: 'Radio',
  },
  { element: <RadioGroup {...PROBE} label="Label" />, name: 'RadioGroup' },
  { element: <SearchField {...PROBE} label="Label" />, name: 'SearchField' },
  {
    element: (
      <SegmentedButton {...PROBE} aria-label="Label">
        <SegmentedButton.Segment id="first">First item</SegmentedButton.Segment>
      </SegmentedButton>
    ),
    name: 'SegmentedButton',
  },
  {
    element: (
      <SegmentedButton aria-label="Label">
        <SegmentedButton.Segment {...PROBE} id="first">
          First item
        </SegmentedButton.Segment>
      </SegmentedButton>
    ),
    name: 'SegmentedButton.Segment',
  },
  {
    element: (
      <Select
        {...PROBE}
        label="Label"
        options={<ListBox.Item id="first">First item</ListBox.Item>}
      />
    ),
    name: 'Select',
  },
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
          <Sheet.Handle {...PROBE} />
        </Sheet.Content>
      </Sheet>
    ),
    name: 'Sheet.Handle',
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
    element: <Slider {...PROBE} defaultValue={40} label="Label" />,
    name: 'Slider',
  },
  { element: <Snackbar {...PROBE} queue={SNACKBARS} />, name: 'Snackbar' },
  {
    element: (
      <SupportingPane {...PROBE} main="First item" supporting="Second item" />
    ),
    name: 'SupportingPane',
  },
  { element: <Switch {...PROBE}>Label</Switch>, name: 'Switch' },
  {
    element: (
      <Tabs defaultSelectedKey="first">
        <Tabs.List {...PROBE}>
          <Tabs.Tab id="first">Label</Tabs.Tab>
        </Tabs.List>
      </Tabs>
    ),
    name: 'Tabs.List',
  },
  {
    element: (
      <Tabs defaultSelectedKey="first">
        <Tabs.Panel {...PROBE} id="first">
          First item
        </Tabs.Panel>
      </Tabs>
    ),
    name: 'Tabs.Panel',
  },
  {
    element: (
      <Tabs defaultSelectedKey="first">
        <Tabs.List>
          <Tabs.Tab {...PROBE} id="first">
            Label
          </Tabs.Tab>
        </Tabs.List>
      </Tabs>
    ),
    name: 'Tabs.Tab',
  },
  { element: <Tag {...PROBE}>Label</Tag>, name: 'Tag' },
  { element: <Text {...PROBE}>Headline</Text>, name: 'Text' },
  { element: <TextArea {...PROBE} label="Label" />, name: 'TextArea' },
  { element: <TextField {...PROBE} label="Label" />, name: 'TextField' },
  {
    element: <TokenField {...PROBE} label="Label" />,
    name: 'TokenField',
  },
  {
    element: (
      <Toolbar {...PROBE} aria-label="Label">
        <Button>Label</Button>
      </Toolbar>
    ),
    name: 'Toolbar',
  },
  {
    element: (
      <Tooltip {...PROBE} defaultOpen label="Supporting text">
        <Button>Trigger</Button>
      </Tooltip>
    ),
    name: 'Tooltip',
  },
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
