import { describe, expect, it } from 'vitest'

import * as publicApi from '.'
import {
  AppBar as ComponentsAppBar,
  Avatar as ComponentsAvatar,
  Badge as ComponentsBadge,
  Button as ComponentsButton,
  Card as ComponentsCard,
  Chip as ComponentsChip,
  Code as ComponentsCode,
  Container as ComponentsContainer,
  CopyField as ComponentsCopyField,
  Currency as ComponentsCurrency,
  Feed as ComponentsFeed,
  IconButton as ComponentsIconButton,
  Keycap as ComponentsKeycap,
  Link as ComponentsLink,
  ListDetail as ComponentsListDetail,
  ListItem as ComponentsListItem,
  Popover as ComponentsPopover,
  ProductIcon as ComponentsProductIcon,
  Separator as ComponentsSeparator,
  Sheet as ComponentsSheet,
  Stack as ComponentsStack,
  SupportingPane as ComponentsSupportingPane,
  Tabs as ComponentsTabs,
  Text as ComponentsText,
  TextField as ComponentsTextField,
} from './components'

describe('package entry point', () => {
  // Deliberately exact rather than a `toContain`, so an internal helper
  // leaking into the published surface fails here instead of shipping.
  it('exposes exactly the documented public API', () => {
    expect(Object.keys(publicApi)).toEqual([
      'AppBar',
      'Avatar',
      'Badge',
      'Button',
      'Card',
      'Chip',
      'Code',
      'Container',
      'CopyField',
      'Currency',
      'Feed',
      'IconButton',
      'Keycap',
      'Link',
      'ListDetail',
      'ListItem',
      'Popover',
      'ProductIcon',
      'Separator',
      'Sheet',
      'Stack',
      'SupportingPane',
      'Tabs',
      'Text',
      'TextField',
    ])
  })

  it('forwards AppBar as the same reference as the components barrel', () => {
    expect(publicApi.AppBar).toBe(ComponentsAppBar)
  })

  it('forwards Avatar as the same reference as the components barrel', () => {
    expect(publicApi.Avatar).toBe(ComponentsAvatar)
  })

  it('forwards Badge as the same reference as the components barrel', () => {
    expect(publicApi.Badge).toBe(ComponentsBadge)
  })

  it('forwards Button as the same reference as the components barrel', () => {
    expect(publicApi.Button).toBe(ComponentsButton)
  })

  it('forwards Card as the same reference as the components barrel', () => {
    expect(publicApi.Card).toBe(ComponentsCard)
  })

  it('forwards Chip as the same reference as the components barrel', () => {
    expect(publicApi.Chip).toBe(ComponentsChip)
  })

  it('forwards Code as the same reference as the components barrel', () => {
    expect(publicApi.Code).toBe(ComponentsCode)
  })

  it('forwards Container as the same reference as the components barrel', () => {
    expect(publicApi.Container).toBe(ComponentsContainer)
  })

  it('forwards CopyField as the same reference as the components barrel', () => {
    expect(publicApi.CopyField).toBe(ComponentsCopyField)
  })

  it('forwards Currency as the same reference as the components barrel', () => {
    expect(publicApi.Currency).toBe(ComponentsCurrency)
  })

  it('forwards Feed as the same reference as the components barrel', () => {
    expect(publicApi.Feed).toBe(ComponentsFeed)
  })

  it('forwards IconButton as the same reference as the components barrel', () => {
    expect(publicApi.IconButton).toBe(ComponentsIconButton)
  })

  it('forwards Keycap as the same reference as the components barrel', () => {
    expect(publicApi.Keycap).toBe(ComponentsKeycap)
  })

  it('forwards Link as the same reference as the components barrel', () => {
    expect(publicApi.Link).toBe(ComponentsLink)
  })

  it('forwards ListDetail as the same reference as the components barrel', () => {
    expect(publicApi.ListDetail).toBe(ComponentsListDetail)
  })

  it('forwards ListItem as the same reference as the components barrel', () => {
    expect(publicApi.ListItem).toBe(ComponentsListItem)
  })

  it('forwards Popover as the same reference as the components barrel', () => {
    expect(publicApi.Popover).toBe(ComponentsPopover)
  })

  it('forwards ProductIcon as the same reference as the components barrel', () => {
    expect(publicApi.ProductIcon).toBe(ComponentsProductIcon)
  })

  it('forwards Separator as the same reference as the components barrel', () => {
    expect(publicApi.Separator).toBe(ComponentsSeparator)
  })

  it('forwards Sheet as the same reference as the components barrel', () => {
    expect(publicApi.Sheet).toBe(ComponentsSheet)
  })

  it('forwards Stack as the same reference as the components barrel', () => {
    expect(publicApi.Stack).toBe(ComponentsStack)
  })

  it('forwards SupportingPane as the same reference as the components barrel', () => {
    expect(publicApi.SupportingPane).toBe(ComponentsSupportingPane)
  })

  it('forwards Tabs as the same reference as the components barrel', () => {
    expect(publicApi.Tabs).toBe(ComponentsTabs)
  })

  it('forwards Text as the same reference as the components barrel', () => {
    expect(publicApi.Text).toBe(ComponentsText)
  })

  it('forwards TextField as the same reference as the components barrel', () => {
    expect(publicApi.TextField).toBe(ComponentsTextField)
  })
})
