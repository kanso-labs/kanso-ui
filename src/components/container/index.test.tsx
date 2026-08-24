import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import Container from '.'

// Wider than any measure under test, so what is being read is the container's
// own limit rather than the room it was given. Cached for react-perf's
// no-new-object-as-prop, the way the Feed spec caches its widths.
const OUTER = { inlineSize: '1400px' }

// oxlint-disable-next-line jsx-a11y/heading-has-content -- filled by useRender
const SECTION = <section aria-label="Container" />

function renderContainer(element: React.ReactElement) {
  const view = render(<div style={OUTER}>{element}</div>)
  const container = view.container.firstElementChild?.firstElementChild
  if (!(container instanceof HTMLElement)) {
    throw new Error('expected the container to render an element')
  }
  return { container, view }
}

describe('measure', () => {
  it('stops growing at its measure', () => {
    const { container } = renderContainer(
      <Container maxInlineSize="600px" padding="none">
        First item
      </Container>,
    )

    expect(container.getBoundingClientRect().width).toBe(600)
  })

  it('centres the leftover space either side', () => {
    const { container, view } = renderContainer(
      <Container maxInlineSize="600px" padding="none">
        First item
      </Container>,
    )
    const outer = view.container.firstElementChild
    if (!(outer instanceof HTMLElement)) {
      throw new Error('expected the wrapper to render an element')
    }

    const outerBox = outer.getBoundingClientRect()
    const innerBox = container.getBoundingClientRect()

    expect(innerBox.left - outerBox.left).toBeCloseTo(
      outerBox.right - innerBox.right,
      1,
    )
  })

  it('fills the room it has when that is narrower than the measure', () => {
    const { container } = renderContainer(
      <Container maxInlineSize="2000px" padding="none">
        First item
      </Container>,
    )

    expect(container.getBoundingClientRect().width).toBe(1400)
  })

  it('falls back to the page measure', () => {
    const { container } = renderContainer(
      <Container padding="none">First item</Container>,
    )

    expect(container.getBoundingClientRect().width).toBe(960)
  })
})

describe('padding', () => {
  // The padding has to sit inside the measure rather than widen the box past
  // it, which is what box-sizing decides. Without it a padded container is
  // wider than the measure it was given, and two of them at the same measure
  // no longer line up.
  it('keeps the padding inside the measure', () => {
    const { container } = renderContainer(
      <Container maxInlineSize="600px">First item</Container>,
    )

    expect(getComputedStyle(container).boxSizing).toBe('border-box')
    expect(container.getBoundingClientRect().width).toBe(600)
  })

  it('closes the padding entirely on request', () => {
    const { container } = renderContainer(
      <Container maxInlineSize="600px" padding="none">
        First item
      </Container>,
    )

    expect(getComputedStyle(container).paddingLeft).toBe('0px')
  })

  it('pads by default', () => {
    const { container } = renderContainer(
      <Container maxInlineSize="600px">First item</Container>,
    )

    expect(Number.parseFloat(getComputedStyle(container).paddingLeft)).toBe(24)
  })
})

describe('element', () => {
  it('renders a div by default', () => {
    const { container } = renderContainer(<Container>First item</Container>)

    expect(container.tagName).toBe('DIV')
  })

  it('renders the element given to `render` instead, still measured', () => {
    const { container } = renderContainer(
      <Container maxInlineSize="600px" padding="none" render={SECTION}>
        First item
      </Container>,
    )

    expect(container.tagName).toBe('SECTION')
    expect(container.getBoundingClientRect().width).toBe(600)
  })
})
