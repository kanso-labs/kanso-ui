import * as stylex from '@stylexjs/stylex'
import { act, fireEvent, render, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import Popover from '.'
import { colors, radii, typography } from '../../tokens/design.tokens.stylex'
import Button from '../button'

// StyleX hashes an atomic class from the property and value, so the same
// declaration written here produces the same class the component produces.
// Asserting on class membership pins which role each part reaches for without
// depending on the browser having applied a rule these tests are the first
// thing to use — see chip/index.test.tsx for the flake behind this.
const probeStyles = stylex.create({
  body: { fontSize: typography.bodyMediumSize },
  corner: { borderRadius: radii.md },
  subhead: { fontSize: typography.titleSmallSize },
  supporting: { color: colors.onSurfaceVariant },
  surface: { backgroundColor: colors.surfaceContainer },
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
  body: classesOf(stylex.props(probeStyles.body)),
  corner: classesOf(stylex.props(probeStyles.corner)),
  subhead: classesOf(stylex.props(probeStyles.subhead)),
  supporting: classesOf(stylex.props(probeStyles.supporting)),
  surface: classesOf(stylex.props(probeStyles.surface)),
}

// The gap `Popover.Content` puts between the anchor and the panel when the
// call site names none.
const DEFAULT_SIDE_OFFSET = 8

/**
 * Focus as a keyboard brings it, which is what React Aria reads to decide a
 * keyboard is in use.
 */
function focusByKeyboard(element: HTMLElement) {
  fireEvent.keyDown(document.body, { key: 'Tab' })
  act(() => {
    element.focus()
  })
}

function hasClasses(element: Element, classes: string[]) {
  return classes.every((name) => element.classList.contains(name))
}

/** The same popover, opened by a pointer resting on its trigger. */
function hovered(props: Partial<Parameters<typeof Popover>[0]> = {}) {
  const view = render(
    <Popover trigger="hover" {...props}>
      <Button>Open</Button>
      <Popover.Content>
        <Popover.Title>Headline</Popover.Title>
        <Popover.Description>Supporting line</Popover.Description>
        <Button>Action</Button>
      </Popover.Content>
    </Popover>,
  )
  return { ...view, trigger: view.getByRole('button', { name: 'Open' }) }
}

/**
 * Opens a pressed popover the way a keyboard does: the trigger focused, then
 * Enter, which React Aria answers on the key's release.
 */
async function openByKeyboard(view: ReturnType<typeof render>) {
  const trigger = view.getByRole('button', { name: 'Open' })
  focusByKeyboard(trigger)
  fireEvent.keyDown(trigger, { key: 'Enter' })
  fireEvent.keyUp(trigger, { key: 'Enter' })
  await view.findByRole('dialog')
  // The panel takes focus in an effect after it mounts.
  await waitFor(() => {
    expect(view.getByRole('dialog').contains(document.activeElement)).toBe(true)
  })
}

/**
 * A pressed popover between two buttons of the page, which is what Tab
 * leaving the panel has to land on.
 */
function pageAround(props: Partial<Parameters<typeof Popover>[0]> = {}) {
  return render(
    <>
      <Button>Before</Button>
      <Popover {...props}>
        <Button>Open</Button>
        <Popover.Content>
          <Popover.Title>Headline</Popover.Title>
          <Button>Action</Button>
        </Popover.Content>
      </Popover>
      <Button>After</Button>
    </>,
  )
}

/**
 * The positioned panel around the element with the dialog role. React Aria
 * places, sizes and marks the panel; the dialog inside it carries the role
 * and the name.
 */
function panelOf(dialog: HTMLElement) {
  const panel = dialog.parentElement
  if (!panel) {
    throw new Error('expected the dialog to sit inside its panel')
  }
  return panel
}

function setup(props: Partial<Parameters<typeof Popover>[0]> = {}) {
  return render(
    <Popover defaultOpen {...props}>
      <Button>Open</Button>
      <Popover.Content>
        <Popover.Title>Headline</Popover.Title>
        <Popover.Description>Supporting line</Popover.Description>
        <Button slot="close">Close</Button>
      </Popover.Content>
    </Popover>,
  )
}

/** The panel's tabbable controls, in order. */
function tabbablesIn(dialog: HTMLElement) {
  return [
    ...dialog.parentElement!.querySelectorAll<HTMLElement>(
      'button:not([tabindex="-1"]), [tabindex="0"]',
    ),
  ]
}

/**
 * Tab from `element`. What a browser does with the key is its own default
 * action, which a dispatched event never runs — so the tests start from the
 * edge of the panel, where the step out of it is React Aria's to take, and
 * that is what they pin.
 */
function tabFrom(element: Element, shiftKey = false) {
  act(() => {
    if (element instanceof HTMLElement) {
      element.focus()
    }
  })
  fireEvent.keyDown(element, { key: 'Tab', shiftKey })
}

describe('popover', () => {
  describe('semantics', () => {
    // The roles are the reason this wraps React Aria rather than styling a
    // positioned <div>: a dialog announces itself and hands focus back to
    // whatever opened it, and a div does neither.
    it('renders a dialog named by its title', () => {
      const view = setup()

      expect(view.getByRole('dialog').getAttribute('aria-labelledby')).toBe(
        view.getByText('Headline').id,
      )
    })

    it('points the dialog at its description', () => {
      const view = setup()

      expect(view.getByRole('dialog').getAttribute('aria-describedby')).toBe(
        view.getByText('Supporting line').id,
      )
    })

    it('renders nothing until it is open', () => {
      const view = render(
        <Popover>
          <Button>Open</Button>
          <Popover.Content>
            <Popover.Title>Headline</Popover.Title>
          </Popover.Content>
        </Popover>,
      )

      expect(view.queryByRole('dialog')).toBeNull()
    })

    it('opens from its trigger', async () => {
      const view = render(
        <Popover>
          <Button>Open</Button>
          <Popover.Content>
            <Popover.Title>Headline</Popover.Title>
          </Popover.Content>
        </Popover>,
      )
      fireEvent.click(view.getByRole('button', { name: 'Open' }))

      await waitFor(() => {
        expect(view.getByRole('dialog')).not.toBeNull()
      })
    })

    // Non-modal is the whole difference from Sheet: the page behind stays
    // reachable while the panel is up. A modal popover makes the rest of the
    // page inert — everything but itself — which is what the case below
    // looks for on an element outside it, and what proves this one can find
    // it rather than never finding anything.
    it('leaves the page interactive', () => {
      const view = render(
        <>
          <p>Outside</p>
          <Popover defaultOpen>
            <Button>Open</Button>
            <Popover.Content>
              <Popover.Title>Headline</Popover.Title>
            </Popover.Content>
          </Popover>
        </>,
      )

      expect(
        view.getByText('Outside').closest('[aria-hidden="true"]'),
      ).toBeNull()
    })

    it('makes the page inert when asked to be modal', () => {
      const view = render(
        <>
          <p>Outside</p>
          <Popover defaultOpen modal>
            <Button>Open</Button>
            <Popover.Content>
              <Popover.Title>Headline</Popover.Title>
            </Popover.Content>
          </Popover>
        </>,
      )

      expect(view.getByText('Outside').closest('[inert]')).not.toBeNull()
    })
  })

  describe('dismissal', () => {
    it('closes from a slot="close" button', async () => {
      const view = setup()
      fireEvent.click(view.getByRole('button', { name: 'Close' }))

      await waitFor(() => {
        expect(view.queryByRole('dialog')).toBeNull()
      })
    })

    it('closes on Escape', async () => {
      const view = setup()
      fireEvent.keyDown(view.getByRole('dialog'), { key: 'Escape' })

      await waitFor(() => {
        expect(view.queryByRole('dialog')).toBeNull()
      })
    })

    // Controlled means the call site owns the state: closing reports it and
    // nothing moves until the prop comes back different.
    it('does not close on its own when controlled', async () => {
      const onOpenChange = vi.fn<() => void>()
      const view = setup({ isOpen: true, onOpenChange })

      fireEvent.click(view.getByRole('button', { name: 'Close' }))
      await waitFor(() => {
        expect(onOpenChange).toHaveBeenCalledTimes(1)
      })
      expect(view.getByRole('dialog')).not.toBeNull()
    })
  })

  describe('appearance', () => {
    it('draws the panel on the surface container role', () => {
      const view = setup()
      const panel = panelOf(view.getByRole('dialog'))

      expect(hasClasses(panel, CLASSES.surface)).toBe(true)
      expect(hasClasses(panel, CLASSES.corner)).toBe(true)
    })

    // The rich tooltip's two lines of type: a title-small subhead over
    // body-medium supporting text, both on surface variant.
    it('sets the title as the subhead and the description as supporting text', () => {
      const view = setup()
      const title = view.getByText('Headline')
      const description = view.getByText('Supporting line')

      expect(hasClasses(title, CLASSES.subhead)).toBe(true)
      expect(hasClasses(title, CLASSES.supporting)).toBe(true)
      expect(hasClasses(description, CLASSES.body)).toBe(true)
      expect(hasClasses(description, CLASSES.supporting)).toBe(true)
      expect(hasClasses(description, CLASSES.subhead)).toBe(false)
    })

    // The rich tooltip's inset, read as the browser resolved it, since a
    // padding is a number rather than a role.
    it('insets the panel 12 above, 8 below and 16 at the sides', () => {
      const view = setup()
      const panel = getComputedStyle(panelOf(view.getByRole('dialog')))

      expect(panel.paddingTop).toBe('12px')
      expect(panel.paddingBottom).toBe('8px')
      expect(panel.paddingLeft).toBe('16px')
      expect(panel.paddingRight).toBe('16px')
    })

    // Both sizes have to carry a width of their own, or `styles[size]`
    // resolves to nothing and the panel is free to run the width of the page.
    it.each([
      ['md', '320px'],
      ['sm', '240px'],
    ] as const)('caps the %s panel at %s', (size, width) => {
      const view = setup({ size })

      expect(
        getComputedStyle(panelOf(view.getByRole('dialog'))).maxInlineSize,
      ).toBe(width)
    })

    // React Aria measures the room left between the anchor and the edge of
    // the viewport and sets it as the panel's max height, so a tall panel
    // scrolls rather than running off the screen. Proving the measurement
    // arrives at all is what this is after.
    it('never asks for more room than the anchor leaves it', async () => {
      const view = setup()

      await waitFor(() => {
        expect(panelOf(view.getByRole('dialog')).style.maxHeight).not.toBe('')
      })
    })
  })

  // The tooltips page's rich tooltip: a panel that opens from a pointer
  // resting on the trigger and may hold buttons and links, which is what
  // separates it from the plain tooltip.
  //
  // The hovering itself is not reachable from here. React Aria's preview
  // state opens through its own hover and warm-up machinery, which a
  // synthetic pointer event does not drive and a faked clock does not
  // advance — the trigger takes its hover state and the panel never opens.
  // What a real pointer does is in the pull request's test plan; what is
  // left here is everything around it.
  describe('hover trigger', () => {
    it('renders nothing until it is open', () => {
      const view = hovered()
      expect(view.queryByRole('dialog')).toBeNull()
      expect(view.trigger).not.toBeNull()
    })

    it('is named by its title and described by its description', () => {
      const view = hovered({ defaultOpen: true })
      const dialog = view.getByRole('dialog')

      expect(dialog.getAttribute('aria-labelledby')).toBe(
        view.getByText('Headline').id,
      )
      expect(dialog.getAttribute('aria-describedby')).toBe(
        view.getByText('Supporting line').id,
      )
    })

    // The rich tooltip's whole point: the panel may hold something to press,
    // which a plain tooltip may not.
    it('holds interactive content', () => {
      const view = hovered({ defaultOpen: true })
      expect(view.getByRole('button', { name: 'Action' })).not.toBeNull()
    })

    // A hovered panel is always non-modal: one that blocked the page while
    // the pointer merely rested on something would be a trap.
    it('leaves the page interactive, whatever modal asks for', () => {
      hovered({ defaultOpen: true, modal: true })
      expect(document.body.getAttribute('aria-hidden')).toBeNull()
    })

    it('is controlled by isOpen', async () => {
      const view = hovered({ isOpen: true })
      expect(view.getByRole('dialog')).not.toBeNull()

      view.rerender(
        <Popover isOpen={false} trigger="hover">
          <Button>Open</Button>
          <Popover.Content>
            <Popover.Title>Headline</Popover.Title>
          </Popover.Content>
        </Popover>,
      )
      await waitFor(() => {
        expect(view.queryByRole('dialog')).toBeNull()
      })
    })

    // A pressed popover is the default, and the new prop does not change it.
    it('leaves a pressed popover opening on press', async () => {
      const view = render(
        <Popover>
          <Button>Open</Button>
          <Popover.Content>
            <Popover.Title>Headline</Popover.Title>
          </Popover.Content>
        </Popover>,
      )
      fireEvent.click(view.getByRole('button', { name: 'Open' }))
      expect(await view.findByRole('dialog')).not.toBeNull()
    })
  })

  // The page behind a non-modal popover stays in reach, which includes the
  // keyboard. The panel once nested React Aria's Dialog, which moves focus
  // into itself as it mounts and holds it inside the overlay: a hover took
  // focus from wherever the reader was typing, and Tab went round the panel
  // forever.
  describe('focus', () => {
    it('leaves focus where it was when a hover popover opens', async () => {
      const view = render(
        <>
          <input aria-label="Field" />
          <Popover delay={0} trigger="hover">
            <Button>Open</Button>
            <Popover.Content>
              <Popover.Title>Headline</Popover.Title>
              <Button>Action</Button>
            </Popover.Content>
          </Popover>
        </>,
      )
      const field = view.getByRole('textbox', { name: 'Field' })
      // A pointer's press, as clicking into the field would be, which is
      // what React Aria reads to treat what follows as a pointer's hover.
      fireEvent.pointerDown(field, { pointerType: 'mouse' })
      fireEvent.pointerUp(field, { pointerType: 'mouse' })
      act(() => {
        field.focus()
      })
      fireEvent.pointerOver(view.getByRole('button', { name: 'Open' }), {
        pointerType: 'mouse',
      })
      await view.findByRole('dialog')

      await waitFor(() => {
        expect(document.activeElement).toBe(field)
      })
    })

    it('leaves focus on a hover trigger reached by the keyboard', async () => {
      const view = render(
        <Popover delay={0} trigger="hover">
          <Button>Open</Button>
          <Popover.Content>
            <Popover.Title>Headline</Popover.Title>
            <Button>Action</Button>
          </Popover.Content>
        </Popover>,
      )
      const trigger = view.getByRole('button', { name: 'Open' })
      focusByKeyboard(trigger)
      await view.findByRole('dialog')

      await waitFor(() => {
        expect(document.activeElement).toBe(trigger)
      })
    })

    // A press asked for the panel, so it still takes focus as it opens.
    it('moves focus into a pressed popover as it opens', async () => {
      const view = pageAround()
      await openByKeyboard(view)

      expect(view.getByRole('dialog').contains(document.activeElement)).toBe(
        true,
      )
    })

    it('carries Tab on from the trigger past the last control', async () => {
      const view = pageAround()
      await openByKeyboard(view)
      const last = tabbablesIn(view.getByRole('dialog')).at(-1)
      expect(last).toBeDefined()

      tabFrom(last!)

      expect(document.activeElement).toBe(
        view.getByRole('button', { name: 'After' }),
      )
    })

    it('carries Shift+Tab back past the trigger from the first control', async () => {
      const view = pageAround()
      await openByKeyboard(view)

      tabFrom(view.getByRole('button', { name: 'Action' }), true)

      expect(document.activeElement).toBe(
        view.getByRole('button', { name: 'Before' }),
      )
    })

    // Modal is the one form that holds focus, as a dialog does.
    it('holds focus inside a modal popover', async () => {
      const view = pageAround({ modal: true })
      await openByKeyboard(view)
      const dialog = view.getByRole('dialog')
      const last = tabbablesIn(dialog).at(-1)
      expect(last).toBeDefined()

      tabFrom(last!)

      expect(dialog.parentElement!.contains(document.activeElement)).toBe(true)
    })

    it('is named by its trigger when it has no title', async () => {
      const view = render(
        <Popover defaultOpen>
          <Button>Open</Button>
          <Popover.Content>
            <Button>Action</Button>
          </Popover.Content>
        </Popover>,
      )
      const dialog = await view.findByRole('dialog')
      expect(dialog.getAttribute('aria-labelledby')).toBe(
        view.getByRole('button', { name: 'Open' }).id,
      )
    })
  })

  describe('placement', () => {
    it('opens below its anchor by default', async () => {
      const view = setup()

      await waitFor(() => {
        expect(
          panelOf(view.getByRole('dialog')).getAttribute('data-placement'),
        ).toBe('bottom')
      })
    })

    it('takes the side it is given', async () => {
      const view = render(
        <Popover defaultOpen>
          <Button>Open</Button>
          <Popover.Content side="right">
            <Popover.Title>Headline</Popover.Title>
          </Popover.Content>
        </Popover>,
      )

      await waitFor(() => {
        expect(
          panelOf(view.getByRole('dialog')).getAttribute('data-placement'),
        ).toBe('right')
      })
    })

    // The gap is this component's decision rather than an inherited one, so
    // it is pinned here whatever React Aria's own default happens to be.
    it('leaves a gap between the anchor and the panel', async () => {
      const view = setup()
      const trigger = view.getByRole('button', { name: 'Open' })

      await waitFor(() => {
        const gap =
          panelOf(view.getByRole('dialog')).getBoundingClientRect().top -
          trigger.getBoundingClientRect().bottom

        expect(Math.round(gap)).toBe(DEFAULT_SIDE_OFFSET)
      })
    })

    it('lets the call site widen that gap', async () => {
      const view = render(
        <Popover defaultOpen>
          <Button>Open</Button>
          <Popover.Content sideOffset={24}>
            <Popover.Title>Headline</Popover.Title>
          </Popover.Content>
        </Popover>,
      )
      const trigger = view.getByRole('button', { name: 'Open' })

      await waitFor(() => {
        const gap =
          panelOf(view.getByRole('dialog')).getBoundingClientRect().top -
          trigger.getBoundingClientRect().bottom

        expect(Math.round(gap)).toBe(24)
      })
    })
  })
})
