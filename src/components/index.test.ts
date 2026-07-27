import { PlusIcon } from '@phosphor-icons/react'
import { describe, expect, it } from 'vitest'

import type { ButtonProps } from './button'
import type { IconProps } from './icon'

import * as components from '.'
import ButtonDefault from './button'
import IconDefault from './icon'

describe('components barrel', () => {
  it('exposes exactly the documented public components', () => {
    expect(Object.keys(components)).toEqual(['Button', 'Icon'])
  })

  it('re-exports Button as the same reference as its own module', () => {
    expect(components.Button).toBe(ButtonDefault)
  })

  it('re-exports the ButtonProps type', () => {
    const props: ButtonProps = { children: 'test' }
    expect(props.children).toBe('test')
  })

  it('re-exports Icon as the same reference as its own module', () => {
    expect(components.Icon).toBe(IconDefault)
  })

  it('re-exports the IconProps type', () => {
    const props: IconProps = { icon: PlusIcon }
    expect(props.icon).toBe(PlusIcon)
  })
})
