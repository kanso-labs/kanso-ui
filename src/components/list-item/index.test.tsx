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
import { colors } from '../../tokens/design.tokens.stylex'

const probeStyles = stylex.create({
  onSurfaceVariant: { color: colors.onSurfaceVariant },
})

function probeColor(element: ReactElement) {
  const view = render(element)
  const color = getComputedStyle(view.getByTestId('probe')).color
  view.unmount()
  return color
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
      const view = render(<ListItem>Groceries</ListItem>)
      expect(view.getByText('Groceries')).not.toBeNull()
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
