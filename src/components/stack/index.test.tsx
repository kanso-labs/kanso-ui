import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import Stack from '.'
import { spacingPx } from '../../tokens/values'

// Wide enough that a row only wraps when it is told to, so the wrap
// assertions are reading the prop rather than the room. Cached for
// react-perf's no-new-object-as-prop.
const OUTER = { inlineSize: '400px' }

const NAV = <nav aria-label="Stack" />

function Items() {
  return (
    <>
      <span>First item</span>
      <span>Second item</span>
    </>
  )
}

function renderStack(element: React.ReactElement) {
  const view = render(<div style={OUTER}>{element}</div>)
  const stack = view.container.firstElementChild?.firstElementChild
  if (!(stack instanceof HTMLElement)) {
    throw new Error('expected the stack to render an element')
  }
  return { stack, view }
}

describe('direction', () => {
  it('runs down the block axis by default', () => {
    const { stack } = renderStack(
      <Stack>
        <Items />
      </Stack>,
    )

    expect(getComputedStyle(stack).flexDirection).toBe('column')
  })

  it('runs across on request', () => {
    const { stack } = renderStack(
      <Stack direction="row">
        <Items />
      </Stack>,
    )

    expect(getComputedStyle(stack).flexDirection).toBe('row')
  })
})

describe('gap', () => {
  // Read as the resolved pixel value rather than as a class, because what a
  // consumer cares about is that `gap="lg"` is the scale's lg and not merely
  // that some gap was applied.
  it('takes each step from the spacing scale', () => {
    const steps = [
      ['xxs', spacingPx.xxs],
      ['sm', spacingPx.sm],
      ['lg', spacingPx.lg],
      ['xxxl', spacingPx.xxxl],
    ] as const

    for (const [step, expected] of steps) {
      const { stack, view } = renderStack(
        <Stack gap={step}>
          <Items />
        </Stack>,
      )

      expect(Number.parseFloat(getComputedStyle(stack).rowGap)).toBe(expected)
      view.unmount()
    }
  })

  it('closes the gap entirely on `none`', () => {
    const { stack } = renderStack(
      <Stack gap="none">
        <Items />
      </Stack>,
    )

    expect(Number.parseFloat(getComputedStyle(stack).rowGap)).toBe(0)
  })

  it('defaults to a middle step of the scale', () => {
    const { stack } = renderStack(
      <Stack>
        <Items />
      </Stack>,
    )

    expect(Number.parseFloat(getComputedStyle(stack).rowGap)).toBe(spacingPx.md)
  })
})

describe('alignment', () => {
  // A flex column stretches its children, which is what makes every card in
  // one the same width — and what makes an inline-sized child span the whole
  // stack until `align` says otherwise.
  it('stretches its children until told not to', () => {
    const { stack } = renderStack(
      <Stack>
        <Items />
      </Stack>,
    )

    expect(getComputedStyle(stack).alignItems).toBe('normal')
  })

  it('lets a child keep its own width', () => {
    const { stack } = renderStack(
      <Stack align="start">
        <Items />
      </Stack>,
    )
    const child = stack.firstElementChild
    if (!(child instanceof HTMLElement)) {
      throw new Error('expected the stack to render its children')
    }

    expect(getComputedStyle(stack).alignItems).toBe('flex-start')
    expect(child.getBoundingClientRect().width).toBeLessThan(400)
  })

  it('distributes leftover space along the stack', () => {
    const { stack } = renderStack(
      <Stack direction="row" justify="between">
        <Items />
      </Stack>,
    )

    expect(getComputedStyle(stack).justifyContent).toBe('space-between')
  })
})

describe('wrap', () => {
  it('overflows rather than wrapping by default', () => {
    const { stack } = renderStack(
      <Stack direction="row">
        <Items />
      </Stack>,
    )

    expect(getComputedStyle(stack).flexWrap).toBe('nowrap')
  })

  it('wraps a row onto further lines on request', () => {
    const { stack } = renderStack(
      <Stack direction="row" wrap>
        <Items />
      </Stack>,
    )

    expect(getComputedStyle(stack).flexWrap).toBe('wrap')
  })
})

describe('element', () => {
  it('renders a div by default', () => {
    const { stack } = renderStack(
      <Stack>
        <Items />
      </Stack>,
    )

    expect(stack.tagName).toBe('DIV')
  })

  it('renders the element given to `render` instead, still stacked', () => {
    const { stack } = renderStack(
      <Stack direction="row" render={NAV}>
        <Items />
      </Stack>,
    )

    expect(stack.tagName).toBe('NAV')
    expect(getComputedStyle(stack).flexDirection).toBe('row')
  })
})
