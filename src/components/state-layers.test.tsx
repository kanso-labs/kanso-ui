import type { RenderResult } from '@testing-library/react'

import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import {
  Button,
  Calendar,
  Chip,
  ChipGroup,
  ColorPicker,
  DatePicker,
  Disclosure,
  RangeCalendar,
  Snackbar,
  Table,
  Tabs,
  TextField,
} from '.'
import { CalendarDate } from '../date'

// Every surface whose hover and pressed layers React Aria's render state
// draws, rather than `:hover` and `:active`. The browser left `:hover` on
// whatever a touch had tapped, which kept the layer drawn after the tap had
// ended, and React Aria prevents the default of a Space or Enter keydown, so
// `:active` never matched a press made from the keyboard.
//
// Read as the computed value of the property each layer changes, compared
// with itself at rest, so a case proves the state reached the element without
// pinning which tint it is — each component's own tests own that. None of the
// events below moves the browser's own pointer, so a `:hover` or `:active`
// rule cannot match during them: reverting any surface to one fails here.

type Case = {
  // Whether a press draws a layer of its own over the hover. The outlined
  // field's box and an elevated button's shadow change on hover alone.
  press: boolean
  property: Property
  // The element the class lands on, and the one the pointer enters, which
  // differ only for the field: the box is the group around its input.
  setup: () => { hover?: HTMLElement; target: HTMLElement }
}

type Property = 'backgroundColor' | 'backgroundImage' | 'boxShadow' | 'color'

const SEPTEMBER = new CalendarDate(2026, 9, 15)

const AROUND_SEPTEMBER = {
  end: SEPTEMBER.add({ days: 3 }),
  start: SEPTEMBER.subtract({ days: 3 }),
}

// The remove handler, which only has to exist for the button to be drawn.
const ignore = () => {}

// The field's box, the group its label sits two levels inside. React Aria
// gives the group no role a query can find, since it is presentational.
function boxOf(view: RenderResult) {
  const box = view.getByText('Label', { selector: 'label' }).parentElement
    ?.parentElement
  if (!box) {
    throw new Error('expected the label to sit inside a box')
  }
  return box
}

// The value a layer leaves once it is drawn. A component that eases its
// layer in would otherwise be read at the start of the transition, which is
// the value it started from rather than the one it is moving to.
function settled(element: HTMLElement, property: Property) {
  for (const animation of element.getAnimations()) {
    animation.finish()
  }
  return getComputedStyle(element)[property]
}

