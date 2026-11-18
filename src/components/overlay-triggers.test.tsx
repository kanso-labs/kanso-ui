import type { ReactElement } from 'react'

import { fireEvent, render, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import Button from './button'
import ComboBox from './combo-box'
import Dialog from './dialog'
import FabMenu from './fab-menu'
import ListBox from './list-box'
import Menu from './menu'
import Popover from './popover'
import Select from './select'
import SplitButton from './split-button'

// Every trigger that opens an overlay says whether it is open, through
// `aria-expanded`, and the attribute follows the overlay both ways: WCAG
// 4.1.2 asks that a control's state be exposed to assistive technology. The
// pressed shape a trigger draws is no part of that, since it is a press's
// alone — see src/button — so the attribute is the one thing that says a
// trigger's overlay is open.

// Hoisted, since react-perf rejects an element built at the prop.
const OPTIONS = (
  <>
    <ListBox.Item id="first">First item</ListBox.Item>
    <ListBox.Item id="second">Second item</ListBox.Item>
  </>
)

const ICON = <svg aria-hidden="true" />

// Each trigger, the overlay it opens, and how to find the element that
// carries `aria-expanded`.
const TRIGGERS: Record<
  string,
  { element: ReactElement; name: RegExp; role: 'button' | 'combobox' }
> = {
  ComboBox: {
    element: <ComboBox label="Label" options={OPTIONS} />,
    name: /Label/,
    role: 'combobox',
  },
  Dialog: {
    element: (
      <Dialog>
        <Button>Open</Button>
        <Dialog.Content>
          <Dialog.Header>
            <Dialog.Title>Headline</Dialog.Title>
          </Dialog.Header>
        </Dialog.Content>
      </Dialog>
    ),
    name: /Open/,
    role: 'button',
  },
  FabMenu: {
    element: (
      <FabMenu aria-label="Open" icon={ICON}>
        <FabMenu.Item icon={ICON} id="first">
          First item
        </FabMenu.Item>
      </FabMenu>
    ),
    name: /Open/,
    role: 'button',
  },
  Menu: {
    element: (
      <Menu>
        <Button>Open</Button>
        <Menu.Content>
          <Menu.Item id="first">First item</Menu.Item>
        </Menu.Content>
      </Menu>
    ),
    name: /Open/,
    role: 'button',
  },
  Popover: {
    element: (
      <Popover>
        <Button>Open</Button>
        <Popover.Content>
          <Popover.Title>Headline</Popover.Title>
        </Popover.Content>
      </Popover>
    ),
    name: /Open/,
    role: 'button',
  },
  Select: {
    element: <Select label="Label" options={OPTIONS} />,
    name: /Label/,
    role: 'button',
  },
  SplitButton: {
    element: (
      <SplitButton>
        <SplitButton.Action>Label</SplitButton.Action>
        <SplitButton.Menu aria-label="Open">
          <Menu.Item id="first">First item</Menu.Item>
        </SplitButton.Menu>
      </SplitButton>
    ),
    name: /Open/,
    role: 'button',
  },
}

describe('an overlay trigger', () => {
  it.each(Object.entries(TRIGGERS))(
    "%s exposes aria-expanded and follows its overlay's opening and closing",
    async (_name, { element, name, role }) => {
      const view = render(element)
      // A modal overlay hides what is outside it from the accessibility tree.
      const trigger = view.getByRole(role, { hidden: true, name })
      expect(trigger.getAttribute('aria-expanded')).toBe('false')

      // A press of the button from the keyboard. A combo box's input is not
      // a button: its list opens from the toggle beside it, and focus stays
      // in the input, which is where its Escape goes.
      if (role === 'combobox') {
        fireEvent.click(view.getByRole('button', { hidden: true }))
      } else {
        fireEvent.keyDown(trigger, { key: 'Enter' })
        fireEvent.keyUp(trigger, { key: 'Enter' })
      }
      await waitFor(() => {
        expect(trigger.getAttribute('aria-expanded')).toBe('true')
      })

      // Escape where focus went, which is inside the overlay for every other
      // trigger.
      const focused =
        role === 'combobox'
          ? trigger
          : (document.activeElement ?? document.body)
      fireEvent.keyDown(focused, { key: 'Escape' })
      fireEvent.keyUp(focused, { key: 'Escape' })
      await waitFor(() => {
        expect(trigger.getAttribute('aria-expanded')).toBe('false')
      })
    },
  )
})
