import type { ReactElement } from 'react'

import * as stylex from '@stylexjs/stylex'
import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import Button from '../components/button'
import Card from '../components/card'
import Chip from '../components/chip'
import IconButton from '../components/icon-button'
import Link from '../components/link'
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
const RING = (stylex.props(focus.ring).className ?? '')
  .split(' ')
  .filter(Boolean)

const CASES: ReadonlyArray<{
  element: ReactElement
  name: string
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
  {
    element: <Card interactive>First item</Card>,
    name: 'Card (interactive)',
    role: 'button',
  },
]

describe('the shared focus ring', () => {
  it('compiles to classes at all', () => {
    // An empty list would make every case below pass for the wrong reason,
    // since `every` is true of nothing.
    expect(RING.length).toBeGreaterThan(0)
  })

  it.each(CASES)('reaches $name', ({ element, role }) => {
    const view = render(element)
    const classes = new Set(view.getByRole(role).classList)

    expect(RING.filter((name) => !classes.has(name))).toEqual([])
  })
})
