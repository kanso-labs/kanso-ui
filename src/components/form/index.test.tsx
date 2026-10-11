import type { InputEventHandler, SyntheticEvent } from 'react'

import { act, fireEvent, render } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import Form from '.'
import Button from '../button'
import Checkbox from '../checkbox'
import TextArea from '../text-area'
import TextField from '../text-field'

/** Where the second of two stacked fields starts, which is what shifts. */
function secondFieldTop(view: ReturnType<typeof render>) {
  const second = [...formOf(view).children][1]
  if (!(second instanceof HTMLElement)) {
    throw new Error('expected the form to hold two fields')
  }
  return second.getBoundingClientRect().top
}

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

/**
 * Types `value` into a control that keeps focus: an `input` event and no
 * `change`, which a text control fires only once focus leaves.
 */
function typeInto(control: HTMLElement, value: string) {
  act(() => {
    control.focus()
    fireEvent.input(control, { target: { value } })
  })
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

  // A message arriving inside a form would otherwise push every field below
  // it down by the line it takes, at the moment a person is reading the form.
  describe('room for a message', () => {
    it('keeps the line clear under a field that has nothing to say', () => {
      const alone = render(<TextField label="Alone" />)
      const aloneHeight = alone.container.getBoundingClientRect().height
      alone.unmount()

      const inForm = render(
        <Form aria-label="Label">
          <TextField label="In a form" />
        </Form>,
      )
      const formHeight = inForm.container.getBoundingClientRect().height
      // The line is 4 of padding and its own 16.
      expect(formHeight - aloneHeight).toBe(20)
    })

    it('does not move the field below when a server error arrives', () => {
      const view = render(
        <Form aria-label="Label">
          <TextField label="First" name="name" />
          <TextField label="Second" name="other" />
        </Form>,
      )
      const before = secondFieldTop(view)

      view.rerender(
        <Form aria-label="Label" validationErrors={SERVER_ERRORS}>
          <TextField label="First" name="name" />
          <TextField label="Second" name="other" />
        </Form>,
      )
      expect(view.getByText('Choose another name.')).not.toBeNull()
      expect(secondFieldTop(view)).toBe(before)
    })

    it('does not move the field below when a native message arrives', () => {
      const view = render(
        <Form aria-label="Label" validationBehavior="native">
          <TextField isRequired label="First" name="first" />
          <TextField label="Second" name="second" />
        </Form>,
      )
      const before = secondFieldTop(view)

      act(() => {
        formOf(view).requestSubmit()
      })
      expect(
        view
          .getByRole('textbox', { name: 'First' })
          .getAttribute('aria-invalid'),
      ).toBe('true')
      expect(secondFieldTop(view)).toBe(before)
    })

    it('leaves a field on its own as it was', () => {
      const view = render(<TextField label="Alone" />)
      expect(view.container.querySelectorAll('[slot]')).toHaveLength(0)
    })

    // The other half of what the `error` prop docs promise: a field outside a
    // form has no line to fill, so one arriving takes the space from whatever
    // is under it. Pinned because it is the comparison that makes wrapping in
    // a form worth mentioning at all.
    it('moves the field below when one on its own gains an error', () => {
      const view = render(
        <>
          <TextField label="First" />
          <TextField label="Second" />
        </>,
      )
      // Read off the container rather than `secondFieldTop`, which looks the
      // fields up through the form that is deliberately absent here.
      const secondOf = () => {
        const second = [...view.container.children][1]
        if (!(second instanceof HTMLElement)) {
          throw new Error('expected two fields')
        }
        return second.getBoundingClientRect().top
      }
      const before = secondOf()

      view.rerender(
        <>
          <TextField error="Choose another name." label="First" />
          <TextField label="Second" />
        </>,
      )

      expect(view.getByText('Choose another name.')).not.toBeNull()
      expect(secondOf() - before).toBe(20)
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
      const control = view.getByRole('textbox', { name: 'Field' })
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
      expect(
        view.getByRole('textbox', { name: 'Field' }).hasAttribute('required'),
      ).toBe(true)
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
      const control = view.getByRole('textbox', { name: 'Field' })
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

  // React Aria commits a field's validation on the control's `change` event,
  // which a text control fires only on blur, so an error used to outlive the
  // edit that fixed it until focus left. Each case here edits a control that
  // keeps focus throughout.
  describe('an error being fixed', () => {
    it.each([
      ['a text field', <TextField key="field" label="Name" name="name" />],
      ['a text area', <TextArea key="field" label="Name" name="name" />],
    ])("clears a server's error from %s on the first edit", (_case, field) => {
      const view = render(
        <Form aria-label="Label" validationErrors={SERVER_ERRORS}>
          {field}
        </Form>,
      )
      const control = view.getByLabelText('Name')
      expect(control.getAttribute('aria-invalid')).toBe('true')

      typeInto(control, 'Edited')

      expect(document.activeElement).toBe(control)
      expect(control.getAttribute('aria-invalid')).not.toBe('true')
      expect(view.queryByText('Choose another name.')).toBeNull()
    })

    it("checks the browser's error again against the edited value", () => {
      const view = render(
        <Form aria-label="Label" validationBehavior="native">
          <TextField isRequired label="Field" name="field" type="email" />
        </Form>,
      )
      const control = view.getByRole('textbox', { name: 'Field' })
      act(() => {
        formOf(view).requestSubmit()
      })
      expect(control.getAttribute('aria-invalid')).toBe('true')

      // Still not an address, so still an error, with the message for this
      // value rather than for the empty one.
      const empty = messageOf(control, view)[0]?.textContent
      typeInto(control, 'name')
      expect(control.getAttribute('aria-invalid')).toBe('true')
      expect(messageOf(control, view)[0]?.textContent).not.toBe(empty)

      typeInto(control, 'name@example.com')
      expect(document.activeElement).toBe(control)
      expect(control.getAttribute('aria-invalid')).not.toBe('true')
    })

    // An error is shown late and taken back early: a field with no error
    // shows none in the middle of typing, even a value it will reject.
    it('flags nothing new while a valid field is typed in', () => {
      const view = render(
        <Form aria-label="Label" validationBehavior="native">
          <TextField label="Field" name="field" type="email" />
        </Form>,
      )
      const control = view.getByRole('textbox', { name: 'Field' })

      typeInto(control, 'name')

      expect(control.getAttribute('aria-invalid')).not.toBe('true')
    })

    it("still runs the call site's own input and change handlers once each", () => {
      const onInput = vi.fn<InputEventHandler<HTMLInputElement>>()
      const onChange = vi.fn<(value: string) => void>()
      const view = render(
        <Form aria-label="Label" validationErrors={SERVER_ERRORS}>
          <TextField
            label="Name"
            name="name"
            onChange={onChange}
            onInput={onInput}
          />
        </Form>,
      )

      typeInto(view.getByLabelText('Name'), 'Edited')

      expect(onInput).toHaveBeenCalledTimes(1)
      expect(onChange).toHaveBeenCalledTimes(1)
      expect(onChange).toHaveBeenCalledWith('Edited')
    })
  })
})
