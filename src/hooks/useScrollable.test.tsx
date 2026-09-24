import { act, render, waitFor } from '@testing-library/react'
import { useRef } from 'react'
import { describe, expect, it } from 'vitest'

import { useScrollable } from './useScrollable'

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

function Probe({
  grown = false,
  lines,
  tall = false,
}: {
  grown?: boolean
  lines: number
  tall?: boolean
}) {
  const ref = useRef<HTMLDivElement>(null)
  const scrollable = useScrollable(ref)

  return (
    <div
      data-scrollable={scrollable}
      data-testid="box"
      ref={ref}
      style={tall ? TALL : SHORT}
    >
      {Array.from({ length: lines }, (_, index) => (
        <p key={index} style={grown && index === 0 ? GROWN : undefined}>
          Supporting line
        </p>
      ))}
    </div>
  )
}

function scrollingOf(view: ReturnType<typeof render>) {
  return view.getByTestId('box').getAttribute('data-scrollable')
}

describe('useScrollable', () => {
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
})
