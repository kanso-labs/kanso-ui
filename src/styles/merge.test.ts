import { describe, expect, it } from 'vitest'

import { mergeStatefulStyles, mergeStyles } from './merge'

// Compiled results are written as literals rather than taken from
// `stylex.props()`: what is under test is the merging, and a literal says
// which half of the result each field came from where a hashed class would
// not.
const COMPILED = { className: 'kui', style: { zIndex: 1 } }

const EMPTY = {}

// The form Chip and Tabs.Tab need: styles that cannot be chosen in CSS
// because they depend on state only React Aria knows.
const compiledFor = (state: { pressed: boolean }) => ({
  className: state.pressed ? 'kui-on' : 'kui-off',
})

// The same, for the half of a compiled result that is an object rather than a
// class: a dynamic StyleX style resolves per state, so the compiled `style`
// changes with it the way the class name does above.
const compiledStyleFor = (state: { pressed: boolean }) => ({
  className: 'kui',
  style: { marginTop: state.pressed ? 1 : 2 },
})

describe('mergeStyles', () => {
  it('joins both class names', () => {
    expect(mergeStyles(COMPILED, { className: 'probe' }).className).toBe(
      'kui probe',
    )
  })

  it('keeps the compiled class name when the call site passed none', () => {
    expect(mergeStyles(COMPILED, EMPTY).className).toBe('kui')
  })

  // '' rather than undefined would render a bare class attribute on an
  // element that has no classes at all.
  it('leaves className undefined when neither side has one', () => {
    expect(mergeStyles(EMPTY, EMPTY).className).toBeUndefined()
  })

  // Both are inline, so nothing but this order separates them.
  it('applies the call site style over the compiled one', () => {
    const merged = mergeStyles(
      { className: 'kui', style: { marginTop: 1, zIndex: 1 } },
      { style: { zIndex: 2 } },
    )

    expect(merged.style).toEqual({ marginTop: 1, zIndex: 2 })
  })

  it('leaves style undefined when neither side has one', () => {
    expect(mergeStyles({ className: 'kui' }, EMPTY).style).toBeUndefined()
  })
})

describe('mergeStatefulStyles', () => {
  it('resolves a compiled function against the state', () => {
    const merged = mergeStatefulStyles(compiledFor, EMPTY)

    expect(merged.className({ pressed: true })).toBe('kui-on')
    expect(merged.className({ pressed: false })).toBe('kui-off')
  })

  it('resolves a call site className that is a function too', () => {
    const merged = mergeStatefulStyles(compiledFor, {
      className: (state: { pressed: boolean }) =>
        state.pressed ? 'probe-on' : undefined,
    })

    expect(merged.className({ pressed: true })).toBe('kui-on probe-on')
    expect(merged.className({ pressed: false })).toBe('kui-off')
  })

  it('takes a plain className and a plain compiled result as well', () => {
    const merged = mergeStatefulStyles(COMPILED, { className: 'probe' })

    expect(merged.className({})).toBe('kui probe')
  })

  // The compiled side carries a key the call site does not set, which is what
  // makes the assertion able to fail. With both sides on `zIndex` alone the
  // expected object is also what dropping the compiled style produces, so the
  // case passed whether or not the two were merged at all.
  it('applies the call site style over the compiled one', () => {
    const merged = mergeStatefulStyles(
      { className: 'kui', style: { marginTop: 1, zIndex: 1 } },
      { style: () => ({ zIndex: 2 }) },
    )

    expect(merged.style({})).toEqual({ marginTop: 1, zIndex: 2 })
  })

  // The compiled style is resolved on every call, and no component passes a
  // compiled function carrying one yet, so this is the only thing exercising
  // that branch.
  it('resolves a compiled style function against the state', () => {
    const merged = mergeStatefulStyles(compiledStyleFor, {
      style: () => ({ zIndex: 2 }),
    })

    expect(merged.style({ pressed: true })).toEqual({ marginTop: 1, zIndex: 2 })
    expect(merged.style({ pressed: false })).toEqual({
      marginTop: 2,
      zIndex: 2,
    })
  })
})
