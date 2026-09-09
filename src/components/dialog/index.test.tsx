import * as stylex from '@stylexjs/stylex'
import { fireEvent, render, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { page } from 'vitest/browser'

import Dialog from '.'
import { colors } from '../../tokens/design.tokens.stylex'
import Button from '../button'
import IconButton from '../icon-button'

// StyleX hashes an atomic class from the property and value, so the same
// declaration written here produces the same class the component produces.
// Asserting on class membership pins which role each part reaches for without
// depending on the browser having applied a rule these tests are the first
// thing to use — see chip/index.test.tsx for the flake behind this.
const probeStyles = stylex.create({
  body: { color: colors.onSurfaceVariant },
  scrim: {
    backgroundColor: `color-mix(in srgb, ${colors.scrim} 32%, transparent)`,
  },
  surface: { backgroundColor: colors.surfaceContainerHigh },
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
  scrim: classesOf(stylex.props(probeStyles.scrim)),
  surface: classesOf(stylex.props(probeStyles.surface)),
}

// The runner's own viewport, restored after any test that changes it. It sits
// below the medium breakpoint by default, so a test that does not say
// otherwise is looking at the full-screen presentation.
const DEFAULT_VIEWPORT = {
  height: window.innerHeight,
  width: window.innerWidth,
}

/** The container around the element with the dialog role: what is sized and shaped. */
function containerOf(dialog: HTMLElement) {
  const container = dialog.parentElement
  if (!container) {
    throw new Error('expected the dialog to sit inside its container')
  }
  // Its entry scales it from 90%, so a box read while that is running is
  // nine tenths of the real one.
  for (const animation of container.getAnimations({ subtree: true })) {
    animation.finish()
  }
  return container
}

function hasClasses(element: Element, classes: string[]) {
  return classes.every((name) => element.classList.contains(name))
}

/** The four paddings as the browser resolved them. */
function paddingOf(element: HTMLElement) {
  const style = getComputedStyle(element)
  return {
    bottom: style.paddingBottom,
    left: style.paddingLeft,
    right: style.paddingRight,
    top: style.paddingTop,
  }
}

/** The header, body and footer, which are the three parts that carry padding. */
function partsOf(view: ReturnType<typeof render>) {
  const header = view.getByText('Headline').parentElement
  const body = view.getByText('Supporting line')
  const footer = view.getByRole('button', { name: 'Cancel' }).parentElement
  if (!(header instanceof HTMLElement) || !(footer instanceof HTMLElement)) {
    throw new Error('expected the dialog to hold a header and a footer')
  }
  return { body, footer, header }
}

/** The scrim the container sits on, which fills the window. */
function scrimOf(container: HTMLElement) {
  const scrim = container.parentElement
  if (scrim === null) {
    throw new Error('expected the container to sit on the scrim')
  }
  return scrim
}

function setup(props: Partial<Parameters<typeof Dialog>[0]> = {}) {
  return render(
    <Dialog defaultOpen {...props}>
      <Button>Open</Button>
      <Dialog.Content>
        <Dialog.Header>
          <Dialog.Title>Headline</Dialog.Title>
          <IconButton aria-label="Close" slot="close">
            ×
          </IconButton>
        </Dialog.Header>
        <Dialog.Body>Supporting line</Dialog.Body>
        <Dialog.Footer>
          <Button slot="close">Cancel</Button>
        </Dialog.Footer>
      </Dialog.Content>
    </Dialog>,
  )
}

describe('dialog', () => {
  describe('semantics', () => {
    it('renders a dialog named by its title', () => {
      const view = setup()
      const dialog = view.getByRole('dialog')
      expect(dialog.getAttribute('aria-labelledby')).toBe(
        view.getByText('Headline').id,
      )
    })

    it('renders nothing until it is open', () => {
      const view = render(
        <Dialog>
          <Button>Open</Button>
          <Dialog.Content>
            <Dialog.Title>Headline</Dialog.Title>
          </Dialog.Content>
        </Dialog>,
      )
      expect(view.queryByRole('dialog')).toBeNull()
      expect(view.getByRole('button', { name: 'Open' })).not.toBeNull()
    })

    it('opens from its trigger', async () => {
      const view = render(
        <Dialog>
          <Button>Open</Button>
          <Dialog.Content>
            <Dialog.Title>Headline</Dialog.Title>
          </Dialog.Content>
        </Dialog>,
      )
      fireEvent.click(view.getByRole('button', { name: 'Open' }))
      await waitFor(() => {
        expect(view.getByRole('dialog')).not.toBeNull()
      })
    })

    // An alert dialog interrupts with something to answer, and a screen
    // reader announces it rather than waiting to be asked.
    it('takes the alert dialog role when asked', () => {
      const view = render(
        <Dialog defaultOpen>
          <Dialog.Content role="alertdialog">
            <Dialog.Title>Headline</Dialog.Title>
          </Dialog.Content>
        </Dialog>,
      )
      expect(view.getByRole('alertdialog')).not.toBeNull()
      expect(view.queryByRole('dialog')).toBeNull()
    })
  })

  describe('dismissal', () => {
    it('closes from any slot="close" button, wherever it sits', async () => {
      const view = setup()
      fireEvent.click(view.getByRole('button', { name: 'Cancel' }))
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

    it('does not close on its own when controlled', async () => {
      const onOpenChange = vi.fn<(open: boolean) => void>()
      const view = setup({ isOpen: true, onOpenChange })
      fireEvent.click(view.getByRole('button', { name: 'Cancel' }))
      await waitFor(() => {
        expect(onOpenChange).toHaveBeenCalledWith(false)
      })
      expect(view.getByRole('dialog')).not.toBeNull()
    })
  })

  describe('appearance', () => {
    it('draws the container on the surface container high role', () => {
      const view = setup()
      expect(
        hasClasses(containerOf(view.getByRole('dialog')), CLASSES.surface),
      ).toBe(true)
    })

    it('lays a scrim behind the container', () => {
      const view = setup()
      const scrim = scrimOf(containerOf(view.getByRole('dialog')))
      expect(hasClasses(scrim, CLASSES.scrim)).toBe(true)
    })

    it('sets the supporting text in the on surface variant role', () => {
      const view = setup()
      expect(hasClasses(view.getByText('Supporting line'), CLASSES.body)).toBe(
        true,
      )
    })
  })

  describe('presentation', () => {
    afterEach(async () => {
      await page.viewport(DEFAULT_VIEWPORT.width, DEFAULT_VIEWPORT.height)
    })

    // The page's basic dialog: a 28dp corner, between 280 and 560 wide,
    // centred over the scrim with 24 of room around it.
    it('is a basic dialog above the medium breakpoint', async () => {
      await page.viewport(1024, 768)
      const view = setup()
      const container = containerOf(view.getByRole('dialog'))
      const style = getComputedStyle(container)

      expect(style.borderTopLeftRadius).toBe('28px')
      expect(style.maxWidth).toBe('560px')
      expect(style.minWidth).toBe('280px')
      // Centred rather than pinned to an edge, and at the page's widest.
      const room = scrimOf(container).getBoundingClientRect()
      const box = container.getBoundingClientRect()
      expect(box.width).toBe(560)
      expect(Math.round(box.left - room.left)).toBe(
        Math.round(room.right - box.right),
      )
    })

    // The page's full-screen dialog: square, filling the window.
    it('is a full-screen dialog below it', async () => {
      await page.viewport(375, 812)
      const view = setup()
      const container = containerOf(view.getByRole('dialog'))
      const style = getComputedStyle(container)

      const room = scrimOf(container).getBoundingClientRect()
      expect(style.borderTopLeftRadius).toBe('0px')
      // The scrim is the window, and the dialog fills it.
      expect(container.getBoundingClientRect().width).toBe(room.width)
      expect(container.getBoundingClientRect().height).toBe(room.height)
    })
  })

  describe('layout', () => {
    // The page's basic dialog pads 24 all round, with 16 between the
    // headline and the body and 24 between the body and the actions. Read as
    // the parts' own padding rather than from where the text lands, since the
    // headline is centred against a taller close button beside it.
    it("insets the parts by the page's paddings", async () => {
      await page.viewport(1024, 768)
      const view = setup()
      const container = containerOf(view.getByRole('dialog'))
      const { body, footer, header } = partsOf(view)

      expect(paddingOf(header)).toEqual({
        bottom: '16px',
        left: '24px',
        right: '24px',
        top: '24px',
      })
      expect(paddingOf(body).left).toBe('24px')
      expect(paddingOf(body).right).toBe('24px')
      expect(paddingOf(footer)).toEqual({
        bottom: '24px',
        left: '24px',
        right: '24px',
        top: '24px',
      })
      // The buttons sit at the trailing edge, 8 apart.
      expect(getComputedStyle(footer).columnGap).toBe('8px')
      expect(
        container.getBoundingClientRect().right -
          view.getByRole('button', { name: 'Cancel' }).getBoundingClientRect()
            .right,
      ).toBe(24)

      await page.viewport(DEFAULT_VIEWPORT.width, DEFAULT_VIEWPORT.height)
    })

    // Full screen, the header and the actions are the page's two 56dp bars.
    it('draws a 56 header and action bar full screen', async () => {
      await page.viewport(375, 812)
      const view = setup()
      containerOf(view.getByRole('dialog'))
      const { footer, header } = partsOf(view)

      expect(header.getBoundingClientRect().height).toBe(56)
      expect(footer.getBoundingClientRect().height).toBe(56)
      expect(getComputedStyle(header).borderBottomStyle).toBe('solid')
      expect(getComputedStyle(footer).borderTopStyle).toBe('solid')

      await page.viewport(DEFAULT_VIEWPORT.width, DEFAULT_VIEWPORT.height)
    })
  })
})
