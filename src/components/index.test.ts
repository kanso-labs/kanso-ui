import { describe, expect, it } from 'vitest'

import type { AvatarProps } from './avatar'
import type { BadgeProps } from './badge'
import type { ButtonProps } from './button'
import type { CardProps } from './card'
import type { ChipProps } from './chip'
import type { CodeProps } from './code'
import type { CurrencyProps } from './currency'
import type { IconButtonProps } from './icon-button'
import type { KeycapProps } from './keycap'
import type { LinkProps } from './link'
import type { ListItemProps } from './list-item'
import type { SeparatorProps } from './separator'
import type { SheetProps } from './sheet'
import type { TabsProps } from './tabs'
import type { TextProps } from './text'
import type { TextFieldProps } from './text-field'

import * as components from '.'
import AvatarDefault from './avatar'
import BadgeDefault from './badge'
import ButtonDefault from './button'
import CardDefault from './card'
import ChipDefault from './chip'
import CodeDefault from './code'
import CurrencyDefault from './currency'
import IconButtonDefault from './icon-button'
import KeycapDefault from './keycap'
import LinkDefault from './link'
import ListItemDefault from './list-item'
import SeparatorDefault from './separator'
import SheetDefault from './sheet'
import TabsDefault from './tabs'
import TextDefault from './text'
import TextFieldDefault from './text-field'

describe('components barrel', () => {
  it('exposes exactly the documented public components', () => {
    expect(Object.keys(components)).toEqual([
      'Avatar',
      'Badge',
      'Button',
      'Card',
      'Chip',
      'Code',
      'Currency',
      'IconButton',
      'Keycap',
      'Link',
      'ListItem',
      'Separator',
      'Sheet',
      'Tabs',
      'Text',
      'TextField',
    ])
  })

  it('re-exports Avatar as the same reference as its own module', () => {
    expect(components.Avatar).toBe(AvatarDefault)
  })

  it('re-exports Badge as the same reference as its own module', () => {
    expect(components.Badge).toBe(BadgeDefault)
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

  it('re-exports Code as the same reference as its own module', () => {
    expect(components.Code).toBe(CodeDefault)
  })

  it('re-exports Currency as the same reference as its own module', () => {
    expect(components.Currency).toBe(CurrencyDefault)
  })

  it('re-exports IconButton as the same reference as its own module', () => {
    expect(components.IconButton).toBe(IconButtonDefault)
  })

  it('re-exports Keycap as the same reference as its own module', () => {
    expect(components.Keycap).toBe(KeycapDefault)
  })

  it('re-exports Link as the same reference as its own module', () => {
    expect(components.Link).toBe(LinkDefault)
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

  it('re-exports TextField as the same reference as its own module', () => {
    expect(components.TextField).toBe(TextFieldDefault)
  })

  it('re-exports the AvatarProps type', () => {
    const props: AvatarProps = { name: 'Ada Lovelace' }
    expect(props.name).toBe('Ada Lovelace')
  })

  it('re-exports the BadgeProps type', () => {
    const props: BadgeProps = { tone: 'positive' }
    expect(props.tone).toBe('positive')
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

  it('re-exports the CodeProps type', () => {
    const props: CodeProps = { children: 'test' }
    expect(props.children).toBe('test')
  })

  it('re-exports the CurrencyProps type', () => {
    const props: CurrencyProps = { value: 12.5 }
    expect(props.value).toBe(12.5)
  })

  it('re-exports the IconButtonProps type', () => {
    const props: IconButtonProps = { 'aria-label': 'Add' }
    expect(props['aria-label']).toBe('Add')
  })

  it('re-exports the KeycapProps type', () => {
    const props: KeycapProps = { children: 'Enter' }
    expect(props.children).toBe('Enter')
  })

  it('re-exports the LinkProps type', () => {
    const props: LinkProps = { tone: 'inherit' }
    expect(props.tone).toBe('inherit')
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

  it('re-exports the TextFieldProps type', () => {
    const props: TextFieldProps = { label: 'Label' }
    expect(props.label).toBe('Label')
  })
})
