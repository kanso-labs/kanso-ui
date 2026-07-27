import { describe, expect, it } from 'vitest'

import type { ButtonProps } from './button'

import * as components from '.'
import ButtonDefault from './button'

describe('components barrel', () => {
  it('exposes exactly the documented public components', () => {
    expect(Object.keys(components)).toEqual(['Button'])
  })

  it('re-exports Button as the same reference as its own module', () => {
    expect(components.Button).toBe(ButtonDefault)
  })

  it('re-exports the ButtonProps type', () => {
    const props: ButtonProps = { children: 'test' }
    expect(props.children).toBe('test')
  })
})
