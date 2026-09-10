// The leading and trailing slots take nodes, so passing JSX to them is this
// component's API rather than a misuse of it — and in a list the node depends
// on the row's own data, so there is nothing to hoist. react-perf guards
// against a fresh element identity defeating memoization, which the React
// Compiler this repo builds with already handles.
// oxlint-disable react-perf/jsx-no-jsx-as-prop

import type { ReactElement } from 'react'

import * as stylex from '@stylexjs/stylex'
import { render } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import ListItem from '.'
import { colors, typography } from '../../tokens/design.tokens.stylex'

const probeStyles = stylex.create({
  bodyLarge: { fontSize: typography.bodyLargeSize },
  bodyMedium: { fontSize: typography.bodyMediumSize },
  labelSmall: { fontSize: typography.labelSmallSize },
  onSurfaceVariant: { color: colors.onSurfaceVariant },
})

function probeColor(element: ReactElement) {
  const view = render(element)
  const color = getComputedStyle(view.getByTestId('probe')).color
  view.unmount()
  return color
}

function probeFontSize(element: ReactElement) {
  const view = render(element)
  const size = getComputedStyle(view.getByTestId('probe')).fontSize
  view.unmount()
  return size
}

// Narrows with instanceof rather than an assertion, so a row that failed to
// render fails here instead of further down with something obscure.
function rowIn(container: HTMLElement) {
  const row = container.firstElementChild
  if (!(row instanceof HTMLElement)) {
    throw new Error('expected the row to render an element')
  }
  return row
}

