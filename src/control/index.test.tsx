import type { ReactElement } from 'react'

import * as stylex from '@stylexjs/stylex'
import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import Checkbox from '../components/checkbox'
import RadioGroup, { Radio } from '../components/radio-group'
import Switch from '../components/switch'
import { controlStyles } from './styles'

// The row is shared, and each component composes it at its own `stylex.props`
// call — StyleX cannot share a declaration inside `create`, so composition is
// what carries it. Dropping one of those arguments is silent: the component
// still renders, the stylesheet still holds every rule, and only that element
// stops drawing the grid, the label or the disc.
//
// Nothing caught that before. Removing the grid from Checkbox left its own
// suite green at 20 passed.
const classesOf = (style: stylex.StyleXStyles) =>
  (stylex.props(style).className ?? '').split(' ').filter(Boolean)

const FIELD = classesOf(controlStyles.field)
const LABEL = classesOf(controlStyles.label)
const DISC = classesOf(controlStyles.disc)

const LABELLED: ReadonlyArray<{
  element: ReactElement
  name: string
  text: string
}> = [
  { element: <Checkbox>Label</Checkbox>, name: 'Checkbox', text: 'Label' },
  { element: <Switch>Label</Switch>, name: 'Switch', text: 'Label' },
  {
    // The group carries a label of its own, so the radio's is named
    // separately rather than matched by a pattern that finds both.
    element: (
      <RadioGroup label="Group">
        <Radio value="first">First item</Radio>
      </RadioGroup>
    ),
    name: 'Radio',
    text: 'First item',
  },
]

// Switch has no disc. Its track is 52 by 40 and carries the state layer
// itself, which is why that one style stayed with the component.
const DISCED: ReadonlyArray<{ element: ReactElement; name: string }> = [
  { element: <Checkbox>Label</Checkbox>, name: 'Checkbox' },
  {
    element: (
      <RadioGroup label="Group">
        <Radio value="first">First item</Radio>
      </RadioGroup>
    ),
    name: 'Radio',
  },
]

function missing(classes: ReadonlyArray<string>, element: Element) {
  const applied = new Set(element.classList)

  return classes.filter((name) => !applied.has(name))
}

describe('the shared control row', () => {
  it('compiles to classes at all', () => {
    // Empty lists would make every case below pass for the wrong reason,
    // since `filter` over nothing is empty.
    expect(FIELD.length).toBeGreaterThan(0)
    expect(LABEL.length).toBeGreaterThan(0)
    expect(DISC.length).toBeGreaterThan(0)
  })

  it.each(LABELLED)(
    'draws $name on the two-column grid',
    ({ element, text }) => {
      const view = render(element)
      const label = view.getByText(text)
      const field = label.closest(`.${FIELD[0]}`)
      if (!(field instanceof HTMLElement)) {
        throw new Error('expected the label to sit inside the grid')
      }

      expect(missing(FIELD, field)).toEqual([])
    },
  )

  it.each(LABELLED)('gives $name the shared label', ({ element, text }) => {
    const view = render(element)

    expect(missing(LABEL, view.getByText(text))).toEqual([])
  })

  it.each(DISCED)('gives $name the 40dp disc', ({ element }) => {
    const view = render(element)
    const disc = view.container.querySelector(`.${DISC[0]}`)
    if (!(disc instanceof HTMLElement)) {
      throw new Error('expected the control to draw the shared disc')
    }

    expect(missing(DISC, disc)).toEqual([])
  })
})
