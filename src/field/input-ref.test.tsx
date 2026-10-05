import type { ReactElement, Ref } from 'react'

import { render } from '@testing-library/react'
import { createRef } from 'react'
import { describe, expect, it } from 'vitest'

import ColorField from '../components/color-field'
import ComboBox from '../components/combo-box'
import NumberField from '../components/number-field'
import SearchField from '../components/search-field'
import TextArea from '../components/text-area'
import TextField from '../components/text-field'

// A field's `ref` is the field as a whole, which is what a layout positions.
// What a call site moves focus to — after a server's error, or when a dialog
// opens on a form — is the control inside it, so each field that draws one
// hands it out as `inputRef`.
const INPUTS: ReadonlyArray<{
  field: (ref: Ref<HTMLInputElement>) => ReactElement
  name: string
}> = [
  {
    field: (ref) => <ColorField inputRef={ref} label="Label" />,
    name: 'ColorField',
  },
  {
    field: (ref) => <ComboBox inputRef={ref} label="Label" />,
    name: 'ComboBox',
  },
  {
    field: (ref) => <NumberField inputRef={ref} label="Label" />,
    name: 'NumberField',
  },
  {
    field: (ref) => <SearchField inputRef={ref} label="Label" />,
    name: 'SearchField',
  },
  {
    field: (ref) => <TextField inputRef={ref} label="Label" />,
    name: 'TextField',
  },
]

describe('inputRef', () => {
  it.each(INPUTS)('hands $name its <input>', ({ field }) => {
    const ref = createRef<HTMLInputElement>()
    const view = render(field(ref))

    expect(ref.current).toBe(view.container.querySelector('input'))
    expect(ref.current).toBeInstanceOf(HTMLInputElement)
  })

  it('hands TextArea its <textarea>', () => {
    const ref = createRef<HTMLTextAreaElement>()
    const view = render(<TextArea inputRef={ref} label="Label" />)

    expect(ref.current).toBe(view.container.querySelector('textarea'))
    expect(ref.current).toBeInstanceOf(HTMLTextAreaElement)
  })
})
