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

// A word longer than a phone-width strip holds, which a file name or a German
// compound easily is.
const LONG_WORD = 'Supporting'.repeat(6)

const LONG_MESSAGE =
  'Supporting text long enough to run onto a second line of the strip'

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

/** A snackbar with an action and a close button, its rise played out. */
async function shown() {
  const { queue, view } = setup()
  act(() => {
    queue.add('First item', { action: UNDO, showCloseButton: true })
  })
  await waitFor(() => {
    expect(view.getByRole('button', { name: 'Close' })).not.toBeNull()
  })
  const strip = snackbarIn(view)
  for (const animation of strip.getAnimations()) {
    animation.finish()
  }
  return { strip, view }
}

/** A snackbar at a phone's width, its rise played out, and its parts. */
async function shownAt360(message: string, options: SnackbarOptions) {
  await page.viewport(360, 640)
  const { queue, view } = setup()
  act(() => {
    queue.add(message, options)
  })
  await waitFor(() => {
    expect(view.getByRole('alertdialog')).not.toBeNull()
  })
  const strip = snackbarIn(view)
  for (const animation of strip.getAnimations()) {
    animation.finish()
  }
  const content = view.getByText(message).parentElement
  if (content === null) {
    throw new Error('expected the message to sit inside a content element')
  }
  return { content, strip, view }
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

    // The page shows one at a time, and a newer message takes the screen.
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

    // Replaced rather than queued: the message a newer one took the place of
    // used to come back once that closed, an Undo long after its moment.
    it('does not bring back the message it replaced once the newer one closes', async () => {
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
        expect(view.queryByText('Second item')).toBeNull()
      })
      expect(view.queryByText('First item')).toBeNull()
    })

    it('closes the message it replaces, running its onClose once', async () => {
      const onClose = vi.fn<() => void>()
      const { queue, view } = setup()
      act(() => {
        queue.add('First item', { onClose })
      })
      await waitFor(() => {
        expect(view.getByText('First item')).not.toBeNull()
      })

      act(() => {
        queue.add('Second item')
      })

      expect(onClose).toHaveBeenCalledTimes(1)
      await waitFor(() => {
        expect(view.getByText('Second item')).not.toBeNull()
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

    // React Aria's own clear empties its list without running a single
    // onClose, so a call site committing a change unless Undo was pressed
    // never heard of a message cleared this way.
    it('clears the message on screen, running its onClose', async () => {
      const onClose = vi.fn<() => void>()
      const { queue, view } = setup()
      act(() => {
        queue.add('First item', { onClose })
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
      expect(onClose).toHaveBeenCalledTimes(1)
    })

    // Three messages added in quick succession are one message on screen for
    // one lifetime, not three drained one after another.
    it('leaves nothing behind three messages added at once', () => {
      vi.useFakeTimers()
      try {
        const { queue, view } = setup()
        act(() => {
          queue.add('First item')
          queue.add('Second item')
          queue.add('Third item')
        })
        expect(view.getByText('Third item')).not.toBeNull()

        act(() => {
          vi.advanceTimersByTime(5000)
        })

        expect(document.querySelectorAll('[role="alertdialog"]')).toHaveLength(
          0,
        )
      } finally {
        vi.useRealTimers()
      }
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

    // Material Design allows four seconds at the least, and a call site asking
    // for less is given that rather than a message nobody can read.
    it.each<[string, SnackbarOptions]>([
      ['alone', {}],
      ['with an action', { action: UNDO }],
    ])('holds a shorter timeout to four seconds, %s', (_, options) => {
      vi.useFakeTimers()
      try {
        const { queue, view } = setup()
        act(() => {
          queue.add('First item', { ...options, timeout: 1000 })
        })

        act(() => {
          vi.advanceTimersByTime(3900)
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

    // React Aria runs no timer for a value below zero, as for zero itself, so
    // there is no timer to hold and the message stays.
    it('leaves a timeout below zero untimed', () => {
      vi.useFakeTimers()
      try {
        const { queue, view } = setup()
        act(() => {
          queue.add('First item', { showCloseButton: true, timeout: -1 })
        })

        act(() => {
          vi.advanceTimersByTime(60_000)
        })
        expect(view.queryByText('First item')).not.toBeNull()
      } finally {
        vi.useRealTimers()
      }
    })

    it('keeps a timeout of four seconds as it is', () => {
      vi.useFakeTimers()
      try {
        const { queue, view } = setup()
        act(() => {
          queue.add('First item', { timeout: 4000 })
        })

        act(() => {
          vi.advanceTimersByTime(3900)
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

    it('keeps a message with a timeout of 0 until it is closed', () => {
      vi.useFakeTimers()
      try {
        const { queue, view } = setup()
        let key = ''
        act(() => {
          key = queue.add('First item', { timeout: 0 })
        })

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

  // Content longer than one line of the strip holds, on a phone. A word
  // with no break in it ran under the controls and past the strip's edge,
  // and a long action squeezed the message into a column a word wide.
  describe('content longer than the strip', () => {
    afterEach(async () => {
      await page.viewport(DEFAULT_VIEWPORT.width, DEFAULT_VIEWPORT.height)
    })

    it('breaks a word with no break in it inside the strip', async () => {
      const { content, strip } = await shownAt360(LONG_WORD, {
        action: UNDO,
        showCloseButton: true,
      })

      expect(content.scrollWidth).toBeLessThanOrEqual(content.clientWidth)
      expect(content.getBoundingClientRect().right).toBeLessThanOrEqual(
        strip.getBoundingClientRect().right,
      )
    })

    // Material Design's two-line snackbar with a longer action: the action
    // and the close button drop onto a line of their own under the message,
    // at the trailing edge, and the message keeps the strip's width.
    it('moves a long action and the close button under the message', async () => {
      const { content, strip, view } = await shownAt360(LONG_MESSAGE, {
        action: { label: 'Long action label', onPress: () => {} },
        showCloseButton: true,
      })
      const action = view
        .getByRole('button', { name: 'Long action label' })
        .getBoundingClientRect()
      const close = view
        .getByRole('button', { name: 'Close' })
        .getBoundingClientRect()
      const message = content.getBoundingClientRect()
      const edge = strip.getBoundingClientRect()

      expect(action.top).toBeGreaterThanOrEqual(message.bottom)
      expect(close.left).toBeGreaterThanOrEqual(action.right)
      expect(edge.right - close.right).toBe(8)
      expect(message.width).toBeGreaterThan(edge.width / 2)
    })

    // What moves the controls is their width, not the message's: a message
    // of two lines beside a short action keeps the action beside it.
    it('keeps a short action beside a message of several lines', async () => {
      const { content, view } = await shownAt360(LONG_MESSAGE, {
        action: UNDO,
      })
      const action = view
        .getByRole('button', { name: 'Undo' })
        .getBoundingClientRect()
      const message = content.getBoundingClientRect()

      expect(action.left).toBeGreaterThanOrEqual(message.right)
      expect(action.top).toBeLessThan(message.bottom)
    })

    // A short action still shares the message's row, at the page's 48.
    it('keeps a short action beside the message', async () => {
      const { content, strip, view } = await shownAt360('First item', {
        action: UNDO,
        showCloseButton: true,
      })
      const action = view
        .getByRole('button', { name: 'Undo' })
        .getBoundingClientRect()

      expect(action.left).toBeGreaterThanOrEqual(
        content.getBoundingClientRect().right,
      )
      expect(strip.getBoundingClientRect().height).toBe(48)
    })
  })

  // Material Design's text button: 40dp tall with a 48dp target, as
  // Button's medium size is. Sized by its padding alone it was 36dp, or 32
  // in a tighter type scale, and a press just off it landed on the strip.
  describe("the action's size", () => {
    it('is 40 tall', async () => {
      const { view } = await shown()
      expect(
        view.getByRole('button', { name: 'Undo' }).getBoundingClientRect()
          .height,
      ).toBe(40)
    })

    it('takes a press just above and just below its box', async () => {
      const { view } = await shown()
      const action = view.getByRole('button', { name: 'Undo' })
      const box = action.getBoundingClientRect()
      const x = box.left + box.width / 2

      for (const y of [box.top - 3, box.bottom + 3]) {
        expect(action.contains(document.elementFromPoint(x, y))).toBe(true)
      }
    })

    // The height is a least height rather than padding around the line, so
    // a scheme with a shorter label line keeps the 40.
    it('stays 40 tall under a shorter label line', async () => {
      const root = document.documentElement.style
      root.setProperty('--kui-typography-label-large-line-height', '16px')
      try {
        const { view } = await shown()
        expect(
          view.getByRole('button', { name: 'Undo' }).getBoundingClientRect()
            .height,
        ).toBe(40)
      } finally {
        root.removeProperty('--kui-typography-label-large-line-height')
      }
    })
  })

  // A ring outside the strip was drawn on the page, in a colour made to read
  // on the strip rather than on the page — 1.07:1 against it in the light
  // scheme. Each ring is now inside the strip, over the fill its colour reads
  // on: its outer edge, the element's box grown by the offset and the width,
  // lies within the strip.
  describe('the focus rings', () => {
    it.each(['the strip', 'Undo', 'Close'])(
      'draws the ring of %s inside the strip',
      async (part) => {
        const { strip, view } = await shown()
        const element =
          part === 'the strip'
            ? strip
            : view.getByRole('button', { name: part })
        const style = getComputedStyle(element)
        const reach =
          Number.parseFloat(style.outlineOffset) +
          Number.parseFloat(style.outlineWidth)
        const box = element.getBoundingClientRect()
        const edge = strip.getBoundingClientRect()

        expect(reach).toBeLessThanOrEqual(0)
        expect(box.top - reach).toBeGreaterThanOrEqual(edge.top)
        expect(box.bottom + reach).toBeLessThanOrEqual(edge.bottom)
        expect(box.left - reach).toBeGreaterThanOrEqual(edge.left)
        expect(box.right + reach).toBeLessThanOrEqual(edge.right)
      },
    )

    // The strip's ring lies on its fill, so it is the fill's own contrast
    // role — the message's colour — rather than the fill's colour.
    it("draws the strip's ring in the role that reads on its fill", async () => {
      const { strip, view } = await shown()
      const message = view.getByText('First item').parentElement
      if (message === null) {
        throw new Error('expected the message to sit inside a content element')
      }
      const ring = getComputedStyle(strip).outlineColor

      expect(ring).toBe(getComputedStyle(message).color)
      expect(ring).not.toBe(getComputedStyle(strip).backgroundColor)
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
