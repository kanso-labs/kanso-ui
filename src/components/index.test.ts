import { describe, expect, it } from 'vitest'

import type { AvatarProps } from './avatar'
import type { ButtonProps } from './button'
import type { CardProps } from './card'
import type { SeparatorProps } from './separator'
import type { TextProps } from './text'

import * as components from '.'
import AvatarDefault from './avatar'
import ButtonDefault from './button'
import CardDefault from './card'
import SeparatorDefault from './separator'
import TextDefault from './text'

describe('components barrel', () => {
  it('exposes exactly the documented public components', () => {
    expect(Object.keys(components)).toEqual([
      'Avatar',
      'Button',
      'Card',
      'Separator',
      'Text',
    ])
  })

  it('re-exports Avatar as the same reference as its own module', () => {
    expect(components.Avatar).toBe(AvatarDefault)
  })

  it('re-exports Button as the same reference as its own module', () => {
    expect(components.Button).toBe(ButtonDefault)
  })

  it('re-exports Card as the same reference as its own module', () => {
    expect(components.Card).toBe(CardDefault)
  })

  it('re-exports Separator as the same reference as its own module', () => {
    expect(components.Separator).toBe(SeparatorDefault)
  })

  it('re-exports Text as the same reference as its own module', () => {
    expect(components.Text).toBe(TextDefault)
  })

  it('re-exports the AvatarProps type', () => {
    const props: AvatarProps = { name: 'Ada Lovelace' }
    expect(props.name).toBe('Ada Lovelace')
  })

  it('re-exports the ButtonProps type', () => {
    const props: ButtonProps = { children: 'test' }
    expect(props.children).toBe('test')
  })

  it('re-exports the CardProps type', () => {
    const props: CardProps = { variant: 'outlined' }
    expect(props.variant).toBe('outlined')
  })

  it('re-exports the SeparatorProps type', () => {
    const props: SeparatorProps = { orientation: 'vertical' }
    expect(props.orientation).toBe('vertical')
  })

  it('re-exports the TextProps type', () => {
    const props: TextProps = { children: 'test' }
    expect(props.children).toBe('test')
  })
})
