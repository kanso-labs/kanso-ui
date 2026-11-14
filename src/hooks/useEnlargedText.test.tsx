import { render } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { PROBE_ATTRIBUTE, useEnlargedText } from './useEnlargedText'
import { enlargeText, settle } from './useEnlargedText.testing'

function probes() {
  return document.querySelectorAll(`[${PROBE_ATTRIBUTE}]`)
}

function Reading() {
  return <output>{useEnlargedText() ? 'enlarged' : 'as set'}</output>
}

let restore: (() => void) | undefined

afterEach(() => {
  restore?.()
  restore = undefined
})

describe('useEnlargedText', () => {
  it('reads text drawn at the size it was set in as not enlarged', async () => {
    const view = render(<Reading />)
    await settle()

    expect(view.getByRole('status').textContent).toBe('as set')
  })

  it('reads a font grown past its own lengths as enlarged', async () => {
    const view = render(<Reading />)
    restore = enlargeText()
    await settle()

    expect(view.getByRole('status').textContent).toBe('enlarged')

    restore()
    restore = undefined
    await settle()

    expect(view.getByRole('status').textContent).toBe('as set')
  })

  // A theme's larger type grows the probe's font and its height together.
  it('reads type a theme sets larger as not enlarged', async () => {
    const view = render(<Reading />)
    restore = enlargeText({ fontsOnly: true })
    await settle()

    expect(view.getByRole('status').textContent).toBe('as set')
  })

  it('measures with one probe, gone once nothing listens', async () => {
    const view = render(
      <>
        <Reading />
        <Reading />
      </>,
    )
    await settle()

    expect(probes()).toHaveLength(1)
    expect(probes()[0]?.getAttribute('aria-hidden')).toBe('true')

    view.unmount()

    expect(probes()).toHaveLength(0)
  })

  it('starts enlarged for a reader whose text already is', async () => {
    restore = enlargeText()
    const view = render(<Reading />)
    await settle()

    expect(view.getByRole('status').textContent).toBe('enlarged')
  })
})
