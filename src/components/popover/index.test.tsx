import * as stylex from '@stylexjs/stylex'
import { fireEvent, render, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import Popover from '.'
import { colors, radii } from '../../tokens/design.tokens.stylex'

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

/**
 * What Base UI lays over the page for a modal popover, or null for the
 * non-modal default: a fixed, full-inset element inside the same portal root
 * as the panel. `data-base-ui-inert` alone is not enough to look for, since
 * the same attribute marks the content the panel was opened from.
 */
function blockingLayer(dialog: Element) {
  const portalRoot = dialog.parentElement?.parentElement

  return portalRoot?.querySelector(':scope > [data-base-ui-inert]') ?? null
}

function hasClasses(element: Element, classes: string[]) {
  return classes.every((name) => element.classList.contains(name))
}

function setup(props: Partial<Parameters<typeof Popover>[0]> = {}) {
  return render(
    <Popover defaultOpen {...props}>
      <Popover.Trigger>Open</Popover.Trigger>
      <Popover.Content>
        <Popover.Title>Headline</Popover.Title>
        <Popover.Description>Supporting line</Popover.Description>
        <Popover.Close>Dismiss</Popover.Close>
      </Popover.Content>
    </Popover>,
  )
}

describe('popover', () => {
  describe('semantics', () => {
    // The roles are the reason this wraps Base UI rather than styling a
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
          <Popover.Trigger>Open</Popover.Trigger>
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
          <Popover.Trigger>Open</Popover.Trigger>
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
    // clickable while the panel is up. The case below is what proves this can
    // report a layer rather than never finding one.
    it('leaves the page interactive', () => {
      const view = setup()

      expect(blockingLayer(view.getByRole('dialog'))).toBeNull()
    })

    it('blocks it when asked to be modal', () => {
      const view = setup({ modal: true })

      expect(blockingLayer(view.getByRole('dialog'))).not.toBeNull()
    })
  })

  describe('dismissal', () => {
    it('closes from Popover.Close', async () => {
      const view = setup()
      fireEvent.click(view.getByRole('button', { name: 'Dismiss' }))

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
      const view = setup({ onOpenChange, open: true })

      fireEvent.click(view.getByRole('button', { name: 'Dismiss' }))
      await waitFor(() => {
        expect(onOpenChange).toHaveBeenCalledTimes(1)
      })
      expect(view.getByRole('dialog')).not.toBeNull()
    })
  })

  describe('appearance', () => {
    it('draws the panel on the surface container role', () => {
      const view = setup()
      const dialog = view.getByRole('dialog')

      expect(hasClasses(dialog, CLASSES.surface)).toBe(true)
      expect(hasClasses(dialog, CLASSES.corner)).toBe(true)
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

      expect(getComputedStyle(view.getByRole('dialog')).maxInlineSize).toBe(
        width,
      )
    })

    // The cap is `min()` against the room Base UI measured, so a panel wider
    // than the viewport is narrowed rather than clipped by it. Proving the
    // custom property arrives at all is what this is after — without it the
    // whole declaration is invalid and the panel has no cap.
    it('never asks for more room than the anchor leaves it', () => {
      const view = render(
        <Popover defaultOpen>
          <Popover.Trigger>Open</Popover.Trigger>
          <Popover.Content>
            <Popover.Title>Headline</Popover.Title>
          </Popover.Content>
        </Popover>,
      )
      const dialog = view.getByRole('dialog')

      expect(
        dialog.parentElement?.style.getPropertyValue('--available-width'),
      ).not.toBe('')
      expect(getComputedStyle(dialog).maxBlockSize).not.toBe('none')
    })
  })

  describe('placement', () => {
    it('opens below its anchor by default', async () => {
      const view = setup()

      await waitFor(() => {
        expect(view.getByRole('dialog').getAttribute('data-side')).toBe(
          'bottom',
        )
      })
    })

    it('takes the side it is given', async () => {
      const view = render(
        <Popover defaultOpen>
          <Popover.Trigger>Open</Popover.Trigger>
          <Popover.Content side="right">
            <Popover.Title>Headline</Popover.Title>
          </Popover.Content>
        </Popover>,
      )

      await waitFor(() => {
        expect(view.getByRole('dialog').getAttribute('data-side')).toBe('right')
      })
    })

    // Base UI's own default is 0, which leaves the panel touching the control
    // that opened it, so the gap is this component's decision rather than an
    // inherited one.
    it('leaves a gap between the anchor and the panel', async () => {
      const view = setup()
      const trigger = view.getByRole('button', { name: 'Open' })

      await waitFor(() => {
        const gap =
          view.getByRole('dialog').getBoundingClientRect().top -
          trigger.getBoundingClientRect().bottom

        expect(Math.round(gap)).toBe(DEFAULT_SIDE_OFFSET)
      })
    })

    it('lets the call site widen that gap', async () => {
      const view = render(
        <Popover defaultOpen>
          <Popover.Trigger>Open</Popover.Trigger>
          <Popover.Content sideOffset={24}>
            <Popover.Title>Headline</Popover.Title>
          </Popover.Content>
        </Popover>,
      )
      const trigger = view.getByRole('button', { name: 'Open' })

      await waitFor(() => {
        const gap =
          view.getByRole('dialog').getBoundingClientRect().top -
          trigger.getBoundingClientRect().bottom

        expect(Math.round(gap)).toBe(24)
      })
    })
  })
})
