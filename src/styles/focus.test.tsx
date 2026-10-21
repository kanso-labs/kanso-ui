import type { ReactElement } from 'react'

import * as stylex from '@stylexjs/stylex'
import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

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
// the control, and this suite has no keyboard driver to do that.
const RING = classesOf(stylex.props(focus.ring))

// A colour over the ring, as Card lays its own over it.
const colourStyles = stylex.create({
  over: { outlineColor: colors.secondary },
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
