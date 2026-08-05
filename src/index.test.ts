import { describe, expect, it } from 'vitest'

import * as publicApi from '.'
import {
  Button as ComponentsButton,
  Separator as ComponentsSeparator,
  Text as ComponentsText,
} from './components'

describe('package entry point', () => {
  // Deliberately exact rather than a `toContain`, so an internal helper
  // leaking into the published surface fails here instead of shipping.
  it('exposes exactly the documented public API', () => {
    expect(Object.keys(publicApi)).toEqual(['Button', 'Separator', 'Text'])
  })

  it('forwards Button as the same reference as the components barrel', () => {
    expect(publicApi.Button).toBe(ComponentsButton)
  })

  it('forwards Separator as the same reference as the components barrel', () => {
    expect(publicApi.Separator).toBe(ComponentsSeparator)
  })

  it('forwards Text as the same reference as the components barrel', () => {
    expect(publicApi.Text).toBe(ComponentsText)
  })
})
