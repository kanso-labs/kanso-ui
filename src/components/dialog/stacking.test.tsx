import { act, fireEvent, render, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { page } from 'vitest/browser'

import Dialog from '.'
import Button from '../button'
import ListBox from '../list-box'
import Menu from '../menu'
import Select from '../select'
import Snackbar from '../snackbar'

// A dialog is where a page opens most of its other overlays at once: a menu
// and a select from its body, and a toast raised over it. Each of the three
// can fail only in that company — the page's layered content painting over
// the scrim, a press on a select landing on the field's own column and
// opening nothing, a toast taking the taps meant for the dialog's actions —
// so these build the company. Every press is sent to whatever the browser
// hit-tests where its target is drawn, never dispatched on the target
// itself: a click sent straight to an element succeeds whatever is painted
// over it, which is how all three passed the tests beside each component.

// What a mouse press can focus: the browser focuses the nearest of these
// around where it lands.
const FOCUSABLE = 'a[href], button, input, select, textarea, [tabindex]'

// The runner's own viewport, restored after any test that changes it.
const DEFAULT_VIEWPORT = {
  height: window.innerHeight,
  width: window.innerWidth,
}

const OPTIONS = (
  <>
    <ListBox.Item id="first">First item</ListBox.Item>
    <ListBox.Item id="second">Second item</ListBox.Item>
  </>
)

// Hoisted so it is one stable object rather than a fresh one per render,
// which is what react-perf's no-new-object-as-prop is after.
const LAYERED_STYLE = {
  blockSize: '64px',
  position: 'relative',
  zIndex: 1,
} as const

const UNDO = { label: 'Undo', onPress: () => {} }

let layered: HTMLElement | null = null

afterEach(async () => {
  layered?.remove()
  layered = null
  await page.viewport(DEFAULT_VIEWPORT.width, DEFAULT_VIEWPORT.height)
})

/** The point at the centre of where `element` is drawn. */
function centreOf(element: Element) {
  const { height, left, top, width } = element.getBoundingClientRect()
  return { clientX: left + width / 2, clientY: top + height / 2 }
}

/** What the browser draws on top at the centre of `element`. */
function hitAt(element: Element) {
  const { clientX, clientY } = centreOf(element)
  return document.elementFromPoint(clientX, clientY)
}

/**
 * A dialog holding a menu and a select in its body and two actions in its
 * footer, opened from a trigger on the page, beside a snackbar.
 */
function host() {
  const queue = new Snackbar.Queue()
  const view = render(
    <>
      <Dialog>
        <Button>Open dialog</Button>
        <Dialog.Content>
          <Dialog.Header>
            <Dialog.Title>Headline</Dialog.Title>
          </Dialog.Header>
          <Dialog.Body>
            <Menu>
              <Button>Open menu</Button>
              <Menu.Content>
                <Menu.Item id="first">First item</Menu.Item>
                <Menu.Item id="second">Second item</Menu.Item>
              </Menu.Content>
            </Menu>
            <Select label="Label" options={OPTIONS} />
          </Dialog.Body>
          <Dialog.Footer>
            <Button slot="close" variant="text">
              Cancel
            </Button>
            <Button variant="text">Confirm</Button>
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog>
      <Snackbar queue={queue} />
    </>,
  )
  return {
    opener: view.getByRole('button', { name: 'Open dialog' }),
    queue,
    view,
  }
}

/**
 * A press where `element` is drawn, sent as a mouse's events to whatever the
 * browser hit-tests at its centre. Dispatched by the page rather than driven
 * through the runner's pointer, which is a command to the whole page and
 * waits long enough under a full run's load to time a test out.
 */
async function pressAt(element: Element) {
  const point = centreOf(element)
  const hit = document.elementFromPoint(point.clientX, point.clientY)
  if (hit === null) {
    throw new Error('expected something to be drawn there')
  }
  const init = {
    ...point,
    button: 0,
    isPrimary: true,
    pointerId: 1,
    pointerType: 'mouse',
  }
  fireEvent.pointerDown(hit, init)
  // The browser focuses what a mouse press lands on as the default action of
  // its mousedown, which a dispatched event does not run, so it is done here
  // unless something cancelled it. Focus is what an overlay returns to.
  if (fireEvent.mouseDown(hit, init)) {
    hit.closest<HTMLElement>(FOCUSABLE)?.focus()
  }
  fireEvent.pointerUp(hit, init)
  fireEvent.mouseUp(hit, init)
  fireEvent.click(hit, init)
  await act(async () => {})
}

/** Escape, pressed where focus is, as a keyboard sends it. */
function pressEscape() {
  fireEvent.keyDown(document.activeElement ?? document.body, {
    key: 'Escape',
  })
}

/** Plays out every entry under way, so what is drawn is where it rests. */
function settle() {
  for (const animation of document.getAnimations()) {
    animation.finish()
  }
}

describe('a dialog hosting other overlays', () => {
  it('closes one layer per Escape and returns focus to what opened it', async () => {
    const { opener, view } = host()
    await pressAt(opener)
    await view.findByRole('dialog', { name: 'Headline' })
    settle()

    const menuTrigger = view.getByRole('button', { name: 'Open menu' })
    await pressAt(menuTrigger)
    await view.findByRole('menu')
    settle()
    pressEscape()
    // React Aria hands focus back a frame after the layer unmounts, so focus
    // is waited for with the layer's removal rather than read straight
    // after it: under a full run's load that frame can come late.
    await waitFor(() => {
      expect(view.queryByRole('menu')).toBeNull()
      expect(document.activeElement).toBe(menuTrigger)
    })
    expect(view.getByRole('dialog', { name: 'Headline' })).not.toBeNull()

    // Pressed on the label, which the field draws over the press target's
    // middle, so the press reaches the select only if the target is on top.
    const selectTrigger = view.getByRole('button', { name: /Label/ })
    await pressAt(view.getByText('Label'))
    await view.findByRole('listbox')
    expect(selectTrigger.getAttribute('aria-expanded')).toBe('true')
    settle()
    pressEscape()
    await waitFor(() => {
      expect(view.queryByRole('listbox')).toBeNull()
      expect(document.activeElement).toBe(selectTrigger)
    })
    expect(view.getByRole('dialog', { name: 'Headline' })).not.toBeNull()

    settle()
    pressEscape()
    await waitFor(() => {
      expect(view.queryByRole('dialog')).toBeNull()
      expect(document.activeElement).toBe(opener)
    })
  })

  // Wide enough for the basic dialog, centred with the scrim around it, so
  // the layered content sits under the scrim and nowhere under the dialog.
  it("lays the scrim over the page's layered content", async () => {
    await page.viewport(1024, 640)
    layered = document.createElement('div')
    document.body.prepend(layered)
    const content = render(<div style={LAYERED_STYLE}>Supporting line</div>, {
      container: layered,
    }).getByText('Supporting line')
    const { opener, view } = host()
    await pressAt(opener)
    const dialog = await view.findByRole('dialog', { name: 'Headline' })
    settle()

    // React Aria makes everything outside an open modal inert, which takes
    // the content out of hit testing however it paints, so that is undone
    // first: what is left is the paint order.
    for (const element of document.querySelectorAll('[inert]')) {
      element.removeAttribute('inert')
    }
    const hit = hitAt(content)
    expect(content.contains(hit)).toBe(false)
    expect(hit?.contains(dialog)).toBe(true)
  })

  // A phone's width, where the dialog fills the window and pins its actions
  // to the bottom edge the snackbar rises from.
  it("keeps a toast raised over it clear of the dialog's actions", async () => {
    await page.viewport(360, 640)
    const { opener, queue, view } = host()
    await pressAt(opener)
    await view.findByRole('dialog', { name: 'Headline' })
    act(() => {
      queue.add('Supporting line', { action: UNDO })
    })
    const message = await view.findByText('Supporting line')
    settle()

    const toast = message.closest('[role="alertdialog"]')
    if (toast === null) {
      throw new Error('expected the message to sit in a toast')
    }
    await waitFor(() => {
      for (const name of ['Cancel', 'Confirm']) {
        const action = view.getByText(name).closest('button')
        if (action === null) {
          throw new Error(`expected ${name} to be a button`)
        }
        expect(action.contains(hitAt(action))).toBe(true)
        expect(toast.getBoundingClientRect().bottom).toBeLessThanOrEqual(
          action.getBoundingClientRect().top,
        )
      }
      expect(toast.contains(hitAt(toast))).toBe(true)
    })
  })
})
