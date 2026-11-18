import type { ComponentProps } from 'react'

import { act, fireEvent, render } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import TextField from '../components/text-field'

// What typing re-renders in a field's chrome. The label the field draws is
// `FieldLabel`, which renders React Aria's `Label` and nothing else, so a
// stand-in for `Label` that counts and then draws the real one counts the
// renders of `FieldLabel` that reached it: one `FieldLabel` skipped hands
// down the element it handed down last time, and React does not call the
// stand-in again. The React Compiler runs over the library here as it does in
// a build, so what is counted is the memoisation a consumer gets.
const renders = vi.hoisted(() => ({ label: 0 }))

// Called from the stand-in rather than written in it, since the compiler
// refuses a component that writes to a module's variable.
function countLabel() {
  renders.label += 1
}

vi.mock('react-aria-components', async (original) => {
  const actual = await original<typeof import('react-aria-components')>()
  function CountedLabel(props: ComponentProps<typeof actual.Label>) {
    countLabel()
    return <actual.Label {...props} />
  }
  return { ...actual, Label: CountedLabel }
})

function typeInto(input: HTMLElement, value: string) {
  act(() => {
    fireEvent.change(input, { target: { value } })
  })
}

describe('typing into a field', () => {
  // The label's colour follows focus, so focusing the field renders it. The
  // characters after that change nothing it draws: the label has already
  // floated for the focus, and stays in the focused colour. Before, React
  // Aria's render state was handed down whole, a new object on every
  // keystroke, and the label rendered once per character.
  it.each(['filled', 'outlined'] as const)(
    'renders the %s label as focus arrives, and not as characters do',
    (variant) => {
      const view = render(<TextField label="Label" variant={variant} />)
      const input = view.getByRole('textbox')

      renders.label = 0
      act(() => {
        input.focus()
      })
      expect(renders.label).toBeGreaterThan(0)

      renders.label = 0
      typeInto(input, 'a')
      typeInto(input, 'ab')
      typeInto(input, 'abc')
      typeInto(input, 'abcd')

      expect(input).toHaveValue('abcd')
      expect(renders.label).toBe(0)
    },
  )

  // What the label draws does follow the value where focus does not hide
  // it: an empty, unfocused field holds its label in the box, and a value
  // arriving floats it. Pinned so the test above cannot pass on a label
  // that never renders at all.
  it('renders the label when a value arrives in an unfocused field', () => {
    const view = render(<TextField label="Label" />)
    const input = view.getByRole('textbox')

    renders.label = 0
    typeInto(input, 'a')

    expect(renders.label).toBeGreaterThan(0)
  })
})
