import * as stylex from '@stylexjs/stylex'
import { render } from '@testing-library/react'
import { SeparatorContext } from 'react-aria-components'
import { describe, expect, it } from 'vitest'

import Separator from '.'
import { colors } from '../../tokens/design.tokens.stylex'

const styles = stylex.create({
  // Compared against an element styled straight from the token rather than a
  // hex literal, so the assertion pins which colour role a divider draws
  // from without also pinning what that role currently resolves to.
  border: {
    backgroundColor: colors.outlineVariant,
  },
  // A vertical separator has no length of its own, so it is measured inside
  // a flex row with a real height — the arrangement a consumer puts it in.
  harness: {
    alignItems: 'stretch',
    blockSize: '48px',
    display: 'flex',
  },
})

const HARNESS_HEIGHT = '48px'

// Hoisted rather than written at the prop, which is what react-perf's
// no-new-object-as-prop is after.
const FROM_CONTEXT = { id: 'from-context' }

function setup(props: Parameters<typeof Separator>[0] = {}) {
  const view = render(
    <div {...stylex.props(styles.harness)}>
      <Separator {...props} />
    </div>,
  )
  return { ...view, separator: view.getByRole('separator') }
}

// Hoisted so neither frame is a new object per render, which is what
// react-perf's no-new-object-as-prop is after.
const FRAME_WIDTH = 400
const INSET_FRAME = { inlineSize: `${FRAME_WIDTH}px` }
const INSET_COLUMN = { blockSize: '200px', display: 'flex' } as const

describe('separator', () => {
  it('exposes itself to assistive technology as a separator', () => {
    const { separator } = setup()
    expect(separator).toBeInstanceOf(HTMLElement)
  })

  it('draws a one-pixel rule across the axis it runs on', () => {
    const { separator: horizontal, unmount } = setup()
    expect(getComputedStyle(horizontal).height).toBe('1px')
    unmount()

    const { separator: vertical } = setup({ orientation: 'vertical' })
    expect(getComputedStyle(vertical).width).toBe('1px')
  })

  it('takes its length from the parent when vertical', () => {
    const { separator } = setup({ orientation: 'vertical' })
    // The harness is HARNESS_HEIGHT tall and nothing tells the separator so.
    expect(getComputedStyle(separator).height).toBe(HARNESS_HEIGHT)
  })

  it('draws in the same colour as a border', () => {
    const probe = render(
      <div data-testid="probe" {...stylex.props(styles.border)} />,
    )
    const expected = getComputedStyle(
      probe.getByTestId('probe'),
    ).backgroundColor
    probe.unmount()

    const { separator } = setup()
    expect(getComputedStyle(separator).backgroundColor).toBe(expected)
    // Guards the comparison: a transparent probe would satisfy it trivially.
    expect(expected).not.toBe('rgba(0, 0, 0, 0)')
  })

  // The orientation drives the accessibility tree, not only which side the
  // rule is drawn on. Horizontal is an <hr>, whose role and orientation are
  // implicit; vertical has to be a <div> told both, since an <hr> is
  // horizontal by definition.
  // The divider page's three forms: full width, inset 16dp at the leading
  // end, and middle-inset 16dp at both. Measured rather than asserted on the
  // margin alone, because a margin outside a `100%` box overflows the parent
  // — the length has to give way with it.
  describe('inset', () => {
    function measure(inset?: 'both' | 'start') {
      const view = render(
        <div style={INSET_FRAME}>
          <Separator data-testid="rule" inset={inset} />
        </div>,
      )
      const rule = view.getByTestId('rule')
      const box = rule.getBoundingClientRect()
      const style = getComputedStyle(rule)
      const read = {
        end: style.marginInlineEnd,
        start: style.marginInlineStart,
        width: Math.round(box.width),
      }
      view.unmount()
      return read
    }

    it('runs the full width by default', () => {
      expect(measure()).toStrictEqual({
        end: '0px',
        start: '0px',
        width: FRAME_WIDTH,
      })
    })

    it('holds the rule off the leading end alone', () => {
      expect(measure('start')).toStrictEqual({
        end: '0px',
        start: '16px',
        width: FRAME_WIDTH - 16,
      })
    })

    it('holds the rule off both ends', () => {
      expect(measure('both')).toStrictEqual({
        end: '16px',
        start: '16px',
        width: FRAME_WIDTH - 32,
      })
    })

    // A vertical rule takes its length from the parent, so the inset goes on
    // the block axis and shortens it rather than moving it sideways.
    it('shortens a vertical rule rather than moving it', () => {
      const view = render(
        <div style={INSET_COLUMN}>
          <Separator data-testid="rule" inset="both" orientation="vertical" />
        </div>,
      )
      const rule = view.getByTestId('rule')
      const style = getComputedStyle(rule)

      expect(style.marginBlockStart).toBe('16px')
      expect(style.marginBlockEnd).toBe('16px')
      expect(style.marginInlineStart).toBe('0px')
      expect(Math.round(rule.getBoundingClientRect().height)).toBe(200 - 32)
    })
  })

  describe('orientation', () => {
    it('renders a horizontal rule with the semantics an hr carries', () => {
      const { separator } = setup()
      expect(separator.tagName).toBe('HR')
      expect(separator.hasAttribute('aria-orientation')).toBe(false)
    })

    it('renders a vertical rule as a div told its orientation', () => {
      const { separator } = setup({ orientation: 'vertical' })
      expect(separator.tagName).toBe('DIV')
      expect(separator.getAttribute('role')).toBe('separator')
      expect(separator.getAttribute('aria-orientation')).toBe('vertical')
    })

    it('renders a different element when asked', () => {
      const { separator } = setup({ elementType: 'div' })
      expect(separator.tagName).toBe('DIV')
      expect(separator.getAttribute('role')).toBe('separator')
    })
  })

  // The reason this is React Aria's Separator rather than a styled element of
  // the library's own: a Menu or Toolbar around it hands props down through
  // this context, and a separator that ignored them would sit outside the
  // collection it divides.
  it('takes props a parent hands down through context', () => {
    const view = render(
      <SeparatorContext value={FROM_CONTEXT}>
        <Separator />
      </SeparatorContext>,
    )
    expect(view.getByRole('separator').id).toBe('from-context')
  })
})
