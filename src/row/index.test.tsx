import type { StyleXStyles } from '@stylexjs/stylex'

import * as stylex from '@stylexjs/stylex'
import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { RowContent } from '.'
import {
  colors,
  stateLayerOpacity,
  typography,
} from '../tokens/design.tokens.stylex'
import { rowStyles } from './styles'

// The same declarations the module writes, so they hash to the same atomic
// classes — see chip/index.test.tsx for the pattern.
const probeStyles = stylex.create({
  bodyLarge: { fontSize: typography.bodyLargeSize },
  bodyMedium: { fontSize: typography.bodyMediumSize },
  disabledText: {
    color: `color-mix(in srgb, ${colors.onSurface} calc(${stateLayerOpacity.disabledContent} * 100%), ${colors.surface})`,
  },
  labelLarge: { fontSize: typography.labelLargeSize },
  muted: { color: colors.onSurfaceVariant },
  selectedListSurface: { backgroundColor: colors.primaryContainer },
  selectedListText: { color: colors.onPrimaryContainer },
  selectedMenuSurface: { backgroundColor: colors.tertiaryContainer },
  selectedMenuText: { color: colors.onTertiaryContainer },
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

// Scoped to the render's own container: two rows rendered in one test would
// otherwise both answer to the test id.
function rowWith(style: StyleXStyles) {
  const view = render(<div data-testid="row" {...stylex.props(style)} />)
  const row = view.container.firstElementChild
  if (!(row instanceof HTMLElement)) {
    throw new Error('expected the row to render an element')
  }
  return row
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

    it('keeps the supporting line in the muted role at body-medium', () => {
      const view = render(
        <RowContent supporting="Supporting line">Headline</RowContent>,
      )
      const supporting = view.getByText('Supporting line')
      expect(hasClasses(supporting, classesOf(probeStyles.muted))).toBe(true)
      expect(hasClasses(supporting, classesOf(probeStyles.bodyMedium))).toBe(
        true,
      )
    })

    // The two spec pages disagree about the headline: the lists page gives a
    // list item body-large, the menus page gives a menu item label-large.
    it('sets a list headline in body-large and a menu label in label-large', () => {
      const list = render(<RowContent>Headline</RowContent>)
      expect(
        hasClasses(
          list.getByText('Headline'),
          classesOf(probeStyles.bodyLarge),
        ),
      ).toBe(true)

      const menu = render(<RowContent variant="menu">Label</RowContent>)
      expect(
        hasClasses(menu.getByText('Label'), classesOf(probeStyles.labelLarge)),
      ).toBe(true)
    })
  })

  // The states a collection item applies from its render state. Each is pinned
  // to the token role it reaches for, since that is the whole of what the
  // module promises: one row, drawn the same everywhere the page allows.
  describe('states', () => {
    it('is transparent at rest so it takes the colour behind it', () => {
      expect(
        hasClasses(rowWith(rowStyles.base), classesOf(probeStyles.transparent)),
      ).toBe(true)
    })

    it('gives a list row the 56 floor and a menu row 48', () => {
      expect(
        getComputedStyle(rowWith([rowStyles.base, rowStyles.list])).minHeight,
      ).toBe('56px')
      expect(
        getComputedStyle(rowWith([rowStyles.base, rowStyles.menu])).minHeight,
      ).toBe('48px')
    })

    it('selects a list row on primary container, as the lists page gives it', () => {
      const row = rowWith([
        rowStyles.base,
        rowStyles.list,
        rowStyles.selectedList,
      ])
      expect(hasClasses(row, classesOf(probeStyles.selectedListSurface))).toBe(
        true,
      )
      expect(hasClasses(row, classesOf(probeStyles.selectedListText))).toBe(
        true,
      )
    })

    it('selects a menu row on tertiary container, as the menus page gives it', () => {
      const row = rowWith([
        rowStyles.base,
        rowStyles.menu,
        rowStyles.selectedMenu,
      ])
      expect(hasClasses(row, classesOf(probeStyles.selectedMenuSurface))).toBe(
        true,
      )
      expect(hasClasses(row, classesOf(probeStyles.selectedMenuText))).toBe(
        true,
      )
    })

    it('disabled mutes the text and drops the selected container', () => {
      const row = rowWith([
        rowStyles.base,
        rowStyles.list,
        rowStyles.selectedList,
        rowStyles.disabled,
      ])
      expect(hasClasses(row, classesOf(probeStyles.disabledText))).toBe(true)
      expect(hasClasses(row, classesOf(probeStyles.transparent))).toBe(true)
      expect(hasClasses(row, classesOf(probeStyles.selectedListSurface))).toBe(
        false,
      )
    })
  })
})
