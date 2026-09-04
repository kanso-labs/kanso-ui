import * as stylex from '@stylexjs/stylex'
import { fireEvent, render, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import Popover from '.'
import { colors, radii } from '../../tokens/design.tokens.stylex'
import Button from '../button'

// StyleX hashes an atomic class from the property and value, so the same
// declaration written here produces the same class the component produces.
// Asserting on class membership pins which role each part reaches for without
// depending on the browser having applied a rule these tests are the first
// thing to use — see chip/index.test.tsx for the flake behind this.
const probeStyles = stylex.create({
  corner: { borderRadius: radii.md },
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
  corner: classesOf(stylex.props(probeStyles.corner)),
  supporting: classesOf(stylex.props(probeStyles.supporting)),
  surface: classesOf(stylex.props(probeStyles.surface)),
}

// The gap `Popover.Content` puts between the anchor and the panel when the
// call site names none.
const DEFAULT_SIDE_OFFSET = 8

function hasClasses(element: Element, classes: string[]) {
  return classes.every((name) => element.classList.contains(name))
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

    it('sets the description apart from the title', () => {
      const view = setup()

      expect(
        hasClasses(view.getByText('Supporting line'), CLASSES.supporting),
      ).toBe(true)
      expect(hasClasses(view.getByText('Headline'), CLASSES.supporting)).toBe(
        false,
      )
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
