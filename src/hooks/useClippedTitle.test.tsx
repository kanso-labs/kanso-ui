import type { ReactNode } from 'react'

import * as stylex from '@stylexjs/stylex'
import { fireEvent, render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { useClippedTitle } from './useClippedTitle'

// A label box narrow enough to cut a sentence short and wide enough for a
// word, clipped to one line the way every label using the hook is.
const styles = stylex.create({
  label: {
    display: 'block',
    inlineSize: '80px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  wide: {
    inlineSize: '1000px',
  },
})

// React derives onPointerEnter from the bubbling pointerover.
function hover(element: HTMLElement) {
  fireEvent.pointerOver(element)
  return element
}

function Label({ children, wide }: { children: ReactNode; wide?: boolean }) {
  const clipped = useClippedTitle(children)

  return (
    <span
      data-testid="label"
      {...clipped}
      {...stylex.props(styles.label, wide === true && styles.wide)}
    >
      {children}
    </span>
  )
}

describe('useClippedTitle', () => {
  it('titles a label cut short with its full text', () => {
    const view = render(<Label>A label long enough to be cut short</Label>)

    expect(hover(view.getByTestId('label'))).toHaveAttribute(
      'title',
      'A label long enough to be cut short',
    )
  })

  it('leaves a label that fits untitled', () => {
    const view = render(<Label>Label</Label>)

    expect(hover(view.getByTestId('label'))).not.toHaveAttribute('title')
  })

  it('measures nothing before the pointer arrives', () => {
    const view = render(<Label>A label long enough to be cut short</Label>)

    expect(view.getByTestId('label')).not.toHaveAttribute('title')
  })

  it('reads a label made of text and numbers whole', () => {
    const view = render(<Label>A label long enough to be cut {1}</Label>)

    expect(hover(view.getByTestId('label'))).toHaveAttribute(
      'title',
      'A label long enough to be cut 1',
    )
  })

  it('gives a label holding an element nothing to show', () => {
    const view = render(
      <Label>
        <strong>A label</strong> long enough to be cut short
      </Label>,
    )

    expect(hover(view.getByTestId('label'))).not.toHaveAttribute('title')
  })

  it('drops the title once the label has room again', () => {
    const view = render(<Label>A label long enough to be cut short</Label>)
    hover(view.getByTestId('label'))

    view.rerender(<Label wide>A label long enough to be cut short</Label>)

    expect(hover(view.getByTestId('label'))).not.toHaveAttribute('title')
  })
})
