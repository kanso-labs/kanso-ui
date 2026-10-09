import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import Button from './button'
import Card from './card'
import Link from './link'
import Text from './text'

// A word with nowhere to break — an address, a German compound — wraps only
// where the element lets it break inside the word. Each of these held its
// line at the word's own width: Text, Link and Button widened the page, and
// Card, which clips to its corners, cut the word off at its edge.

// Narrower than the word below at every size these draw it at.
const NARROW = { inlineSize: '200px' }

// A row, so a link inside it is a flex item, whose minimum is its content
// unless its text can break.
const ROW = { display: 'flex', gap: '8px', inlineSize: '200px' }

const LONG_WORD = 'Unterstützungszeilenüberschrift'

describe('a word wider than the room', () => {
  it.each([
    ['Text', <Text key="text">{LONG_WORD}</Text>],
    [
      'Text at a display size',
      <Text key="display" variant="displaySmall">
        {LONG_WORD}
      </Text>,
    ],
    [
      'Link',
      <Link href="#first" key="link">
        {LONG_WORD}
      </Link>,
    ],
    ['Button', <Button key="button">{LONG_WORD}</Button>],
    ['Card', <Card key="card">{LONG_WORD}</Card>],
  ])('stays inside the room in %s', (_name, element) => {
    const view = render(<div style={NARROW}>{element}</div>)
    const room = view.container.firstElementChild!
    const drawn = room.firstElementChild!

    expect(room.scrollWidth).toBeLessThanOrEqual(room.clientWidth)
    expect(drawn.scrollWidth).toBeLessThanOrEqual(drawn.clientWidth)
  })

  it('stays inside the room in a Link that is a flex item', () => {
    const view = render(
      <div style={ROW}>
        <Link href="#first">{LONG_WORD}</Link>
      </div>,
    )
    const room = view.container.firstElementChild!

    expect(room.scrollWidth).toBeLessThanOrEqual(room.clientWidth)
  })
})
