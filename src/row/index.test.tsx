import type { StyleXStyles } from '@stylexjs/stylex'

import * as stylex from '@stylexjs/stylex'
import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { RowContent } from '.'
import { colors, stateLayerOpacity } from '../tokens/design.tokens.stylex'
import { rowStyles } from './styles'

// The same declarations the module writes, so they hash to the same atomic
// classes — see chip/index.test.tsx for the pattern.
const probeStyles = stylex.create({
  disabledText: {
    color: `color-mix(in srgb, ${colors.onSurface} calc(${stateLayerOpacity.disabledContent} * 100%), ${colors.surface})`,
  },
  muted: { color: colors.onSurfaceVariant },
  selectedSurface: { backgroundColor: colors.secondaryContainer },
  selectedText: { color: colors.onSecondaryContainer },
  transparent: { backgroundColor: 'transparent' },
})

function classesOf(style: StyleXStyles) {
  const classes = (stylex.props(style).className ?? '')
    .split(' ')
    .filter(Boolean)
  // An empty list would make every `every` below vacuously true, so it is a
  // broken assertion rather than a passing one.
  if (classes.length === 0) {
    throw new Error('expected the style to generate at least one class')
  }
  return classes
}

function hasClasses(element: HTMLElement, classes: string[]) {
  return classes.every((name) => element.classList.contains(name))
}

function rowWith(style: StyleXStyles) {
  const view = render(<div data-testid="row" {...stylex.props(style)} />)
  return view.getByTestId('row')
}

describe('row', () => {
  describe('content', () => {
    it('renders only the slots it was given', () => {
      const view = render(<RowContent>Headline</RowContent>)
      expect(view.container.textContent).toBe('Headline')
      // The headline's own span and its column: nothing for the slots left out.
      expect(view.container.querySelectorAll('span')).toHaveLength(2)
    })

    it('places leading, headline, supporting and trailing in reading order', () => {
      const view = render(
        <RowContent leading="01" supporting="Supporting line" trailing="02">
          Headline
        </RowContent>,
      )
      expect(view.container.textContent).toBe('01HeadlineSupporting line02')
    })

    it('keeps the supporting line in the muted role', () => {
      const view = render(
        <RowContent supporting="Supporting line">Headline</RowContent>,
      )
      expect(
        hasClasses(
          view.getByText('Supporting line'),
          classesOf(probeStyles.muted),
        ),
      ).toBe(true)
    })
  })

  // The states a collection item applies from its render state. Each is pinned
  // to the token role it reaches for, since that is the whole of what the
  // module promises: one row, drawn the same everywhere.
  describe('states', () => {
    it('is transparent at rest so it takes the colour behind it', () => {
      expect(
        hasClasses(rowWith(rowStyles.base), classesOf(probeStyles.transparent)),
      ).toBe(true)
    })

    it('selected takes the secondary container, as a selected chip does', () => {
      const row = rowWith([rowStyles.base, rowStyles.selected])
      expect(hasClasses(row, classesOf(probeStyles.selectedSurface))).toBe(true)
      expect(hasClasses(row, classesOf(probeStyles.selectedText))).toBe(true)
    })

    it('disabled mutes the text and drops the selected container', () => {
      const row = rowWith([
        rowStyles.base,
        rowStyles.selected,
        rowStyles.disabled,
      ])
      expect(hasClasses(row, classesOf(probeStyles.disabledText))).toBe(true)
      expect(hasClasses(row, classesOf(probeStyles.transparent))).toBe(true)
      expect(hasClasses(row, classesOf(probeStyles.selectedSurface))).toBe(
        false,
      )
    })
  })
})
