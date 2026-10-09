import { createElement } from 'react'
import { describe, expect, it } from 'vitest'

import { hasContent } from './content'

describe('hasContent', () => {
  it.each([undefined, null, false, true, ''])(
    'reads %j as nothing to draw',
    (node) => {
      expect(hasContent(node)).toBe(false)
    },
  )

  // React draws a 0, and spaces are the call site's to trim.
  it.each([0, 'x', ' ', createElement('span')])(
    'reads %j as something to draw',
    (node) => {
      expect(hasContent(node)).toBe(true)
    },
  )
})
