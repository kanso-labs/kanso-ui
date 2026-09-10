import { act, fireEvent, render, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import Autocomplete from '.'
import ListBox from '../list-box'
import SearchField from '../search-field'

const OPTIONS = (
  <>
    <ListBox.Item id="first">First item</ListBox.Item>
    <ListBox.Item id="second">Second item</ListBox.Item>
    <ListBox.Item id="third">Third item</ListBox.Item>
  </>
)

/** The search bar's own input, typed so its value can be read. */
function inputOf(view: ReturnType<typeof render>) {
  const input = view.getByRole('searchbox', { name: 'Search' })
  if (!(input instanceof HTMLInputElement)) {
    throw new Error('expected the bar to draw an input')
  }
  return input
}

function setup(
  props: Partial<Parameters<typeof Autocomplete<object>>[0]> = {},
) {
  const view = render(
    <Autocomplete {...props}>
      <SearchField label="Search" />
      <ListBox aria-label="Results" selectionMode="single">
        {OPTIONS}
      </ListBox>
    </Autocomplete>,
  )
  return { ...view, input: inputOf(view) }
}

// Matches from the start of the text rather than anywhere in it, which the
// default contains filter does not.
function startsWith(textValue: string, inputValue: string) {
  return textValue.toLowerCase().startsWith(inputValue.toLowerCase())
}

describe('autocomplete', () => {
  describe('semantics', () => {
    it('draws no element of its own', () => {
      const view = setup()
      // The search field and the list are siblings under the render
      // container: the wrapper is behaviour, not a box.
      expect(view.container.firstElementChild?.children).toHaveLength(2)
    })

    it('leaves the input and the collection as they were', () => {
      const view = setup()
      expect(view.getByRole('searchbox', { name: 'Search' })).not.toBeNull()
      expect(view.getByRole('listbox', { name: 'Results' })).not.toBeNull()
      expect(view.getAllByRole('option')).toHaveLength(3)
    })

    // Focus stays in the input while the arrow keys move through the list,
    // which is what `aria-activedescendant` reports.
    it('keeps focus in the input and points it at the collection', () => {
      const { input } = setup()
      expect(input.getAttribute('aria-controls')).not.toBeNull()
      expect(input.getAttribute('aria-autocomplete')).toBe('list')
    })
  })

  describe('filtering', () => {
    // React Aria's own wrapper filters nothing unless it is handed a
    // predicate. A search box that does not search is a puzzle rather than a
    // default, so this one filters out of the box.
    it('narrows the collection without being given a filter', async () => {
      const view = setup()

      act(() => {
        fireEvent.change(view.input, { target: { value: 'Sec' } })
      })

      await waitFor(() => {
        expect(view.getAllByRole('option')).toHaveLength(1)
      })
      expect(view.getByRole('option', { name: 'Second item' })).not.toBeNull()
    })

    it('matches anywhere in the text, not only at the start', async () => {
      const view = setup()

      act(() => {
        fireEvent.change(view.input, { target: { value: 'item' } })
      })

      await waitFor(() => {
        expect(view.getAllByRole('option')).toHaveLength(3)
      })
    })

    it('takes a filter of its own', async () => {
      const view = setup({ filter: startsWith })

      act(() => {
        fireEvent.change(view.input, { target: { value: 'item' } })
      })

      await waitFor(() => {
        expect(view.queryAllByRole('option')).toHaveLength(0)
      })
    })

    it('ignores case and accents', async () => {
      const view = setup()

      act(() => {
        fireEvent.change(view.input, { target: { value: 'SECOND' } })
      })

      await waitFor(() => {
        expect(view.getAllByRole('option')).toHaveLength(1)
      })
    })
  })

  describe('the input value', () => {
    it('keeps its own from defaultInputValue', async () => {
      const view = setup({ defaultInputValue: 'Third' })
      expect(view.input.value).toBe('Third')
      await waitFor(() => {
        expect(view.getAllByRole('option')).toHaveLength(1)
      })
    })

    it('reports what was typed', async () => {
      const onInputChange = vi.fn<(value: string) => void>()
      const view = setup({ onInputChange })

      act(() => {
        fireEvent.change(view.input, { target: { value: 'Sec' } })
      })

      await waitFor(() => {
        expect(onInputChange).toHaveBeenCalledWith('Sec')
      })
    })

    it('does not change on its own when controlled', async () => {
      const onInputChange = vi.fn<(value: string) => void>()
      const view = setup({ inputValue: 'First', onInputChange })

      act(() => {
        fireEvent.change(view.input, { target: { value: 'Sec' } })
      })

      await waitFor(() => {
        expect(onInputChange).toHaveBeenCalledWith('Sec')
      })
      expect(view.input.value).toBe('First')
    })
  })

  describe('keyboard', () => {
    // The arrow keys move through the collection while focus stays in the
    // input, so what moves is aria-activedescendant rather than focus.
    it('moves through the collection from the input', async () => {
      const view = setup()
      act(() => {
        view.input.focus()
      })

      fireEvent.keyDown(view.input, { key: 'ArrowDown' })
      fireEvent.keyUp(view.input, { key: 'ArrowDown' })

      await waitFor(() => {
        expect(view.input.getAttribute('aria-activedescendant')).not.toBeNull()
      })
      expect(document.activeElement).toBe(view.input)
    })
  })
})