const CASES: Record<string, Case> = {
  'Button, elevated': {
    press: false,
    property: 'boxShadow',
    setup: () => ({
      target: render(<Button variant="elevated">Label</Button>).getByRole(
        'button',
      ),
    }),
  },
  'Button, filled': {
    press: true,
    property: 'backgroundColor',
    setup: () => ({
      target: render(<Button variant="filled">Label</Button>).getByRole(
        'button',
      ),
    }),
  },
  'Calendar, a date': {
    press: true,
    property: 'backgroundColor',
    setup: () => ({
      target: render(
        <Calendar aria-label="Label" defaultFocusedValue={SEPTEMBER} />,
      ).getByRole('button', { name: /September 16, 2026/ }),
    }),
  },
  // The first of two: React Aria draws a second, visually hidden, after the
  // grid for a screen reader.
  'Calendar, the chevron': {
    press: true,
    property: 'backgroundColor',
    setup: () => ({
      target: render(
        <Calendar aria-label="Label" defaultFocusedValue={SEPTEMBER} />,
      ).getAllByRole('button', { name: 'Next' })[0],
    }),
  },
  'Calendar, the selected date': {
    press: true,
    property: 'backgroundColor',
    setup: () => ({
      target: render(
        <Calendar aria-label="Label" defaultValue={SEPTEMBER} />,
      ).getByRole('button', { name: /September 15, 2026/ }),
    }),
  },
  Chip: {
    press: true,
    property: 'backgroundColor',
    setup: () => ({
      target: render(<Chip>Label</Chip>).getByRole('button'),
    }),
  },
  // A chip in a group is a control only when the group lets it be selected;
  // React Aria reports no hover or press on one that cannot be, and so it
  // draws no layer either.
  'ChipGroup, a chip': {
    press: true,
    property: 'backgroundColor',
    setup: () => ({
      target: render(
        <ChipGroup label="Label" selectionMode="multiple">
          <ChipGroup.Chip id="first">First item</ChipGroup.Chip>
        </ChipGroup>,
      ).getByRole('row'),
    }),
  },
  'ChipGroup, the remove button': {
    press: true,
    property: 'backgroundColor',
    setup: () => ({
      target: render(
        <ChipGroup label="Label" onRemove={ignore}>
          <ChipGroup.Chip id="first">First item</ChipGroup.Chip>
        </ChipGroup>,
      ).getByRole('button'),
    }),
  },
  'ColorPicker, the trigger': {
    press: true,
    property: 'backgroundColor',
    setup: () => ({
      target: render(
        <ColorPicker defaultValue="#6750A4" label="Label" />,
      ).getByRole('button'),
    }),
  },
  'DatePicker, the trigger': {
    press: true,
    property: 'backgroundColor',
    setup: () => ({
      target: render(<DatePicker label="Label" />).getByRole('button', {
        name: /Calendar/,
      }),
    }),
  },
  // A row draws its layers as an image over its fill — see `focusVisible` in
  // src/row/styles.ts.
  'Disclosure, the header': {
    press: true,
    property: 'backgroundImage',
    setup: () => ({
      target: render(
        <Disclosure>
          <Disclosure.Header>Headline</Disclosure.Header>
          <Disclosure.Panel>Supporting line</Disclosure.Panel>
        </Disclosure>,
      ).getByRole('button', { name: 'Headline' }),
    }),
  },
  'RangeCalendar, a date in the range': {
    press: true,
    property: 'backgroundColor',
    setup: () => ({
      target: render(
        <RangeCalendar aria-label="Label" defaultValue={AROUND_SEPTEMBER} />,
      ).getByRole('button', { name: /September 15, 2026/ }),
    }),
  },
  'Snackbar, the action': {
    press: true,
    property: 'backgroundColor',
    setup: () => {
      const queue = new Snackbar.Queue()
      queue.add('First item', { action: { label: 'Label', onPress() {} } })
      render(<Snackbar queue={queue} />)
      return { target: screen.getByRole('button', { name: 'Label' }) }
    },
  },
  'Snackbar, the close button': {
    press: true,
    property: 'backgroundColor',
    setup: () => {
      const queue = new Snackbar.Queue()
      queue.add('First item', { showCloseButton: true })
      render(<Snackbar closeLabel="Label" queue={queue} />)
      return { target: screen.getByRole('button', { name: 'Label' }) }
    },
  },
  'Table, a sortable column': {
    press: true,
    property: 'backgroundColor',
    setup: () => ({
      target: render(
        <Table aria-label="Label">
          <Table.Header>
            <Table.Column allowsSorting id="label" isRowHeader>
              Label
            </Table.Column>
          </Table.Header>
          <Table.Body>
            <Table.Row id="first">
              <Table.Cell>First item</Table.Cell>
            </Table.Row>
          </Table.Body>
        </Table>,
      ).getByRole('columnheader'),
    }),
  },
  'Tabs, the selected tab': {
    press: true,
    property: 'backgroundColor',
    setup: () => ({
      target: render(
        <Tabs defaultSelectedKey="first">
          <Tabs.List aria-label="Label">
            <Tabs.Tab id="first">First item</Tabs.Tab>
            <Tabs.Tab id="second">Second item</Tabs.Tab>
          </Tabs.List>
        </Tabs>,
      ).getByRole('tab', { name: 'First item' }),
    }),
  },
  'TextField, outlined': {
    press: false,
    property: 'color',
    setup: () => {
      const box = boxOf(render(<TextField label="Label" variant="outlined" />))
      return { hover: box, target: box }
    },
  },
  'TextField, outlined and invalid': {
    press: false,
    property: 'color',
    setup: () => {
      const box = boxOf(
        render(
          <TextField
            error="Supporting line"
            label="Label"
            variant="outlined"
          />,
        ),
      )
      return { hover: box, target: box }
    },
  },
}

const ENTRIES = Object.entries(CASES)

describe('state layers', () => {
  describe.each(ENTRIES)('%s', (_, { property, setup }) => {
    it('draws a hover layer for a mouse', () => {
      const { hover, target } = setup()
      const rest = settled(target, property)

      fireEvent.pointerOver(hover ?? target, { pointerType: 'mouse' })
      expect(settled(target, property)).not.toBe(rest)
    })

    // React Aria ignores a touch for hover, which is the whole of the fix
    // for the layer staying on after a tap: the pointer a tap reports is
    // what the class is drawn from.
    it('draws no hover layer for a touch', () => {
      const { hover, target } = setup()
      const rest = settled(target, property)

      fireEvent.pointerOver(hover ?? target, { pointerType: 'touch' })
      expect(settled(target, property)).toBe(rest)
    })
  })

  // Pressed while hovered, so the press has to draw a layer of its own over
  // the hover's rather than merely one over nothing.
  describe.each(ENTRIES.filter(([, { press }]) => press))(
    '%s',
    (_, { property, setup }) => {
      it('draws a pressed layer for a key', () => {
        const { hover, target } = setup()
        const rest = settled(target, property)
        fireEvent.pointerOver(hover ?? target, { pointerType: 'mouse' })
        const hovered = settled(target, property)

        // Space is the key React Aria prevents the default of, which is
        // what kept `:active` from ever matching.
        fireEvent.keyDown(target, { key: ' ' })
        const pressed = settled(target, property)
        fireEvent.keyUp(target, { key: ' ' })

        expect(pressed).not.toBe(hovered)
        expect(pressed).not.toBe(rest)
      })
    },
  )
})
