import { describe, expect, it } from 'vitest'

import * as publicApi from '.'
import {
  Avatar as ComponentsAvatar,
  Button as ComponentsButton,
  Card as ComponentsCard,
  Chip as ComponentsChip,
  IconButton as ComponentsIconButton,
  ListItem as ComponentsListItem,
  Separator as ComponentsSeparator,
  Tabs as ComponentsTabs,
  Text as ComponentsText,
  TextField as ComponentsTextField,
} from './components'

describe('package entry point', () => {
  // Deliberately exact rather than a `toContain`, so an internal helper
  // leaking into the published surface fails here instead of shipping.
  it('exposes exactly the documented public API', () => {
    expect(Object.keys(publicApi)).toEqual([
      'Avatar',
      'Button',
      'Card',
      'Chip',
      'IconButton',
      'ListItem',
      'Separator',
      'Tabs',
      'Text',
      'TextField',
    ])
  })

  it('forwards Avatar as the same reference as the components barrel', () => {
    expect(publicApi.Avatar).toBe(ComponentsAvatar)
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

  it('forwards IconButton as the same reference as the components barrel', () => {
    expect(publicApi.IconButton).toBe(ComponentsIconButton)
  })

  it('forwards ListItem as the same reference as the components barrel', () => {
    expect(publicApi.ListItem).toBe(ComponentsListItem)
  })

  it('forwards Separator as the same reference as the components barrel', () => {
    expect(publicApi.Separator).toBe(ComponentsSeparator)
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
