import * as stylex from '@stylexjs/stylex'
import { render } from '@testing-library/react'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import Button from '../components/button'
import { colors } from '../tokens/design.tokens.stylex'

// The library's rules compile into one named cascade layer, `kanso`, so an app
// whose own CSS is layered — Tailwind v4's is — can say where it goes. This is
// the order the README gives for Tailwind v4, with a preflight in `base` that
// empties a button's fill and a utility that pads it, both shaped the way
// Tailwind writes them.
//
// The statement has to come first in the document, since a layer's place is
// fixed where it is first named and the library's stylesheet names its own as
// soon as it loads. Prepended to the head, it is read before the library's
// <link>, as an app's stylesheet imported ahead of the package would be.
const TAILWIND_V4 = `
@layer theme, base, kanso, components, utilities;
@layer base { button { background-color: transparent; padding: 0; } }
@layer utilities { .p-8 { padding: 2rem; } }
`

const probeStyles = stylex.create({
  primary: { backgroundColor: colors.primary },
})

let sheet: HTMLStyleElement

beforeAll(() => {
  sheet = document.createElement('style')
  sheet.textContent = TAILWIND_V4
  document.head.prepend(sheet)
})

afterAll(() => {
  sheet.remove()
})

/** The fill `style` resolves to, read off an element drawn with it. */
function fillOf(style: stylex.StyleXStyles) {
  const view = render(<span data-testid="probe" {...stylex.props(style)} />)
  const fill = getComputedStyle(view.getByTestId('probe')).backgroundColor
  view.unmount()
  return fill
}

describe('the library cascade layer', () => {
  // `base` is ordered before `kanso`, so a preflight that resets every button
  // loses to the library's own fill.
  it('keeps a filled button its fill against a reset ordered before it', () => {
    const button = render(<Button>Label</Button>).getByRole('button')

    expect(getComputedStyle(button).backgroundColor).toBe(
      fillOf(probeStyles.primary),
    )
  })

  // `utilities` is ordered after `kanso`, so a utility on the call site wins
  // over the size's own padding.
  it('lets a utility ordered after it win', () => {
    const button = render(<Button className="p-8">Label</Button>).getByRole(
      'button',
    )

    expect(getComputedStyle(button).paddingInlineStart).toBe('32px')
  })
})
