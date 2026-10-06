import * as stylex from '@stylexjs/stylex'
import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { colorScheme } from './color-scheme'
import { colors } from './tokens/design.tokens.stylex'

// The scheme's primary in design.tokens.json, light and dark, which are what
// a pinned scheme has to land on whatever the OS asks for.
const LIGHT_PRIMARY = 'rgb(103, 80, 164)'
const DARK_PRIMARY = 'rgb(208, 188, 255)'

const probeStyles = stylex.create({
  primary: { color: colors.primary },
})

const OVERRIDE = { '--kui-color-primary': 'rgb(1, 2, 3)' }

/** The primary colour a probe reads inside `outer`, and `inner` within it. */
function primaryUnder(outer: string, inner = '', style = {}) {
  const view = render(
    <div className={outer} style={style}>
      <div className={inner}>
        <span data-testid="probe" {...stylex.props(probeStyles.primary)} />
      </div>
    </div>,
  )
  const colour = getComputedStyle(view.getByTestId('probe')).color
  view.unmount()
  return colour
}

describe('colorScheme', () => {
  it('names two classes, one per scheme', () => {
    expect(colorScheme.dark).not.toBe('')
    expect(colorScheme.light).not.toBe('')
    expect(colorScheme.dark).not.toBe(colorScheme.light)
  })

  // The runner's OS asks for light, so the dark class has to be what
  // turns it dark.
  it('pins the dark scheme against a light OS', () => {
    expect(primaryUnder(colorScheme.dark)).toBe(DARK_PRIMARY)
  })

  // Nested inside the dark class, which stands in for a dark OS, since no
  // test can set the media query: the light class is what turns it back.
  it('pins the light scheme inside a dark one', () => {
    expect(primaryUnder(colorScheme.dark, colorScheme.light)).toBe(
      LIGHT_PRIMARY,
    )
  })

  // A pinned scheme reads the same `--kui-color-*` the OS's one does, so an
  // app's own override still applies under it. A bare value in the class
  // would win over the override instead.
  it.each(['dark', 'light'] as const)(
    'keeps an app override under the %s scheme',
    (scheme) => {
      expect(primaryUnder(colorScheme[scheme], '', OVERRIDE)).toBe(
        'rgb(1, 2, 3)',
      )
    },
  )
})
