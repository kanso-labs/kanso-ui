import { describe, expect, it } from 'vitest'

import { textOf } from './text'

// What JSX hands an item for its children: a string on its own, an array
// once an expression sits beside text, and elements wherever markup does.
describe('textOf', () => {
  it('reads a plain string', () => {
    expect(textOf('First item')).toBe('First item')
  })

  it('reads a lone number', () => {
    expect(textOf(3)).toBe('3')
  })

  it('joins strings and numbers as they render', () => {
    // <Item>First item {1}</Item>
    expect(textOf(['First item ', 1])).toBe('First item 1')
  })

  it('joins nested arrays, as a mapped list renders', () => {
    expect(textOf(['Label ', [1, '-', 2]])).toBe('Label 1-2')
  })

  it('counts null, undefined and booleans for nothing, as they draw nothing', () => {
    expect(textOf(['First item', null, undefined, false, true])).toBe(
      'First item',
    )
  })

  it('finds nothing in children that draw nothing', () => {
    expect(textOf(null)).toBeUndefined()
    expect(textOf([false, undefined])).toBeUndefined()
  })

  it('finds nothing in an element', () => {
    expect(textOf(<strong>First item</strong>)).toBeUndefined()
  })

  it('finds nothing in an array holding an element', () => {
    expect(
      textOf([<strong key="first">First</strong>, ' item']),
    ).toBeUndefined()
  })
})
