import * as stylex from '@stylexjs/stylex'
import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { colorScheme, themeScope } from './color-scheme'
import {
  colors,
  motion,
  radii,
  shadows,
  sizing,
  spacing,
  stateLayerOpacity,
  tokenScope,
  typography,
} from './tokens/design.tokens.stylex'

// The scheme's primary in design.tokens.json, light and dark, which are what
// a pinned scheme has to land on whatever the OS asks for.
const LIGHT_PRIMARY = 'rgb(103, 80, 164)'
const DARK_PRIMARY = 'rgb(208, 188, 255)'

const probeStyles = stylex.create({
  colors: { color: colors.primary },
  motion: { transitionDuration: motion.durationShort1 },
  radii: { borderTopLeftRadius: radii.sm },
  shadows: { boxShadow: shadows.elevation1 },
  sizing: { blockSize: sizing.controlMd },
  spacing: { paddingTop: spacing.md },
  stateLayerOpacity: { opacity: stateLayerOpacity.hover },
  typography: { fontFamily: typography.bodyLargeFont },
})

const OVERRIDE = { '--kui-color-primary': 'rgb(1, 2, 3)' }

/** The primary colour a probe reads inside `outer`, and `inner` within it. */
function primaryUnder(outer: string, inner = '', style = {}) {
  const view = render(
    <div className={outer} style={style}>
      <div className={inner}>
        <span data-testid="probe" {...stylex.props(probeStyles.colors)} />
      </div>
    </div>,
  )
  const colour = getComputedStyle(view.getByTestId('probe')).color
  view.unmount()
  return colour
}

// One custom property per var group the scope declares again, each moved
// well clear of its default, and the computed property a probe reads it
// through. Typography's is the plain face rather than a style's own font,
// since a style reaches it through an alias, and the alias has to resolve on
// the scope as well.
const GROUP_PROBES = [
  ['colors', '--kui-color-primary', 'rgb(1, 2, 3)', 'color'],
  ['motion', '--kui-motion-duration-short1', '900ms', 'transition-duration'],
  ['radii', '--kui-radius-sm', '13px', 'border-top-left-radius'],
  [
    'shadows',
    '--kui-shadow-elevation1',
    'rgb(1, 2, 3) 1px 2px 3px 0px',
    'box-shadow',
  ],
  ['sizing', '--kui-sizing-control-md', '77px', 'height'],
  ['spacing', '--kui-spacing-md', '17px', 'padding-top'],
  ['stateLayerOpacity', '--kui-state-layer-opacity-hover', '0.37', 'opacity'],
  [
    'typography',
    '--kui-typography-font-family-plain',
    'Courier',
    'font-family',
  ],
] as const

/** What `property` reads on a probe for `group`, inside `className`. */
function groupUnder(
  className: string,
  group: (typeof GROUP_PROBES)[number][0],
  style: Record<string, string>,
  property: string,
) {
  const view = render(
    <div style={style}>
      <div className={className}>
        <div data-testid="probe" {...stylex.props(probeStyles[group])} />
      </div>
    </div>,
  )
  const value = getComputedStyle(view.getByTestId('probe')).getPropertyValue(
    property,
  )
  view.unmount()
  return value
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
  // Each is a scope as well as a pin, so on an element smaller than `<html>`
  // the overrides around it reach inside, colours or not.
  it.each(['dark', 'light'] as const)(
    'scopes the subtree under the %s scheme',
    (scheme) => {
      expect(
        groupUnder(
          colorScheme[scheme],
          'radii',
          { '--kui-radius-sm': '13px' },
          'border-top-left-radius',
        ),
      ).toBe('13px')
    },
  )

  it.each(['dark', 'light'] as const)(
    'keeps an app override under the %s scheme',
    (scheme) => {
      expect(primaryUnder(colorScheme[scheme], '', OVERRIDE)).toBe(
        'rgb(1, 2, 3)',
      )
    },
  )
})

describe('themeScope', () => {
  it('names a class', () => {
    expect(themeScope).not.toBe('')
  })

  // The list above is the test's half of the generator's SCOPED_GROUPS, so a
  // group added there without a probe here fails rather than passing unread.
  it('has a probe for every group it declares again', () => {
    expect(tokenScope).toHaveLength(GROUP_PROBES.length)
  })

  // The override sits on the element around the scope, the harder of the
  // two places: on the scope itself it is in scope there just the same.
  it.each(GROUP_PROBES)(
    'resolves a %s override declared around it',
    (group, property, value, read) => {
      expect(groupUnder(themeScope, group, { [property]: value }, read)).toBe(
        value === '900ms' ? '0.9s' : value,
      )
    },
  )

  // What the scope is for, and so what proves the cases above are its work:
  // with no scope, the tokens a probe reads resolved on `:root`, and an
  // override on an element below it reaches nothing.
  it.each(GROUP_PROBES)(
    'leaves a %s override on a plain element unread',
    (group, property, value, read) => {
      expect(groupUnder('', group, { [property]: value }, read)).not.toBe(
        value === '900ms' ? '0.9s' : value,
      )
    },
  )

  it('follows the OS when nothing around it pins a scheme', () => {
    expect(primaryUnder(themeScope)).toBe(LIGHT_PRIMARY)
  })

  // A scope declares the colours again but not the defaults they fall back
  // to, which is what keeps a scope inside a dark page dark.
  it('keeps the scheme pinned around it', () => {
    expect(primaryUnder(colorScheme.dark, themeScope)).toBe(DARK_PRIMARY)
  })

  it('keeps an override under the scheme pinned around it', () => {
    expect(primaryUnder(colorScheme.dark, themeScope, OVERRIDE)).toBe(
      'rgb(1, 2, 3)',
    )
  })
})
