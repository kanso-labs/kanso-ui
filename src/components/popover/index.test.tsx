import * as stylex from '@stylexjs/stylex'
import { fireEvent, render, waitFor } from '@testing-library/react'
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
