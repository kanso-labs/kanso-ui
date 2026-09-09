import * as stylex from '@stylexjs/stylex'
import { act, fireEvent, render, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import Snackbar from '.'
import { colors } from '../../tokens/design.tokens.stylex'

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

/** A fresh queue and a mounted region, since the queue outlives React. */
function setup() {
  const queue = new Snackbar.Queue()
  const view = render(<Snackbar queue={queue} />)
  return { queue, view }
}

/** The element carrying the alertdialog role: the snackbar's container. */
function snackbarIn(view: ReturnType<typeof render>) {
  return view.getByRole('alertdialog')
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
      let first = ''
      act(() => {
        first = queue.add('First item')
        queue.add('Second item')
      })
      await waitFor(() => {
        expect(view.getByText('Second item')).not.toBeNull()
      })

      act(() => {
        queue.close(queue.rac.visibleToasts[0]?.key ?? '')
      })

      await waitFor(() => {
        expect(view.getByText('First item')).not.toBeNull()
      })
      expect(first).not.toBe('')
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
    // A message alone is shown for the page's short duration; one carrying
    // an action for its long one, since the action has to be read first.
    it('leaves on its own after the short duration', () => {
      vi.useFakeTimers()
      try {
        const { queue, view } = setup()
        act(() => {
          queue.add('First item')
        })
        expect(view.getByText('First item')).not.toBeNull()

        act(() => {
          vi.advanceTimersByTime(1400)
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

    it('stays longer when there is an action to read', () => {
      vi.useFakeTimers()
      try {
        const { queue, view } = setup()
        act(() => {
          queue.add('First item', {
            action: { label: 'Undo', onPress: () => {} },
          })
        })

        act(() => {
          vi.advanceTimersByTime(1600)
        })
        expect(view.queryByText('First item')).not.toBeNull()

        act(() => {
          vi.advanceTimersByTime(1200)
        })
        expect(view.queryByText('First item')).toBeNull()
      } finally {
        vi.useRealTimers()
      }
    })

    it('takes a timeout of its own', () => {
      vi.useFakeTimers()
      try {
        const { queue, view } = setup()
        act(() => {
          queue.add('First item', { timeout: 10_000 })
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

    it('closes from the close button when it is dismissable', async () => {
      const { queue, view } = setup()
      act(() => {
        queue.add('First item', { isDismissable: true })
      })
      await waitFor(() => {
        expect(view.getByRole('button', { name: 'Close' })).not.toBeNull()
      })

      fireEvent.click(view.getByRole('button', { name: 'Close' }))

      await waitFor(() => {
        expect(view.queryByText('First item')).toBeNull()
      })
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
          isDismissable: true,
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
})
