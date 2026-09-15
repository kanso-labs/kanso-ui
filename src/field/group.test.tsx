import type { ReactElement } from 'react'

import * as stylex from '@stylexjs/stylex'
import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import CheckboxGroup from '../components/checkbox-group'
import ChipGroup from '../components/chip-group'
import ColorSlider from '../components/color-slider'
import RadioGroup, { Radio } from '../components/radio-group'
import Slider from '../components/slider'
import { groupStyles } from './styles'

// A label above a group carries its own type, since a group has no box to
// float a label in. Five components draw one, and each wrote the same
// five-declaration override at its own call site — the reasoning recorded in
// exactly one of the five.
//
// The label now comes from `FieldLabel variant="group"` and the column from
// `groupStyles.root`. Both are silent to lose: the component still renders,
// the stylesheet still holds every rule, and only that label's type or that
// column's gap goes back to a default.
//
// Nothing caught that before. Dropping the variant from CheckboxGroup left
// its own suite green at 8 passed.
const classesOf = (style: stylex.StyleXStyles) =>
  (stylex.props(style).className ?? '').split(' ').filter(Boolean)

const LABEL = classesOf(groupStyles.label)
const ROOT = classesOf(groupStyles.root)

const CASES: ReadonlyArray<{ element: ReactElement; name: string }> = [
  {
    element: <CheckboxGroup label="Label" />,
    name: 'CheckboxGroup',
  },
  {
    element: (
      <ChipGroup label="Label">
        <ChipGroup.Chip id="first">First item</ChipGroup.Chip>
      </ChipGroup>
    ),
    name: 'ChipGroup',
  },
  {
    element: (
      <RadioGroup label="Label">
        <Radio value="first">First item</Radio>
      </RadioGroup>
    ),
    name: 'RadioGroup',
  },
  { element: <Slider label="Label" />, name: 'Slider' },
  {
    // A colour slider needs a value, and the channel has to exist in that
    // value's colour space — hue is HSL's, not a hex string's.
    element: (
      <ColorSlider
        channel="hue"
        defaultValue="hsl(200, 100%, 50%)"
        label="Label"
      />
    ),
    name: 'ColorSlider',
  },
]

// Selected on the whole class list rather than one name: StyleX emits a class
// per declaration, so the one for `box-sizing` sits on most of the page and
// would match the wrong element.
function find(container: HTMLElement, classes: ReadonlyArray<string>) {
  const selector = classes.map((name) => `.${name}`).join('')
  const element = container.querySelector(selector)
  if (!(element instanceof HTMLElement)) {
    throw new Error(`expected an element carrying ${selector}`)
  }

  return element
}

function missing(classes: ReadonlyArray<string>, element: Element) {
  const applied = new Set(element.classList)

  return classes.filter((name) => !applied.has(name))
}

describe("a group's label", () => {
  it('compiles to classes at all', () => {
    // Empty lists would make every case below pass over nothing.
    expect(LABEL.length).toBeGreaterThan(0)
    expect(ROOT.length).toBeGreaterThan(0)
  })

  it.each(CASES)('gives $name the shared label type', ({ element }) => {
    const view = render(element)

    expect(missing(LABEL, find(view.container, LABEL))).toEqual([])
  })

  it.each(CASES)('gives $name the shared column', ({ element }) => {
    const view = render(element)

    expect(missing(ROOT, find(view.container, ROOT))).toEqual([])
  })
})
