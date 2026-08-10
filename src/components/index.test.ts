import { describe, expect, it } from 'vitest'

import type { AvatarProps } from './avatar'
import type { ButtonProps } from './button'
import type { CardProps } from './card'
import type { ChipProps } from './chip'
import type { IconButtonProps } from './icon-button'
import type { ListItemProps } from './list-item'
import type { SeparatorProps } from './separator'
import type { SheetProps } from './sheet'
import type { TabsProps } from './tabs'
import type { TextProps } from './text'

import * as components from '.'
import AvatarDefault from './avatar'
import ButtonDefault from './button'
import CardDefault from './card'
import ChipDefault from './chip'
import IconButtonDefault from './icon-button'
import ListItemDefault from './list-item'
import SeparatorDefault from './separator'
import SheetDefault from './sheet'
import TabsDefault from './tabs'
import TextDefault from './text'

describe('components barrel', () => {
  it('exposes exactly the documented public components', () => {
    expect(Object.keys(components)).toEqual([
      'Avatar',
      'Button',
      'Card',
      'Chip',
      'IconButton',
      'ListItem',
      'Separator',
      'Sheet',
      'Tabs',
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

  it('re-exports Chip as the same reference as its own module', () => {
    expect(components.Chip).toBe(ChipDefault)
  })

  it('re-exports IconButton as the same reference as its own module', () => {
    expect(components.IconButton).toBe(IconButtonDefault)
  })

  it('re-exports ListItem as the same reference as its own module', () => {
    expect(components.ListItem).toBe(ListItemDefault)
  })

  it('re-exports Separator as the same reference as its own module', () => {
    expect(components.Separator).toBe(SeparatorDefault)
  })

  it('re-exports Sheet as the same reference as its own module', () => {
    expect(components.Sheet).toBe(SheetDefault)
  })

  it('re-exports Tabs as the same reference as its own module', () => {
    expect(components.Tabs).toBe(TabsDefault)
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

  it('re-exports the ChipProps type', () => {
    const props: ChipProps = { children: 'test' }
    expect(props.children).toBe('test')
  })

  it('re-exports the IconButtonProps type', () => {
    const props: IconButtonProps = { 'aria-label': 'Add' }
    expect(props['aria-label']).toBe('Add')
  })

  it('re-exports the ListItemProps type', () => {
    const props: ListItemProps = { children: 'test' }
    expect(props.children).toBe('test')
  })

  it('re-exports the SeparatorProps type', () => {
    const props: SeparatorProps = { orientation: 'vertical' }
    expect(props.orientation).toBe('vertical')
  })

  it('re-exports the SheetProps type', () => {
    const props: SheetProps = { size: 'sm' }
    expect(props.size).toBe('sm')
  })

  it('re-exports the TabsProps type', () => {
    const props: TabsProps = { defaultValue: 'first' }
    expect(props.defaultValue).toBe('first')
  })

  it('re-exports the TextProps type', () => {
    const props: TextProps = { children: 'test' }
    expect(props.children).toBe('test')
  })
})
