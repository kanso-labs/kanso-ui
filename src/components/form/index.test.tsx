import type { SyntheticEvent } from 'react'

import { act, fireEvent, render } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import Form from '.'
import Button from '../button'
import Checkbox from '../checkbox'
import TextArea from '../text-area'
import TextField from '../text-field'

// Hoisted so each is one stable object per render rather than a fresh one,
// which is what react-perf's no-new-object-as-prop is after.
const SERVER_ERRORS = { name: 'Choose another name.' }
const SERVER_ERRORS_TWO = { name: ['Too short.', 'Taken.'] }

function formOf(view: ReturnType<typeof render>) {
  const form = view.getByRole('form')
  if (!(form instanceof HTMLFormElement)) {
    throw new Error('expected a form element')
  }
  return form
}

function messageOf(control: HTMLElement, view: ReturnType<typeof render>) {
  const ids = control.getAttribute('aria-describedby')?.split(' ') ?? []
  const messages = ids.map((id) => view.container.querySelector(`#${id}`))
  return messages.filter((element) => element !== null)
}

describe('form', () => {
  describe('semantics', () => {
    it('is a form, named when given a name', () => {
      const view = render(
        <Form aria-label="Label">
          <TextField label="Field" />
        </Form>,
      )
      const form = view.getByRole('form', { name: 'Label' })
      expect(form.tagName).toBe('FORM')
    })

    // The values are read inside the handler: React clears the synthetic
    // event's `currentTarget` once it has been dispatched.
    it('submits through a submit button and hands the event over', () => {
      const submitted: FormData[] = []
      const onSubmit = vi.fn<(event: SyntheticEvent<HTMLFormElement>) => void>(
        (event) => {
          event.preventDefault()
          submitted.push(new FormData(event.currentTarget))
        },
      )
      const view = render(
        <Form aria-label="Label" onSubmit={onSubmit}>
          <TextField defaultValue="typed" label="Field" name="field" />
          <Button type="submit">Submit</Button>
        </Form>,
      )
      fireEvent.click(view.getByRole('button', { name: 'Submit' }))
      expect(onSubmit).toHaveBeenCalledTimes(1)
      expect(submitted[0]?.get('field')).toBe('typed')
    })
  })

  describe('server errors', () => {
    // The errors are keyed by name and reach the field through React Aria's
    // context, so the field needs no prop of its own to show them.
    it('shows a server error under the field it names', () => {
      const view = render(
        <Form aria-label="Label" validationErrors={SERVER_ERRORS}>
          <TextField label="Name" name="name" />
          <TextField label="Other" name="other" />
        </Form>,
      )
      const named = view.getByLabelText('Name')
      expect(named.getAttribute('aria-invalid')).toBe('true')
      expect(messageOf(named, view).map((m) => m.textContent)).toContain(
        'Choose another name.',
      )
      const other = view.getByLabelText('Other')
      expect(other.getAttribute('aria-invalid')).not.toBe('true')
    })

    it('joins several errors for one field into one line', () => {
      const view = render(
        <Form aria-label="Label" validationErrors={SERVER_ERRORS_TWO}>
          <TextField label="Name" name="name" />
        </Form>,
      )
      expect(view.getByText('Too short. Taken.')).not.toBeNull()
    })

    // The description and the error occupy the same line, so a server error
    // replaces the description as a field's own `error` does.
    it('replaces the description with the server error', () => {
      const view = render(
        <Form aria-label="Label" validationErrors={SERVER_ERRORS}>
          <TextField description="Supporting line" label="Name" name="name" />
        </Form>,
      )
      expect(view.queryByText('Supporting line')).toBeNull()
      expect(view.getByText('Choose another name.')).not.toBeNull()
    })

    it('reaches a checkbox and a text area by name too', () => {
      const view = render(
        <Form aria-label="Label" validationErrors={SERVER_ERRORS}>
          <Checkbox name="name">Agree</Checkbox>
          <TextArea label="Note" name="name" />
        </Form>,
      )
      expect(view.getAllByText('Choose another name.')).toHaveLength(2)
      expect(view.getByLabelText('Note').getAttribute('aria-invalid')).toBe(
        'true',
      )
    })
  })

  describe('validation behaviour', () => {
    // Under `aria` a required field is marked required for a screen reader
    // and nothing stops submission; under `native` the browser holds the
    // constraint, which is the `required` attribute.
    it('marks fields through ARIA by default, inside a form as outside one', () => {
      const view = render(
        <Form aria-label="Label">
          <TextField isRequired label="Field" name="field" />
        </Form>,
      )
      const control = view.getByLabelText('Field')
      expect(control.getAttribute('aria-required')).toBe('true')
      expect(control.hasAttribute('required')).toBe(false)
      expect(view.getByRole('form').hasAttribute('novalidate')).toBe(true)
    })

    it('opts every field into native validation at once', () => {
      const view = render(
        <Form aria-label="Label" validationBehavior="native">
          <TextField isRequired label="Field" name="field" />
          <Checkbox isRequired name="agree">
            Agree
          </Checkbox>
        </Form>,
      )
      expect(view.getByLabelText('Field').hasAttribute('required')).toBe(true)
      expect(view.getByRole('checkbox').hasAttribute('required')).toBe(true)
      expect(view.getByRole('form').hasAttribute('novalidate')).toBe(false)
    })

    it("blocks a native submission and shows the browser's message", () => {
      const onSubmit = vi.fn<(event: SyntheticEvent<HTMLFormElement>) => void>(
        (event) => {
          event.preventDefault()
        },
      )
      const view = render(
        <Form
          aria-label="Label"
          onSubmit={onSubmit}
          validationBehavior="native"
        >
          <TextField isRequired label="Field" name="field" />
          <Button type="submit">Submit</Button>
        </Form>,
      )
      const control = view.getByLabelText('Field')
      expect(control.getAttribute('aria-invalid')).not.toBe('true')

      act(() => {
        formOf(view).requestSubmit()
      })
      expect(onSubmit).not.toHaveBeenCalled()
      expect(control.getAttribute('aria-invalid')).toBe('true')
      const [message] = messageOf(control, view)
      expect(message.textContent).not.toBe('')
      expect(document.activeElement).toBe(control)

      act(() => {
        fireEvent.change(control, { target: { value: 'typed' } })
      })
      act(() => {
        formOf(view).requestSubmit()
      })
      expect(onSubmit).toHaveBeenCalledTimes(1)
    })
  })
})
