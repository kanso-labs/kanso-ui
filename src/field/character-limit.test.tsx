import type { ReactElement } from 'react'

import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import TextArea from '../components/text-area'
import TextField from '../components/text-field'

/**
 * What a screen reader is handed as the field's description: the text of
 * every element `aria-describedby` points at, in the order it points at them.
 */
function describedBy(control: Element): string {
  const ids = (control.getAttribute('aria-describedby') ?? '')
    .split(' ')
    .filter(Boolean)

  return ids
    .map((id) => {
      const described = document.querySelectorAll(`[id="${id}"]`)

      // React Aria gives every element in its description slot the same
      // generated id, so a second slotted description is a duplicate id
      // rather than a second description. Failing here is what catches it.
      expect(described).toHaveLength(1)

      return described[0].textContent
    })
    .join(' ')
}

const FIELDS: ReadonlyArray<{
  control: 'textbox'
  name: string
  render: (props: Record<string, unknown>) => ReactElement
}> = [
  {
    control: 'textbox',
    name: 'a text field',
    render: (props) => <TextField label="Label" {...props} />,
  },
  {
    control: 'textbox',
    name: 'a text area',
    render: (props) => <TextArea label="Label" {...props} />,
  },
]

describe('a field with a character limit', () => {
  it.each(FIELDS)('tells $name it has one', ({ render: renderField }) => {
    const view = render(renderField({ characterCount: true, maxLength: 10 }))

    expect(describedBy(view.getByRole('textbox'))).toContain(
      'Up to 10 characters',
    )
  })

  it.each(FIELDS)(
    'says it once beside the hint on $name',
    ({ render: renderField }) => {
      const view = render(
        renderField({
          characterCount: true,
          description: 'Supporting line',
          maxLength: 10,
        }),
      )
      const described = describedBy(view.getByRole('textbox'))

      expect(described).toContain('Supporting line')
      expect(described).toContain('Up to 10 characters')
    },
  )

  it.each(FIELDS)(
    'keeps the live count out of $name',
    ({ render: renderField }) => {
      const view = render(
        renderField({
          characterCount: true,
          defaultValue: 'abc',
          maxLength: 10,
        }),
      )
      const count = view.getByText('3/10')

      expect(count.getAttribute('aria-hidden')).toBe('true')
      expect(describedBy(view.getByRole('textbox'))).not.toContain('3/10')
    },
  )

  it.each(FIELDS)(
    'lets a call site say it on $name',
    ({ render: renderField }) => {
      const view = render(
        renderField({
          characterCount: true,
          characterLimitLabel: 'Dix caractères au plus',
          maxLength: 10,
        }),
      )

      expect(describedBy(view.getByRole('textbox'))).toContain(
        'Dix caractères au plus',
      )
    },
  )

  it.each(FIELDS)(
    'says one character rather than 1 characters on $name',
    ({ render: renderField }) => {
      const view = render(renderField({ characterCount: true, maxLength: 1 }))

      expect(describedBy(view.getByRole('textbox'))).toContain(
        'Up to 1 character',
      )
      expect(describedBy(view.getByRole('textbox'))).not.toContain('characters')
    },
  )

  // The message row is a flex line with 16dp between its parts, and an
  // element with no width is still a part — so a limit with no hint beside
  // it has to leave the flow rather than merely be invisible, or every such
  // field gains a gap.
  it.each(FIELDS)(
    'keeps a limit with no hint out of the flow on $name',
    ({ render: renderField }) => {
      const view = render(renderField({ characterCount: true, maxLength: 10 }))
      const id = (
        view.getByRole('textbox').getAttribute('aria-describedby') ?? ''
      ).split(' ')[0]
      const described = document.getElementById(id)

      if (described === null) {
        throw new Error('expected the field to name a description')
      }

      // The clip is on the wrapper React Aria renders, not on the described
      // element itself, so this asks whether anything between the two takes
      // it out of the row rather than which element carries the style.
      const row = described.closest('div')
      let outOfFlow = false

      for (
        let element: HTMLElement | null = described;
        element !== null && element !== row;
        element = element.parentElement
      ) {
        if (getComputedStyle(element).position === 'absolute') {
          outOfFlow = true
        }
      }

      expect(outOfFlow).toBe(true)
    },
  )

  // The message line is one line of type plus the 4dp above it, and a field
  // with nothing to say does not draw it. A limit is said to a reader and to
  // nobody else, so it must not bring the line along — it would make every
  // field carrying a limit taller than the same field without one.
  it.each(FIELDS)(
    'leaves the height of $name alone when only the limit is set',
    ({ render: renderField }) => {
      const plain = render(renderField({}))
      const before = plain.container.firstElementChild?.clientHeight

      plain.unmount()

      const limited = render(renderField({ maxLength: 10 }))
      const after = limited.container.firstElementChild?.clientHeight

      expect(before).toBeGreaterThan(0)
      expect(after).toBe(before)
    },
  )

  it.each(FIELDS)(
    'says nothing about a limit $name has none of',
    ({ render: renderField }) => {
      const view = render(renderField({ characterCount: true }))

      expect(describedBy(view.getByRole('textbox'))).not.toContain('Up to')
    },
  )
})