describe('list item', () => {
  describe('slots', () => {
    it('renders only the slots it was given', () => {
      const view = render(<ListItem>Headline</ListItem>)
      expect(view.getByText('Headline')).not.toBeNull()
      expect(view.queryByText('leading')).toBeNull()
      expect(view.queryByText('trailing')).toBeNull()
      // Headline only: the row is the headline's wrapper plus nothing else.
      expect(rowIn(view.container).childElementCount).toBe(1)
    })

    it('places leading, headline, supporting, and trailing in reading order', () => {
      const view = render(
        <ListItem
          leading={<span>leading</span>}
          supporting="supporting"
          trailing={<span>trailing</span>}
        >
          headline
        </ListItem>,
      )
      const text = rowIn(view.container).textContent
      expect(text).toBe('leadingheadlinesupportingtrailing')
    })

    // The lists spec page's type roles: a body-large headline over a
    // body-medium supporting line, compared by computed size against probes
    // styled from the tokens so a retuned scale moves both together.
    it('sets the headline in body-large and the supporting line in body-medium', () => {
      const headlineSize = probeFontSize(
        <div data-testid="probe" {...stylex.props(probeStyles.bodyLarge)} />,
      )
      const supportingSize = probeFontSize(
        <div data-testid="probe" {...stylex.props(probeStyles.bodyMedium)} />,
      )
      expect(headlineSize).not.toBe(supportingSize)

      const view = render(<ListItem supporting="supporting">headline</ListItem>)
      expect(getComputedStyle(view.getByText('headline')).fontSize).toBe(
        headlineSize,
      )
      expect(getComputedStyle(view.getByText('supporting')).fontSize).toBe(
        supportingSize,
      )
    })

    it('keeps the supporting line in the muted role', () => {
      const expected = probeColor(
        <div
          data-testid="probe"
          {...stylex.props(probeStyles.onSurfaceVariant)}
        />,
      )
      const view = render(<ListItem supporting="supporting">headline</ListItem>)
      const supporting = view.getByText('supporting')
      expect(getComputedStyle(supporting).color).toBe(expected)
      // Guards the comparison: the headline must not already be this colour,
      // or the assertion would hold however the supporting line was styled.
      expect(getComputedStyle(view.getByText('headline')).color).not.toBe(
        expected,
      )
    })
  })

  describe('layout', () => {
    it('holds a minimum row height even with a single line', () => {
      const view = render(<ListItem>headline</ListItem>)
      expect(getComputedStyle(rowIn(view.container)).minHeight).toBe('56px')
    })

    // Deliberately one unbroken token. Ordinary prose wraps, so its
    // min-content width is a single word and the column shrinks whether or
    // not min-width: 0 is set — a version of this test written with a normal
    // sentence passes against a component that has lost it.
    it('keeps an unbreakable headline from pushing the trailing slot out', () => {
      const view = render(
        <ListItem
          leading={<span>lead</span>}
          trailing={<span data-testid="trailing">trailing</span>}
        >
          aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
        </ListItem>,
      )
      const row = rowIn(view.container)
      row.style.width = '260px'

      const rowRight = row.getBoundingClientRect().right
      const trailingRight = view
        .getByTestId('trailing')
        .getBoundingClientRect().right
      expect(trailingRight).toBeLessThanOrEqual(rowRight)
    })
  })

  // The lists page's overline: a line above the headline in label-small,
  // taking the same muted role the supporting line does.
  describe('overline', () => {
    it('draws it above the headline', () => {
      const view = render(<ListItem overline="Overline">Headline</ListItem>)
      const main = view.getByText('Headline').parentElement

      expect(main?.textContent).toBe('OverlineHeadline')
      expect(main?.firstElementChild?.textContent).toBe('Overline')
    })

    it('sets it in the page label-small role', () => {
      const expected = probeFontSize(
        <span data-testid="probe" {...stylex.props(probeStyles.labelSmall)} />,
      )
      const view = render(<ListItem overline="Overline">Headline</ListItem>)

      expect(getComputedStyle(view.getByText('Overline')).fontSize).toBe(
        expected,
      )
      expect(expected).not.toBe(
        getComputedStyle(view.getByText('Headline')).fontSize,
      )
    })

    it('draws it in the muted role', () => {
      const expected = probeColor(
        <span
          data-testid="probe"
          {...stylex.props(probeStyles.onSurfaceVariant)}
        />,
      )
      const view = render(<ListItem overline="Overline">Headline</ListItem>)

      expect(getComputedStyle(view.getByText('Overline')).color).toBe(expected)
    })

    it('draws nothing when it is not given', () => {
      const view = render(<ListItem>Headline</ListItem>)
      expect(view.queryByText('Overline')).toBeNull()
    })
  })

  // The page's three-line item, which is the only row whose slots move: an
  // overline, a headline and a supporting line together take an 88dp floor
  // with the leading and trailing slots held at the top.
  describe('three lines', () => {
    it('takes the page floor and holds its slots at the top', () => {
      const view = render(
        <ListItem overline="Overline" supporting="Supporting line">
          Headline
        </ListItem>,
      )
      const style = getComputedStyle(rowIn(view.container))

      expect(style.minHeight).toBe('88px')
      expect(style.alignItems).toBe('flex-start')
    })

    it('stays a centred two-line row with an overline alone', () => {
      const view = render(<ListItem overline="Overline">Headline</ListItem>)
      const style = getComputedStyle(rowIn(view.container))

      expect(style.minHeight).toBe('56px')
      expect(style.alignItems).toBe('center')
    })

    it('stays a centred two-line row with a supporting line alone', () => {
      const view = render(
        <ListItem supporting="Supporting line">Headline</ListItem>,
      )
      const style = getComputedStyle(rowIn(view.container))

      expect(style.minHeight).toBe('56px')
      expect(style.alignItems).toBe('center')
    })

    it('holds its slots at the top while interactive too', () => {
      const view = render(
        <ListItem interactive overline="Overline" supporting="Supporting line">
          Headline
        </ListItem>,
      )
      expect(getComputedStyle(rowIn(view.container)).alignItems).toBe(
        'flex-start',
      )
    })
  })

  describe('interactive', () => {
    it('renders a plain container with no ripple by default', () => {
      const view = render(<ListItem>headline</ListItem>)
      expect(view.queryByRole('button')).toBeNull()
      expect(
        view.container.querySelector('span[aria-hidden="true"]'),
      ).toBeNull()
    })

    it('renders a button that ripples when interactive', () => {
      const view = render(<ListItem interactive>headline</ListItem>)
      const button = view.getByRole('button')
      expect(button.getAttribute('type')).toBe('button')
      expect(
        view.container.querySelector('span[aria-hidden="true"]'),
      ).not.toBeNull()
    })

    it('calls onClick when an interactive row is pressed', () => {
      const onClick = vi.fn<() => void>()
      const view = render(
        <ListItem interactive onClick={onClick}>
          headline
        </ListItem>,
      )
      view.getByRole('button').click()
      expect(onClick).toHaveBeenCalledTimes(1)
    })

    // The row's own background is transparent so it tints whatever it sits
    // on, which is why this composites over transparent rather than over a
    // container colour the way Card's does.
    it('is transparent at rest so it takes the colour behind it', () => {
      const view = render(<ListItem interactive>headline</ListItem>)
      expect(getComputedStyle(view.getByRole('button')).backgroundColor).toBe(
        'rgba(0, 0, 0, 0)',
      )
    })
  })
})
