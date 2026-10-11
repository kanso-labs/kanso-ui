import type { ReactNode } from 'react'

import * as stylex from '@stylexjs/stylex'
import { render } from '@testing-library/react'
import { useRef } from 'react'
import { describe, expect, it } from 'vitest'

import { useBottomEdgeClearance, useHoldBottomEdge } from './useBottomEdge'

const styles = stylex.create({
  // A bar pinned to the window's bottom edge, as an overlay's actions are.
  bar: (blockSize: string) => ({
    blockSize,
    boxSizing: 'border-box',
    insetBlockEnd: 0,
    insetInline: 0,
    position: 'fixed',
  }),
})

function Bar({
  blockSize,
  isHolding = true,
}: {
  blockSize: number
  isHolding?: boolean
}) {
  const ref = useRef<HTMLDivElement>(null)
  useHoldBottomEdge(ref, isHolding)
  return <div ref={ref} {...stylex.props(styles.bar(`${blockSize}px`))} />
}

function Clearance() {
  return <output>{useBottomEdgeClearance()}</output>
}

/** What the clearance reads with the given bars mounted. */
function clearanceWith(bars: ReactNode) {
  const view = render(
    <>
      {bars}
      <Clearance />
    </>,
  )
  return { text: () => view.getByRole('status').textContent, view }
}

describe('useBottomEdge', () => {
  it('reads 0 while nothing holds the edge', () => {
    expect(clearanceWith(null).text()).toBe('0')
  })

  it('reads the height of a bar holding the edge', () => {
    expect(clearanceWith(<Bar blockSize={56} />).text()).toBe('56')
  })

  it('reads nothing from a bar that does not hold it', () => {
    expect(clearanceWith(<Bar blockSize={56} isHolding={false} />).text()).toBe(
      '0',
    )
  })

  // Two overlays open at once, a sheet raised from a full-screen dialog, say:
  // a toast has to clear the taller.
  it('reads the tallest of several, and the next once that one goes', () => {
    const { text, view } = clearanceWith(
      <>
        <Bar blockSize={56} key="short" />
        <Bar blockSize={80} key="tall" />
      </>,
    )
    expect(text()).toBe('80')

    view.rerender(
      <>
        <Bar blockSize={56} key="short" />
        <Clearance />
      </>,
    )
    expect(text()).toBe('56')

    view.rerender(<Clearance />)
    expect(text()).toBe('0')
  })

  // The same bar, resized in place, as a footer is when a label wraps: what
  // reaches the clearance is the resize, not a new mount.
  it('follows a bar that grows', async () => {
    const { text, view } = clearanceWith(<Bar blockSize={56} key="bar" />)
    view.rerender(
      <>
        <Bar blockSize={72} key="bar" />
        <Clearance />
      </>,
    )

    await expect.poll(text).toBe('72')
  })
})
