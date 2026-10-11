import * as stylex from '@stylexjs/stylex'
import { act, fireEvent, render, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { page } from 'vitest/browser'

import type { SnackbarOptions } from '.'

import Snackbar from '.'
import { colors } from '../../tokens/design.tokens.stylex'
import Button from '../button'
import Dialog from '../dialog'
import Sheet from '../sheet'

// StyleX hashes an atomic class from the property and value, so the same
// declaration written here produces the same class the component produces.
// Asserting on class membership pins which role each part reaches for without
// depending on the browser having applied a rule these tests are the first
// thing to use — see chip/index.test.tsx for the flake behind this.
const probeStyles = stylex.create({
  action: { color: colors.inversePrimary },
  container: { backgroundColor: colors.inverseSurface },
  message: { color: colors.inverseOnSurface },
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
  action: classesOf(stylex.props(probeStyles.action)),
  container: classesOf(stylex.props(probeStyles.container)),
  message: classesOf(stylex.props(probeStyles.message)),
}

function hasClasses(element: Element, classes: string[]) {
  return classes.every((name) => element.classList.contains(name))
}

const UNDO = { label: 'Undo', onPress: () => {} }

/** A fresh queue and a mounted region, since the queue outlives React. */
function setup(props: Partial<Parameters<typeof Snackbar>[0]> = {}) {
  const queue = new Snackbar.Queue()
  const view = render(<Snackbar queue={queue} {...props} />)
  return { queue, view }
}

/** The element carrying the alertdialog role: the snackbar's container. */
function snackbarIn(view: ReturnType<typeof render>) {
  return view.getByRole('alertdialog')
}

// The runner's own viewport, restored after any test that changes it.
const DEFAULT_VIEWPORT = {
  height: window.innerHeight,
  width: window.innerWidth,
}

/** The footer an overlay's action sits in. */
function footerOf(action: Element) {
  const footer = action.parentElement
  if (footer === null) {
    throw new Error('expected the action to sit in a footer')
  }
  return footer
}

/**
 * What a tap at the centre of `element` lands on: `'itself'` where it lands
 * on the element or inside it, and otherwise the text of whatever it lands
 * on, or `'nothing'` off the page — so a failure says what took the tap.
 */
function tapAtTheCentreOf(element: Element) {
  const { height, left, top, width } = element.getBoundingClientRect()
  const hit = document.elementFromPoint(left + width / 2, top + height / 2)
  if (hit === null) {
    return 'nothing'
  }
  return element.contains(hit) ? 'itself' : hit.textContent || hit.tagName
}

/**
 * A toast with an action raised over an open overlay with a Confirm action
 * in its footer, read once both have arrived. The overlay is `Dialog` or
 * `Sheet`, of the role given.
 */
async function toastOver(
  overlay: 'alertdialog' | 'dialog' | 'sheet',
  { finishEntries = true }: { finishEntries?: boolean } = {},
) {
  const queue = new Snackbar.Queue()
  const footer = (
    <>
      <Button>Confirm</Button>
    </>
  )
  const view = render(
    <>
      {overlay === 'sheet' ? (
        <Sheet.Content aria-label="Label" isOpen>
          <Sheet.Body>Supporting line</Sheet.Body>
          <Sheet.Footer>{footer}</Sheet.Footer>
        </Sheet.Content>
      ) : (
        <Dialog.Content aria-label="Label" isOpen role={overlay}>
          <Dialog.Body>Supporting line</Dialog.Body>
          <Dialog.Footer>{footer}</Dialog.Footer>
        </Dialog.Content>
      )}
      <Snackbar queue={queue} />
    </>,
  )
  act(() => {
    queue.add('First item', { action: UNDO })
  })
  await waitFor(() => {
    expect(view.getByText('First item')).not.toBeNull()
  })
  // The overlay arrives from below and the toast rises into place, so both
  // are drawn short of where they rest until their entries have run.
  if (finishEntries) {
    for (const animation of document.getAnimations()) {
      animation.finish()
    }
  }
  const toast = view.getByText('First item').closest('[role="alertdialog"]')
  const region = view.getByText('First item').closest('[role="region"]')
  if (toast === null || region === null) {
    throw new Error('expected the message to sit in a toast in its region')
  }
  return {
    confirm: view.getByText('Confirm').closest('button') ?? toast,
    queue,
    region,
    toast,
    view,
  }
}

describe('snackbar', () => {
  describe('the queue', () => {
    it('renders nothing until something is added', () => {
      const { view } = setup()
      expect(view.queryByRole('region')).toBeNull()
      expect(document.querySelectorAll('[role="alertdialog"]')).toHaveLength(0)
    })

    it('shows a message that was added', async () => {
      const { queue, view } = setup()
      act(() => {
        queue.add('First item')
      })
      await waitFor(() => {
        expect(view.getByText('First item')).not.toBeNull()
      })
    })

    // The page shows one at a time and a newer message takes the screen,
    // with the one it replaced shown after it rather than discarded.
    it('shows one message at a time, newest first', async () => {
      const { queue, view } = setup()
      act(() => {
        queue.add('First item')
        queue.add('Second item')
      })
      await waitFor(() => {
        expect(view.getByText('Second item')).not.toBeNull()
      })
      expect(view.queryByText('First item')).toBeNull()
    })

    it('shows the message it replaced once the newer one closes', async () => {
      const { queue, view } = setup()
      let second = ''
      act(() => {
        queue.add('First item')
        second = queue.add('Second item')
      })
      await waitFor(() => {
        expect(view.getByText('Second item')).not.toBeNull()
      })

      // Closed by the key add returned rather than through the React Aria
      // queue underneath, which the component documents as not its API.
      act(() => {
        queue.close(second)
      })

      await waitFor(() => {
        expect(view.getByText('First item')).not.toBeNull()
      })
    })

    it('closes a message by the key add returned', async () => {
      const { queue, view } = setup()
      let key = ''
      act(() => {
        key = queue.add('First item')
      })
      await waitFor(() => {
        expect(view.getByText('First item')).not.toBeNull()
      })
      act(() => {
        queue.close(key)
      })
      await waitFor(() => {
        expect(view.queryByText('First item')).toBeNull()
      })
    })

    it('clears every message at once', async () => {
      const { queue, view } = setup()
      act(() => {
        queue.add('First item')
      })
      await waitFor(() => {
        expect(view.getByText('First item')).not.toBeNull()
      })
      act(() => {
        queue.clear()
      })
      await waitFor(() => {
        expect(view.queryByText('First item')).toBeNull()
      })
    })
  })

  describe('timing', () => {
    // A message alone is shown for five seconds; one carrying an action stays
    // until it is taken or closed — see the durations in the component.
    it('leaves on its own after five seconds', () => {
      vi.useFakeTimers()
      try {
        const { queue, view } = setup()
        act(() => {
          queue.add('First item')
        })
        expect(view.getByText('First item')).not.toBeNull()

        act(() => {
          vi.advanceTimersByTime(4900)
        })
        expect(view.queryByText('First item')).not.toBeNull()

        act(() => {
          vi.advanceTimersByTime(200)
        })
        expect(view.queryByText('First item')).toBeNull()
      } finally {
        vi.useRealTimers()
      }
    })

    it('stays until closed when there is an action to take', () => {
      vi.useFakeTimers()
      try {
        const { queue, view } = setup()
        let key = ''
        act(() => {
          key = queue.add('First item', { action: UNDO })
        })

        // A minute is far past any duration a timer would have been given.
        act(() => {
          vi.advanceTimersByTime(60_000)
        })
        expect(view.queryByText('First item')).not.toBeNull()

        act(() => {
          queue.close(key)
        })
        expect(view.queryByText('First item')).toBeNull()
      } finally {
        vi.useRealTimers()
      }
    })

    it.each<[string, SnackbarOptions]>([
      ['alone', {}],
      ['with an action', { action: UNDO }],
    ])('takes a timeout of its own, %s', (_, options) => {
      vi.useFakeTimers()
      try {
        const { queue, view } = setup()
        act(() => {
          queue.add('First item', { ...options, timeout: 10_000 })
        })

        act(() => {
          vi.advanceTimersByTime(5000)
        })
        expect(view.queryByText('First item')).not.toBeNull()

        act(() => {
          vi.advanceTimersByTime(5100)
        })
        expect(view.queryByText('First item')).toBeNull()
      } finally {
        vi.useRealTimers()
      }
    })

    it('calls onClose however the message went away', async () => {
      const onClose = vi.fn<() => void>()
      const { queue, view } = setup()
      let key = ''
      act(() => {
        key = queue.add('First item', { onClose })
      })
      await waitFor(() => {
        expect(view.getByText('First item')).not.toBeNull()
      })
      act(() => {
        queue.close(key)
      })
      await waitFor(() => {
        expect(onClose).toHaveBeenCalledTimes(1)
      })
    })
  })

  describe('the action', () => {
    it('draws no action unless one was given', async () => {
      const { queue, view } = setup()
      act(() => {
        queue.add('First item')
      })
      await waitFor(() => {
        expect(view.getByText('First item')).not.toBeNull()
      })
      expect(view.queryByRole('button')).toBeNull()
    })

    it('runs the action and closes the message', async () => {
      const onPress = vi.fn<() => void>()
      const { queue, view } = setup()
      act(() => {
        queue.add('First item', { action: { label: 'Undo', onPress } })
      })
      await waitFor(() => {
        expect(view.getByRole('button', { name: 'Undo' })).not.toBeNull()
      })

      fireEvent.click(view.getByRole('button', { name: 'Undo' }))

      await waitFor(() => {
        expect(onPress).toHaveBeenCalledTimes(1)
      })
      await waitFor(() => {
        expect(view.queryByText('First item')).toBeNull()
      })
    })

    it('closes from its close button', async () => {
      const { queue, view } = setup()
      act(() => {
        queue.add('First item', { showCloseButton: true })
      })
      await waitFor(() => {
        expect(view.getByRole('button', { name: 'Close' })).not.toBeNull()
      })

      fireEvent.click(view.getByRole('button', { name: 'Close' }))

      await waitFor(() => {
        expect(view.queryByText('First item')).toBeNull()
      })
    })

    // On the overlays around it `isDismissable` is whether a press outside
    // closes them, so the option here is named for what it draws, and the
    // other spelling is taken neither by the type nor at run time.
    it('draws the close button for showCloseButton alone', async () => {
      const { queue, view } = setup()
      // @ts-expect-error -- the option is `showCloseButton`
      const options: SnackbarOptions = { isDismissable: true }
      act(() => {
        queue.add('First item', options)
      })
      await waitFor(() => {
        expect(view.getByText('First item')).not.toBeNull()
      })
      expect(view.queryByRole('button', { name: 'Close' })).toBeNull()
    })

    // Left unnamed, the button takes React Aria's own name in the reader's
    // locale, as localised-names.test.tsx pins; a call site that wants other
    // words names it here.
    it('lets the close button be named by the call site', async () => {
      const { queue, view } = setup({ closeLabel: 'Fermer' })
      act(() => {
        queue.add('First item', { showCloseButton: true })
      })

      await waitFor(() => {
        expect(view.getByRole('button', { name: 'Fermer' })).not.toBeNull()
      })
      expect(view.queryByRole('button', { name: 'Close' })).toBeNull()
    })
  })

  describe('semantics', () => {
    // React Aria makes the region a landmark and the message itself an
    // alert dialog, which is what a screen reader announces and can be
    // moved into with a keyboard.
    it('puts the message in a landmark region', async () => {
      const { queue, view } = setup()
      act(() => {
        queue.add('First item')
      })
      await waitFor(() => {
        expect(view.getByRole('region')).not.toBeNull()
      })
      expect(snackbarIn(view)).not.toBeNull()
    })

    it('names the region when asked', async () => {
      const queue = new Snackbar.Queue()
      const view = render(<Snackbar aria-label="Messages" queue={queue} />)
      act(() => {
        queue.add('First item')
      })
      await waitFor(() => {
        expect(view.getByRole('region', { name: 'Messages' })).not.toBeNull()
      })
    })

    // Left unnamed, the region takes React Aria's own name, which counts the
    // messages it holds and is localized — "1 notification." under the test
    // locale, since the queue shows one at a time. The prop's comment once
    // promised a plain 'Notifications' that nothing ever applied, and
    // applying it now would swap every reader's own language for English, so
    // what is pinned here is the name React Aria gives rather than that one.
    //
    // The exact string is React Aria's and moves with it. If an upgrade
    // changes it, this fails with the new wording in the diff, which is worth
    // knowing about a name every screen reader user hears.
    it("leaves an unnamed region to React Aria's localized count", async () => {
      const { queue, view } = setup()
      act(() => {
        queue.add('First item')
      })

      await waitFor(() => {
        expect(
          view.getByRole('region', { name: '1 notification.' }),
        ).not.toBeNull()
      })
      expect(view.queryByRole('region', { name: 'Notifications' })).toBeNull()
    })
  })

  describe('appearance', () => {
    it('draws the container and its text in the page inverse roles', async () => {
      const { queue, view } = setup()
      act(() => {
        queue.add('First item', {
          action: { label: 'Undo', onPress: () => {} },
        })
      })
      await waitFor(() => {
        expect(view.getByText('First item')).not.toBeNull()
      })

      expect(hasClasses(snackbarIn(view), CLASSES.container)).toBe(true)
      // The colour is on the element holding the text rather than on the
      // text itself, which inherits it — see the message style's comment.
      const content = view.getByText('First item').parentElement
      if (content === null) {
        throw new Error('expected the message to sit inside a content element')
      }
      expect(hasClasses(content, CLASSES.message)).toBe(true)
      expect(
        hasClasses(view.getByRole('button', { name: 'Undo' }), CLASSES.action),
      ).toBe(true)
    })

    // The page's container: a 4dp corner, 8 either side, and 48 tall on a
    // single line. The height comes from the message's own 14 above and
    // below rather than from the container, which is what keeps a 48dp close
    // button from making the snackbar taller than the page draws it.
    it('draws the page container shape and single-line height', async () => {
      const { queue, view } = setup()
      act(() => {
        queue.add('First item')
      })
      await waitFor(() => {
        expect(view.getByText('First item')).not.toBeNull()
      })

      const style = getComputedStyle(snackbarIn(view))
      expect(style.borderTopLeftRadius).toBe('4px')
      expect(style.paddingLeft).toBe('8px')
      expect(style.paddingTop).toBe('0px')
      expect(snackbarIn(view).getBoundingClientRect().height).toBe(48)
    })

    it('stays 48 tall with a close button beside the message', async () => {
      const { queue, view } = setup()
      act(() => {
        queue.add('First item', {
          action: { label: 'Undo', onPress: () => {} },
          showCloseButton: true,
        })
      })
      await waitFor(() => {
        expect(view.getByRole('button', { name: 'Close' })).not.toBeNull()
      })

      expect(snackbarIn(view).getBoundingClientRect().height).toBe(48)
      expect(
        view.getByRole('button', { name: 'Close' }).getBoundingClientRect()
          .height,
      ).toBe(48)
    })
  })

  // A full-screen dialog's action bar and a sheet's actions sit on the
  // window's bottom edge, as the snackbar does, and the snackbar is drawn
  // above both. A toast with an action stays until it is answered, so one
  // lying over those actions took every tap meant for them: a tap on the
  // dialog's Close fired the toast's Undo instead.
  describe('over an overlay holding the bottom edge', () => {
    afterEach(async () => {
      await page.viewport(DEFAULT_VIEWPORT.width, DEFAULT_VIEWPORT.height)
    })

    it.each([
      { name: 'a full-screen dialog', overlay: 'dialog', width: 360 },
      { name: 'a bottom sheet', overlay: 'sheet', width: 360 },
      { name: 'a side sheet', overlay: 'sheet', width: 1024 },
    ] as const)(
      'rises clear of the actions of $name',
      async ({ overlay, width }) => {
        await page.viewport(width, 640)
        const { confirm, toast } = await toastOver(overlay)

        // Read once the overlay's entry has ended, which is when the strip
        // it holds is measured where it rests and the actions sit where a
        // tap finds them. A side sheet arrives across the window, so a tap
        // read while it was still on its way could land past its edge.
        await waitFor(() => {
          // Above the actions with the page's 8dp of margin between them,
          // rather than anywhere above them, and still on screen.
          const actions = footerOf(confirm).getBoundingClientRect()
          const box = toast.getBoundingClientRect()
          expect(Math.round(actions.top - box.bottom)).toBe(8)
          expect(box.top).toBeGreaterThan(0)
          expect(tapAtTheCentreOf(confirm)).toBe('itself')
        })
      },
    )

    // The dialog is drawn lower than it rests until its entry has run, so a
    // strip measured as it arrives is short. Left to run in real time here,
    // rather than finished as the cases above finish it, which is what shows
    // the strip is measured again once the dialog has arrived.
    it('measures the action bar where it rests once the dialog arrives', async () => {
      await page.viewport(360, 640)
      const { confirm, toast } = await toastOver('dialog', {
        finishEntries: false,
      })

      await waitFor(
        () => {
          expect(document.getAnimations()).toHaveLength(0)
          const actions = footerOf(confirm).getBoundingClientRect()
          expect(
            Math.round(actions.top - toast.getBoundingClientRect().bottom),
          ).toBe(8)
        },
        { timeout: 3000 },
      )
    })

    // Above the breakpoint the dialog is the basic one, centred with room
    // below it, and an alert dialog is the basic one at every width: neither
    // holds the edge, so the toast stays where it always sits.
    it.each([
      { name: 'a basic dialog', overlay: 'dialog', width: 1024 },
      {
        name: 'an alert dialog on a phone',
        overlay: 'alertdialog',
        width: 360,
      },
    ] as const)('stays at the edge over $name', async ({ overlay, width }) => {
      await page.viewport(width, 640)
      const { region } = await toastOver(overlay)

      expect(getComputedStyle(region).bottom).toBe('0px')
    })

    it('settles back to the edge once the overlay closes', async () => {
      await page.viewport(360, 640)
      const { queue, region, view } = await toastOver('dialog')
      await waitFor(() => {
        expect(getComputedStyle(region).bottom).not.toBe('0px')
      })

      view.rerender(<Snackbar queue={queue} />)

      await waitFor(() => {
        expect(getComputedStyle(view.getByRole('region')).bottom).toBe('0px')
      })
    })
  })
})
