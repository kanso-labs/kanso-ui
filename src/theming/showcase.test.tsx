import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import Showcase from './showcase'

// The showcase is the only page that draws the whole library under a scheme
// that is not the library's own, which makes it the only place a hard-coded
// colour, corner or spacing step shows up at all — everywhere else a literal
// and the token it should have been render identically. A component missing
// from it is therefore never checked under a theme.
//
// AGENTS.md records that gap rather than hiding it: the page still renders,
// all five snapshots still pass, and nothing says the new component is
// absent. The other two lists a component has to join are both pinned, in
// src/components/index.test.ts and src/components/styling.test.tsx. This is
// the third.
//
// The expected set comes from the directories rather than the barrel's export
// names. A directory under src/components is a public component, so the two
// are 1:1, while the export surface carries two more names — Radio and
// FileTrigger are sub-components of another module — which would need a
// hand-kept exception list, and that list would be a fourth thing to
// remember.
const EXPECTED = Object.keys(import.meta.glob('../components/*/index.tsx'))
  .map((path) => path.split('/').at(-2) ?? '')
  .map((directory) =>
    directory
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(''),
  )

describe('the showcase', () => {
  // What this catches is omission, not hollowness: a Section with a title and
  // no children satisfies it. That is deliberate — AppBar's own section is
  // exactly that, because the bar is drawn at the top of the page and its
  // entry points at it.
  it('gives every component a section', () => {
    const { container } = render(<Showcase name="editorial" />)

    // Scoped to the sections rather than asked of the document, because the
    // page's own scheme label is an h2 too and sits outside every section.
    const titles = [...container.querySelectorAll('section')].map(
      (section) => section.querySelector('h2')?.textContent ?? '',
    )

    // Compared as named differences rather than as whole lists, because two
    // arrays of 69 elide to "…(66)" against "…(67)" and say nothing about
    // which component went missing. The count after it is what catches a
    // section that is duplicated rather than absent.
    const missing = EXPECTED.filter((name) => !titles.includes(name))
    const unexpected = titles.filter((title) => !EXPECTED.includes(title))

    expect({ missing, unexpected }).toEqual({ missing: [], unexpected: [] })
    expect(titles).toHaveLength(EXPECTED.length)
  })
})
