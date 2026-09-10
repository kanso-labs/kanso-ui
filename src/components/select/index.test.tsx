import * as stylex from '@stylexjs/stylex'
import { act, fireEvent, render, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import Select from '.'
import { colors, typography } from '../../tokens/design.tokens.stylex'
import ListBox from '../list-box'

// StyleX hashes an atomic class from the property and value, so the same
// declaration written here produces the same class the component produces.
// Asserting on class membership pins which role each part reaches for without
// depending on the browser having applied a rule these tests are the first
// thing to use — see chip/index.test.tsx for the flake behind this.
const probeStyles = stylex.create({
  error: { color: colors.error },
  floated: { fontSize: typography.bodySmallSize },
  placeholder: { color: colors.onSurfaceVariant },
})

function classesOf(props: { className?: string | undefined }) {
  const classes = (props.className ?? '').split(' ').filter(Boolean)
  // An empty list would make every `every` below vacuously true, so it is a
  // broken assertion rather than a passing one.
  if (classes.length === 0) {
    throw new Error('expected the probe style to generate at least one class')
  }
  return classes
}

const CLASSES = {
  error: classesOf(stylex.props(probeStyles.error)),
  floated: classesOf(stylex.props(probeStyles.floated)),
  placeholder: classesOf(stylex.props(probeStyles.placeholder)),
}

const OPTIONS = (
  <>
    <ListBox.Item id="first">First item</ListBox.Item>
    <ListBox.Item id="second">Second item</ListBox.Item>
    <ListBox.Item id="third">Third item</ListBox.Item>
  </>
)

function hasClasses(element: Element, classes: string[]) {
  return classes.every((name) => element.classList.contains(name))
}

// The field fills what it is given, and React Aria clamps a popover to the
// viewport — so a field as wide as the runner's window would open a list
// narrower than itself for reasons that are the window's rather than the
// component's. A fixed width keeps the two comparable.
const WIDTH = { width: '320px' }

function setup(props: Partial<Parameters<typeof Select<object>>[0]> = {}) {
  const view = render(
    <div style={WIDTH}>
      <Select label="Label" options={OPTIONS} {...props} />
    </div>,
  )
  return { ...view, trigger: view.getByRole('button', { name: /Label/ }) }
}

/** The element React Aria draws the value in, styled by the field chrome. */
function valueOf(view: ReturnType<typeof render>) {
  // The box holds the press target, then the column the label and the value
  // share, then the trailing icon. The value is the column's last child.
  const box = view.container.querySelector('[role="group"]')
  const value =
    box?.querySelector('button')?.nextElementSibling?.lastElementChild
  if (!(value instanceof HTMLElement)) {
    throw new Error('expected the box to draw a value')
  }
  return value
}

describe('select', () => {
  describe('semantics', () => {
    it('renders a button named by its label', () => {
      const { trigger } = setup()
      expect(trigger.getAttribute('aria-haspopup')).toBe('listbox')
      expect(trigger.getAttribute('aria-expanded')).toBe('false')
    })

    it('renders no list until it is opened', () => {
      const view = setup()
      expect(view.queryByRole('listbox')).toBeNull()
    })

    it('opens the list from the field', async () => {
      const view = setup()
      fireEvent.click(view.trigger)
      await waitFor(() => {
        expect(view.getByRole('listbox')).not.toBeNull()
      })
      expect(view.getAllByRole('option')).toHaveLength(3)
    })

    it('reports its disabled state', () => {
      const { trigger } = setup({ isDisabled: true })
      expect(trigger.getAttribute('disabled')).not.toBeNull()
    })

    // The error is what puts the field in its error state — the message,
    // the underline and aria-invalid all follow from it.
    it('reports an error on the field and shows it once', () => {
      const view = setup({
        description: 'Supporting line',
        error: 'Choose an item',
      })
      expect(view.getByText('Choose an item')).not.toBeNull()
      expect(view.queryByText('Supporting line')).toBeNull()
    })

    it('shows the description when there is no error', () => {
      const view = setup({ description: 'Supporting line' })
      expect(view.getByText('Supporting line')).not.toBeNull()
    })
  })

  describe('choosing', () => {
    it('chooses an option and closes the list', async () => {
      const view = setup()
      fireEvent.click(view.trigger)
      await waitFor(() => {
        expect(view.getByRole('listbox')).not.toBeNull()
      })

      fireEvent.click(view.getByRole('option', { name: 'Second item' }))

      await waitFor(() => {
        expect(view.queryByRole('listbox')).toBeNull()
      })
      expect(view.getByText('Second item')).not.toBeNull()
    })

    it('keeps its own choice from defaultSelectedKey', () => {
      const view = setup({ defaultValue: 'third' })
      expect(view.getByText('Third item')).not.toBeNull()
    })

    it('does not change on its own when controlled', async () => {
      const onChange = vi.fn<(key: unknown) => void>()
      const view = setup({ onChange, value: 'first' })
      fireEvent.click(view.trigger)
      await waitFor(() => {
        expect(view.getByRole('listbox')).not.toBeNull()
      })

      fireEvent.click(view.getByRole('option', { name: 'Second item' }))

      await waitFor(() => {
        expect(onChange).toHaveBeenCalledWith('second')
      })
      // The value is still the one it was told to show, not the one pressed.
      expect(valueOf(view).textContent).toBe('First item')
    })

    it('shows the placeholder while nothing is chosen', () => {
      const view = setup({ placeholder: 'Pick one' })
      expect(view.getByText('Pick one')).not.toBeNull()
    })
  })

  describe('keyboard', () => {
    it('opens the list from the keyboard', async () => {
      const view = setup()
      act(() => {
        view.trigger.focus()
      })
      fireEvent.keyDown(view.trigger, { key: 'ArrowDown' })
      fireEvent.keyUp(view.trigger, { key: 'ArrowDown' })

      await waitFor(() => {
        expect(view.getByRole('listbox')).not.toBeNull()
      })
    })

    it('closes on Escape', async () => {
      const view = setup()
      fireEvent.click(view.trigger)
      await waitFor(() => {
        expect(view.getByRole('listbox')).not.toBeNull()
      })

      fireEvent.keyDown(view.getByRole('listbox'), { key: 'Escape' })

      await waitFor(() => {
        expect(view.queryByRole('listbox')).toBeNull()
      })
    })
  })

  describe('the label', () => {
    // The box shrinks its label through CSS keyed on an input that is not
    // showing its placeholder. A select has no input to ask, so the chrome
    // reads the select's own state instead — without that the label never
    // floats, however much is chosen, and sits over the value.
    it('floats once something is chosen', () => {
      const empty = setup()
      expect(hasClasses(empty.getByText('Label'), CLASSES.floated)).toBe(false)
      empty.unmount()

      const chosen = setup({ defaultValue: 'second' })
      expect(hasClasses(chosen.getByText('Label'), CLASSES.floated)).toBe(true)
    })

    it('stays floated when it was told not to float at all', () => {
      const view = setup({ floatingLabel: false })
      expect(hasClasses(view.getByText('Label'), CLASSES.floated)).toBe(false)
    })

    it('takes the error role when there is an error', () => {
      const view = setup({ error: 'Choose an item' })
      expect(hasClasses(view.getByText('Label'), CLASSES.error)).toBe(true)
    })
  })

  describe('appearance', () => {
    // With no floating label there is nothing for the placeholder to hide
    // behind, so it shows in the muted role from the start.
    it('draws the placeholder in the muted role', () => {
      const view = setup({ floatingLabel: false, placeholder: 'Pick one' })
      expect(hasClasses(valueOf(view), CLASSES.placeholder)).toBe(true)
      expect(valueOf(view).textContent).toBe('Pick one')
    })

    // Under a floating label the placeholder waits until the field is
    // focused, exactly as an input's does — otherwise it and the label sit
    // on top of each other in the empty box.
    it('hides the placeholder under a floating label', () => {
      const view = setup({ placeholder: 'Pick one' })
      expect(getComputedStyle(valueOf(view)).color).toBe('rgba(0, 0, 0, 0)')
    })

    // The press target covers the box rather than the value's line, so the
    // padding, the label and the icons all open the list.
    it('covers the whole box with the press target', () => {
      const view = setup()
      const box = view.container.querySelector('[role="group"]')
      if (box === null) {
        throw new Error('expected the field to draw a box')
      }

      expect(box.getBoundingClientRect().width).toBe(
        view.trigger.getBoundingClientRect().width,
      )
      expect(box.getBoundingClientRect().height).toBe(
        view.trigger.getBoundingClientRect().height,
      )
    })

    // The page draws the list under the field and as wide as it, which only
    // holds because the popover is anchored to the box rather than to the
    // button inside it.
    it('opens the list at the width of the field', async () => {
      const view = setup()
      const box = view.container.querySelector('[role="group"]')
      if (box === null) {
        throw new Error('expected the field to draw a box')
      }

      fireEvent.click(view.trigger)
      await waitFor(() => {
        expect(view.getByRole('listbox')).not.toBeNull()
      })

      // React Aria reports the anchor's width to the surface as a custom
      // property, and clamps the surface itself to the viewport — so what is
      // pinned here is what it was anchored to, which is the whole point:
      // anchored to the button inside the box, the list came out narrower
      // than the field by the icons either side of it.
      const surface = view.getByRole('listbox').parentElement
      expect(surface?.style.getPropertyValue('--trigger-width')).toBe(
        `${box.getBoundingClientRect().width}px`,
      )
    })
  })
})
