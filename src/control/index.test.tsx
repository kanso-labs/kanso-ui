import type { ReactElement } from 'react'

import * as stylex from '@stylexjs/stylex'
import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import Checkbox from '../components/checkbox'
import RadioGroup, { Radio } from '../components/radio-group'
import Switch from '../components/switch'
import { spacing, typography } from '../tokens/design.tokens.stylex'
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

// A scheme whose body line is longer than the default 24, which is what
// tells a centring derived from the line apart from one that happens to be
// half the disc under the default tokens. `Editorial`'s values, from
// src/theming/themes.ts — its `sm` is here too, since a padding taken from
// the spacing scale followed that rather than the line.
const longLineType = stylex.createTheme(typography, {
  bodyLargeLineHeight: '28px',
})
const longLineSpacing = stylex.createTheme(spacing, { sm: '10px' })

// Where the label's first line actually sits, read from a Range over its own
// text rather than inferred from the padding — so the assertion holds however
// the offset is produced, and does not quietly pass for a rule that moved the
// line some other way.
function firstLineOf(label: Element) {
  const range = document.createRange()
  range.selectNodeContents(label)
  const lines = range.getClientRects()
  if (lines.length === 0) {
    throw new Error('expected the label to draw a line box')
  }
  return lines[0]
}

// Narrow enough that the long label below wraps, hoisted so the element it
// styles keeps one identity across renders.
const WRAPPING_WIDTH = { width: '220px' }

// A line box's height comes from the font's own metrics, which rasterise
// differently between machines — the same assertion that read exactly 0 here
// read -0.5 on CI. Half a pixel is the rounding, and the drifts this guards
// against are 4px and 8px, so a sub-pixel tolerance separates them cleanly.
const SUBPIXEL = 1

function centringOf(container: HTMLElement, text: string) {
  const spans = [...container.querySelectorAll('span')]
  const disc = spans.find(
    (span) => Math.round(span.getBoundingClientRect().height) === 40,
  )
  const label = spans.find((span) => span.textContent === text)
  if (disc === undefined || label === undefined) {
    throw new Error('expected the row to draw a disc beside its label')
  }
  const discBox = disc.getBoundingClientRect()
  const line = firstLineOf(label)

  return line.top + line.height / 2 - (discBox.top + discBox.height / 2)
}

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

  // The control sits on the middle of its label's first line, which is what
  // a row of them reads along. The label's padding is what puts it there, so
  // the padding follows the line's height rather than the spacing scale.
  describe('the label beside the disc', () => {
    const SHORT = 'Label'
    const WRAPPING =
      'Label that wraps across two lines because it is long enough'

    function renderCheckbox(copy: string, themed: boolean) {
      const field = (
        <div style={WRAPPING_WIDTH}>
          <Checkbox>{copy}</Checkbox>
        </div>
      )

      return render(
        themed ? (
          <div {...stylex.props(longLineType, longLineSpacing)}>{field}</div>
        ) : (
          field
        ),
      )
    }

    it('centres a one-line label on the disc under a longer body line', () => {
      const view = renderCheckbox(SHORT, true)

      expect(Math.abs(centringOf(view.container, SHORT))).toBeLessThan(SUBPIXEL)
    })

    // The label that wraps is what separates a first-line centring from one
    // that centres the whole label: the second drops this line below the
    // disc, and does it under the default tokens too.
    it('centres a wrapping label by its first line', () => {
      for (const themed of [false, true]) {
        const view = renderCheckbox(WRAPPING, themed)

        expect(Math.abs(centringOf(view.container, WRAPPING))).toBeLessThan(
          SUBPIXEL,
        )
      }
    })

    it('leaves the default tokens where they were', () => {
      const view = renderCheckbox(SHORT, false)
      const label = view.getByText(SHORT)

      expect(getComputedStyle(label).paddingBlockStart).toBe('8px')
      expect(label.getBoundingClientRect().height).toBe(40)
    })
  })
})
