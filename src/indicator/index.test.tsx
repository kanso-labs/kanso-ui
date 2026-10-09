import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import Meter from '../components/meter'
import ProgressIndicator from '../components/progress-indicator'

// The line above a linear indicator, which Meter and ProgressIndicator share:
// the label at its start and the value at its end.

// Narrower than the word below, as a phone's column is.
const NARROW = { inlineSize: '200px' }

// One word with nowhere to break.
const LONG_LABEL = 'Unterstützungszeilenüberschrift'

/** The value, which every case here draws as 40%. */
function valueIn(view: ReturnType<typeof render>) {
  return view.getByText(/^40\s?%$/)
}

describe('the label line', () => {
  // A word wider than the room held its line at its own width, pushed the
  // value off the end and widened the page.
  it.each([
    ['a meter', <Meter key="meter" label={LONG_LABEL} value={40} />],
    [
      'a progress indicator',
      <ProgressIndicator
        key="progress"
        label={LONG_LABEL}
        showValue
        value={40}
      />,
    ],
  ])('keeps the value in view beside a long label in %s', (_what, element) => {
    const view = render(<div style={NARROW}>{element}</div>)
    const room = view.container.firstElementChild!
    const value = valueIn(view)

    expect(room.scrollWidth).toBeLessThanOrEqual(room.clientWidth)
    expect(value.getBoundingClientRect().right).toBeLessThanOrEqual(
      room.getBoundingClientRect().right,
    )
    expect(value.getClientRects()).toHaveLength(1)
  })

  // A lone child of a line spaced between its ends sat at the start, so a
  // meter named by `aria-label` alone drew its value at the other edge from
  // a labelled one.
  it.each([
    { dir: 'ltr', edge: 'right' },
    { dir: 'rtl', edge: 'left' },
  ] as const)(
    'ends the line with the value when there is no label, $dir',
    ({ dir, edge }) => {
      const view = render(
        <div dir={dir} style={NARROW}>
          <Meter aria-label="Label" value={40} />
        </div>,
      )
      const room = view.container.firstElementChild!.getBoundingClientRect()
      const value = valueIn(view).getBoundingClientRect()

      expect(value[edge]).toBeCloseTo(room[edge], 0)
    },
  )
})
