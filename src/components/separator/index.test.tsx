import * as stylex from '@stylexjs/stylex'
import { render } from '@testing-library/react'
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

  // Base UI spells out aria-orientation in both directions rather than
  // leaving the horizontal case to the role's implicit value. That is worth
  // pinning because it is the reason this wraps Base UI's separator instead
  // of styling a bare div: the orientation prop drives the accessibility
  // tree, not only which side the rule is drawn on.
  it('reflects its orientation for assistive technology', () => {
    const { separator, unmount } = setup({ orientation: 'vertical' })
    expect(separator.getAttribute('aria-orientation')).toBe('vertical')
    unmount()

    const { separator: horizontal } = setup()
    expect(horizontal.getAttribute('aria-orientation')).toBe('horizontal')
  })
})
