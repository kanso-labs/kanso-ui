import type { ReactElement } from 'react'

import * as stylex from '@stylexjs/stylex'
import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { userEvent } from 'vitest/browser'

import Button from '../components/button'
import Card from '../components/card'
import Chip from '../components/chip'
import IconButton from '../components/icon-button'
import Link from '../components/link'
import { colors } from '../tokens/design.tokens.stylex'
import { focus } from './focus'

// The ring lives in one place, and every component that draws it composes it
// at the call site — StyleX cannot share a declaration inside `create`, so the
// composition is what carries it. Dropping `focus.ring` from one of those
// calls is silent: the component still renders, the stylesheet still holds
// every rule, and only that element stops drawing a ring.
//
// Nothing caught that before. Each of these renders a component whose ring is
// applied unconditionally, or on a prop the case sets, and checks the classes
// reached the element.
//
// The always-solid form is not here. It is applied only when React Aria's
// render state reports focus, so the class is absent until something focuses
// the control; what it draws is read at the end of the file instead.
const RING = classesOf(stylex.props(focus.ring))

// A colour over the ring, as Card lays its own over it — on surface, which
// an outlined Card takes, since the elevated and filled ones take the ring's
// own secondary. `secondary` is the role the ring itself is read against.
const colourStyles = stylex.create({
  over: { outlineColor: colors.onSurface },
  secondary: { outlineColor: colors.secondary },
})

// The ring's classes but its colour's: what reaches a component that takes
// the shared width, offset and `:focus-visible` and sets a colour of its own.
const RING_BUT_COLOUR = classesOf(
  stylex.props(focus.ring, colourStyles.over),
).filter((name) => RING.includes(name))

const CASES: ReadonlyArray<{
  element: ReactElement
  name: string
  ring?: string[]
  role: string
}> = [
  { element: <Button>Label</Button>, name: 'Button', role: 'button' },
  { element: <Chip>Label</Chip>, name: 'Chip', role: 'button' },
  {
    element: (
      <IconButton aria-label="Label">
        <svg />
      </IconButton>
    ),
    name: 'IconButton',
    role: 'button',
  },
  { element: <Link href="#first">Label</Link>, name: 'Link', role: 'link' },
  // The cards page gives a card's ring colours of its own, which Card lays
  // over the shared ring, so the rest of the ring is what reaches it.
  {
    element: <Card interactive>First item</Card>,
    name: 'Card (interactive)',
    ring: RING_BUT_COLOUR,
    role: 'button',
  },
]

function classesOf({ className }: ReturnType<typeof stylex.props>) {
  return (className ?? '').split(' ').filter(Boolean)
}

// The role's colour as the browser resolves it, to compare a computed
// outline colour against.
function secondary() {
  const view = render(
    <span data-testid="probe" {...stylex.props(colourStyles.secondary)} />,
  )
  const colour = getComputedStyle(view.getByTestId('probe')).outlineColor
  view.unmount()
  return colour
}

describe('the shared focus ring', () => {
  it('compiles to classes at all', () => {
    // An empty list would make every case below pass for the wrong reason,
    // since `every` is true of nothing.
    expect(RING.length).toBeGreaterThan(0)
    // One class, the colour's, is all a colour laid over it takes away.
    expect(RING_BUT_COLOUR).toHaveLength(RING.length - 1)
  })

  it.each(CASES)('reaches $name', ({ element, ring = RING, role }) => {
    const view = render(element)
    const classes = new Set(view.getByRole(role).classList)

    expect(ring.filter((name) => !classes.has(name))).toEqual([])
  })
})

// What the ring draws, rather than where it reaches: Material Design's focus
// indicator, 3dp thick in the secondary role and 2dp outside the element. It
// was 2px in the primary role, which the file did not record as a departure.
describe('the focus ring itself', () => {
  it('draws 3px in secondary, 2px out, on a Tab', async () => {
    const colour = secondary()
    const view = render(<Button>Label</Button>)
    await userEvent.tab()

    const button = view.getByRole('button')
    expect(document.activeElement).toBe(button)
    const style = getComputedStyle(button)
    expect(style.outlineStyle).toBe('solid')
    expect(style.outlineWidth).toBe('3px')
    expect(style.outlineOffset).toBe('2px')
    expect(style.outlineColor).toBe(colour)
  })

  it('draws the always-solid form the same', () => {
    const colour = secondary()
    const view = render(
      <span data-testid="ring" {...stylex.props(focus.ringVisible)} />,
    )
    const style = getComputedStyle(view.getByTestId('ring'))

    expect(style.outlineStyle).toBe('solid')
    expect(style.outlineWidth).toBe('3px')
    expect(style.outlineOffset).toBe('2px')
    expect(style.outlineColor).toBe(colour)
  })
})
