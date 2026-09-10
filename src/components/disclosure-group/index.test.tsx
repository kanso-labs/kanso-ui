import { fireEvent, render } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import DisclosureGroup from '.'
import Disclosure from '../disclosure'

const FIRST = ['first']
const FIRST_AND_THIRD = ['first', 'third']

function section(id: string, label: string) {
  return (
    <Disclosure id={id} key={id}>
      <Disclosure.Header>{label}</Disclosure.Header>
      <Disclosure.Panel>{`Panel for the ${label}`}</Disclosure.Panel>
    </Disclosure>
  )
}

// Written as an array rather than a fragment so the two shapes are covered
// separately: the fragment case has a test of its own below.
const SECTIONS = [
  section('first', 'First item'),
  section('second', 'Second item'),
  section('third', 'Third item'),
]

function setup(
  props: Partial<Parameters<typeof DisclosureGroup>[0]> = {},
  children?: Parameters<typeof DisclosureGroup>[0]['children'],
) {
  const view = render(
    <DisclosureGroup {...props}>{children ?? SECTIONS}</DisclosureGroup>,
  )
  const expanded = () =>
    view
      .getAllByRole('button')
      .map((button) => button.getAttribute('aria-expanded'))
  const rules = () => view.queryAllByRole('separator')

  return { ...view, expanded, rules }
}

describe('disclosure group', () => {
  describe('what is open', () => {
    it('opens the sections it is given', () => {
      const view = setup({ defaultExpandedKeys: FIRST })
      expect(view.expanded()).toStrictEqual(['true', 'false', 'false'])
    })

    // One at a time is the default, so opening a new section closes the last.
    it('closes the last when a new one opens', () => {
      const view = setup({ defaultExpandedKeys: FIRST })

      fireEvent.click(view.getByRole('button', { name: /Second item/ }))

      expect(view.expanded()).toStrictEqual(['false', 'true', 'false'])
    })

    it('keeps several open when it allows them', () => {
      const view = setup({
        allowsMultipleExpanded: true,
        defaultExpandedKeys: FIRST,
      })

      fireEvent.click(view.getByRole('button', { name: /Second item/ }))

      expect(view.expanded()).toStrictEqual(['true', 'true', 'false'])
    })

    it('keeps its own state from defaultExpandedKeys', () => {
      const view = setup({
        allowsMultipleExpanded: true,
        defaultExpandedKeys: FIRST_AND_THIRD,
      })
      expect(view.expanded()).toStrictEqual(['true', 'false', 'true'])
    })

    it('does not open on its own when controlled', () => {
      const onExpandedChange = vi.fn<(keys: unknown) => void>()
      const view = setup({ expandedKeys: FIRST, onExpandedChange })

      fireEvent.click(view.getByRole('button', { name: /Second item/ }))

      expect(onExpandedChange).toHaveBeenCalledTimes(1)
      expect(view.expanded()).toStrictEqual(['true', 'false', 'false'])
    })

    it('stops responding while the group is disabled', () => {
      const onExpandedChange = vi.fn<(keys: unknown) => void>()
      const view = setup({ isDisabled: true, onExpandedChange })

      fireEvent.click(view.getByRole('button', { name: /First item/ }))

      expect(onExpandedChange).not.toHaveBeenCalled()
      expect(
        view.getAllByRole('button').every((button) => 'disabled' in button),
      ).toBe(true)
    })

    it('opens from the keyboard', () => {
      const view = setup()
      const trigger = view.getByRole('button', { name: /First item/ })

      fireEvent.keyDown(trigger, { key: ' ' })
      fireEvent.keyUp(trigger, { key: ' ' })

      expect(view.expanded()).toStrictEqual(['true', 'false', 'false'])
    })
  })

  describe('the rule between the sections', () => {
    it('draws one between each pair and none at the ends', () => {
      const view = setup()
      expect(view.rules()).toHaveLength(2)
    })

    it('draws none when the group is undivided', () => {
      const view = setup({ divided: false })
      expect(view.rules()).toHaveLength(0)
    })

    it('draws none for a single section', () => {
      const view = setup({}, section('first', 'First item'))
      expect(view.rules()).toHaveLength(0)
    })

    // Sections are as often written inside a fragment as listed as siblings —
    // a call site that maps over data and wraps the result gets one. React's
    // own child helpers hand a fragment back as a single child, so without
    // opening it up the group would draw no rules at all and look undivided.
    it('draws them for sections written inside a fragment', () => {
      const view = setup(
        {},
        <>
          {section('first', 'First item')}
          {section('second', 'Second item')}
          {section('third', 'Third item')}
        </>,
      )

      expect(view.getAllByRole('button')).toHaveLength(3)
      expect(view.rules()).toHaveLength(2)
    })

    it('draws them for sections nested a fragment deeper', () => {
      const view = setup(
        {},
        <>
          {section('first', 'First item')}
          <>{section('second', 'Second item')}</>
        </>,
      )

      expect(view.getAllByRole('button')).toHaveLength(2)
      expect(view.rules()).toHaveLength(1)
    })

    it('runs the rule across the stack', () => {
      const view = setup()
      const [rule] = view.rules()

      expect(rule.tagName).toBe('HR')
      expect(getComputedStyle(rule).blockSize).toBe('1px')
    })
  })

  describe('appearance', () => {
    it('stacks the sections in a column', () => {
      const view = setup()
      const group = view.container.firstElementChild

      expect(group).not.toBeNull()
      expect(getComputedStyle(group!).flexDirection).toBe('column')
    })
  })
})
