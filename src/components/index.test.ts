import { describe, expect, it } from 'vitest'

import type { ButtonProps } from './button'
import type { TextProps } from './text'

import * as components from '.'
import ButtonDefault from './button'
import TextDefault from './text'

describe('components barrel', () => {
  it('exposes exactly the documented public components', () => {
    expect(Object.keys(components)).toEqual(['Button', 'Text'])
  })

  it('re-exports Button as the same reference as its own module', () => {
    expect(components.Button).toBe(ButtonDefault)
  })

  it('re-exports Text as the same reference as its own module', () => {
    expect(components.Text).toBe(TextDefault)
  })

  it('re-exports the ButtonProps type', () => {
    const props: ButtonProps = { children: 'test' }
    expect(props.children).toBe('test')
  })

  it('re-exports the TextProps type', () => {
    const props: TextProps = { children: 'test' }
    expect(props.children).toBe('test')
  })
})
