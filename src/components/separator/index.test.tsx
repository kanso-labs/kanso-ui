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
