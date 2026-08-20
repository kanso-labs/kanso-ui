import { act, render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import CopyField from '.'

const VALUE = 'first.second.third'
const COPIED_RESET_MS = 2000

// The real clipboard is unavailable outside a secure context and gated on
// permission besides, so these drive a stand-in and assert what the component
// hands it. Restored after each test, since it is a property of the shared
// navigator rather than of the tree under test.
type WriteText = (text: string) => Promise<void>

let writeText: ReturnType<typeof vi.fn<WriteText>>
let original: PropertyDescriptor | undefined

// The click handler awaits the clipboard promise before it sets any state, so
// the microtask queue has to drain inside act for React to see the update.
async function click(button: HTMLElement) {
  await act(async () => {
    button.click()
    await Promise.resolve()
  })
}

function install(behaviour: WriteText) {
  writeText = vi.fn<WriteText>(behaviour)
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: { writeText },
  })
}

function setup(props: Partial<Parameters<typeof CopyField>[0]> = {}) {
  const view = render(
    <CopyField data-testid="field" value={VALUE} {...props} />,
  )
  const field = view.getByTestId('field')
  return {
    ...view,
    button: view.getByRole('button'),
    field,
    status: view.getByRole('status'),
  }
}

beforeEach(() => {
  original = Object.getOwnPropertyDescriptor(navigator, 'clipboard')
  vi.useFakeTimers()
  install(async () => {})
})

afterEach(() => {
  vi.useRealTimers()
  if (original === undefined) {
    // @ts-expect-error -- removing a property the platform normally owns
    delete navigator.clipboard
  } else {
    Object.defineProperty(navigator, 'clipboard', original)
  }
})

describe('copyField', () => {
  describe('structure', () => {
    it('shows the value it would copy', () => {
      const { field } = setup()
      expect(field.textContent).toContain(VALUE)
    })

    it('offers the copy at rest', () => {
      const { button } = setup()
      expect(button.textContent).toBe('Copy')
    })

    it('takes its labels from the call site', () => {
      const { button } = setup({ copyLabel: 'Take' })
      expect(button.textContent).toBe('Take')
    })

    it('passes attributes through to the root', () => {
      const { field } = setup({ id: 'repo-url' })
      expect(field.id).toBe('repo-url')
    })
  })

  describe('copying', () => {
    it('writes the value to the clipboard', async () => {
      const { button } = setup()
      await click(button)
      expect(writeText).toHaveBeenCalledTimes(1)
      expect(writeText).toHaveBeenCalledWith(VALUE)
    })

    it('confirms on the button once the write lands', async () => {
      const { button } = setup()
      expect(button.textContent).toBe('Copy')
      await click(button)
      expect(button.textContent).toBe('Copied')
    })

    it('reports the value to the call site', async () => {
      const onCopied = vi.fn<(value: string) => void>()
      const { button } = setup({ onCopied })
      await click(button)
      expect(onCopied).toHaveBeenCalledWith(VALUE)
    })
  })

  // The dwell is the component's own timer, so it is driven rather than
  // waited on. A real wait here would race the assertion against the timer.
  describe('the dwell', () => {
    it('returns to offering the copy after the dwell', async () => {
      const { button } = setup()
      await click(button)
      expect(button.textContent).toBe('Copied')

      act(() => {
        vi.advanceTimersByTime(COPIED_RESET_MS)
      })
      expect(button.textContent).toBe('Copy')
    })

    it('still confirms just before the dwell is up', async () => {
      const { button } = setup()
      await click(button)

      act(() => {
        vi.advanceTimersByTime(COPIED_RESET_MS - 1)
      })
      // Guards the test above: an assertion that only ever ran after the full
      // dwell could not tell a working timer from one that never fired.
      expect(button.textContent).toBe('Copied')
    })

    it('restarts the dwell when copied again', async () => {
      const { button } = setup()
      await click(button)

      act(() => {
        vi.advanceTimersByTime(COPIED_RESET_MS - 100)
      })
      await click(button)
      act(() => {
        vi.advanceTimersByTime(COPIED_RESET_MS - 100)
      })
      expect(button.textContent).toBe('Copied')
    })

    it('leaves no timer behind when unmounted mid-dwell', async () => {
      const { button, unmount } = setup()
      await click(button)

      // Counted rather than inferred from a warning: React no longer reports
      // a setState on an unmounted tree, so a leaked dwell is silent. The
      // count is a comparison rather than an exact number because the ripple
      // on the copy button schedules a timer of its own, and how many it
      // leaves pending is useRipple's business rather than this component's.
      const pending = vi.getTimerCount()
      expect(pending).toBeGreaterThan(0)

      unmount()
      expect(vi.getTimerCount()).toBeLessThan(pending)
    })
  })

  // Refused outside a secure context and wherever the permission is denied.
  // The control must not claim a value reached the clipboard when it did not.
  describe('when the clipboard refuses', () => {
    it('stays at rest rather than confirming', async () => {
      install(async () => {
        await Promise.reject(new Error('denied'))
      })
      const { button } = setup()
      await click(button)
      expect(button.textContent).toBe('Copy')
    })

    it('tells the call site nothing was copied', async () => {
      install(async () => {
        await Promise.reject(new Error('denied'))
      })
      const onCopied = vi.fn<(value: string) => void>()
      const { button } = setup({ onCopied })
      await click(button)
      expect(onCopied).not.toHaveBeenCalled()
    })
  })

  // A button's own label changing is not reliably announced, so the
  // confirmation gets a live region of its own.
  describe('announcement', () => {
    it('says nothing at rest', () => {
      const { status } = setup()
      expect(status.textContent).toBe('')
    })

    it('announces the confirmation once the write lands', async () => {
      const { button, status } = setup()
      await click(button)
      expect(status.textContent).toBe('Copied')
    })

    it('clears the announcement after the dwell', async () => {
      const { button, status } = setup()
      await click(button)
      act(() => {
        vi.advanceTimersByTime(COPIED_RESET_MS)
      })
      expect(status.textContent).toBe('')
    })
  })
})
