import * as stylex from '@stylexjs/stylex'
import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import Code from '.'

const harnessStyles = stylex.create({
  narrow: { inlineSize: '80px' },
  prose: { fontFamily: 'Georgia, serif', fontSize: '32px' },
})

const LIST_ITEM = <li />

function setup(props: Partial<Parameters<typeof Code>[0]> = {}) {
  const view = render(
    <Code data-testid="code" {...props}>
      identifier
    </Code>,
  )
  return { ...view, code: view.getByTestId('code') }
}

describe('code', () => {
  describe('structure', () => {
    it('renders a code element carrying its children', () => {
      const { code } = setup()
      expect(code.tagName).toBe('CODE')
      expect(code.textContent).toBe('identifier')
    })

    it('renders as another element when given one', () => {
      const { code } = setup({ render: LIST_ITEM })
      expect(code.tagName).toBe('LI')
    })

    it('passes attributes through to the element', () => {
      const { code } = setup({ id: 'repo-url' })
      expect(code.id).toBe('repo-url')
    })
  })

  describe('typography', () => {
    it('renders in the mono face', () => {
      const { code } = setup()
      expect(getComputedStyle(code).fontFamily).toContain('Roboto Mono')
    })

    // Sized in em, so the same component serves a heading and a footnote.
    // A fixed size here would make one of the two wrong.
    it('scales with the text it interrupts', () => {
      const view = render(
        <div {...stylex.props(harnessStyles.prose)}>
          <Code data-testid="code">identifier</Code>
        </div>,
      )
      // 0.875em against the harness's 32px.
      expect(getComputedStyle(view.getByTestId('code')).fontSize).toBe('28px')
    })
  })

  describe('long identifiers', () => {
    // A package path or a hash has no spaces to break at, so without this it
    // would push its container wider rather than wrapping inside it.
    it('breaks rather than widening its container', () => {
      const view = render(
        <div {...stylex.props(harnessStyles.narrow)}>
          <Code data-testid="code">
            ghcr.io/kanso-labs/a-long-unbroken-identifier
          </Code>
        </div>,
      )
      const code = view.getByTestId('code')
      expect(getComputedStyle(code).overflowWrap).toBe('anywhere')
      // Guards the declaration above: a value the browser did not honour
      // would still read back correctly from the computed style.
      expect(code.getBoundingClientRect().width).toBeLessThanOrEqual(80)
    })
  })

  // The mono face is the whole signal, so a container would be a second one.
  // This pins that decision rather than leaving it to drift.
  describe('surface', () => {
    it('paints no background of its own', () => {
      const { code } = setup()
      expect(getComputedStyle(code).backgroundColor).toBe('rgba(0, 0, 0, 0)')
    })
  })
})
