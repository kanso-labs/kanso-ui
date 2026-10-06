import { createRef } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { refCallback } from './ref'

describe('refCallback', () => {
  it('hands back nothing for no ref', () => {
    expect(refCallback(undefined)).toBeUndefined()
    expect(refCallback(null)).toBeUndefined()
  })

  it("hands a call site's callback through as it is", () => {
    const callback = vi.fn<(element: HTMLElement | null) => void>()

    expect(refCallback(callback)).toBe(callback)
  })

  it('writes the element into a ref object, and clears it', () => {
    const ref = createRef<HTMLElement>()
    const element = document.createElement('button')
    const callback = refCallback(ref)

    callback?.(element)
    expect(ref.current).toBe(element)

    callback?.(null)
    expect(ref.current).toBeNull()
  })
})
