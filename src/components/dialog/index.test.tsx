import * as stylex from '@stylexjs/stylex'
import { act, fireEvent, render, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { page } from 'vitest/browser'

import type { DialogContentProps } from '.'

import Dialog from '.'
import { colors, shadows } from '../../tokens/design.tokens.stylex'
import Button from '../button'
import IconButton from '../icon-button'

// StyleX hashes an atomic class from the property and value, so the same
// declaration written here produces the same class the component produces.
// Asserting on class membership pins which role each part reaches for without
// depending on the browser having applied a rule these tests are the first
// thing to use — see chip/index.test.tsx for the flake behind this.
const probeStyles = stylex.create({
  body: { color: colors.onSurfaceVariant },
  elevation3: { boxShadow: shadows.elevation3 },
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
  elevation3: classesOf(stylex.props(probeStyles.elevation3)),
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

/** An alert dialog, with the dismissal props a call site passes. */
function alert(props: {
  isDismissable?: boolean
  isKeyboardDismissDisabled?: boolean
}) {
  return render(
    <Dialog defaultOpen>
      <Button>Open</Button>
      <Dialog.Content role="alertdialog" {...props}>
        <Dialog.Header>
          <Dialog.Title>Headline</Dialog.Title>
        </Dialog.Header>
        <Dialog.Footer>
          <Button slot="close" variant="text">
            Confirm
          </Button>
        </Dialog.Footer>
      </Dialog.Content>
    </Dialog>,
  )
}

/** The named computed properties of `element`, as one object. */
function computedOf(element: HTMLElement, properties: string[]) {
  const style = getComputedStyle(element)
  return Object.fromEntries(
    properties.map((property) => [property, style.getPropertyValue(property)]),
  )
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

// What a dismissal needs before its outcome can be read. A dialog that is
// closing stays on screen until the animations on it end, and its entry one
// is still running straight after it opens; and even with none left, React
// Aria unmounts it a microtask after the event rather than during it. Read
// sooner, a dialog Escape had already closed looked like one it had held
// open. Every press below goes through this, and the cases that expect a
// close are what show it waits long enough.
async function dismissWith(press: () => void) {
  for (const animation of document.getAnimations()) {
    animation.finish()
  }
  press()
  await act(async () => {})
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

/** The element `element` sits in, which a part's own element always has. */
function parentOf(element: HTMLElement) {
  const parent = element.parentElement
  if (parent === null) {
    throw new Error('expected the element to sit inside a part')
  }
  return parent
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

/**
 * Every property the full-screen presentation changes, read off each part
 * of an open dialog, so two presentations can be compared whole.
 */
function presentationOf(view: ReturnType<typeof render>, role: string) {
  const container = containerOf(view.getByRole(role))
  const { body, footer, header } = partsOf(view)
  const title = view.getByText('Headline')
  const paddings = [
    'padding-top',
    'padding-right',
    'padding-bottom',
    'padding-left',
  ]

  return {
    body: computedOf(body, paddings),
    container: computedOf(container, [
      'animation-name',
      'border-top-left-radius',
      'height',
      'max-width',
      'min-width',
      ...paddings,
    ]),
    footer: computedOf(footer, [
      'border-top-style',
      'height',
      'min-height',
      ...paddings,
    ]),
    header: computedOf(header, [
      'border-bottom-style',
      'height',
      'min-height',
      ...paddings,
    ]),
    scrim: computedOf(scrimOf(container), paddings),
    title: computedOf(title, [
      'font-family',
      'font-size',
      'font-weight',
      'letter-spacing',
      'line-height',
    ]),
  }
}

/**
 * Escape, dispatched on the dialog itself, as `closes on Escape` does.
 * Dispatched on whatever held focus instead, it missed the dialog whenever
 * an earlier case's dialog had handed focus back to the page — and a key
 * that never reaches the dialog leaves it open for a reason that proves
 * nothing. The story checks the real path, from a focused dialog.
 */
async function pressEscape(dialog: HTMLElement) {
  await dismissWith(() => {
    fireEvent.keyDown(dialog, { key: 'Escape' })
  })
}

/** A press on the scrim, outside the container, which is what React Aria reads as outside. */
async function pressScrim(dialog: HTMLElement) {
  const scrim = scrimOf(containerOf(dialog))
  const init = {
    button: 0,
    isPrimary: true,
    pointerId: 1,
    pointerType: 'mouse',
  }
  await dismissWith(() => {
    fireEvent.pointerDown(scrim, init)
    fireEvent.pointerUp(scrim, init)
    fireEvent.click(scrim, init)
  })
}

/** The scrim the container sits on, which fills the window. */
function scrimOf(container: HTMLElement) {
  const scrim = container.parentElement
  if (scrim === null) {
    throw new Error('expected the container to sit on the scrim')
  }
  return scrim
}

function setup(
  props: Partial<Parameters<typeof Dialog>[0]> = {},
  { role }: { role?: 'alertdialog' | 'dialog' } = {},
) {
  return render(
    <Dialog defaultOpen {...props}>
      <Button>Open</Button>
      <Dialog.Content role={role}>
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

/**
 * A dialog with no trigger: the content part on its own, holding the open
 * state `Dialog` would otherwise hold.
 */
function standalone(content: Partial<DialogContentProps> = {}) {
  return render(
    <Dialog.Content {...content}>
      <Dialog.Title>Headline</Dialog.Title>
      <Button slot="close">Cancel</Button>
    </Dialog.Content>,
  )
}

/**
 * A dialog of the given role whose title is `title`, beside a close button,
 * read once it has arrived.
 */
function titled(title: string, role: 'alertdialog' | 'dialog') {
  const view = render(
    <Dialog defaultOpen>
      <Button>Open</Button>
      <Dialog.Content role={role}>
        <Dialog.Header>
          <Dialog.Title>{title}</Dialog.Title>
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
  const heading = view.getByText(title)
  return {
    close: view.getByRole('button', { name: 'Close' }),
    container: containerOf(view.getByRole(role)),
    header: parentOf(heading),
    title: heading,
  }
}

// Sixty lines of body, far more than any viewport holds, which is what shows
// whether the body scrolls or the container clips it.
const LONG_BODY = Array.from({ length: 60 }, (_, index) => (
  <p key={index}>Supporting line</p>
))

/** A dialog whose body runs past its container, read once it has arrived. */
function longDialog() {
  const view = render(
    <Dialog defaultOpen>
      <Button>Open</Button>
      <Dialog.Content>
        <Dialog.Header>
          <Dialog.Title>Headline</Dialog.Title>
        </Dialog.Header>
        <Dialog.Body data-testid="body">{LONG_BODY}</Dialog.Body>
        <Dialog.Footer>
          <Button slot="close">Cancel</Button>
        </Dialog.Footer>
      </Dialog.Content>
    </Dialog>,
  )
  containerOf(view.getByRole('dialog'))
  return {
    body: view.getByTestId('body'),
    cancel: view.getByRole('button', { name: 'Cancel' }),
  }
}

// One word longer than any phone is wide, with nowhere to break it.
const LONG_WORD = 'Headline'.repeat(8)

/** Whether `inner` lies wholly inside `outer`, to the subpixel. */
function within(inner: Element, outer: Element) {
  const a = inner.getBoundingClientRect()
  const b = outer.getBoundingClientRect()
  return (
    a.left >= b.left - 0.5 &&
    a.right <= b.right + 0.5 &&
    a.top >= b.top - 0.5 &&
    a.bottom <= b.bottom + 0.5
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
          <Button>Open</Button>
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

    // The press every case below uses, shown closing a dialog that allows it,
    // so a dialog those cases find still open was held open and was not
    // simply missed.
    it('closes on a press on the scrim', async () => {
      const view = setup()
      await pressScrim(view.getByRole('dialog'))

      expect(view.queryByRole('dialog')).toBeNull()
    })

    // React Aria keeps the two ways out on two props: `isDismissable` is a
    // press on the scrim, `isKeyboardDismissDisabled` is Escape. The stories
    // once paired an alert dialog with the first alone, which left Escape
    // closing a question that had to be answered.
    describe('an alert dialog, which has to be answered', () => {
      it('stays open on Escape with keyboard dismissal off', async () => {
        const view = alert({
          isDismissable: false,
          isKeyboardDismissDisabled: true,
        })
        await pressEscape(view.getByRole('alertdialog'))

        expect(view.getByRole('alertdialog')).not.toBeNull()
      })

      it('stays open on a press on the scrim', async () => {
        const view = alert({
          isDismissable: false,
          isKeyboardDismissDisabled: true,
        })
        await pressScrim(view.getByRole('alertdialog'))

        expect(view.getByRole('alertdialog')).not.toBeNull()
      })

      it('closes from one of its own actions', async () => {
        const view = alert({
          isDismissable: false,
          isKeyboardDismissDisabled: true,
        })
        await dismissWith(() => {
          fireEvent.click(view.getByRole('button', { name: 'Confirm' }))
        })

        expect(view.queryByRole('alertdialog')).toBeNull()
      })

      // The control for the Escape case above, and the reason the stories
      // pass both props: `isDismissable` says nothing about Escape.
      it('still closes on Escape with isDismissable={false} alone', async () => {
        const view = alert({ isDismissable: false })
        await pressEscape(view.getByRole('alertdialog'))

        expect(view.queryByRole('alertdialog')).toBeNull()
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

  // A dialog nothing on the page opens, such as one a route shows, is the
  // content part on its own, holding the open state the trigger would have.
  describe('without a trigger', () => {
    it('opens from isOpen, named by its title', () => {
      const view = standalone({ isOpen: true })

      expect(view.getByRole('dialog').getAttribute('aria-labelledby')).toBe(
        view.getByText('Headline').id,
      )
    })

    it('renders nothing while isOpen is false', () => {
      expect(standalone({ isOpen: false }).queryByRole('dialog')).toBeNull()
    })

    // Controlled, as through `Dialog`: closing reports it, and nothing moves
    // until the prop comes back different.
    it('reports a close from a slot="close" button to onOpenChange', async () => {
      const onOpenChange = vi.fn<(isOpen: boolean) => void>()
      const view = standalone({ isOpen: true, onOpenChange })

      fireEvent.click(view.getByRole('button', { name: 'Cancel' }))
      await waitFor(() => {
        expect(onOpenChange).toHaveBeenCalledWith(false)
      })
      expect(view.getByRole('dialog')).not.toBeNull()
    })

    it('closes itself when it keeps its own state', async () => {
      const view = standalone({ defaultOpen: true })

      fireEvent.keyDown(view.getByRole('dialog'), { key: 'Escape' })
      await waitFor(() => {
        expect(view.queryByRole('dialog')).toBeNull()
      })
    })

    // `Dialog` with no button inside it warns that React Aria's press
    // responder found nothing to press, which leaving it out is for.
    it('warns about nothing', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
      try {
        // Open, so a quiet console is one that rendered the whole dialog.
        expect(standalone({ isOpen: true }).getByRole('dialog')).not.toBeNull()
        expect(warn).not.toHaveBeenCalled()
      } finally {
        warn.mockRestore()
      }
    })
  })

  describe('appearance', () => {
    it('draws the container on the surface container high role', () => {
      const view = setup()
      expect(
        hasClasses(containerOf(view.getByRole('dialog')), CLASSES.surface),
      ).toBe(true)
    })

    // The dialogs page lifts the container to elevation level 3.
    it('lifts the container to elevation 3', () => {
      const view = setup()
      expect(
        hasClasses(containerOf(view.getByRole('dialog')), CLASSES.elevation3),
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

    // An alert dialog is a question rather than a task, and the page keeps
    // the full-screen dialog for tasks: on a phone it stays the basic dialog,
    // rounded, centred, and only as tall as what it holds.
    it('keeps an alert dialog the basic dialog below it', async () => {
      await page.viewport(375, 812)
      const view = setup({}, { role: 'alertdialog' })
      const container = containerOf(view.getByRole('alertdialog'))
      const room = scrimOf(container).getBoundingClientRect()
      const box = container.getBoundingClientRect()

      expect(getComputedStyle(container).borderTopLeftRadius).toBe('28px')
      // The scrim's 24 of room either side, and centred top to bottom.
      expect(box.width).toBe(room.width - 48)
      expect(Math.round(box.top - room.top)).toBe(
        Math.round(room.bottom - box.bottom),
      )
      expect(box.height).toBeLessThan(room.height - 48)
    })

    // The basic presentation an alert dialog keeps is restated rather than
    // shared, so this compares it whole with what any dialog draws above the
    // breakpoint: a value changed in one and not the other fails here.
    it('draws an alert dialog below it as any dialog above it', async () => {
      await page.viewport(1024, 768)
      const wide = setup()
      const above = presentationOf(wide, 'dialog')
      wide.unmount()

      await page.viewport(375, 812)
      const below = presentationOf(
        setup({}, { role: 'alertdialog' }),
        'alertdialog',
      )

      expect(below).toEqual(above)
    })

    // Only the alert role leaves the pairing: one asked for by name stays a
    // full-screen dialog, header bar and all.
    it('still fills the window with role="dialog" named', async () => {
      await page.viewport(375, 812)
      const view = setup({}, { role: 'dialog' })
      const container = containerOf(view.getByRole('dialog'))
      const room = scrimOf(container).getBoundingClientRect()

      expect(container.getBoundingClientRect().height).toBe(room.height)
      expect(partsOf(view).header.getBoundingClientRect().height).toBe(56)
    })
  })

  // The body is the one part that scrolls: a body longer than the room
  // leaves the header and the actions where they are, and the rest of the
  // text a scroll away rather than clipped past the container's edge.
  describe('a body longer than the room', () => {
    afterEach(async () => {
      await page.viewport(DEFAULT_VIEWPORT.width, DEFAULT_VIEWPORT.height)
    })

    it.each([
      { height: 768, name: 'the basic dialog', width: 1024 },
      { height: 812, name: 'the full-screen dialog', width: 375 },
    ])(
      'scrolls the body of $name and keeps its actions on screen',
      async ({ height, width }) => {
        await page.viewport(width, height)
        const { body, cancel } = longDialog()

        expect(body.scrollHeight).toBeGreaterThan(body.clientHeight)
        body.scrollTop = 200
        expect(body.scrollTop).toBe(200)
        // A tab stop while it scrolls, so a keyboard can scroll it too.
        expect(body.tabIndex).toBe(0)
        expect(cancel.getBoundingClientRect().bottom).toBeLessThanOrEqual(
          window.innerHeight,
        )
      },
    )

    it("keeps a call site's own tabIndex on a body that scrolls", async () => {
      await page.viewport(1024, 768)
      const view = render(
        <Dialog defaultOpen>
          <Button>Open</Button>
          <Dialog.Content aria-label="Label">
            <Dialog.Body data-testid="body" tabIndex={-1}>
              {LONG_BODY}
            </Dialog.Body>
          </Dialog.Content>
        </Dialog>,
      )
      containerOf(view.getByRole('dialog'))

      expect(view.getByTestId('body').tabIndex).toBe(-1)
    })

    // A body that shows whole has nothing to scroll, so it is no stop at all.
    it('leaves a body that fits out of the tab order', () => {
      const view = setup()

      expect(view.getByText('Supporting line').hasAttribute('tabindex')).toBe(
        false,
      )
    })
  })

  describe('layout', () => {
    // The scrim is an element the library renders and the one the centring
    // padding sits on, so it is border-box like every other: nothing about
    // it may depend on a reset the consumer might not have.
    it('draws its scrim border-box', () => {
      const view = alert({})
      const scrim = containerOf(view.getByRole('alertdialog')).parentElement
      if (!(scrim instanceof HTMLElement)) {
        throw new Error('expected the container to sit on the scrim')
      }
      const style = getComputedStyle(scrim)

      expect(style.position).toBe('fixed')
      expect(style.boxSizing).toBe('border-box')
    })

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
      // None of its own at either end: the header and the footer are what
      // carry the container's 24, and the 16 and 24 they leave in front of
      // and after the body are the page's two gaps.
      expect(paddingOf(body).top).toBe('0px')
      expect(paddingOf(body).bottom).toBe('0px')
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

    // A dialog with no header and no footer has no part to carry the ends of
    // the container's 24, so the body carries them itself — the shape a
    // command palette is, which otherwise sat flush against the container's
    // top and bottom edges.
    it('pads the body at both ends when it is the whole dialog', async () => {
      await page.viewport(1024, 768)
      const view = render(
        <Dialog defaultOpen>
          <Button>Open</Button>
          <Dialog.Content aria-label="Commands">
            <Dialog.Body>Supporting line</Dialog.Body>
          </Dialog.Content>
        </Dialog>,
      )
      const container = containerOf(view.getByRole('dialog'))
      const body = view.getByText('Supporting line')

      expect(paddingOf(body)).toEqual({
        bottom: '24px',
        left: '24px',
        right: '24px',
        top: '24px',
      })
      // And the padding is the container's own, not room around it.
      expect(
        body.getBoundingClientRect().top -
          container.getBoundingClientRect().top,
      ).toBe(0)

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

    // Full screen the header has no padding under its divider, so the body
    // carries the 24 there that its sides already have; its first line sat
    // against the divider before. Above the breakpoint the header carries
    // the gap instead, and `insets the parts by the page's paddings` pins
    // the body at none.
    it('pads the body 24 below the header full screen', async () => {
      await page.viewport(375, 812)
      const view = setup()
      containerOf(view.getByRole('dialog'))
      const { body, header } = partsOf(view)

      expect(paddingOf(body).top).toBe('24px')
      // The body's own padding, starting at the divider rather than below it.
      expect(
        body.getBoundingClientRect().top -
          header.getBoundingClientRect().bottom,
      ).toBe(0)

      await page.viewport(DEFAULT_VIEWPORT.width, DEFAULT_VIEWPORT.height)
    })
  })

  // The header and footer are sized for a one-line headline and a row of two
  // short actions. Each case here is content that runs past that on a phone,
  // which the container's `overflow: hidden` used to clip without a trace.
  describe('content longer than the bars', () => {
    afterEach(async () => {
      await page.viewport(DEFAULT_VIEWPORT.width, DEFAULT_VIEWPORT.height)
    })

    // A third action on a phone used to push the first past the container's
    // start edge, where it was cut to the end of its label.
    it('wraps actions that do not fit onto another row', async () => {
      await page.viewport(360, 700)
      const view = render(
        <Dialog defaultOpen>
          <Button>Open</Button>
          <Dialog.Content role="alertdialog">
            <Dialog.Header>
              <Dialog.Title>Headline</Dialog.Title>
            </Dialog.Header>
            <Dialog.Footer>
              <Button slot="close" variant="text">
                First action
              </Button>
              <Button slot="close" variant="text">
                Second action
              </Button>
              <Button slot="close" variant="text">
                Third action
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog>,
      )
      const container = containerOf(view.getByRole('alertdialog'))
      const actions = ['First action', 'Second action', 'Third action'].map(
        (name) => view.getByRole('button', { name }),
      )

      for (const action of actions) {
        expect(within(action, container)).toBe(true)
      }
      // On two rows rather than squeezed onto one, and still at the
      // trailing edge: the last action ends where a lone one would.
      const [first, , third] = actions.map((action) =>
        action.getBoundingClientRect(),
      )
      expect(third.top).toBeGreaterThan(first.top)
      expect(container.getBoundingClientRect().right - third.right).toBe(24)
    })

    // The headline is the part that gives way, so the close button keeps its
    // size and stays on screen.
    it.each(['dialog', 'alertdialog'] as const)(
      'breaks one long word in the title of a %s',
      async (role) => {
        await page.viewport(360, 700)
        const { close, container, title } = titled(LONG_WORD, role)

        expect(within(title, container)).toBe(true)
        expect(within(close, container)).toBe(true)
        expect(close.getBoundingClientRect().right).toBeLessThanOrEqual(
          window.innerWidth,
        )
        expect(close.getBoundingClientRect().width).toBe(
          close.getBoundingClientRect().height,
        )
      },
    )

    // Full screen the header was a fixed 56, so a headline of three lines
    // overflowed it both ways and started above the top of the window.
    it('grows the full-screen header with a headline of several lines', async () => {
      await page.viewport(375, 812)
      const { header, title } = titled(
        'Headline that runs on for long enough to take several lines',
        'dialog',
      )
      const box = header.getBoundingClientRect()
      const text = title.getBoundingClientRect()

      expect(text.height).toBeGreaterThan(56)
      expect(text.top).toBeGreaterThanOrEqual(box.top)
      expect(text.bottom).toBeLessThanOrEqual(box.bottom)
    })

    // Likewise an action whose label wraps, which met the divider over a
    // fixed 56 action bar.
    it('grows the full-screen action bar with an action of two lines', async () => {
      await page.viewport(375, 812)
      const view = render(
        <Dialog defaultOpen>
          <Button>Open</Button>
          <Dialog.Content aria-label="Label">
            <Dialog.Body>Supporting line</Dialog.Body>
            <Dialog.Footer>
              <Button slot="close">
                Action with a label long enough to run onto a second line
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog>,
      )
      containerOf(view.getByRole('dialog'))
      const action = view.getByRole('button', { name: /^Action/ })
      const bar = parentOf(action).getBoundingClientRect()
      const box = action.getBoundingClientRect()

      expect(box.height).toBeGreaterThan(40)
      // Clear of the divider, which is the bar's 1px top border, by the
      // bar's own 4 of padding.
      expect(box.top - bar.top).toBeGreaterThanOrEqual(5)
      expect(bar.bottom - box.bottom).toBeGreaterThanOrEqual(4)
    })
  })
})
