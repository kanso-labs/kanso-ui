import * as stylex from '@stylexjs/stylex'
import { act, fireEvent, render, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { userEvent } from 'vitest/browser'

import Select from '.'
import { atFootOfWindow, originOf } from '../../styles/overlay.testing'
import {
  colors,
  motion,
  stateLayerOpacity,
  typography,
} from '../../tokens/design.tokens.stylex'
import Button from '../button'
import Dialog from '../dialog'
import ListBox from '../list-box'

// StyleX hashes an atomic class from the property and value, so the same
// declaration written here produces the same class the component produces.
// Asserting on class membership pins which role each part reaches for without
// depending on the browser having applied a rule these tests are the first
// thing to use — see chip/index.test.tsx for the flake behind this.
const probeStyles = stylex.create({
  disabledIcon: {
    color: `color-mix(in srgb, ${colors.onSurface} calc(${stateLayerOpacity.disabledContent} * 100%), ${colors.surface})`,
  },
  error: { color: colors.error },
  floated: { fontSize: typography.bodySmallSize },
  // The label's colour while the field is focused.
  focusedLabel: { color: colors.primary },
  // The focused indicator, in each variant: the filled box's 2dp underline
  // and the outlined box's primary outline.
  focusedOutline: { color: colors.primary },
  focusedUnderline: { boxShadow: `inset 0 -2px 0 0 ${colors.primary}` },
  // The muted role, which the placeholder and the leading icon both take.
  muted: { color: colors.onSurfaceVariant },
  // The curve the rest of the library turns a chevron on, read back through
  // the browser so the assertion pins the role rather than the cubic-bezier
  // it currently resolves to.
  standardEasing: { transitionTimingFunction: motion.easingStandard },
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
  disabledIcon: classesOf(stylex.props(probeStyles.disabledIcon)),
  error: classesOf(stylex.props(probeStyles.error)),
  floated: classesOf(stylex.props(probeStyles.floated)),
  focusedLabel: classesOf(stylex.props(probeStyles.focusedLabel)),
  focusedOutline: classesOf(stylex.props(probeStyles.focusedOutline)),
  focusedUnderline: classesOf(stylex.props(probeStyles.focusedUnderline)),
  muted: classesOf(stylex.props(probeStyles.muted)),
}

const OPTIONS = (
  <>
    <ListBox.Item id="first">First item</ListBox.Item>
    <ListBox.Item id="second">Second item</ListBox.Item>
    <ListBox.Item id="third">Third item</ListBox.Item>
  </>
)

// Sized in `em`, so it takes the slot's 24.
const ICON = <svg data-testid="icon" style={{ height: '1em', width: '1em' }} />

function hasClasses(element: Element, classes: string[]) {
  return classes.every((name) => element.classList.contains(name))
}

// The field fills what it is given, and React Aria clamps a popover to the
// viewport — so a field as wide as the runner's window would open a list
// narrower than itself for reasons that are the window's rather than the
// component's. A fixed width keeps the two comparable.
const WIDTH = { width: '320px' }

/** The box the field draws, which the press target and the icons sit in. */
function boxOf(view: ReturnType<typeof render>) {
  const box = view.container.querySelector('[role="group"]')
  if (!(box instanceof HTMLElement)) {
    throw new Error('expected the field to draw a box')
  }
  return box
}

// How far the chevron's middle sits from the box's, in a field of one
// variant.
function chevronOffCentre(variant: 'filled' | 'outlined') {
  const view = setup({ variant })
  const box = view.container.querySelector('[role="group"]')
  if (box === null) {
    throw new Error('expected the field to draw a box')
  }
  const outer = box.getBoundingClientRect()
  const glyph = glyphOf(view).getBoundingClientRect()
  view.unmount()
  return glyph.top + glyph.height / 2 - (outer.top + outer.height / 2)
}

// The chevron is the only svg either field draws. Narrowed here rather than
// asserted at the call site, so a field that failed to draw one fails with
// that sentence instead of further down on a null.
function glyphOf(view: ReturnType<typeof render>) {
  const glyph = view.container.querySelector('svg')
  if (glyph === null) {
    throw new Error('expected the field to draw a chevron')
  }
  return glyph
}

function setup(
  props: Partial<Parameters<typeof Select<object>>[0]> = {},
  container?: HTMLElement,
) {
  const view = render(
    <div style={WIDTH}>
      <Select label="Label" options={OPTIONS} {...props} />
    </div>,
    { baseElement: document.body, container },
  )
  return { ...view, trigger: view.getByRole('button', { name: /Label/ }) }
}

/** The surface the list opens on, once it has opened. */
async function surfaceOf(view: ReturnType<typeof render>) {
  const list = await view.findByRole('listbox')
  if (list.parentElement === null) {
    throw new Error('expected the list to sit on a surface')
  }
  return list.parentElement
}

/** The element React Aria draws the value in, styled by the field chrome. */
function valueOf(view: ReturnType<typeof render>) {
  // The label and the value share a column, the value last. Found through
  // the label rather than by position in the box, which a leading icon
  // shifts by one.
  const value = view.getByText('Label').parentElement?.lastElementChild
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

  // The whole box opens the list, which only holds while the press target
  // is what a pointer lands on. Every test here presses at real coordinates:
  // a click dispatched on the button itself skips hit testing, which is how
  // a box whose column covered the button passed every test above.
  describe('pressing the box', () => {
    it('puts the press target under every point across the box', () => {
      const { trigger } = setup()
      const box = trigger.getBoundingClientRect()
      for (const fraction of [0.05, 0.25, 0.5, 0.75, 0.95]) {
        const hit = document.elementFromPoint(
          box.left + box.width * fraction,
          box.top + box.height / 2,
        )
        expect(hit === trigger || trigger.contains(hit)).toBe(true)
      }
    })

    // Forced, so the pointer goes down wherever the label is drawn and the
    // press lands on whatever is on top there, rather than Playwright first
    // checking the label is what it would hit.
    it('opens the list from a press on the label', async () => {
      const view = setup()
      await userEvent.click(view.getByText('Label'), { force: true })
      await waitFor(() => {
        expect(view.getByRole('listbox')).not.toBeNull()
      })
      expect(view.trigger.getAttribute('aria-expanded')).toBe('true')
    })

    it('opens the list inside a dialog and leaves the dialog open', async () => {
      const view = render(
        <Dialog defaultOpen>
          <Button>Open</Button>
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title>Headline</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              <Select label="Label" options={OPTIONS} />
            </Dialog.Body>
          </Dialog.Content>
        </Dialog>,
      )
      const label = await view.findByText('Label')
      await userEvent.click(label, { force: true })
      await waitFor(() => {
        expect(view.getByRole('listbox')).not.toBeNull()
      })
      expect(view.getByRole('dialog', { name: 'Headline' })).not.toBeNull()
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
      expect(valueOf(view).textContent).toBe('Second item')
    })

    // The value is what the option is worth as text, which React Aria reads
    // off an option's children. An option here always wraps its headline in
    // the row, so ListBox.Item passes a plain-string headline through as the
    // option's text value; without that the field showed nothing at all.
    it('keeps its own choice from defaultValue', () => {
      const view = setup({ defaultValue: 'third' })
      expect(valueOf(view).textContent).toBe('Third item')
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

    // Opening the list moves focus into it, on an overlay outside the box,
    // so the box's `:focus-within` lets go. The box stays focused anyway,
    // which is what keeps the label from falling back onto the placeholder
    // the select still shows.
    it('stays floated and focused while the list is open', async () => {
      const view = setup()
      const label = view.getByText('Label')
      expect(hasClasses(label, CLASSES.floated)).toBe(false)
      expect(hasClasses(boxOf(view), CLASSES.focusedUnderline)).toBe(false)

      await userEvent.click(label, { force: true })
      await view.findByRole('listbox')

      expect(view.trigger.contains(document.activeElement)).toBe(false)
      expect(hasClasses(label, CLASSES.floated)).toBe(true)
      expect(hasClasses(label, CLASSES.focusedLabel)).toBe(true)
      expect(hasClasses(boxOf(view), CLASSES.focusedUnderline)).toBe(true)
    })

    it('keeps an outlined box focused while the list is open', async () => {
      const view = setup({ variant: 'outlined' })
      expect(hasClasses(boxOf(view), CLASSES.focusedOutline)).toBe(false)

      fireEvent.keyDown(view.trigger, { key: 'ArrowDown' })
      await view.findByRole('listbox')

      // The outline's notch repeats the label, hidden, to cut the outline
      // to its width; the label drawn is the one outside it.
      const label = view
        .getAllByText('Label')
        .find((element) => element.closest('legend') === null)
      expect(label && hasClasses(label, CLASSES.floated)).toBe(true)
      expect(hasClasses(boxOf(view), CLASSES.focusedOutline)).toBe(true)
    })

    it('lets go of the focused state once the list closes', async () => {
      const view = setup()
      await userEvent.click(view.getByText('Label'), { force: true })
      await view.findByRole('listbox')

      fireEvent.click(view.getByRole('option', { name: 'Second item' }))
      await waitFor(() => {
        expect(view.queryByRole('listbox')).toBeNull()
      })
      act(() => {
        view.trigger.blur()
      })

      expect(hasClasses(boxOf(view), CLASSES.focusedUnderline)).toBe(false)
    })
  })

  describe('appearance', () => {
    // With no floating label there is nothing for the placeholder to hide
    // behind, so it shows in the muted role from the start.
    it('draws the placeholder in the muted role', () => {
      const view = setup({ floatingLabel: false, placeholder: 'Pick one' })
      expect(hasClasses(valueOf(view), CLASSES.muted)).toBe(true)
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

    // The chevron is the field's trailing icon, centred in the box whichever
    // box it is: the filled one's 8 above the label and nothing below, or
    // the outlined one's 16 above and below the value.
    it('centres the chevron in the box, filled or outlined', () => {
      expect({
        filled: chevronOffCentre('filled'),
        outlined: chevronOffCentre('outlined'),
      }).toEqual({ filled: 0, outlined: 0 })
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

    // The list grows out of the field, from the edge it is anchored by:
    // down from its top edge under the field, and up from its bottom edge
    // when there is no room under the field and React Aria opens it above.
    it('grows the list down from its top edge under the field', async () => {
      const view = setup()

      fireEvent.click(view.trigger)
      const surface = await surfaceOf(view)

      expect(surface.getAttribute('data-placement')).toBe('bottom')
      expect(originOf(surface).y).toBeCloseTo(0)
    })

    it('grows the list up from its bottom edge above the field', async () => {
      const view = setup({}, atFootOfWindow())

      fireEvent.click(view.trigger)
      const surface = await surfaceOf(view)

      expect(surface.getAttribute('data-placement')).toBe('top')
      expect(originOf(surface).y).toBeCloseTo(1)
    })
  })
  // The turn is drawn from the motion tokens rather than written as literals,
  // which is what lets an app retime it: redeclaring
  // `--kui-motion-duration-short3` is the documented way to do that from
  // outside the StyleX toolchain, and a hard-coded duration ignores it.
  // The page's 24dp leading icon, in the slot every field draws: 12 from the
  // box's edge, with the label and the value moved past it.
  describe('the leading icon', () => {
    it('draws the icon 12 from the edge and moves the label and the value past it', () => {
      const view = setup({ defaultValue: 'second', leadingIcon: ICON })
      const box = boxOf(view).getBoundingClientRect()
      const icon = view.getByTestId('icon').getBoundingClientRect()

      expect(icon.width).toBe(24)
      expect(icon.left - box.left).toBe(12)
      expect(
        view.getByText('Label').getBoundingClientRect().left - box.left,
      ).toBe(52)
      expect(valueOf(view).getBoundingClientRect().left - box.left).toBe(52)
      expect(valueOf(view).textContent).toBe('Second item')
    })

    // The error goes to the label and the underline, and the page leaves
    // the leading icon in the muted role through it.
    it('draws the icon in the muted role, with or without an error', () => {
      for (const error of [undefined, 'Choose an item']) {
        const view = setup({ error, leadingIcon: ICON })
        const slot = view.getByTestId('icon').parentElement

        if (!(slot instanceof HTMLElement)) {
          throw new Error('expected the icon to sit in its slot')
        }
        expect(hasClasses(slot, CLASSES.muted)).toBe(true)
        expect(hasClasses(slot, CLASSES.error)).toBe(false)
        view.unmount()
      }
    })

    // React Aria's Select hands the box no disabled state, so the icon dims
    // only because the field passes it on — see the box in the component.
    it('dims the icon while disabled', () => {
      const view = setup({ isDisabled: true, leadingIcon: ICON })
      const slot = view.getByTestId('icon').parentElement

      if (!(slot instanceof HTMLElement)) {
        throw new Error('expected the icon to sit in its slot')
      }
      expect(hasClasses(slot, CLASSES.disabledIcon)).toBe(true)
    })

    // The press target is drawn over the icon, so a press on the icon opens
    // the list like one anywhere else in the box.
    it('opens the list from a press on the icon', () => {
      const view = setup({ leadingIcon: ICON })
      const icon = view.getByTestId('icon').getBoundingClientRect()
      const hit = document.elementFromPoint(
        icon.left + icon.width / 2,
        icon.top + icon.height / 2,
      )

      expect(hit !== null && view.trigger.contains(hit)).toBe(true)
    })
  })

  describe('the turn', () => {
    // On the document element rather than on a wrapper: StyleX compiles a
    // token into a variable of its own, declared once at the root as the
    // `--kui-*` custom property with its default as the fallback. Resolving
    // there is why an app sets these at the root too, and why setting one
    // further down reaches nothing.
    it('follows an override of the motion duration token', () => {
      const root = document.documentElement
      root.style.setProperty('--kui-motion-duration-short3', '640ms')

      try {
        const view = render(
          <div style={WIDTH}>
            <Select label="Label" options={OPTIONS} />
          </div>,
        )

        expect(getComputedStyle(glyphOf(view)).transitionDuration).toBe('0.64s')
      } finally {
        root.style.removeProperty('--kui-motion-duration-short3')
      }
    })

    // Named rather than left to fall to the CSS initial value, which is
    // `ease` — not the curve every other chevron here turns on.
    it('turns on the standard easing', () => {
      const probe = render(
        <div {...stylex.props(probeStyles.standardEasing)} />,
      )
      const swatch = probe.container.firstElementChild
      if (swatch === null) {
        throw new Error('expected the probe to render an element')
      }
      const expected = getComputedStyle(swatch).transitionTimingFunction
      probe.unmount()

      const view = render(
        <div style={WIDTH}>
          <Select label="Label" options={OPTIONS} />
        </div>,
      )

      expect(getComputedStyle(glyphOf(view)).transitionTimingFunction).toBe(
        expected,
      )
    })
  })
})
