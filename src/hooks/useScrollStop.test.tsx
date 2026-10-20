import { act, render, waitFor } from '@testing-library/react'
import { useRef } from 'react'
import { describe, expect, it } from 'vitest'

import { useScrollStop } from './useScrollStop'

// A box short enough that ten lines run past it, and one tall enough that
// they do not. The scrollbar's gutter is reserved in both, so a scrollbar
// arriving or leaving narrows nothing: without that, every change here also
// resized the lines, and each test passed through that instead of through
// the path it names.
const SHORT = {
  blockSize: '100px',
  overflowY: 'auto',
  scrollbarGutter: 'stable',
} as const
const TALL = {
  blockSize: '2000px',
  overflowY: 'auto',
  scrollbarGutter: 'stable',
} as const
// A line grown past the short box by its style alone, which is a change no
// mutation observer watching content sees.
const GROWN = { blockSize: '200px' } as const

/**
 * Lets the resize observer deliver the observations it makes of everything it
 * starts watching, which arrive a frame after it starts. A change made
 * sooner is measured by that first delivery, whatever path was meant to
 * catch it.
 */
async function observed() {
  await act(async () => {
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          resolve()
        })
      })
    })
  })
}

// A line wider than the short box, with nowhere to break, which is what makes
// a box scroll sideways alone.
const WIDE = { inlineSize: '2000px' } as const

function Probe({
  control,
  grown = false,
  label,
  lines,
  tall = false,
  title,
  wide = false,
}: {
  control?: 'button' | 'disabled' | 'removed'
  grown?: boolean
  label?: string
  lines: number
  tall?: boolean
  title?: string
  wide?: boolean
}) {
  const ref = useRef<HTMLDivElement>(null)
  const scrollStop = useScrollStop(ref, { label, title })

  return (
    <div
      data-testid="box"
      ref={ref}
      style={tall ? TALL : SHORT}
      {...scrollStop}
    >
      {control === 'button' || control === 'disabled' ? (
        <button disabled={control === 'disabled'} type="button">
          Label
        </button>
      ) : null}
      {control === 'removed' ? (
        <button tabIndex={-1} type="button">
          Label
        </button>
      ) : null}
      {Array.from({ length: lines }, (_, index) => (
        <p
          key={index}
          style={grown && index === 0 ? GROWN : wide ? WIDE : undefined}
        >
          Supporting line
        </p>
      ))}
    </div>
  )
}

/** Whether the box is a tab stop, read off what the hook put on it. */
function scrollingOf(view: ReturnType<typeof render>) {
  return String(view.getByTestId('box').getAttribute('tabindex') === '0')
}

describe('useScrollStop', () => {
  // Measured in a layout effect, so the first render already has the answer.
  it('reads content that fits and content that runs past the box', () => {
    const fits = render(<Probe lines={1} />)
    expect(scrollingOf(fits)).toBe('false')
    fits.unmount()

    const runs = render(<Probe lines={10} />)
    expect(scrollingOf(runs)).toBe('true')
  })

  // New lines are caught by the mutation observer, which also starts
  // watching the lines it adds.
  it('follows content that grows past the box', async () => {
    const view = render(<Probe lines={1} />)
    await observed()
    expect(scrollingOf(view)).toBe('false')

    view.rerender(<Probe lines={10} />)
    await waitFor(() => {
      expect(scrollingOf(view)).toBe('true')
    })
  })

  // A line grown by its style changes no content, so it is caught by
  // watching the lines' own sizes.
  it('follows a line that grows past the box', async () => {
    const view = render(<Probe lines={1} />)
    await observed()
    expect(scrollingOf(view)).toBe('false')

    view.rerender(<Probe grown lines={1} />)
    await waitFor(() => {
      expect(scrollingOf(view)).toBe('true')
    })
  })

  // A box resized with its content unchanged is caught by watching the box's
  // own size.
  it('follows the box growing to fit its content', async () => {
    const view = render(<Probe lines={10} />)
    await observed()
    expect(scrollingOf(view)).toBe('true')

    view.rerender(<Probe lines={10} tall />)
    await waitFor(() => {
      expect(scrollingOf(view)).toBe('false')
    })
  })

  // A body scrolled sideways alone, by a line with nowhere to break, is as
  // far out of a keyboard's reach as one scrolled down.
  it('reads content that runs past the box sideways', () => {
    const view = render(<Probe lines={1} wide />)
    const box = view.getByTestId('box')
    expect(box.scrollHeight).toBe(box.clientHeight)
    expect(scrollingOf(view)).toBe('true')
  })

  // A control inside is how a keyboard reaches the box and scrolls it, so a
  // stop of its own would only be one more press of Tab before the control.
  it('makes no stop of a box holding a control in the tab order', () => {
    const view = render(<Probe control="button" lines={10} />)
    expect(scrollingOf(view)).toBe('false')
  })

  it.each([
    ['a disabled control', 'disabled'],
    ['a control taken out of the tab order', 'removed'],
  ] as const)('makes a stop of a box holding only %s', (_case, control) => {
    const view = render(<Probe control={control} lines={10} />)
    expect(scrollingOf(view)).toBe('true')
  })

  // Content arriving and a control leaving the tab order are both caught by
  // the mutation observer.
  it('follows a control arriving and being disabled', async () => {
    const view = render(<Probe lines={10} />)
    await observed()
    expect(scrollingOf(view)).toBe('true')

    view.rerender(<Probe control="button" lines={10} />)
    await waitFor(() => {
      expect(scrollingOf(view)).toBe('false')
    })

    view.rerender(<Probe control="disabled" lines={10} />)
    await waitFor(() => {
      expect(scrollingOf(view)).toBe('true')
    })
  })

  describe('while it is a stop', () => {
    it('is a region named by the title', () => {
      const view = render(<Probe lines={10} title="title" />)
      const box = view.getByTestId('box')
      expect(box.getAttribute('role')).toBe('region')
      expect(box.getAttribute('aria-labelledby')).toBe('title')
    })

    // A label of the call site's own is spread over these, and an
    // aria-labelledby pointing at the title would outrank it.
    it('leaves the naming to a label of its own', () => {
      const view = render(<Probe label="Label" lines={10} title="title" />)
      const box = view.getByTestId('box')
      expect(box.getAttribute('role')).toBe('region')
      expect(box.hasAttribute('aria-labelledby')).toBe(false)
    })

    // A region with no name is not one, so an unnamed box stays a plain stop.
    it('is no region with nothing to name it', () => {
      const view = render(<Probe lines={10} />)
      const box = view.getByTestId('box')
      expect(box.tabIndex).toBe(0)
      expect(box.hasAttribute('role')).toBe(false)
    })

    it('is neither once it is no stop', () => {
      const view = render(<Probe lines={1} title="title" />)
      const box = view.getByTestId('box')
      expect(box.hasAttribute('role')).toBe(false)
      expect(box.hasAttribute('aria-labelledby')).toBe(false)
    })
  })
})
