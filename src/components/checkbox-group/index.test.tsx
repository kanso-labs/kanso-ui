import * as stylex from '@stylexjs/stylex'
import { fireEvent, render } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import CheckboxGroup from '.'
import { colors } from '../../tokens/design.tokens.stylex'
import Checkbox from '../checkbox'

// The same declarations the checkbox writes for its states — see
// checkbox/index.test.tsx for the pattern.
const probeStyles = stylex.create({
  errorRule: { borderColor: colors.error },
  errorText: { color: colors.error },
})

function classesOf(props: { className?: string | undefined }) {
  const classes = (props.className ?? '').split(' ').filter(Boolean)
  // An empty list would make every `every` below vacuously true, so it is a
  // broken assertion rather than a passing one.
  if (classes.length === 0) {
    throw new Error('expected the probe style to generate at least one class')
  }
  return classes
}

const CLASSES = {
  errorRule: classesOf(stylex.props(probeStyles.errorRule)),
  errorText: classesOf(stylex.props(probeStyles.errorText)),
}

/**
 * The 18dp box of the checkbox around `input`: the first child of the
 * control that follows React Aria's hidden wrapper around the input.
 */
function boxOf(input: HTMLElement) {
  const box = input.parentElement?.nextElementSibling?.firstElementChild
  if (!(box instanceof HTMLElement)) {
    throw new Error('expected the control to follow the input')
  }
  return box
}

function hasClasses(element: Element, classes: string[]) {
  return classes.every((name) => element.classList.contains(name))
}

function setup(props: Partial<Parameters<typeof CheckboxGroup>[0]> = {}) {
  const view = render(
    <CheckboxGroup label="Label" {...props}>
      <Checkbox value="first">First item</Checkbox>
      <Checkbox value="second">Second item</Checkbox>
      <Checkbox value="third">Third item</Checkbox>
    </CheckboxGroup>,
  )
  return {
    ...view,
    first: view.getByRole('checkbox', { name: 'First item' }),
    group: view.getByRole('group', { name: 'Label' }),
    second: view.getByRole('checkbox', { name: 'Second item' }),
  }
}

describe('checkbox group', () => {
  describe('semantics', () => {
    // The role is the reason this wraps React Aria rather than stacking
    // checkboxes in a div: a group is introduced by its name before its
    // boxes are read.
    it('renders a group named by its label', () => {
      const { group } = setup()
      expect(group.getAttribute('role')).toBe('group')
    })

    it('describes the group with its description', () => {
      const view = setup({ description: 'Supporting line' })
      expect(view.group.getAttribute('aria-describedby')?.split(' ')).toContain(
        view.getByText('Supporting line').id,
      )
    })

    // The invalid mark lands on each checkbox, which is where a screen reader
    // reads it; the group carries the message.
    it('marks every checkbox invalid and describes the group with the error', () => {
      const view = setup({ error: 'Choose at least one.' })
      expect(view.first.getAttribute('aria-invalid')).toBe('true')
      expect(view.second.getAttribute('aria-invalid')).toBe('true')
      expect(view.group.getAttribute('aria-describedby')?.split(' ')).toContain(
        view.getByText('Choose at least one.').id,
      )
      expect(
        hasClasses(view.getByText('Choose at least one.'), CLASSES.errorText),
      ).toBe(true)
    })
  })

  describe('selection', () => {
    it('keeps its own value when uncontrolled', () => {
      const { first, second } = setup({ defaultValue: ['first'] })
      expect(first).toHaveProperty('checked', true)
      expect(second).toHaveProperty('checked', false)

      fireEvent.click(second)
      expect(second).toHaveProperty('checked', true)
      expect(first).toHaveProperty('checked', true)
    })

    // Controlled means the call site owns the value: a click reports the
    // set it would become and nothing moves until the prop comes back.
    it('reports without moving when controlled', () => {
      const onChange = vi.fn<(value: string[]) => void>()
      const { second } = setup({ onChange, value: ['first'] })
      fireEvent.click(second)
      expect(onChange).toHaveBeenCalledWith(['first', 'second'])
      expect(second).toHaveProperty('checked', false)
    })

    it('disables every checkbox from the group', () => {
      const { first, second } = setup({ isDisabled: true })
      expect(first).toHaveProperty('disabled', true)
      expect(second).toHaveProperty('disabled', true)
    })

    it('holds every checkbox still while read-only', () => {
      const { first } = setup({ defaultValue: ['first'], isReadOnly: true })
      fireEvent.click(first)
      expect(first).toHaveProperty('checked', true)
    })
  })

  describe('appearance', () => {
    // The group's error reaches the boxes through React Aria's group state,
    // so every box takes the error rule without being told anything.
    it('draws every box in the error pair while the group is invalid', () => {
      const { first, second } = setup({ error: 'Choose at least one.' })
      expect(hasClasses(boxOf(first), CLASSES.errorRule)).toBe(true)
      expect(hasClasses(boxOf(second), CLASSES.errorRule)).toBe(true)
    })
  })
})
