import type { ComponentProps } from 'react'

import { act, fireEvent, render } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import List from '../components/list'
import Tree from '../components/tree'

// What a selection change re-renders, row by row. Each part is wrapped in a
// stand-in that counts its renders and then draws the real one, so a count
// is the number of times React rendered that part rather than skipped it: a
// parent that hands down the same element it handed down last time is
// bailed out of, and the stand-in is not called. The React Compiler runs
// over the library here as it does in a build, so what is counted is the
// memoisation a consumer gets.
const renders = vi.hoisted(() => ({
  message: 0,
  row: new Map<string, number>(),
}))

// Called from the stand-ins rather than written in them, since the compiler
// refuses a component that writes to a module's variable.
function countMessage() {
  renders.message += 1
}

function countRow(key: string) {
  renders.row.set(key, (renders.row.get(key) ?? 0) + 1)
}

vi.mock('./index', async (original) => {
  const actual = await original<typeof import('./index')>()
  function CountedRowContent(props: ComponentProps<typeof actual.RowContent>) {
    countRow(typeof props.children === 'string' ? props.children : '')
    return <actual.RowContent {...props} />
  }
  return { ...actual, RowContent: CountedRowContent }
})

vi.mock('../field', async (original) => {
  const actual = await original<typeof import('../field')>()
  function CountedFieldMessage(
    props: ComponentProps<typeof actual.FieldMessage>,
  ) {
    countMessage()
    return <actual.FieldMessage {...props} />
  }
  return { ...actual, FieldMessage: CountedFieldMessage }
})

// Forgets what the first render counted, so what is left is the selection.
function reset() {
  renders.message = 0
  renders.row.clear()
}

function rowRenders() {
  return Object.fromEntries(renders.row)
}

describe('a selection change', () => {
  it('re-renders only the List rows whose selection changed', () => {
    const view = render(
      <List aria-label="Label" selectionMode="multiple">
        <List.Item id="first">First item</List.Item>
        <List.Item id="second">Second item</List.Item>
        <List.Item id="third">Third item</List.Item>
      </List>,
    )
    reset()

    const [, second] = view.getAllByRole('checkbox')
    act(() => {
      fireEvent.click(second)
    })

    expect(view.getAllByRole('checkbox')[1]).toBeChecked()
    // The first and third rows kept what they drew: before, every row's
    // content and checkbox rendered on every selection change.
    expect(rowRenders()).toEqual({ 'Second item': 1 })
    // A row's checkbox draws no message line, so none renders at all.
    expect(renders.message).toBe(0)
  })

  it('re-renders only the Tree rows whose selection changed', () => {
    const view = render(
      <Tree aria-label="Label" selectionMode="multiple">
        <Tree.Item headline="First item" id="first" />
        <Tree.Item headline="Second item" id="second" />
        <Tree.Item headline="Third item" id="third" />
      </Tree>,
    )
    reset()

    const [, second] = view.getAllByRole('checkbox')
    act(() => {
      fireEvent.click(second)
    })

    expect(view.getAllByRole('checkbox')[1]).toBeChecked()
    expect(rowRenders()).toEqual({ 'Second item': 1 })
    expect(renders.message).toBe(0)
  })
})
